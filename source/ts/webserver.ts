import dns        from 'dns';
import SerialPort from 'serialport';
import express    from 'express';
import bodyParser from 'body-parser';
const Readline = SerialPort.parsers.Readline;

// Interfaces
import {Interfaces} from './interfaces';
import ArduinoInsertionRequest  = Interfaces.ArduinoInsertionRequest;
import ArduinoResponse          = Interfaces.ArduinoResponse;
import ArduinoCommandRequest    = Interfaces.ArduinoCommandRequest;
import Credential               = Interfaces.Credential;

// Custom files
import {Arduino} from './arduino';
import {arduinos, PASSWORD} from './global';
import { resolve } from 'path';

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
        for(var i=1;i<ARGUMENTS.length;i++){
            dns.lookup(ARGUMENTS[i], (err, address, family) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                ALLOWED_IPS.push(address);
                console.log("ALLOWED_IP: "+address);
            });
        }
        
    }else{
        for(var i=0;i<ARGUMENTS.length;i++){
            dns.lookup(ARGUMENTS[i], (err, address, family) => {
                if (err) {
                    console.log(err);
                    return;
                }
                
                ALLOWED_IPS.push(address);
                console.log("ALLOWED_IP: "+address);
            });
        }
    }
}

/// Server Functions

function validateCrendential(credential : Credential) {
    var isAllowed = ALLOWED_IPS.some( ip => credential.ip === ip && credential.password === PASSWORD);
    let response = {
        sucess: isAllowed,
        reason: isAllowed? '':'Invalid Credentials'
    } as ArduinoResponse;
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
    } as ArduinoResponse;

    return response;
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

    let ard = new Arduino(request.arduinoName,serial);

    if(!await ard.ping()){
        let response = {
            sucess: false,
            reason:'This port is not an Arduino valid'
        } as ArduinoResponse;

        res.send(JSON.stringify(response));

        ard.Serial.close();

        return;
    }
    arduinos.set(ard.ArduinoName,ard);

    console.log(`Arduino ${request.arduinoName} was added.`);
    console.log("Arduinos:");
    arduinos.forEach((serial, arduino) =>
        console.log(` Arduino: ${arduino}/Port = ${ard.Serial.path} | BaudRate= ${ard.Serial.baudRate}`));
    res.send(JSON.stringify({sucess : true,reason  : ard.ArduinoName+ ' added successfully'} as ArduinoResponse));
});


app.post('/cmd', async function(req, res) {
    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:req.body.password } as Credential;
    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }

    let request = req.body as ArduinoCommandRequest;
    let ard = arduinos.get(request.arduinoName);
    if(ard==null){
        let response = {
            sucess: false,
            reason: 'There is no arduino called '+request.arduinoName
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    if(!await ard.send(request.cmd)){
        let response = {
            sucess: false,
            reason: request.cmd+' not solved!'
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    response = {
        sucess: true,
        reason: request.cmd+' executed sucefully!'
    } as ArduinoResponse;
    
    res.send(response);
    return;
});