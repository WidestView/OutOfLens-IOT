"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const serialport_1 = __importDefault(require("serialport"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const Readline = serialport_1.default.parsers.Readline;
// Custom files
const arduino_1 = require("./arduino");
const global_1 = require("./global");
const defaultBaudRate = 9600;
// Arguments reading
/*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS AND ONE ARDUINO PORT!*/
const ARGUMENTS = process.argv.slice(2); // Remove default node arguments
let WEB_PORT = 8000;
let ALLOWED_IPS = [];
let ARDUINO_PORT_PATH = '';
readLineArguments(ARGUMENTS);
function readLineArguments(args) {
    // ALLOWED IPS (--allow)
    if (args.indexOf('--allow') > -1) {
        if (args.indexOf('--allow') !== args.lastIndexOf('--allow')) {
            throw Error('Specify only one series of allowed servers!');
        }
        let index = args.indexOf('--allow') + 1;
        let stop = false;
        while (!stop) {
            if (args.length <= index) {
                stop = true;
            }
            else {
                if (args[index].charAt(0) == '-') {
                    stop = true;
                }
            }
            if (!stop) {
                dns_1.default.lookup(args[index], (err, address, family) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    ALLOWED_IPS.push(address);
                    console.log("ALLOWED_IP: " + address);
                });
                index++;
            }
        }
    }
    else {
        throw Error('Specify at least one allowed URL as line arguments, use \'--allow\'!');
    }
    // ARDUINO (--arduino)
    if (args.indexOf('--arduino') > -1) {
        if (args.indexOf('--arduino') !== args.lastIndexOf('--arduino')) {
            throw Error('Specify only one arduino!');
        }
        if (args.length <= args.indexOf('--arduino') + 1) {
            throw Error('Specify a serial port for your \'--arduino\' argument!');
        }
        ARDUINO_PORT_PATH = args[args.indexOf('--arduino') + 1];
    }
    else {
        throw Error('Specify one arduino as line arguments, use \'--arduino\'!');
    }
    // CUSTOM WEB PORT ARGUMENT (--port)
    if (args.indexOf('--port') > -1) {
        if (args.indexOf('--port') !== args.lastIndexOf('--port')) {
            throw Error('Specify only one web port as line argument!');
        }
        if (args.length <= args.indexOf('--port') + 1) {
            throw Error('Specify a web port for your \'--port\' argument!');
        }
        if (isNaN(Number(args[args.indexOf('--port') + 1]))) {
            throw Error('Specify a valid web port for your \'--port\' argument!');
        }
        WEB_PORT = Number(args[args.indexOf('--port') + 1]);
    }
}
/// Server Functions
function validateCrendential(credential) {
    const isAllowed = ALLOWED_IPS.some(ip => credential.ip === ip && credential.password === global_1.PASSWORD);
    let response = {
        sucess: isAllowed,
        reason: isAllowed ? '' : 'Invalid Credentials'
    };
    return response;
}
/// Arduino Functions
function createArduino(portPath) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let ports = yield serialport_1.default.list();
            let result = ports.some(port => port.path === portPath);
            if (!result) {
                console.log('Ports connected to pc: ');
                ports.forEach((port) => console.log(port.path));
                reject('No port matches ' + portPath);
            }
            let arduino = new arduino_1.Arduino(new serialport_1.default(portPath, { baudRate: defaultBaudRate }));
            if (yield arduino.ping()) {
                resolve(arduino);
            }
            else {
                reject('Arduino did not answered ping');
            }
        }));
    });
}
// Arduino Creation 
if (ARDUINO_PORT_PATH == '') {
    throw new Error('Something gone wrong and the server tried to start whitout an Serial Port Path for the Arduino');
}
let arduino;
const startArduino = () => __awaiter(void 0, void 0, void 0, function* () {
    arduino = yield createArduino(ARDUINO_PORT_PATH);
});
startArduino();
/// This Side Webserver
const app = express_1.default();
app.use(body_parser_1.default.urlencoded());
app.use(body_parser_1.default.json());
app.listen(WEB_PORT, () => console.log(`Server started at http://localhost:${WEB_PORT}`));
app.post('/cmd', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //CHECK CREDENTIALS
    let credentials = { ip: req.ip.substring(req.ip.lastIndexOf(':') + 1), password: req.body.password };
    let response = validateCrendential(credentials);
    if (!response.sucess) {
        res.send(JSON.stringify(response));
        return;
    }
    let request = req.body;
    if (!(yield arduino.send(request.cmd))) {
        let response = {
            sucess: false,
            reason: request.cmd + ' not solved!'
        };
        res.send(response);
        return;
    }
    response = {
        sucess: true,
        reason: request.cmd + ' executed sucefully!'
    };
    res.send(response);
    return;
}));
