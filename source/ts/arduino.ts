import SerialPort from 'serialport';

const Readline = SerialPort.parsers.Readline;

export class Arduino{
    public SerialPort = require('serialport')

    public Serial: SerialPort;
    private localParser: SerialPort.parsers.Readline;
    private serverParser: SerialPort.parsers.Readline;

    private ApiUrl: string;

    constructor(serial:SerialPort, url:string){
        this.Serial = serial;
        this.localParser = this.Serial.pipe(new Readline({ delimiter : '\n' }));
        this.serverParser = this.Serial.pipe(new Readline({ delimiter : '\n' }));
        this.serverParser.on('data', (data) => this.register(data));
        this.ApiUrl = url;
    }

    public async ping(){
        let port = this.Serial;
        let parser = this.localParser;
        return new Promise(function(resolve, reject) { 
            console.log('Pinging Arduino');
            let done = false;
            parser.on('data', (data) => { 
                done = true;
                console.log('Arduino pong');
                parser.removeAllListeners();
                resolve(data.charAt(0) == 's')
            })
            setTimeout(() => {
                if(!done){
                    console.log('Arduino timed out');
                    parser.removeAllListeners();
                    resolve(false);
                }
            }, 2000);
          });  
    }

    public send(command:string){
        let port = this.Serial;
        let parser = this.localParser;
        return new Promise(function(resolve, reject) { 
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

    private register(data:string):void{
        console.log('REGISTERING: ' + data);
        //IMPLEMENT SEND IT TO SERVERS
    }
}
