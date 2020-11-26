import cryptoJs from 'crypto-js';
import { ENCRYPTION_KEY } from './global';

export namespace userSpaceCredentials {

    export function decrypt(data: string){
        const result = cryptoJs.AES.decrypt(data, ENCRYPTION_KEY);
        return result.toString(cryptoJs.enc.Utf8);
    }

    export function encrypt(data: string){
        return cryptoJs.AES.encrypt(data, ENCRYPTION_KEY).toString();
    }

    export function hash(data: string){
        return cryptoJs.SHA256(data).toString();
    }
}
