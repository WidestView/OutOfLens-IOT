import dns        from 'dns';
import SerialPort from 'serialport';
import express    from 'express';
import bodyParser from 'body-parser';

const Readline = SerialPort.parsers.Readline;

// Interfaces
import { Interfaces } from './interfaces';
import ArduinoResponse          = Interfaces.ArduinoResponse;
import ArduinoCommandRequest    = Interfaces.ArduinoCommandRequest;
import Credential               = Interfaces.Credential;

// Custom files
import { Arduino } from './arduino';
import { PASSWORD } from './global';
import { resolve } from 'path';

const defaultBaudRate = 9600;

// Arguments reading
    
        /*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS AND ONE ARDUINO PORT!*/

const ARGUMENTS = process.argv.slice(2); // Remove default node arguments

let WEB_PORT = 8000;
let ALLOWED_IPS : string[] = [];
let ARDUINO_PORT_PATH: string = '';

readLineArguments(ARGUMENTS);

function readLineArguments(args:string[]){

    // ALLOWED IPS (--allow)

    if(args.indexOf('--allow') > -1){

        if(args.indexOf('--allow') !== args.lastIndexOf('--allow')){
            throw Error('Specify only one series of allowed servers!');
        }

        let index = args.indexOf('--allow') + 1;
        let stop = false;

        while(!stop){

            if(args.length <= index){
                stop = true;
            }
            else{

                if(args[index].charAt(0) == '-'){
                    stop = true;
                }

            }

            if(!stop){
                dns.lookup(args[index], (err, address, family) => {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    ALLOWED_IPS.push(address);
                    console.log("ALLOWED_IP: "+address);
                });
                
                index++;
            }
        }

    }else{
        throw Error('Specify at least one allowed URL as line arguments, use \'--allow\'!');
    }

    // ARDUINO (--arduino)

    if(args.indexOf('--arduino') > -1){

        if(args.indexOf('--arduino') !== args.lastIndexOf('--arduino')){
            throw Error('Specify only one arduino!');
        }

        if(args.length <= args.indexOf('--arduino') + 1){
            throw Error('Specify a serial port for your \'--arduino\' argument!');
        }

        ARDUINO_PORT_PATH = args[args.indexOf('--arduino') + 1]
        
    }else{
        throw Error('Specify one arduino as line arguments, use \'--arduino\'!');
    }

    // CUSTOM WEB PORT ARGUMENT (--port)

    if(args.indexOf('--port') > -1){

        if(args.indexOf('--port') !== args.lastIndexOf('--port')){
            throw Error('Specify only one web port as line argument!');
        }

        if(args.length <= args.indexOf('--port') + 1){
            throw Error('Specify a web port for your \'--port\' argument!');
        }

        if(isNaN(Number(args[args.indexOf('--port') + 1]))){
            throw Error('Specify a valid web port for your \'--port\' argument!');
        }

        WEB_PORT = Number(args[args.indexOf('--port') + 1]);
    }

}



/// Server Functions

function validateCrendential(credential : Credential) {
    const isAllowed = ALLOWED_IPS.some( ip => credential.ip === ip && credential.password === PASSWORD);
    let response = {
        sucess: isAllowed,
        reason: isAllowed? '':'Invalid Credentials'
    } as ArduinoResponse;
    return response;
}



/// Arduino Functions

async function createArduino(portPath: string){
    return new Promise<Arduino>(async (resolve, reject) => {

        let ports = await SerialPort.list();

        let result = ports.some(port => port.path === portPath);

        if (!result) {
            console.log('Ports connected to pc: ');
            ports.forEach((port)=>console.log(port.path));
            reject('No port matches ' + portPath);
        }

        let arduino = new Arduino(new SerialPort(portPath, {baudRate: defaultBaudRate}));

        if(await arduino.ping()){

            resolve(arduino);
        }
        else{

            reject('Arduino did not answered ping');
        }

    });
}



// Arduino Creation 

if(ARDUINO_PORT_PATH == ''){
    throw new Error('Something gone wrong and the server tried to start whitout an Serial Port Path for the Arduino');
}

let arduino: Arduino;

const startArduino = async () => {
    arduino = await createArduino(ARDUINO_PORT_PATH); 
};

startArduino();


/// This Side Webserver

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.listen( WEB_PORT, () => 
    console.log( `Server started at http://localhost:${ WEB_PORT }`)
);

app.post('/cmd', async (req, res)=>{

    //CHECK CREDENTIALS

    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:req.body.password } as Credential;
    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }

    let request = req.body as ArduinoCommandRequest;

    if(!await arduino.send(request.cmd)){
        let response = {
            sucess: false,
            reason: request.cmd + ' not solved!'
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    response = {
        sucess: true,
        reason: request.cmd + ' executed sucefully!'
    } as ArduinoResponse;
    
    res.send(response);
    return;
});