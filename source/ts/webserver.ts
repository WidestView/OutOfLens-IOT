import dns from 'dns';
import SerialPort from 'serialport';
import express    from 'express';

import {Interfaces} from './interfaces';

import ArduinoInsertionRequest = Interfaces.ArduinoInsertionRequest;

import Credential = Interfaces.Credential;

/// Types

/// Globals
const ports = new Map<string, SerialPort>();

const WEB_PORT = 8000;

const SERVER_HOSTNAME = 'http://testesdelifybr.ddns.net/';
const PASSWORD = "5eeb219ebc72cd90a4020538b28593fbfac63d2e0a8d6ccf6c28c21c97f00ea6";
let SERVER_IP:string;
dns.lookup(SERVER_HOSTNAME, (err, address, family) => SERVER_IP = address);

/// EXECUTION

const app = express();

app.set( 'view engine', 'ejs' );

app.listen( WEB_PORT, () => {
    console.log( `Server started at http://localhost:${ WEB_PORT }`);
} );

app.post('/add', function(req, res) {
    let credentials = {ip:req.ip,password:req.body.password} as Credential;
    let request = req.body as ArduinoInsertionRequest;
    ports.set(request.arduinoName, 
        new SerialPort(request.serialPort, { baudRate : Number(request.baudRate) }));

    ports.forEach((serial, arduino) => console.log(`Arduino: ${name}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
});



