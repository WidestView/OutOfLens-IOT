import dns        from 'dns';
import SerialPort from 'serialport';
import express    from 'express';
import bodyParser from 'body-parser';
const Readline = SerialPort.parsers.Readline;

// Interfaces
import {Interfaces} from './interfaces';
import ArduinoInsertionRequest  = Interfaces.ArduinoInsertionRequest;
import ArduinoInsertionResponse = Interfaces.ArduinoInsertionResponse;
import Credential               = Interfaces.Credential;

// Custom files
import {Arduino} from './arduino';
import {arduinos, PASSWORD} from './global';

// Arguments check

    /*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS, just like: beserrovsky.ddns.net !*/
var ARGUMENTS = process.argv.slice(2); // Remove default node arguments

var WEB_PORT = 8000;
var ALLOWED_IPS : string[] = [];

checkLineArguments(ARGUMENTS);

function checkLineArguments(Arguments:string[]){
    if(ARGUMENTS.length<1){
        throw Error('Specify at least one allowed URL as an line argument!');
    }
    
    if(!isNaN(Number(ARGUMENTS[0]))){ // check if the first argument is JUST a valid port
        WEB_PORT = Number(ARGUMENTS[0]);
        if(ARGUMENTS.length<2){
            throw new Error('Specify at least one allowed URL as an line argument!');
        }
        console.log('!-- Allowed URLS: ');
        for(var i=1;i<ARGUMENTS.length;i++){
            dns.lookup(ARGUMENTS[i], (err, address, family) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                ALLOWED_IPS.push(address);
            });
            console.log(ARGUMENTS[i]);
        }
        console.log('! --')
    }else{
        for(var i=1;i<ARGUMENTS.length;i++){
            dns.lookup(ARGUMENTS[i], (err, address, family) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                ALLOWED_IPS.push(address);
            });
        }
    }
}

/// Server Functions

function validateCrendential(credential : Credential) {
    var isAllowed = ALLOWED_IPS.some( ip => credential.ip === ip && credential.password);
    let response = {
        sucess: isAllowed,
        reason: isAllowed? '':'Invalid Credentials'
    } as ArduinoInsertionResponse;
    return response;
}

async function verifyArduinoInsertionRequest(request : ArduinoInsertionRequest) {
    console.log(`Request recieved for opening ${request.serialPort} at ${request.baudRate} as ${request.arduinoName}`);
    let reasons : string[] = []

    arduinos.forEach((ard, name) =>{

        if(request.arduinoName === name){
            reasons.push(`That is already an arduino called '${name}'`);
        }

        if(request.serialPort === ard.Serial.path){
            reasons.push("This port is already used by: "+ard.ArduinoName+", try other");
        }
    });

    let ports = await SerialPort.list();

    let result = ports.some(port => port.path === request.serialPort);

    if (!result) {
        reasons.push('There is no port that matches the given one');
    }

    let response = {
        sucess: reasons.length == 0,
        reason: reasons.join('\n')
    } as ArduinoInsertionResponse;

    return response;
} 

async function pingSerial(serial: SerialPort) : Promise<boolean> {
    console.log('Pinging '+serial.path+' at '+serial.baudRate);

    let parser = serial.pipe(new Readline({delimiter:'\n'}));
    let data:string;
    try{
        data = await new Promise<string>((onResult, onError) => {
            parser.on('data', data => {
                onResult(data);
            });
            setTimeout(()=>serial.write('p'),1000);
            setTimeout(()=>onError(),1100); // VERIFY IF THE RETURN IS ACTUALLY 'p'
        }) as string;
    }
    catch{
        console.log('NOT Pong');
        return false;
    }

    console.log('Pong');
    return data.charCodeAt(0) === 112;
}

/// EXECUTION

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.listen( WEB_PORT, () => 
    console.log( `Server started at http://localhost:${ WEB_PORT }`));

app.post('/add', async function(req, res) {

    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:req.body.password } as Credential;
    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }

    let request = req.body as ArduinoInsertionRequest;

    let result = await verifyArduinoInsertionRequest(request);

    if (!result.sucess) {
        res.send(JSON.stringify(result));
        return;
    }
    
    let serial = new SerialPort(request.serialPort,{baudRate:Number(request.baudRate)});
    

    let isValid = await pingSerial(serial);
    
    if (!isValid) {

        let response = {
            sucess: false,
            reason:'This port is not an Arduino valid'
        } as ArduinoInsertionResponse;

        res.send(JSON.stringify(response));

        serial.close();

        return;
    }

    let ard = new Arduino(request.arduinoName,serial);
    
    arduinos.set(request.arduinoName, ard);

    console.log(`Arduino ${request.arduinoName} was added.`);
    console.log("Arduinos:");
    arduinos.forEach((serial, arduino) =>
        console.log(` Arduino: ${arduino}/Port = ${ard.Serial.path} | BaudRate= ${ard.Serial.baudRate}`));
    res.send(JSON.stringify({sucess : true,reason  : ard.ArduinoName+ ' added successfully'} as ArduinoInsertionResponse));
});


app.post('/cmd', async function(req, res) {
    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:req.body.password } as Credential;
    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }
    try{
        let arduino:Arduino;
        arduinos.forEach( (ard,name)=> {
            if(name == req.body.arduinoName){
                arduino = ard;
                arduino.send(req.body.cmd);
            }
        });
    }
    catch{
    }
    res.end();
});

