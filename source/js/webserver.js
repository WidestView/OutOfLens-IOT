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
// Custom files
const arduino_1 = require("./arduino");
const global_1 = require("./global");
const request_manager_1 = require("./request-manager");
const user_space_credentials_1 = require("./user-space-credentials");
const defaultBaudRate = 9600;
// Arguments reading
/*! LINE ARGUMENTS SHOULD SPECIFY AT LEAST ONE URL FROM ALLOWED APIS AND ONE ARDUINO PORT!*/
const ARGUMENTS = process.argv.slice(2); // Remove default node arguments
let WEB_PORT = 8000;
let ALLOWED_IPS = [];
let ARDUINO_PORT_PATH = '';
let SERVER_API_URL = '';
readLineArguments(ARGUMENTS);
function readLineArguments(args) {
    // ALLOWED IPS (--allow)
    let indexOf = args.indexOf('--allow');
    if (indexOf > -1) {
        if (indexOf !== args.lastIndexOf('--allow')) {
            throw Error('Specify only one series of allowed servers!');
        }
        let index = indexOf + 1;
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
                dns_1.default.lookup(args[index], (err, address) => {
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
    indexOf = args.indexOf('--arduino');
    if (indexOf > -1) {
        if (indexOf !== args.lastIndexOf('--arduino')) {
            throw Error('Specify only one arduino!');
        }
        if (args.length <= indexOf + 1) {
            throw Error('Specify a serial port for your \'--arduino\' argument!');
        }
        ARDUINO_PORT_PATH = args[indexOf + 1];
    }
    else {
        throw Error('Specify one api as line arguments, use \'--arduino\'!');
    }
    // API (--api)
    indexOf = args.indexOf('--api');
    if (indexOf > -1) {
        if (indexOf !== args.lastIndexOf('--api')) {
            throw Error('Specify only one api!');
        }
        if (args.length <= indexOf + 1) {
            throw Error('Specify an api for your \'--api\' argument!');
        }
        SERVER_API_URL = args[indexOf + 1];
        console.log('API URL defined to ' + SERVER_API_URL);
    }
    else {
        throw Error('Specify one api as line arguments, use \'--api\'!');
    }
    // CUSTOM WEB PORT ARGUMENT (--port)
    indexOf = args.indexOf('--port');
    if (indexOf > -1) {
        if (indexOf !== args.lastIndexOf('--port')) {
            throw Error('Specify only one web port as line argument!');
        }
        if (args.length <= indexOf + 1) {
            throw Error('Specify a web port for your \'--port\' argument!');
        }
        if (isNaN(Number(args[indexOf + 1]))) {
            throw Error('Specify a valid web port for your \'--port\' argument!');
        }
        WEB_PORT = Number(args[indexOf + 1]);
    }
}
/// Server Functions
function validateCrendential(credential) {
    const ipAllowed = ALLOWED_IPS.some(ip => credential.ip === ip);
    const passAllowed = credential.password === global_1.PASSWORD;
    console.log('Ip (' + credential.ip + '): ' + (ipAllowed ? 'Ok' : 'Negado'));
    console.log('Senha: ' + (passAllowed ? 'Ok' : 'Negada'));
    return {
        success: ipAllowed && passAllowed,
        reason: ipAllowed && passAllowed ? '' : 'Invalid Credentials'
    };
}
const DEBUG_ARDUINO_PATHS = ['/dev/pts/1'];
/// Arduino Functions
function createArduino(portPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let ports = yield serialport_1.default.list();
        let result = ports.some(port => port.path === portPath) || DEBUG_ARDUINO_PATHS.some(port => port === portPath);
        if (!result) {
            console.log('Ports connected to pc: ');
            ports.forEach((port) => console.log(port.path));
            throw 'No port matches ' + portPath;
        }
        let arduino = new arduino_1.Arduino(new serialport_1.default(portPath, { baudRate: defaultBaudRate }), SERVER_API_URL);
        if (yield arduino.ping()) {
            return arduino;
        }
        else {
            throw 'Arduino did not answered ping';
        }
    });
}
// Arduino Creation
if (ARDUINO_PORT_PATH == '') {
    throw new Error('Something gone wrong and the server tried to start whitout an Serial Port Path for the Arduino');
}
let arduino;
const JUMP_TO_TEST = true;
const startArduino = () => __awaiter(void 0, void 0, void 0, function* () {
    arduino = yield createArduino(ARDUINO_PORT_PATH);
});
if (!JUMP_TO_TEST) {
    startArduino().then().catch(error => {
        console.error('ERROR: Arduino failed to start:', error);
        console.error(error);
    });
}
else {
    new request_manager_1.RequestManager().send('http://localhost:5000/api/logdata', 'beep').then();
}
/// This Side Webserver
const app = express_1.default();
app.use(body_parser_1.default.urlencoded());
app.use(body_parser_1.default.json());
app.listen(WEB_PORT, () => console.log(`Server started at http://localhost:${WEB_PORT}`));
app.post('/cmd', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //CHECK CREDENTIALS
    let credentials = {
        ip: req.ip.substring(req.ip.lastIndexOf(':') + 1),
        password: user_space_credentials_1.userSpaceCredentials.decrypt(req.body.password)
    };
    if (credentials.password === "") {
        let response = {
            success: false,
            reason: user_space_credentials_1.userSpaceCredentials.encrypt('Password could not be decrypted!')
        };
        res.send(response);
        return;
    }
    let response = validateCrendential(credentials);
    if (!response.success) {
        res.send(JSON.stringify(response));
        return;
    }
    let request = { cmd: user_space_credentials_1.userSpaceCredentials.decrypt(req.body.cmd) };
    if (request.cmd === "") {
        let response = {
            success: false,
            reason: user_space_credentials_1.userSpaceCredentials.encrypt('Command could not be decrypted!')
        };
        res.send(response);
        return;
    }
    if (!(yield arduino.send(request.cmd))) {
        let response = {
            success: false,
            reason: user_space_credentials_1.userSpaceCredentials.encrypt(request.cmd + ' not solved!')
        };
        res.send(response);
        return;
    }
    response = {
        success: true,
        reason: user_space_credentials_1.userSpaceCredentials.encrypt(request.cmd + ' executed sucefully!')
    };
    res.send(response);
    return;
}));
//# sourceMappingURL=webserver.js.map