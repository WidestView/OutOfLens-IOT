"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = __importDefault(require("serialport"));
const express_1 = __importDefault(require("express"));
/// Types
/// Globals
const ports = new Map();
const WEB_PORT = 8000;
const SERVER_HOSTNAME = 'http://testesdelifybr.ddns.net/';
const PASSWORD = "5eeb219ebc72cd90a4020538b28593fbfac63d2e0a8d6ccf6c28c21c97f00ea6";
let RIGHTCREDENTIAL;
///
const app = express_1.default();
app.set('view engine', 'ejs');
app.listen(WEB_PORT, () => {
    console.log(`Server started at http://localhost:${WEB_PORT}`);
});
app.post('/add', function (req, res) {
    let credentials = { ip: req.ip, password: req.body.password };
    if (credentials == RIGHTCREDENTIAL) {
        let request = req.body;
        ports.set(request.arduinoName, new serialport_1.default(request.serialPort, { baudRate: Number(request.baudRate) }));
        ports.forEach((serial, arduino) => console.log(`Arduino: ${name}/Port = ${serial.path} | BaudRate= ${serial.baudRate}`));
    }
});
