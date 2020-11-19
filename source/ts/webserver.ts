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
import { crypto } from './crypto';

const defaultBaudRate = 9600;

// Arguments reading
    
        /*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS AND ONE ARDUINO PORT!*/

const ARGUMENTS = process.argv.slice(2); // Remove default node arguments

let WEB_PORT = 8000;
let ALLOWED_IPS : string[] = [];
let ARDUINO_PORT_PATH: string = '';
let SERVER_API_URL: string = '';

readLineArguments(ARGUMENTS);

function readLineArguments(args:string[]){

    // ALLOWED IPS (--allow)

    let indexOf = args.indexOf('--allow');
    if( indexOf > -1){

        if(indexOf !== args.lastIndexOf('--allow')){
            throw Error('Specify only one series of allowed servers!');
        }

        let index = indexOf + 1;
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

    indexOf = args.indexOf('--arduino');
    if( indexOf > -1){

        if(indexOf !== args.lastIndexOf('--arduino')){
            throw Error('Specify only one arduino!');
        }

        if(args.length <= indexOf + 1){
            throw Error('Specify a serial port for your \'--arduino\' argument!');
        }

        ARDUINO_PORT_PATH  = args[indexOf + 1]
        
    }else{
        throw Error('Specify one api as line arguments, use \'--arduino\'!');
    }

    // API (--api)

    indexOf = args.indexOf('--api');
    if( indexOf > -1){

        if(indexOf !== args.lastIndexOf('--api')){
            throw Error('Specify only one api!');
        }

        if(args.length <= indexOf + 1){
            throw Error('Specify an api for your \'--api\' argument!');
        }

        SERVER_API_URL = args[indexOf + 1]

        console.log('API URL defined to ' + SERVER_API_URL);
        
    }else{
        throw Error('Specify one api as line arguments, use \'--api\'!');
    }
    
    // CUSTOM WEB PORT ARGUMENT (--port)

    indexOf = args.indexOf('--port');
    if( indexOf > -1){

        if(indexOf !== args.lastIndexOf('--port')){
            throw Error('Specify only one web port as line argument!');
        }

        if(args.length <= indexOf + 1){
            throw Error('Specify a web port for your \'--port\' argument!');
        }

        if(isNaN(Number(args[indexOf + 1]))){
            throw Error('Specify a valid web port for your \'--port\' argument!');
        }

        WEB_PORT = Number(args[indexOf + 1]);
    }

}

/// Server Functions

function validateCrendential(credential : Credential) {
    const ipAllowed = ALLOWED_IPS.some( ip => credential.ip === ip );
    const passAllowed = credential.password === PASSWORD;

    console.log('Ip (' + credential.ip + '): ' + (ipAllowed? 'Ok':'Negado'));
    console.log('Senha: ' + (passAllowed? 'Ok':'Negada'));
    let response = {
        sucess: ipAllowed && passAllowed,
        reason: ipAllowed && passAllowed? '':'Invalid Credentials'
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

        let arduino = new Arduino(new SerialPort(portPath, {baudRate: defaultBaudRate}), SERVER_API_URL);

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

    let credentials = { ip:req.ip.substring(req.ip.lastIndexOf(':')+1),password:crypto.decrypt(req.body.password) } as Credential;

    if(credentials.password === ""){
        let response = {
            sucess: false,
            reason: crypto.encrypt('Password could not be decrypted!')
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }

    let request = {cmd: crypto.decrypt(req.body.cmd)} as ArduinoCommandRequest;

    if(request.cmd === ""){
        let response = {
            sucess: false,
            reason: crypto.encrypt('Command could not be decrypted!')
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    if(!await arduino.send(request.cmd)){
        let response = {
            sucess: false,
            reason: crypto.encrypt(request.cmd + ' not solved!')
        } as ArduinoResponse;
        res.send(response);
        return;
    }

    response = {
        sucess: true,
        reason: crypto.encrypt(request.cmd + ' executed sucefully!')
    } as ArduinoResponse;
    
    res.send(response);
    return;
});

app.post('/api-test', async (req, res)=>{
    let request = req.body;

    res.send('Data saved on FAKE DATABASE');
    return;
});