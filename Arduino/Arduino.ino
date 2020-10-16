//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//                   

#define BUZZER 9

void setup(){
    //PIN DEFINITION
    pinMode(9,OUTPUT);

    //SERIAL DEFINITION
    Serial.begin(9600);

    //Buzz for setup end
    digitalWrite(BUZZER,HIGH);
    delay(20);
    digitalWrite(BUZZER,LOW);
}

void loop(){
    if (Serial.available()) {
        switch (Serial.read()) {
            case 'a':
                Serial.println("a");
            break;
            case 'b':
                 digitalWrite(BUZZER,HIGH);
                delay(20);
                digitalWrite(BUZZER,LOW);
                Serial.println("b");
            break;
        }
    }
}
