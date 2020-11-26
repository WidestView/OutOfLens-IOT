import axios from 'axios';
import { PASSWORD } from './global';
import { Agent } from 'https';

export class RequestManager {

    public async send(url: string, data: string) {

        // TODO: Implement Cryptography

        let dataToSend = {
            password: PASSWORD,
            data: data
        };

        try {

            const res = await axios.post(url, dataToSend, {
               httpsAgent: new Agent({
                   rejectUnauthorized: false
               })
            });

            console.log(`Response statusCode: ${res.status}`);
            console.log('Response: ' , res.data);
        } catch (error) {

            console.log(String(error));

        }
    }
}

