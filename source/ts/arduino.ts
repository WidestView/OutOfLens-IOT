import SerialPort from 'serialport';

const Readline = SerialPort.parsers.Readline;

export class Arduino{
    public ArduinoName:string;
    public Serial:SerialPort;
    public Parser:SerialPort.parsers.Readline;

    public DataLog:string[] = [];

    constructor(name:string,serial:SerialPort){
        this.ArduinoName = name;
        this.Serial = serial;
        this.Parser = this.Serial.pipe(new Readline({ delimiter : '\n' }));
        this.Parser.on('data', data=>{
            this.DataLog.push(data);
            this.DataLog.map((value)=>{console.log(value);})
        });
    }

    public send(value : string) {
        this.Serial.write(value);
    }
    
    public read(){
        return this.DataLog;
    }
    public readAndClear(){
        let result:string[];
        result = this.DataLog;
        this.DataLog = [];
        return result;
    }
}
