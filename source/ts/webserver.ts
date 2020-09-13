import dns from 'dns';
import SerialPort from 'serialport';
import path from 'path';
import express    from 'express';
import bodyParser    from 'body-parser';

import {Interfaces} from './interfaces';

import ArduinoInsertionRequest = Interfaces.ArduinoInsertionRequest;

import Credential = Interfaces.Credential;

const Readline = SerialPort.parsers.Readline;

/// Globals

const ports = new Map<string, SerialPort>();

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
    ports.forEach((serial, arduino)=>{

    });
    return true;
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

    if (!validateCrendential(credentials)) {
        res.send(JSON.stringify({
            success : false,
            reason  : 'Invalid Credentials'
        }));

        return;
    }

    let request = req.body as ArduinoInsertionRequest;


    //TODO
    //verify if this arduinoname or exact same port and baudrate already exists
    //verify if this COM can be opened

    if(!verifyArduinoInsertionRequest(request)){
        res.send(JSON.stringify({
            success : false,
            reason  : 'An Arduino with that name is already created or this port is busy'
        }));

        return;
    }

    let serial = new SerialPort(request.serialPort, { baudRate : Number(request.baudRate) });

    ports.set(request.arduinoName, serial);

    console.log(`Arduino ${request.arduinoName} was added.`);

    ports.forEach((serial, arduino) =>
        console.log(`Arduino: ${arduino}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
    
    res.send(JSON.stringify({
        success : true,
        reason  : 'Insertion executed successfully'
    }))
    
});



