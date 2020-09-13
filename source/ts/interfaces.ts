
export namespace Interfaces {

    export interface ArduinoInsertionRequest {
        arduinoName: string,
        serialPort: string,
        baudRate: string
    }

    export interface Credential {
        ip: string,
        password: string
    }
}
