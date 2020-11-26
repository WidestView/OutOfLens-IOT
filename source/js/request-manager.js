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
exports.RequestManager = void 0;
const axios_1 = __importDefault(require("axios"));
const global_1 = require("./global");
const https_1 = require("https");
const user_space_credentials_1 = require("./user-space-credentials");
class RequestManager {
    send(url, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const encrypted = user_space_credentials_1.userSpaceCredentials.encrypt(data);
            const password = user_space_credentials_1.userSpaceCredentials.encrypt(global_1.PASSWORD);
            // TODO: IMPLEMENT CRYPTOGRAPHY
            let dataToSend = {
                password: password.toString(),
                data: encrypted.toString()
            };
            try {
                const res = yield axios_1.default.post(url, dataToSend, {
                    httpsAgent: new https_1.Agent({
                        rejectUnauthorized: false
                    })
                });
                console.log(`Response statusCode: ${res.status}`);
                console.log('Response: ', res.data);
            }
            catch (error) {
                console.log(String(error));
            }
        });
    }
}
exports.RequestManager = RequestManager;
//# sourceMappingURL=request-manager.js.map