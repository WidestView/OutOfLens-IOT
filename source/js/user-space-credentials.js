"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSpaceCredentials = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const global_1 = require("./global");
var userSpaceCredentials;
(function (userSpaceCredentials) {
    function decrypt(data) {
        const result = crypto_js_1.default.AES.decrypt(data, global_1.ENCRYPTION_KEY);
        return result.toString(crypto_js_1.default.enc.Utf8);
    }
    userSpaceCredentials.decrypt = decrypt;
    function encrypt(data) {
        return crypto_js_1.default.AES.encrypt(data, global_1.ENCRYPTION_KEY).toString();
    }
    userSpaceCredentials.encrypt = encrypt;
    function hash(data) {
        return crypto_js_1.default.SHA256(data).toString();
    }
    userSpaceCredentials.hash = hash;
})(userSpaceCredentials = exports.userSpaceCredentials || (exports.userSpaceCredentials = {}));
//# sourceMappingURL=user-space-credentials.js.map