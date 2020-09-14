
//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//                   


//Arduino serial stuff, customize to your needs
void setup(){
    Serial.begin(9600);
    pinMode(9,OUTPUT);
}

void loop(){
    if (Serial.available()) { 
        switch (Serial.read()) {
            case 'p':
                Serial.println("p");
                digitalWrite(9,HIGH);
                delay(20);
                digitalWrite(9,LOW);
            break;
            case 'a':
                Serial.println("Led ligada!");
            break;
        }
    }
}
