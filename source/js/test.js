"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serialport_1 = __importDefault(require("serialport"));
const Readline = serialport_1.default.parsers.Readline;
let port = new serialport_1.default('COM3', { baudRate: 9600, autoOpen: false });
port.on('readable', () => {
    console.log('onReadable');
    console.log('data:', port.read());
});
port.on('data', data => {
    console.log('onData');
    console.log(data);
});
port.on('open', () => {
    console.log('open');
    port.write('a');
});
port.open(error => {
    console.log('error');
    console.error(error);
});
