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
exports.Arduino = void 0;
const serialport_1 = __importDefault(require("serialport"));
const Readline = serialport_1.default.parsers.Readline;
class Arduino {
    //private DataLog:string[] = [];
    constructor(name, serial) {
        this.SerialPort = require('serialport');
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            let port = this.Serial;
            let parser = this.Parser;
            let name = this.ArduinoName;
            return new Promise(function (resolve, reject) {
                console.log(name + ' pinged');
                let done = false;
                parser.on('data', (data) => {
                    done = true;
                    console.log(name + ' pong');
                    parser.removeAllListeners();
                    resolve(data.charAt(0) == 's');
                });
                setTimeout(() => {
                    if (!done) {
                        console.log(name + ' timed out');
                        parser.removeAllListeners();
                        resolve(false);
                    }
                }, 2000);
            });
        });
    }
    send(command) {
        let port = this.Serial;
        let parser = this.Parser;
        let name = this.ArduinoName;
        return new Promise(function (resolve, reject) {
            port.write(command, function () {
                console.log(name + ' send: ' + command);
                parser.on('data', (data) => {
                    console.log(name + ' answered: ' + data.charAt(0));
                    parser.removeAllListeners();
                    resolve(data.charAt(0) == 'a');
                });
            });
        });
    }
}
exports.Arduino = Arduino;
