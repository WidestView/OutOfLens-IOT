//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//                   
/*LIBRARIES*/
#include <LedControl.h>

#define BUZZER 9

/*MATRIX CODE*/
#define DIN 7
#define CS 6
#define CLK 5
#define Width 8
#define Height 8

LedControl lc = LedControl(DIN,CLK,CS,1);

enum matrix{
  creeper,
  heart0,
  heart1,
  heart2,
  top
};

void setup() {
  //PIN DEFINITION
  pinMode(9, OUTPUT);

  //SERIAL DEFINITION
  Serial.begin(9600);

  //Buzz for setup end 's' for setup done
  Serial.println('s');

  lc.shutdown(0,false);   
  lc.setIntensity(0,0);      
  lc.clearDisplay(0);
  
  buzz(BUZZER, 3);
}

void loop() {
  /*ONE BUZZING AT THE END AND 'a' FOR COMMAND SOLVED*/
  /*TWO BUZZING AND 'd' FOR COMMAND NOT SOLVED*/

  if (Serial.available()) {
    switch (Serial.read()) {
    case 'a':
      Serial.println('a');
      buzz(BUZZER, 1);
      break;
    case 'c':
      Serial.println('a');
      dotDrawn(creeper,false);
      buzz(BUZZER, 1);
      break;
    case 't':
      Serial.println('a');
      dotDrawn(top,false);
      buzz(BUZZER, 1);
      break;
    case 'd':
      Serial.println('a');
      lc.clearDisplay(0);
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

void dotDrawn(matrix m,bool falar){
  lc.clearDisplay(0);
  switch (m){
    case creeper:
      lc.setRow(0,0,B00000000);
      lc.setRow(0,1,B01100110);
      lc.setRow(0,2,B01100110);
      lc.setRow(0,3,B00011000);
      lc.setRow(0,4,B00111100);
      lc.setRow(0,5,B00111100);
      lc.setRow(0,6,B00100100);
      lc.setRow(0,7,B00000000);
      if(falar){Serial.println("OW man!");}
    break;
    case heart0:
      lc.setRow(0,0,B01100110);
      lc.setRow(0,1,B10011001);
      lc.setRow(0,2,B10000001);
      lc.setRow(0,3,B10000001);
      lc.setRow(0,4,B01000010);
      lc.setRow(0,5,B00100100);
      lc.setRow(0,6,B10011001);
      lc.setRow(0,7,B11000011);
      if(falar){Serial.println("S2");}
    break;
    case heart1:
      lc.setRow(0,0,B00000000);
      lc.setRow(0,1,B01100110);
      lc.setRow(0,2,B01111110);
      lc.setRow(0,3,B01111110);
      lc.setRow(0,4,B00111100);
      lc.setRow(0,5,B00011000);
      lc.setRow(0,6,B10000001);
      lc.setRow(0,7,B01000010);
      if(falar){Serial.println("S2");}
    case heart2:
      lc.setRow(0,0,B01100110);
      lc.setRow(0,1,B10011001);
      lc.setRow(0,2,B10000001);
      lc.setRow(0,3,B10000001);
      lc.setRow(0,4,B01000010);
      lc.setRow(0,5,B00100100);
      lc.setRow(0,6,B11011011);
      lc.setRow(0,7,B01000010);
      if(falar){Serial.println("S2");}
    break;
    case top:
      lc.setRow(0,0,B00010001);
      lc.setRow(0,1,B00001001);
      lc.setRow(0,2,B00000101);
      lc.setRow(0,3,B00110101);
      lc.setRow(0,4,B01001010);
      lc.setRow(0,5,B00000110);
      lc.setRow(0,6,B01001111);
      lc.setRow(0,7,B00110011);
      if(falar){Serial.println("TOP");}
    break;
    }
}
