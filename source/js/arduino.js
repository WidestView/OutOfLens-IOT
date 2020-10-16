"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arduino = void 0;
const serialport_1 = __importDefault(require("serialport"));
const Readline = serialport_1.default.parsers.Readline;
class Arduino {
    constructor(name, serial) {
        this.DataLog = [];
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.Parser.on('data', data => {
            this.DataLog.push(data);
            this.DataLog.map((value) => { console.log(value); });
        });
    }
    send(value) {
        this.Serial.write(value);
    }
    read() {
        return this.DataLog;
    }
    readAndClear() {
        let result;
        result = this.DataLog;
        this.DataLog = [];
        return result;
    }
}
exports.Arduino = Arduino;
