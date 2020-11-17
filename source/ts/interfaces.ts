export namespace Interfaces {
    export interface ArduinoCommandRequest{
        read:boolean,
        cmd:string
    }
    export interface ArduinoResponse {
        sucess : boolean,
        reason : string
    }
    export interface Credential {
        ip: string,
        password: string
    }
}