export namespace Interfaces {
    export interface ArduinoCommandRequest{
        cmd:string
    }
    export interface ArduinoResponse {
        success : boolean,
        reason : string
    }
    export interface Credential {
        ip: string,
        password: string
    }
}
