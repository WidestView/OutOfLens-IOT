//    ______         
//   / ____/__    __ 
//  / /  __/ /___/ /_
// / /__/_  __/_  __/
// \____//_/   /_/   
//          



// DEFINITION


/*LIBRARIES*/
#include <SPI.h>
#include <MFRC522.h>

/*DECLARATIONS*/
#define SERIAL_LED 2
#define SS_PIN 53
#define RST_PIN 5
MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance.

String lastRFID;
int Timer;

// EXECUTION

void setup() {
  //PIN DEFINITION
  pinMode(SERIAL_LED, OUTPUT);

  //SERIAL DEFINITION
  Serial.begin(9600);

  //SPI BUS START
  SPI.begin();

  //RFID INIT
  mfrc522.PCD_Init();
  
  //Buzz for setup end 's' for setup done
  Serial.println('s');
  
  twinkle(SERIAL_LED, 3);
}

void loop() {

  //RFID READING

  if ( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) 
  {
    readRFID();
  }

  //SERIAL READING
  
  /*ONE BUZZING AT THE END AND 'a' FOR COMMAND SOLVED*/
  /*TWO BUZZING AND 'd' FOR COMMAND NOT SOLVED*/

  if (Serial.available()) {
    switch (Serial.read()) {

    case 'a':
      Serial.println('a');
      twinkle(SERIAL_LED, 1);
      break;

    default:
      Serial.println('d');
      twinkle(SERIAL_LED, 2);
    }
  }

  if(Timer==0){
    lastRFID = "None";
  }

  if(Timer>0){
    Timer--;
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

void readRFID(){
  String conteudo= "";
  for (byte i = 0; i < mfrc522.uid.size; i++) 
  {
     conteudo.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
     conteudo.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  if(lastRFID!=conteudo){
    lastRFID = conteudo;
    Serial.println("r" + conteudo);
    Timer = 555; // APROX. 15secs
  }
}
