//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//          



// DEFINITION


/*LIBRARIES*/


/*DECLARATIONS*/
#define LED 2



// EXECUTION

void setup() {
  //PIN DEFINITION
  pinMode(LED, OUTPUT);

  //SERIAL DEFINITION
  Serial.begin(9600);

  //Buzz for setup end 's' for setup done
  Serial.println('s');
  
  twinkle(LED, 3);
}

void loop() {
  /*ONE BUZZING AT THE END AND 'a' FOR COMMAND SOLVED*/
  /*TWO BUZZING AND 'd' FOR COMMAND NOT SOLVED*/

  if (Serial.available()) {
    switch (Serial.read()) {

    case 'a':
      Serial.println('a');
      twinkle(LED, 1);
      break;

    default:
      Serial.println('d');
      twinkle(LED, 2);
    }
  }
}

void twinkle(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    if (times - i > 1) {
      delay(100);
    }
  }
}
