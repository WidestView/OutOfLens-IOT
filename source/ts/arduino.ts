import SerialPort from 'serialport';

import { RequestManager } from './request-manager';

const Readline = SerialPort.parsers.Readline;

export class Arduino {
    public SerialPort = require('serialport')

    public Serial: SerialPort;
    private readonly localParser: SerialPort.parsers.Readline;
    private serverParser: SerialPort.parsers.Readline;

    private readonly apiUrl: string;

    constructor(serial: SerialPort, url: string) {
        this.Serial = serial;
        this.localParser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.serverParser = this.Serial.pipe(new Readline({ delimiter: '\n' }));
        this.serverParser.on('data', (data) => this.register(data));
        this.apiUrl = url;
    }

    public async ping(): Promise<boolean> {
        let parser = this.localParser;


        return new Promise(function (resolve) {

            console.log('Pinging Arduino');
            let done = false;

            parser.on('data', (data) => {
                done = true;
                console.log('Arduino pong');
                parser.removeAllListeners();
                resolve(data.charAt(0) == 's')
            });

            setTimeout(() => {
                if (!done) {
                    console.log('Arduino timed out');
                    parser.removeAllListeners();
                    resolve(false);
                }
            }, 2000);
        });
    }

    public send(command: string): Promise<boolean> {
        let port = this.Serial;
        let parser = this.localParser;

        return new Promise(function (resolve) {

            port.write(command, function () {

                console.log('Command sent to arduino: ' + command);

                parser.on('data', (data) => {

                    console.log('Arduino answered: ' + data.charAt(0));

                    parser.removeAllListeners();

                    resolve(data.charAt(0) == 'a');

                })

            })
        });
    }

    private async register(data: string): Promise<void> {

        if (data.charAt(0) == 's') {
            return;
        }

        await new RequestManager().send(this.apiUrl, data);
    }
}
