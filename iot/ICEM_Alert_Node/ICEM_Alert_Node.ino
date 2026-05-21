#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------
// PARAMÈTRES DE CONNEXION WI-FI
// ---------------------------------------------------------
const char* ssid = "VOTRE_NOM_DE_WIFI";
const char* password = "VOTRE_MOT_DE_PASSE";

// ---------------------------------------------------------
// PARAMÈTRES API BACKEND ICEM
// ---------------------------------------------------------
// Modifiez l'adresse IP par l'adresse IP locale de l'ordinateur 
// qui héberge le backend Node.js (ex: 192.168.1.15)
const char* apiUrl = "http://192.168.1.X:5000/api/iot/alert-status"; 

// ---------------------------------------------------------
// CONFIGURATION MATÉRIELLE (BROCHES ESP32)
// ---------------------------------------------------------
const int pinLedVerte = 14;   // LED Verte (Production Normale)
const int pinLedRouge = 12;   // LED Rouge (Anomalie Détectée)
const int pinBuzzer = 27;     // Buzzer Actif

// ---------------------------------------------------------
// VARIABLES D'ÉTAT
// ---------------------------------------------------------
bool isAlertActive = false;
unsigned long lastCheckTime = 0;
const unsigned long checkInterval = 5000; // Vérification toutes les 5 secondes

// Variables pour le clignotement non-bloquant (évite d'utiliser delay)
unsigned long previousBlinkTime = 0;
const long blinkInterval = 500; // Clignote toutes les 500ms
int ledState = LOW;

void setup() {
  Serial.begin(115200);
  
  // Configuration des broches
  pinMode(pinLedVerte, OUTPUT);
  pinMode(pinLedRouge, OUTPUT);
  pinMode(pinBuzzer, OUTPUT);
  
  // Test initial du matériel (Bip et clignotement)
  digitalWrite(pinLedVerte, HIGH);
  digitalWrite(pinLedRouge, HIGH);
  digitalWrite(pinBuzzer, HIGH);
  delay(500);
  digitalWrite(pinLedVerte, LOW);
  digitalWrite(pinLedRouge, LOW);
  digitalWrite(pinBuzzer, LOW);

  // Connexion Wi-Fi
  Serial.print("Connexion au Wi-Fi ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("Wi-Fi connecté !");
  Serial.print("Adresse IP : ");
  Serial.println(WiFi.localIP());

  // État initial (En attente de la première lecture)
  digitalWrite(pinLedVerte, HIGH); // On suppose que tout va bien au démarrage
}

void loop() {
  // 1. VÉRIFICATION PÉRIODIQUE DE L'API
  if (millis() - lastCheckTime >= checkInterval) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(apiUrl);
      
      int httpResponseCode = http.GET();
      
      if (httpResponseCode == 200) {
        String payload = http.getString();
        Serial.println("Réponse API : " + payload);
        
        // Parsing du JSON (On alloue 256 octets)
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, payload);
        
        if (!error) {
          bool hasAlert = doc["hasAlert"];
          int activeCount = doc["activeCount"];
          
          if (hasAlert) {
            if (!isAlertActive) {
              Serial.println("⚠️ ALERTE : " + String(activeCount) + " anomalie(s) détectée(s) !");
              isAlertActive = true;
            }
          } else {
            if (isAlertActive) {
              Serial.println("✅ RETOUR A LA NORMALE : Toutes les anomalies sont traitées.");
              isAlertActive = false;
              // On s'assure d'éteindre l'alerte
              digitalWrite(pinLedRouge, LOW);
              digitalWrite(pinBuzzer, LOW);
              digitalWrite(pinLedVerte, HIGH);
            }
          }
        } else {
          Serial.print("Erreur de parsing JSON: ");
          Serial.println(error.c_str());
        }
      } else {
        Serial.print("Code d'erreur HTTP : ");
        Serial.println(httpResponseCode);
      }
      http.end();
    } else {
      Serial.println("Erreur: Wi-Fi déconnecté");
      // Tentative de reconnexion...
      WiFi.reconnect();
    }
    
    lastCheckTime = millis();
  }

  // 2. GESTION DE L'ALERTE PHYSIQUE (Mode Clignotant non-bloquant)
  if (isAlertActive) {
    digitalWrite(pinLedVerte, LOW); // Couper la LED Verte
    
    unsigned long currentMillis = millis();
    if (currentMillis - previousBlinkTime >= blinkInterval) {
      previousBlinkTime = currentMillis;
      
      // Inverser l'état
      if (ledState == LOW) {
        ledState = HIGH;
      } else {
        ledState = LOW;
      }
      
      // Appliquer l'état à la LED Rouge et au Buzzer
      digitalWrite(pinLedRouge, ledState);
      digitalWrite(pinBuzzer, ledState);
    }
  }
}
