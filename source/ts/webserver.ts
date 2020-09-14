
import dns        from 'dns';
import SerialPort from 'serialport';
import express    from 'express';
import bodyParser from 'body-parser';
const Readline = SerialPort.parsers.Readline;

import {Interfaces} from './interfaces';
import ArduinoInsertionRequest  = Interfaces.ArduinoInsertionRequest;
import ArduinoInsertionResponse = Interfaces.ArduinoInsertionResponse;
import Credential               = Interfaces.Credential;
import { parse } from 'path';
import { ReadLine } from 'readline';

class Arduino{
    public ArduinoName:string;
    public Serial:SerialPort;
    public Parser:SerialPort.parsers.Readline;

    public Data:string[] = [];

    constructor(name:string,serial:SerialPort){
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter : '\n' }));
        this.Parser.on('data', data=>{
            this.Data.push(data);
            this.Data.map((value)=>{console.log(value);})
        });
    }

    public send(value : string) {
        this.Serial.write(value);
    }
}


/// Globals

const arduinos = new Map<string, Arduino>();

const WEB_PORT        = 3333;
const SERVER_HOSTNAME = 'testesdelifybr.ddns.net';
const PASSWORD        = "5eeb219ebc72cd90a4020538b28593fbfac63d2e0a8d6ccf6c28c21c97f00ea6";


let SERVER_IP:string;

dns.lookup(SERVER_HOSTNAME, (err, address, family) => {

    if (err) {
        console.log(err);
        return;
    }

    SERVER_IP = address;
});

/// Functions

function validateCrendential(credential : Credential) : boolean {
    return credential.ip === SERVER_IP && credential.password === PASSWORD;
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

    try{
        let data = await new Promise<string>((onResult, onError) => {
            parser.on('data', data => {
                onResult(data);
            });
            setTimeout(()=>serial.write('p'),1000);
            setTimeout(()=>onError(),1100); // VERIFY IF THE RETURN IS ACTUALLY 'p'
        });
    }
    catch{
        console.log('NOT Pong');
        return false;
    }

    console.log('Pong');

    return true;
}

/// EXECUTION

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.listen( WEB_PORT, () => 
    console.log( `Server started at http://localhost:${ WEB_PORT }`));

app.post('/add', async function(req, res) {

    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:req.body.password } as Credential;
    let request = req.body as ArduinoInsertionRequest;

    if (!validateCrendential(credentials)) {
        let response = {
            sucess: false,
            reason:'Invalid Credentials'
        } as ArduinoInsertionResponse;

        res.send(JSON.stringify(response));

        return;
    }

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
    ard.send('a');
    res.send(JSON.stringify({sucess : true,reason  : ard.ArduinoName+ ' added successfully'} as ArduinoInsertionResponse));
});


app.post('/cmd', async function(req, res) {
    
});

