import SerialPort from 'serialport';

import util from 'util';

const Readline = SerialPort.parsers.Readline;

let port = new SerialPort('COM3', { baudRate : 9600, autoOpen: false});

port.on('readable', () => {
    console.log('onReadable');
    console.log('data:', port.read())
});

port.on('data', data => {
    console.log('onData');
    console.log(data);
});


port.on('open',() => {
    console.log('open');
    port.write('a') 
})

port.open(error => {
    console.log('error');
    console.error(error);
});



