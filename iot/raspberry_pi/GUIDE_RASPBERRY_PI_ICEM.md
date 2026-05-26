# 🏭 Guide Complet : Station d'Alerte IoT ICEM — Raspberry Pi + Écran + Buzzer

> **Ce guide vous accompagne étape par étape, depuis le début, sans connaissance préalable.**  
> Architecture finale : **Raspberry Pi** + **Écran HDMI (ou tablette)** + **Buzzer actif sur GPIO**.

---

## 🔌 Architecture du Système

```
┌─────────────────────┐        WiFi (même réseau)         ┌────────────────────────────────┐
│   Application Mobile│──────────────────────────────────▶│  Serveur Backend Node.js       │
│   Flutter + IA      │   Détecte une anomalie             │  (votre PC Windows, port 5000) │
└─────────────────────┘   → enregistre dans Firebase       └───────────────┬────────────────┘
                                                                           │
                                                              GET /api/iot/alert-status
                                                                           │ (toutes les 5s)
                                                                           ▼
                                                            ┌──────────────────────────────┐
                                                            │  🍓 RASPBERRY PI              │
                                                            │                              │
                                                            │  Script Python icem_buzzer   │
                                                            │  → GPIO 17 → 🔊 BUZZER        │
                                                            │                              │
                                                            │  Navigateur Chromium (Kiosk) │
                                                            │  → 🖥️ ÉCRAN HDMI / TABLETTE   │
                                                            │    Affiche WorkshopDisplay   │
                                                            └──────────────────────────────┘
```

**Ce que voit l'opérateur d'atelier :**
- 🟢 **Écran vert + silence** : Production conforme, aucune anomalie
- 🔴 **Écran rouge clignotant + BIP du buzzer** : Anomalie détectée, câble à inspecter
- ✅ **Bouton tactile** sur l'écran pour marquer l'anomalie comme traitée

---

## 🛒 Étape 0 : Matériel Nécessaire

| Matériel | Rôle | Note |
|:---|:---|:---|
| **Raspberry Pi** (modèle 3B+, 4 ou 5) | Le mini-ordinateur central | Déjà disponible dans l'usine |
| **Carte MicroSD** (16 ou 32 Go, Classe 10) | Contient le système d'exploitation | À acheter si non disponible |
| **Alimentation officielle Raspberry Pi** | Alimente la carte | 5V/3A pour Pi4 |
| **Câble HDMI / Micro-HDMI** | Connecte l'écran/tablette | Selon le modèle de Pi |
| **Écran HDMI** ou **Tablette avec port HDMI** | Affiche le dashboard | Déjà disponible dans l'usine |
| **Buzzer Actif 5V** | Émet les bips d'alerte | ⚠️ Actif, pas Passif |
| **2 câbles Dupont Femelle-Femelle** | Connecte le buzzer au GPIO | Ou fils avec connecteurs |
| **Clavier USB** (temporaire) | Pour la configuration initiale uniquement | Peut être retiré après |

---

## 💻 Étape 1 : Installer le Système d'Exploitation sur le Raspberry Pi

### 1.1 Télécharger Raspberry Pi Imager (sur votre PC Windows)

1. Allez sur le site officiel : **https://www.raspberrypi.com/software/**
2. Cliquez sur **"Download for Windows"** et installez le logiciel `Raspberry Pi Imager`.

### 1.2 Graver le système sur la carte MicroSD

1. Insérez la carte MicroSD dans votre PC Windows (avec un adaptateur si nécessaire).
2. Ouvrez **Raspberry Pi Imager**.
3. Cliquez sur **"CHOOSE DEVICE"** → Sélectionnez votre modèle de Raspberry Pi.
4. Cliquez sur **"CHOOSE OS"** → Sélectionnez **"Raspberry Pi OS (64-bit)"** (la première option recommandée, avec interface graphique).
5. Cliquez sur **"CHOOSE STORAGE"** → Sélectionnez votre carte MicroSD.
6. ⚠️ **IMPORTANT** : Cliquez sur l'icône ⚙️ (engrenage) pour **pré-configurer** :
   - Cochez **"Set hostname"** → tapez `icem-atelier`
   - Cochez **"Enable SSH"** (accès à distance optionnel)
   - Cochez **"Configure wireless LAN"** → entrez le **nom de votre réseau Wi-Fi** et son **mot de passe**
   - Cochez **"Set username and password"** → utilisateur : `pi`, mot de passe : (choisissez un mot de passe)
   - Cliquez **"SAVE"**
7. Cliquez sur **"WRITE"** et confirmez. La gravure prend 5-10 minutes.

### 1.3 Premier démarrage

1. Retirez la carte MicroSD du PC et insérez-la dans le Raspberry Pi.
2. Branchez l'écran HDMI.
3. Branchez le clavier USB (pour la configuration initiale).
4. Branchez l'alimentation → le Raspberry Pi démarre.
5. Après ~1-2 minutes, vous verrez le bureau graphique de Raspberry Pi OS.

---

## 🔌 Étape 2 : Branchement du Buzzer sur les GPIO

### Comprendre les GPIO du Raspberry Pi

Le Raspberry Pi a une rangée de **40 broches** (pins) sur le côté. Voici les broches qui nous intéressent :

```
          Raspberry Pi — Vue de dessus (côté broches GPIO)
          ┌─────────────────────────────────────────────┐
          │  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  │ ← Rangée du haut (pins impairs : 1,3,5...)
          │  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  ●  │ ← Rangée du bas  (pins pairs  : 2,4,6...)
          └─────────────────────────────────────────────┘
             ↑Pin 1                                  Pin 40↑

  Pin  9 (GND)    → Fil NOIR  → Buzzer (-)  (patte courte ou marquée -)
  Pin 11 (GPIO17) → Fil ROUGE → Buzzer (+)  (patte longue ou marquée +)
```

### Comment compter les broches ?

- La **broche n°1** est dans le coin supérieur gauche (côté port USB et Ethernet), elle est souvent marquée d'un petit carré blanc sur la carte ou dans la documentation.
- Comptez de gauche à droite, ligne par ligne : 1, 2, 3, 4... jusqu'à 40.

### Branchement concret

| Broche Raspberry Pi | Numéro de Pin | Fil | Vers le Buzzer |
|:---|:---:|:---:|:---|
| **GND** (Masse) | Pin **9** | ⬛ Noir | Patte **négative (-)** du buzzer |
| **GPIO 17** (Signal) | Pin **11** | 🔴 Rouge | Patte **positive (+)** du buzzer |

> **Comment identifier les pattes du buzzer ?**  
> - La patte **longue** = positive (+) → GPIO 17 (Pin 11)  
> - La patte **courte** = négative (–) → GND (Pin 9)  
> - Ou regardez le marquage `+` imprimé sur le dessus du buzzer plastique.

---

## ⚙️ Étape 3 : Configuration du Raspberry Pi (Terminal)

Ouvrez un terminal sur le Raspberry Pi (icône noire en haut de l'écran) et tapez les commandes suivantes **dans l'ordre**.

### 3.1 Mettre à jour le système

```bash
sudo apt update && sudo apt upgrade -y
```
*(Cette étape peut prendre 5-15 minutes selon la connexion internet)*

### 3.2 Installer les dépendances Python

```bash
sudo apt install python3-requests python3-rpi.gpio -y
```

### 3.3 Créer le dossier de travail ICEM

```bash
mkdir -p /home/pi/icem
```

### 3.4 Copier les fichiers du projet sur le Raspberry Pi

**Option A** : Copier depuis une clé USB  
Copiez les fichiers `icem_buzzer.py` et `icem_buzzer.service` sur une clé USB sur votre PC, puis sur le Raspberry Pi.

**Option B** : Cloner depuis GitHub (si le projet est sur GitHub)  
```bash
sudo apt install git -y
cd /home/pi
git clone https://github.com/riheme12/projet-pfe-ICEM.git
cp /home/pi/projet-pfe-ICEM/iot/raspberry_pi/icem_buzzer.py /home/pi/icem/
```

**Option C** : Créer le fichier directement sur le Raspberry Pi  
```bash
nano /home/pi/icem/icem_buzzer.py
# (Collez le contenu du fichier, puis Ctrl+X → Y → Entrée pour sauvegarder)
```

### 3.5 Configurer l'adresse IP du backend

Ouvrez le script pour modifier l'adresse IP de votre PC Windows :
```bash
nano /home/pi/icem/icem_buzzer.py
```

Trouvez la ligne et remplacez l'IP :
```python
BACKEND_IP = "192.168.1.15"   # ← Mettez l'IP de votre PC Windows ici
```

> **Comment trouver l'IP de votre PC Windows ?**  
> Sur le PC : ouvrez `cmd.exe` → tapez `ipconfig` → cherchez l'**Adresse IPv4** (ex: `192.168.1.15`)

Sauvegardez avec **Ctrl+X → Y → Entrée**.

### 3.6 Tester le script manuellement

Avant de configurer le démarrage automatique, testez d'abord :
```bash
cd /home/pi/icem
python3 icem_buzzer.py
```

Vous devriez voir dans le terminal :
```
✅ GPIO 17 initialisé (BCM) — Buzzer prêt
🟢 Production normale — Aucune anomalie
🟢 Production normale — Aucune anomalie
...
```

Et si une anomalie est active dans Firebase :
```
🚨 ALERTE : 3 anomalie(s) active(s) détectée(s) !
🔴 Alerte active (3 anomalie(s)) — Bip d'alerte
```

→ Le buzzer doit BIP ! Si c'est le cas : **félicitations !** ✅  
→ Arrêtez avec **Ctrl+C**.

---

## 🚀 Étape 4 : Démarrage Automatique du Buzzer au Boot

Nous allons configurer le Raspberry Pi pour que le script Python démarre automatiquement à chaque allumage, sans intervention humaine.

### 4.1 Copier le fichier de service systemd

```bash
sudo cp /home/pi/icem/icem_buzzer.service /etc/systemd/system/
```

*(Si vous n'avez pas copié le fichier .service, créez-le manuellement :)*
```bash
sudo nano /etc/systemd/system/icem_buzzer.service
```
*(Collez le contenu du fichier icem_buzzer.service, puis Ctrl+X → Y → Entrée)*

### 4.2 Activer et démarrer le service

```bash
# Recharger la liste des services
sudo systemctl daemon-reload

# Activer le démarrage automatique au boot
sudo systemctl enable icem_buzzer.service

# Démarrer le service immédiatement
sudo systemctl start icem_buzzer.service
```

### 4.3 Vérifier que le service tourne correctement

```bash
sudo systemctl status icem_buzzer.service
```

Vous devez voir `Active: active (running)` en vert.

Pour voir les logs en temps réel :
```bash
sudo journalctl -u icem_buzzer.service -f
```

---

## 🖥️ Étape 5 : Mode Kiosk — Affichage Plein Écran sur l'Écran HDMI

Le navigateur **Chromium** va s'ouvrir automatiquement en plein écran au démarrage du Raspberry Pi et afficher la page `WorkshopDisplay` de votre application React.

### 5.1 Identifier l'adresse IP de votre PC Windows (serveur React)

Sur votre PC Windows, dans `cmd.exe` :
```cmd
ipconfig
```
Notez l'**Adresse IPv4** (ex: `192.168.1.15`).

Sur votre PC, démarrez le serveur React :
```cmd
cd frontend-web
npm run dev
```
L'application React sera accessible sur : `http://192.168.1.15:5173/workshop-display`  
*(Le port est 5173 par défaut avec Vite. Vérifiez dans la console npm)*

### 5.2 Configurer le démarrage automatique de Chromium en mode Kiosk

Sur le Raspberry Pi, dans le terminal :

```bash
# Créer le dossier de démarrage automatique (s'il n'existe pas)
mkdir -p /home/pi/.config/autostart

# Créer le fichier de configuration de démarrage automatique
nano /home/pi/.config/autostart/icem_kiosk.desktop
```

Collez ce contenu dans le fichier *(remplacez l'IP par celle de votre PC)* :

```ini
[Desktop Entry]
Type=Application
Name=ICEM Workshop Display
Comment=Écran d'alerte qualité ICEM — Mode Kiosk
# ⚠️ Remplacez 192.168.1.15 par l'IP de votre PC Windows
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-translate http://192.168.1.15:5173/workshop-display
X-GNOME-Autostart-enabled=true
```

Sauvegardez avec **Ctrl+X → Y → Entrée**.

### 5.3 Désactiver la mise en veille de l'écran

Pour que l'écran reste allumé en permanence dans l'atelier :
```bash
nano /home/pi/.config/autostart/disable_screensaver.desktop
```

Collez :
```ini
[Desktop Entry]
Type=Application
Name=Disable Screen Blanking
Exec=xset s off -dpms
X-GNOME-Autostart-enabled=true
```

Sauvegardez avec **Ctrl+X → Y → Entrée**.

---

## 🧪 Étape 6 : Test Complet Bout en Bout

### 6.1 Préparer votre PC Windows

Ouvrez **2 terminaux** sur votre PC :

**Terminal 1** — Démarrer le backend :
```cmd
cd backend
npm run dev
```

**Terminal 2** — Démarrer l'application React :
```cmd
cd frontend-web
npm run dev
```

### 6.2 Redémarrer le Raspberry Pi

```bash
sudo reboot
```

Après le redémarrage (~1 minute), vous devriez voir :
- 🖥️ L'écran HDMI s'allume avec le fond **vert** `"PRODUCTION CONFORME"`
- 🔕 Le buzzer est **silencieux**
- 📟 Le script Python tourne en fond et interroge l'API toutes les 5 secondes

### 6.3 Simuler une anomalie active

1. Allez sur la **console Firebase Firestore** (https://console.firebase.google.com)
2. Ouvrez la collection **`anomaly`**
3. Modifiez n'importe quelle anomalie et mettez le champ `statut` à **`detectee`**
4. Dans les **5 secondes** suivantes :
   - L'écran passe au **rouge clignotant** avec les détails de l'anomalie
   - Le **buzzer émet des bips** d'alerte
5. Sur l'écran HDMI, appuyez sur le bouton **"MARQUER COMME TRAITÉ"**
6. L'écran repasse au **vert** et le buzzer redevient **silencieux**

---

## 📁 Structure des fichiers créés

```
projet-pfe-ICEM/
├── iot/
│   ├── ICEM_Alert_Node/
│   │   └── ICEM_Alert_Node.ino          ← Code ESP32 (ancienne solution, gardé pour référence)
│   ├── raspberry_pi/
│   │   ├── icem_buzzer.py               ← ✅ Script Python GPIO Buzzer
│   │   └── icem_buzzer.service          ← ✅ Démarrage automatique (systemd)
│   └── GUIDE_INTEGRATION_IOT.md         ← Guide ESP32 (ancienne solution)
├── frontend-web/
│   └── src/
│       └── pages/
│           └── WorkshopDisplay.jsx      ← ✅ Page d'affichage atelier React
└── backend/
    └── routes/
        └── iot.js                       ← ✅ API /api/iot/alert-status (déjà en place)
```

---

## 🆘 Résolution de Problèmes

| Problème | Cause probable | Solution |
|:---|:---|:---|
| Le buzzer ne fait aucun son | Mauvais branchement GPIO | Vérifiez Pin 9 (GND) et Pin 11 (GPIO17) |
| Le buzzer fait un bruit permanent | Patte + et − inversées | Échangez les fils du buzzer |
| `ModuleNotFoundError: RPi.GPIO` | Bibliothèque absente | `sudo apt install python3-rpi.gpio -y` |
| `ConnectionError` dans les logs | IP du backend incorrecte ou backend non démarré | Vérifiez l'IP dans `icem_buzzer.py` et que `npm run dev` tourne |
| L'écran reste noir | Chromium ne trouve pas l'adresse | Vérifiez l'IP dans `icem_kiosk.desktop` et que React est démarré |
| L'écran s'éteint tout seul | Mise en veille activée | Vérifiez le fichier `disable_screensaver.desktop` |

---

## 📊 Résumé Final pour le Rapport PFE

Votre station IoT d'atelier combine :
1. **Détection intelligente** : Application mobile Flutter + IA Roboflow (vision par ordinateur)
2. **Traitement et stockage** : Backend Node.js + Firebase Firestore (temps réel)
3. **Affichage atelier** : Raspberry Pi + Écran HDMI (tableau de bord Andon - Industrie 4.0)
4. **Alerte sonore** : Buzzer actif sur GPIO (alerte physique immédiate)
5. **Interaction opérateur** : Bouton tactile pour valider la résolution depuis l'écran atelier

> Cette architecture s'inscrit dans le paradigme **Industrie 4.0** : monitoring en temps réel,  
> IHM (Interface Homme-Machine) intuitive, et alerte multi-canal (visuelle + sonore).
