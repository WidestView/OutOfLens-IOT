import dns from 'dns';
import SerialPort from 'serialport';
import path from 'path';
import express    from 'express';
import bodyParser    from 'body-parser';

import {Interfaces} from './interfaces';

import ArduinoInsertionRequest = Interfaces.ArduinoInsertionRequest;

import ArduinoInsertionResponse = Interfaces.ArduinoInsertionResponse;

import Credential = Interfaces.Credential;

const Readline = SerialPort.parsers.Readline;

/// Globals

const arduinos = new Map<string, SerialPort>();

const WEB_PORT = 3333;
const SERVER_HOSTNAME = 'testesdelifybr.ddns.net';
const PASSWORD = "5eeb219ebc72cd90a4020538b28593fbfac63d2e0a8d6ccf6c28c21c97f00ea6";

let SERVER_IP:string;
dns.lookup(SERVER_HOSTNAME, (err, address, family) => {
    if(err){
        console.log(err);
        return;
    }
    SERVER_IP = address;
});

/// Functions

function validateCrendential(credential : Credential) : boolean {
    return credential.ip === SERVER_IP && credential.password === PASSWORD;
}

function verifyArduinoInsertionRequest(request : ArduinoInsertionRequest){
    let reasons:string = "";
    arduinos.forEach((serial, arduino)=>{
        if(request.arduinoName == arduino){
            reasons += `That is already an arduino called '${arduino}'\n`;
        }
        if(request.serialPort == serial.path && Number(request.baudRate) == serial.baudRate){
            reasons += "This port and baudrate are already busy, try other\n";
        }
    });
    let response = {
        sucess: (reasons=="")? true:false,
        reason: reasons
    } as ArduinoInsertionResponse;
    return response;
} 

/// EXECUTION

const app = express();

app.set( 'view engine', 'ejs' );
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.listen( WEB_PORT, () => {
    console.log( `Server started at http://localhost:${ WEB_PORT }`);
} );

app.post('/add', function(req, res) {
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

    let verify = verifyArduinoInsertionRequest(request);

    if(!verify.sucess){
        res.send(JSON.stringify(verify));
        return;
    }

    let serial = new SerialPort(request.serialPort, { baudRate : Number(request.baudRate) });

    arduinos.set(request.arduinoName, serial);

    console.log(`Arduino ${request.arduinoName} was added.`);

    arduinos.forEach((serial, arduino) =>
        console.log(`Arduino: ${arduino}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
    
    res.send(JSON.stringify({sucess : true,reason  : 'Insertion executed successfully'} as ArduinoInsertionResponse));
});