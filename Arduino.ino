
//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//                   


//Arduino serial stuff, customize to your needs
void setup(){
    Serial.begin(9600);
}

void loop(){
    if (Serial.available())  {

        switch (Serial.read()) {
            case 'a':
                Serial.println('a');
            break;
        }
    }
}