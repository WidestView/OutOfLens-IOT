"use strict";
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
    let reasons = "";
    arduinos.forEach((serial, arduino) => {
        if (request.arduinoName == arduino) {
            reasons += `That is already an arduino called '${arduino}'\n`;
        }
        if (request.serialPort == serial.path && Number(request.baudRate) == serial.baudRate) {
            reasons += "This port and baudrate are already busy, try other\n";
        }
    });
    let response = {
        sucess: (reasons == "") ? true : false,
        reason: reasons
    };
    return response;
}
/// EXECUTION
const app = express_1.default();
app.set('view engine', 'ejs');
app.use(body_parser_1.default.urlencoded());
app.use(body_parser_1.default.json());
app.listen(WEB_PORT, () => {
    console.log(`Server started at http://localhost:${WEB_PORT}`);
});
app.post('/add', function (req, res) {
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
    let verify = verifyArduinoInsertionRequest(request);
    if (!verify.sucess) {
        res.send(JSON.stringify(verify));
        return;
    }
    let serial = new serialport_1.default(request.serialPort, { baudRate: Number(request.baudRate) });
    arduinos.set(request.arduinoName, serial);
    console.log(`Arduino ${request.arduinoName} was added.`);
    arduinos.forEach((serial, arduino) => console.log(`Arduino: ${arduino}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
    res.send(JSON.stringify({ sucess: true, reason: 'Insertion executed successfully' }));
});
