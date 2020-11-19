import cryptoJs   from 'crypto-js';
import { DECKEY } from './global';

export namespace crypto{
    export function decrypt(data: string){
        const result = cryptoJs.AES.decrypt(data, DECKEY);
        return result.toString(cryptoJs.enc.Utf8);
    }

    export function encrypt(data: string){
        const result = cryptoJs.AES.encrypt(data, DECKEY).toString()
        return result;
    }

    export function hash(data: string){
        return cryptoJs.SHA256(data).toString();
    }
}