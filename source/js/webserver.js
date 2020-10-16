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
// Arguments check
/*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS, just like: beserrovsky.ddns.net !*/
var ARGUMENTS = process.argv.slice(2); // Remove default node arguments
var WEB_PORT = 8000;
var ALLOWED_IPS = [];
checkLineArguments(ARGUMENTS);
function checkLineArguments(Arguments) {
    if (ARGUMENTS.length < 1) {
        throw Error('Specify at least one allowed URL as an line argument!');
    }
    if (!isNaN(Number(ARGUMENTS[0]))) { // check if the first argument is JUST a valid port
        WEB_PORT = Number(ARGUMENTS[0]);
        if (ARGUMENTS.length < 2) {
            throw new Error('Specify at least one allowed URL as an line argument!');
        }
        console.log('!-- Allowed URLS: ');
        for (var i = 1; i < ARGUMENTS.length; i++) {
            dns_1.default.lookup(ARGUMENTS[i], (err, address, family) => {
                if (err) {
                    console.log(err);
                    return;
                }
                ALLOWED_IPS.push(address);
            });
            console.log(ARGUMENTS[i]);
        }
        console.log('! --');
    }
    else {
        for (var i = 1; i < ARGUMENTS.length; i++) {
            dns_1.default.lookup(ARGUMENTS[i], (err, address, family) => {
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
function validateCrendential(credential) {
    var isAllowed = ALLOWED_IPS.some(ip => credential.ip === ip && credential.password);
    let response = {
        sucess: isAllowed,
        reason: isAllowed ? '' : 'Invalid Credentials'
    };
    return response;
}
function verifyArduinoInsertionRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Request recieved for opening ${request.serialPort} at ${request.baudRate} as ${request.arduinoName}`);
        let reasons = [];
        global_1.arduinos.forEach((ard, name) => {
            if (request.arduinoName === name) {
                reasons.push(`That is already an arduino called '${name}'`);
            }
            if (request.serialPort === ard.Serial.path) {
                reasons.push("This port is already used by: " + ard.ArduinoName + ", try other");
            }
        });
        let ports = yield serialport_1.default.list();
        let result = ports.some(port => port.path === request.serialPort);
        if (!result) {
            reasons.push('There is no port that matches the given one');
        }
        let response = {
            sucess: reasons.length == 0,
            reason: reasons.join('\n')
        };
        return response;
    });
}
function pingSerial(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Pinging ' + serial.path + ' at ' + serial.baudRate);
        let parser = serial.pipe(new Readline({ delimiter: '\n' }));
        let data;
        try {
            data = (yield new Promise((onResult, onError) => {
                parser.on('data', data => {
                    onResult(data);
                });
                setTimeout(() => serial.write('p'), 1000);
                setTimeout(() => onError(), 1100); // VERIFY IF THE RETURN IS ACTUALLY 'p'
            }));
        }
        catch (_a) {
            console.log('NOT Pong');
            return false;
        }
        console.log('Pong');
        return data.charCodeAt(0) === 112;
    });
}
/// EXECUTION
const app = express_1.default();
app.use(body_parser_1.default.urlencoded());
app.use(body_parser_1.default.json());
app.listen(WEB_PORT, () => console.log(`Server started at http://localhost:${WEB_PORT}`));
app.post('/add', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let credentials = { ip: req.ip.substring(req.ip.lastIndexOf(':') + 1), password: req.body.password };
        let response = validateCrendential(credentials);
        if (!response.sucess) {
            res.send(JSON.stringify(response));
            return;
        }
        let request = req.body;
        let result = yield verifyArduinoInsertionRequest(request);
        if (!result.sucess) {
            res.send(JSON.stringify(result));
            return;
        }
        let serial = new serialport_1.default(request.serialPort, { baudRate: Number(request.baudRate) });
        let isValid = yield pingSerial(serial);
        if (!isValid) {
            let response = {
                sucess: false,
                reason: 'This port is not an Arduino valid'
            };
            res.send(JSON.stringify(response));
            serial.close();
            return;
        }
        let ard = new arduino_1.Arduino(request.arduinoName, serial);
        global_1.arduinos.set(request.arduinoName, ard);
        console.log(`Arduino ${request.arduinoName} was added.`);
        console.log("Arduinos:");
        global_1.arduinos.forEach((serial, arduino) => console.log(` Arduino: ${arduino}/Port = ${ard.Serial.path} | BaudRate= ${ard.Serial.baudRate}`));
        res.send(JSON.stringify({ sucess: true, reason: ard.ArduinoName + ' added successfully' }));
    });
});
app.post('/cmd', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let credentials = { ip: req.ip.substring(req.ip.lastIndexOf(':') + 1), password: req.body.password };
        let response = validateCrendential(credentials);
        if (!response.sucess) {
            res.send(JSON.stringify(response));
            return;
        }
        try {
            let arduino;
            global_1.arduinos.forEach((ard, name) => {
                if (name == req.body.arduinoName) {
                    arduino = ard;
                    arduino.send(req.body.cmd);
                }
            });
        }
        catch (_a) {
        }
        res.end();
    });
});
