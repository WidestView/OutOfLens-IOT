
export namespace Interfaces {

    export interface ArduinoInsertionRequest {
        arduinoName: string,
        serialPort: string,
        baudRate: string
    }
    export interface ArduinoResponse {
        sucess : boolean,
        reason : string
    }
    export interface ArduinoCommandRequest{
        arduinoName: string,
        cmd:string
    }
    export interface Credential {
        ip: string,
        password: string
    }
}