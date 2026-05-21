# 🔌 Guide d'Intégration IoT : Station d'Alerte Physique ICEM

Ce guide est conçu pour vous accompagner pas à pas dans la mise en place de la station d'alerte physique de l'atelier ICEM, **même si vous n'avez aucune connaissance préalable en électronique ou en IoT**.

Le système fonctionne ainsi :
1. Une anomalie est détectée (via l'application mobile Flutter + IA Roboflow).
2. L'anomalie est enregistrée dans Firebase Firestore avec le statut `detectee` (non traitée).
3. L'ESP32 interroge toutes les 5 secondes l'API locale Node.js (`GET /api/iot/alert-status`).
4. Si une anomalie active existe : la **LED Rouge** clignote et le **Buzzer** émet un bip intermittent.
5. Lorsque l'anomalie est marquée comme **Traitée** depuis le Dashboard Web React ou l'App mobile, la station s'éteint et la **LED Verte** s'allume fixe (Production normale).

---

## 🛠️ Étape 1 : Liste du Matériel à Acheter

Vous pouvez trouver ces composants dans n'importe quelle boutique d'électronique en Tunisie (ex: *FabLab, Sciencia, Tunisian Robotics, etc.*). Le coût total estimé est entre **35 et 50 TND**.

| Composant | Quantité | Rôle | Prix Estimé (TND) |
| :--- | :---: | :--- | :---: |
| **Carte ESP32 (ESP-WROOM-32 / NodeMCU)** | 1 | Microcontrôleur Wi-Fi (le "cerveau" de la station) | 25 – 35 TND |
| **LED Verte (5mm)** | 1 | Témoin de production normale | 0.2 – 0.5 TND |
| **LED Rouge (5mm)** | 1 | Témoin d'anomalie active | 0.2 – 0.5 TND |
| **Buzzer Actif (5V)** | 1 | Alarme sonore | 2 – 3 TND |
| **Résistances 220Ω (Ohms)** | 2 | Protéger les LEDs pour éviter qu'elles ne grillent | 0.2 TND |
| **Breadboard (Plaque d'essai)** | 1 | Permet de câbler sans soudure | 4 – 6 TND |
| **Câbles Dupont (Mâle-Mâle)** | 1 lot | Fils de connexion | 3 – 5 TND |
| **Câble Micro-USB** | 1 | Pour connecter l'ESP32 à votre PC (transfert de code + alimentation) | 3 – 5 TND |

> [!TIP]
> Assurez-vous d'acheter un **Buzzer Actif** (qui émet un son dès qu'il est alimenté en tension) et non un *Buzzer Passif* (qui nécessite de générer des fréquences complexes par code).

---

## 🔌 Étape 2 : Câblage du Prototype (Schéma)

Débranchez l'ESP32 de votre ordinateur pendant le câblage pour éviter les courts-circuits.

### 1. Repérer les broches (Pins)
Sur votre carte ESP32, vous verrez des petits textes écrits à côté des broches :
* **GND** : La masse (négatif `-`). Il y en a plusieurs, vous pouvez utiliser n'importe laquelle.
* **G14 (ou D14)** : Broche pour la LED Verte.
* **G12 (ou D12)** : Broche pour la LED Rouge.
* **G27 (ou D27)** : Broche pour le Buzzer.

### 2. Comment brancher une LED
Une LED a deux pattes :
* **La patte longue** (Anode, borne positive `+`).
* **La patte courte** (Cathode, borne négative `-`, souvent avec un méplat sur le bord plastique).

* **Branchement de la LED Verte :**
  1. Insérez la LED Verte sur la Breadboard.
  2. Connectez un fil depuis la broche **D14** de l'ESP32 vers la **patte longue** de la LED Verte.
  3. Connectez une **résistance de 220Ω** entre la **patte courte** de la LED Verte et la ligne bleue de masse (GND) de la breadboard.

* **Branchement de la LED Rouge :**
  1. Insérez la LED Rouge sur la Breadboard.
  2. Connectez un fil depuis la broche **D12** de l'ESP32 vers la **patte longue** de la LED Rouge.
  3. Connectez une **résistance de 220Ω** entre la **patte courte** de la LED Rouge et la ligne de masse (GND).

### 3. Comment brancher le Buzzer Actif
Le buzzer possède une étiquette ou un symbole `+` sur le dessus indiquant la patte positive.
1. Connectez un fil depuis la broche **D27** de l'ESP32 vers la **patte positive (`+`)** du Buzzer.
2. Connectez la **patte négative (`-`)** du Buzzer directement sur la ligne de masse (GND).

### 4. Connecter la Masse Commune
* Connectez un fil depuis la broche **GND** de l'ESP32 vers la ligne bleue de masse (GND) de votre Breadboard afin de fermer le circuit électrique pour tous les composants.

---

## 💻 Étape 3 : Installation des Outils Logiciels sur PC

Pour programmer l'ESP32, nous utiliserons le logiciel gratuit **Arduino IDE**.

1. **Télécharger Arduino IDE** : 
   Allez sur le site officiel [arduino.cc/en/software](https://www.arduino.cc/en/software) et téléchargez la dernière version pour Windows. Installez-la.

2. **Installer le pilote USB (Driver)** :
   Pour que votre PC Windows reconnaisse l'ESP32 lorsqu'il est branché en USB, vous devez installer un pilote.
   * La plupart des cartes ESP32 utilisent le circuit intégré **CP210x** ou **CH340**.
   * Téléchargez et installez le pilote correspondant :
     * Pilote CP210x : [Lien Silicon Labs](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
     * Pilote CH340 : [Lien WCH](http://www.wch-ic.com/downloads/CH341SER_EXE.html)

3. **Ajouter l'ESP32 dans Arduino IDE** :
   * Ouvrez Arduino IDE.
   * Allez dans **Fichier > Préférences** (File > Preferences).
   * Dans la case *URL de gestionnaire de cartes supplémentaires* (Additional Boards Manager URLs), copiez-collez l'adresse suivante :
     ```text
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   * Cliquez sur **OK**.
   * Allez dans **Outils > Carte > Gestionnaire de carte** (Tools > Board > Boards Manager).
   * Recherchez `esp32` (par *Espressif Systems*) et cliquez sur **Installer** (choisissez la dernière version stable).

---

## 📚 Étape 4 : Installation de la Bibliothèque ArduinoJson

Le code de l'ESP32 a besoin de décoder le format de données JSON envoyé par le backend Node.js. Nous utilisons la bibliothèque `ArduinoJson`.

1. Dans Arduino IDE, allez dans **Outils > Gérer les bibliothèques** (ou cliquez sur l'icône de livre dans la barre latérale gauche).
2. Recherchez `ArduinoJson` (développée par *Benoit Blanchon*).
3. **Important :** Le code actuel utilise la syntaxe **Version 6** de la bibliothèque. Sélectionnez la version **6.21.5** (ou toute autre version 6.x) dans le menu déroulant et cliquez sur **Installer**.

> [!NOTE]
> Si vous préférez installer la version 7 (la plus récente par défaut), vous devrez modifier la ligne 87 du fichier `.ino` en changeant `StaticJsonDocument<256> doc;` par `JsonDocument doc;`.

---

## 🌐 Étape 5 : Configuration du Code & Réseau Local

Pour que l'ESP32 puisse interroger votre serveur backend Node.js, ils doivent être connectés au **même réseau Wi-Fi** (par exemple, le Wi-Fi de votre maison ou de votre bureau). L'ESP32 ne peut pas utiliser `localhost` (qui fait référence à lui-même), il a besoin de l'adresse IP locale de votre ordinateur.

### 1. Trouver l'adresse IP locale de votre ordinateur Windows
1. Appuyez sur les touches `Windows + R` de votre clavier, tapez `cmd` et appuyez sur **Entrée**.
2. Dans la console qui s'ouvre, tapez la commande suivante et appuyez sur **Entrée** :
   ```cmd
   ipconfig
   ```
3. Cherchez la section correspondant à votre connexion (généralement *Carte réseau sans fil Wi-Fi* ou *Carte Ethernet*).
4. Notez votre **Adresse IPv4** (elle ressemble à `192.168.1.15` ou `192.168.8.100`).

### 2. Configurer le fichier de code
Ouvrez le fichier [ICEM_Alert_Node.ino](file:///c:/Users/MAISON%20INFO/Documents/GitHub/projet-pfe-ICEM/iot/ICEM_Alert_Node/ICEM_Alert_Node.ino) dans Arduino IDE et modifiez les lignes suivantes :

* **Ligne 8 & 9 : Vos identifiants Wi-Fi**
  ```cpp
  const char* ssid = "VOTRE_NOM_DE_WIFI";       // Remplacez par le nom de votre réseau Wi-Fi
  const char* password = "VOTRE_MOT_DE_PASSE"; // Remplacez par votre clé de sécurité Wi-Fi
  ```

* **Ligne 16 : L'adresse IP de votre serveur backend**
  ```cpp
  // Remplacez 192.168.1.X par l'adresse IP IPv4 de votre PC trouvée précédemment.
  // Laissez le port :5000 et le chemin de l'API intacts.
  const char* apiUrl = "http://192.168.1.15:5000/api/iot/alert-status"; 
  ```

---

## 🚀 Étape 6 : Téléversement du Programme

1. Connectez votre ESP32 à votre ordinateur à l'aide du câble Micro-USB.
2. Dans Arduino IDE, allez dans **Outils > Carte > esp32** et sélectionnez **ESP32 Dev Module** (qui est le choix parfait pour votre carte **ESP-WROOM-32**) ou éventuellement **DOIT ESP32 DEVKIT V1**.
3. Allez dans **Outils > Port** et sélectionnez le port COM correspondant à votre ESP32 (par exemple `COM3` ou `COM4`). Si aucun port n'apparaît, vérifiez le branchement du câble USB et l'installation du pilote.
4. Cliquez sur le bouton **Téléverser** (la flèche orientée vers la droite `➡` en haut à gauche).
5. **Astuce de téléversement :** 
   Sur certaines cartes ESP32 à bas coût, le téléchargement automatique échoue et affiche des points de suspension `Connecting.......___`. Si cela arrive :
   * Dès que le message `Connecting...` apparaît en bas d'Arduino IDE, maintenez enfoncé le bouton **BOOT** (ou **BOOT/FLASH**) situé physiquement sur votre carte ESP32.
   * Relâchez le bouton dès que vous voyez le pourcentage d'écriture s'afficher (`Writing at 0x00001000...`).
6. Une fois le téléversement fini, ouvrez le **Moniteur Série** d'Arduino IDE (icône de loupe en haut à droite).
7. Configurez la vitesse du moniteur série sur **115200 baud** (dans le menu déroulant en bas à droite de la console de texte).
8. Appuyez une fois sur le bouton **EN/RST** de l'ESP32 pour le redémarrer. Vous devriez voir les messages de connexion Wi-Fi s'afficher !

---

## 🧪 Étape 7 : Scénario de Test de Bout en Bout

### 1. Démarrer le Backend ICEM
Sur votre PC Windows, ouvrez un terminal dans le dossier du backend du projet :
```bash
cd backend
npm install
npm run dev
```
Le serveur doit démarrer sur le port `5000`.

### 2. Vérifier l'API avec le navigateur
Depuis n'importe quel appareil connecté au même Wi-Fi, ouvrez votre navigateur et visitez l'adresse suivante :
`http://[IP_DE_VOTRE_PC]:5000/api/iot/alert-status`

Vous devriez obtenir une réponse JSON de ce type :
```json
{
  "activeCount": 0,
  "hasAlert": false
}
```
*À ce stade, l'ESP32 doit avoir sa **LED Verte allumée** fixe et le Buzzer doit être silencieux.*

### 3. Simuler une anomalie
Pour tester le déclenchement de l'alarme sans scanner un vrai câble avec l'application Flutter :
1. Accédez à votre console **Firebase Firestore**.
2. Allez dans la collection `anomaly`.
3. Ajoutez un nouveau document (ou modifiez-en un existant) avec le paramètre suivant :
   * **statut** : `detectee` (ou `en_attente`, n'importe quelle valeur différente de `traitee`, `archivee` ou `resolue`).
4. Dans les 5 secondes qui suivent, l'ESP32 va interroger le serveur.
5. **Résultat physique attendu :** 
   * La LED Verte s'éteint.
   * La LED Rouge se met à clignoter toutes les 500 ms.
   * Le Buzzer émet des bips intermittents synchronisés avec la LED rouge.
   * Le Moniteur Série d'Arduino affiche : `⚠️ ALERTE : 1 anomalie(s) détectée(s) !`

### 4. Résoudre l'anomalie
1. Allez sur votre **Dashboard Web React** (ou directement dans la console Firestore).
2. Changez le statut de cette anomalie pour le passer à : **`traitee`**.
3. Dans les 5 secondes suivantes :
   * **Résultat physique attendu :** La LED Rouge s'éteint, le Buzzer redevient silencieux et la **LED Verte s'allume** fixe.
   * Le Moniteur Série d'Arduino affiche : `✅ RETOUR A LA NORMALE : Toutes les anomalies sont traitées.`
