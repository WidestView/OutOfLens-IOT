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
        let reasons = [];
        arduinos.forEach((serial, arduino) => {
            if (request.arduinoName === arduino) {
                reasons.push(`That is already an arduino called '${arduino}'`);
            }
            if (request.serialPort === serial.path && Number(request.baudRate) == serial.baudRate) {
                reasons.push("This port and baudrate are already busy, try other");
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
function pingArduino(serial) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((onResult, onError) => {
            serial.on('open', () => {
                console.log('Serial is Open');
                onResult();
            });
        });
        console.log('Pinging Arduino');
        console.log(serial);
        serial.write('a');
        const parser = new Readline({ 'delimiter': '\n' });
        serial.pipe(parser);
        let data = yield new Promise((onResult, onError) => {
            parser.on('data', data => {
                console.log('Data received');
                onResult(data);
            });
            serial.write('a');
        });
        console.log('Result is:', data);
        return data === 'a';
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
        ///
        let serial = new serialport_1.default(request.serialPort, { baudRate: Number(request.baudRate) });
        let isValid = yield pingArduino(serial);
        if (!isValid) {
            let response = {
                sucess: false,
                reason: 'This port is not an Arduino valid'
            };
            res.send(JSON.stringify(response));
            serial.close();
            return;
        }
        arduinos.set(request.arduinoName, serial);
        console.log(`Arduino ${request.arduinoName} was added.`);
        arduinos.forEach((serial, arduino) => console.log(`Arduino: ${arduino}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
        res.send(JSON.stringify({ sucess: true, reason: 'Insertion executed successfully' }));
    });
});
