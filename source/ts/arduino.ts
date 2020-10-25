import { resolve } from 'dns';
import { read } from 'fs';
import { prototype } from 'module';
import SerialPort from 'serialport';

const Readline = SerialPort.parsers.Readline;

export class Arduino{
    public ArduinoName:string;

    public SerialPort = require('serialport')

    public Serial:SerialPort;
    private Parser:SerialPort.parsers.Readline;


    //private DataLog:string[] = [];


    constructor(name:string,serial:SerialPort){
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter : '\n' }));
    }

    public async ping(){
        let port = this.Serial;
        let parser = this.Parser;
        let name = this.ArduinoName;
        return new Promise(function(resolve, reject) { 
            console.log(name+' pinged');
            let done = false;
            parser.on('data', (data) => { 
                done = true;
                console.log(name+ ' pong');
                parser.removeAllListeners();
                resolve(data.charAt(0) == 's')
            })
            setTimeout(() => {
                if(!done){
                    console.log(name+ ' timed out');
                    parser.removeAllListeners();
                    resolve(false);
                }
            }, 2000);
          });  
    }

    public send(command:string){
        let port = this.Serial;
        let parser = this.Parser;
        let name = this.ArduinoName;
        return new Promise(function(resolve, reject) { 
            port.write(command, function () {
              console.log(name+' send: '+command);
              parser.on('data', (data) => { 
                  console.log(name+' answered: '+data.charAt(0));
                  parser.removeAllListeners();
                  resolve(data.charAt(0) == 'a');
              })
            })
          }); 
    }
}
