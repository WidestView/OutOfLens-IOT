
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


/// Globals

const arduinos = new Map<string, SerialPort>();

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

    let reasons : string[] = []

    arduinos.forEach((serial, arduino) =>{

        if(request.arduinoName === arduino){
            reasons.push(`That is already an arduino called '${arduino}'`);
        }

        if(request.serialPort === serial.path && Number(request.baudRate) == serial.baudRate){
            reasons.push("This port and baudrate are already busy, try other");
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

async function pingArduino(serial : SerialPort) : Promise<boolean> {

    await new Promise( (onResult, onError) => {serial.on('open', () => {
        console.log('Serial is Open')
        onResult();
    })});

    console.log('Pinging Arduino');
    console.log(serial);
    serial.write('a');

    const parser = new Readline({ 'delimiter' : '\n' });
    
    serial.pipe(parser)
    let data : string = await new Promise((onResult, onError) => {
        parser.on('data', data => {
            console.log('Data received')
            onResult(data);
        });
        serial.write('a');
    });

    console.log('Result is:', data)

    return data === 'a';

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

    ///

    let serial = new SerialPort(request.serialPort, { baudRate : Number(request.baudRate) });

    let isValid = await pingArduino(serial);

    if (!isValid) {

        let response = {
            sucess: false,
            reason:'This port is not an Arduino valid'
        } as ArduinoInsertionResponse;

        res.send(JSON.stringify(response));

        serial.close();

        return;     
    }

    arduinos.set(request.arduinoName, serial);

    console.log(`Arduino ${request.arduinoName} was added.`);

    arduinos.forEach((serial, arduino) =>
        console.log(`Arduino: ${arduino}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
    
    res.send(JSON.stringify({sucess : true,reason  : 'Insertion executed successfully'} as ArduinoInsertionResponse));

});

