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
class Arduino {
    constructor(name, serial) {
        this.Data = [];
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.Parser.on('data', data => {
            this.Data.push(data);
            this.Data.map((value) => { console.log(value); });
        });
    }
    send(value) {
        this.Serial.write(value);
    }
}
/// Globals
const arduinos = new Map();
const WEB_PORT = 3333;
const SERVER_HOSTNAME = 'testesdelifybr.ddns.net';
const PASSWORD = "5eeb219ebc72cd90a4020538b28593fbfac63d2e0a8d6ccf6c28c21c97f00ea6";
let SERVER_IP;
dns_1.default.lookup(SERVER_HOSTNAME, (err, address, family) => {
    if (err) {
        console.log(err);
        return;
    }
    SERVER_IP = address;
});
/// Functions
function validateCrendential(credential) {
    return credential.ip === SERVER_IP && credential.password === PASSWORD;
}
function verifyArduinoInsertionRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Request recieved for opening ${request.serialPort} at ${request.baudRate} as ${request.arduinoName}`);
        let reasons = [];
        arduinos.forEach((ard, name) => {
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
        try {
            let data = yield new Promise((onResult, onError) => {
                parser.on('data', data => {
                    onResult(data);
                });
                setTimeout(() => serial.write('p'), 1000);
                setTimeout(() => onError(), 1100); // VERIFY IF THE RETURN IS ACTUALLY 'p'
            });
        }
        catch (_a) {
            console.log('NOT Pong');
            return false;
        }
        console.log('Pong');
        return true;
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
        let request = req.body;
        if (!validateCrendential(credentials)) {
            let response = {
                sucess: false,
                reason: 'Invalid Credentials'
            };
            res.send(JSON.stringify(response));
            return;
        }
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
        let ard = new Arduino(request.arduinoName, serial);
        arduinos.set(request.arduinoName, ard);
        console.log(`Arduino ${request.arduinoName} was added.`);
        console.log("Arduinos:");
        arduinos.forEach((serial, arduino) => console.log(` Arduino: ${arduino}/Port = ${ard.Serial.path} | BaudRate= ${ard.Serial.baudRate}`));
        ard.send('a');
        res.send(JSON.stringify({ sucess: true, reason: ard.ArduinoName + ' added successfully' }));
    });
});
app.post('/cmd', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
    });
});
