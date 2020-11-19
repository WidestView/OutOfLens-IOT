"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const global_1 = require("./global");
var crypto;
(function (crypto) {
    function decrypt(data) {
        const result = crypto_js_1.default.AES.decrypt(data, global_1.DECKEY);
        return result.toString(crypto_js_1.default.enc.Utf8);
    }
    crypto.decrypt = decrypt;
    function encrypt(data) {
        const result = crypto_js_1.default.AES.encrypt(data, global_1.DECKEY).toString();
        return result;
    }
    crypto.encrypt = encrypt;
    function hash(data) {
        return crypto_js_1.default.SHA256(data).toString();
    }
    crypto.hash = hash;
})(crypto = exports.crypto || (exports.crypto = {}));
