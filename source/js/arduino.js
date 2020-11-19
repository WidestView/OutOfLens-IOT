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
const global_1 = require("./global");
const Readline = serialport_1.default.parsers.Readline;
const axios = require('axios');
class Arduino {
    constructor(serial, url) {
        this.SerialPort = require('serialport');
        this.Serial = serial;
        this.localParser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.serverParser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.serverParser.on('data', (data) => this.register(data));
        this.ApiUrl = url;
    }
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            let port = this.Serial;
            let parser = this.localParser;
            return new Promise(function (resolve, reject) {
                console.log('Pinging Arduino');
                let done = false;
                parser.on('data', (data) => {
                    done = true;
                    console.log('Arduino pong');
                    parser.removeAllListeners();
                    resolve(data.charAt(0) == 's');
                });
                setTimeout(() => {
                    if (!done) {
                        console.log('Arduino timed out');
                        parser.removeAllListeners();
                        resolve(false);
                    }
                }, 2000);
            });
        });
    }
    send(command) {
        let port = this.Serial;
        let parser = this.localParser;
        return new Promise(function (resolve, reject) {
            port.write(command, function () {
                console.log('Command sent to arduino: ' + command);
                parser.on('data', (data) => {
                    console.log('Arduino answered: ' + data.charAt(0));
                    parser.removeAllListeners();
                    resolve(data.charAt(0) == 'a');
                });
            });
        });
    }
    register(data) {
        if (data.charAt(0) == 's') {
            return;
        }
        // TO IMPLEMENT CRYPTOGRAPHY!!!!!!!!!!!!!!!!!!!!!!
        let dataToSend = {
            password: global_1.PASSWORD,
            data: data
        };
        axios
            .post(this.ApiUrl, dataToSend)
            .then((res) => {
            console.log(`Response statusCode: ${res.status}`);
            console.log('Response: ' + res.data);
        })
            .catch((error) => {
            console.error(error);
        });
    }
}
exports.Arduino = Arduino;
