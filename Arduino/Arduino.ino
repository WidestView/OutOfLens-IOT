//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//                   

#define BUZZER 9

void setup() {
  //PIN DEFINITION
  pinMode(9, OUTPUT);

  //SERIAL DEFINITION
  Serial.begin(9600);

  //Buzz for setup end 's' for setup done
  buzz(BUZZER, 3);
  Serial.println('s');
}

void loop() {
  /*ONE BUZZING AT THE END AND 'a' FOT COMMAND SOLVED*/
  /*TWO BUZZING AND 'd' FOR COMMAND NOT SOLVED*/

  if (Serial.available()) {
    switch (Serial.read()) {
    case 'a':
      Serial.println('a');
      buzz(BUZZER, 1);
      break;
    default:
      Serial.println('d');
      buzz(BUZZER, 2);
    }
  }
}

void buzz(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    if (times - i > 1) {
      delay(100);
    }
  }
}