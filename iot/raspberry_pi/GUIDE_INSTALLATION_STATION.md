# 🍓 Guide : Installation icem_station.py sur Raspberry Pi

Ce guide explique comment installer et lancer le script **Python autonome**  
qui se connecte **directement à Firebase** (sans serveur intermédiaire).

---

## Ce que fait ce script

```
Firebase Firestore
      │
      │ (on_snapshot — temps réel, moins d'1 seconde)
      ▼
 Raspberry Pi
      ├── 🖥️  Tkinter GUI (plein écran HDMI)
      │        ├── Fond VERT  → "PRODUCTION CONFORME"
      │        ├── Fond ROUGE → Détails de l'anomalie
      │        └── Bouton tactile → Marquer comme traité
      └── 🔊  GPIO 17 → Buzzer (bips en boucle si alerte)
```

**Avantages de cette approche :**
- ✅ Complètement **autonome** (pas besoin que le PC/backend soit allumé)
- ✅ Réaction en **moins d'1 seconde** (listener Firebase natif)
- ✅ Une seule commande pour tout démarrer : `python3 icem_station.py`

---

## Étape 1 : Copier les fichiers sur le Raspberry Pi

Sur votre PC Windows, copiez ces 2 fichiers sur une **clé USB** :

| Fichier sur votre PC | À copier vers le Raspberry Pi |
|:---|:---|
| `iot/raspberry_pi/icem_station.py` | `/home/pi/icem/icem_station.py` |
| `backend/serviceAccountKey.json` | `/home/pi/icem/serviceAccountKey.json` |

Ensuite sur le Raspberry Pi (terminal) :

```bash
mkdir -p /home/pi/icem
# Branchez la clé USB, puis :
cp /media/pi/[NOM_CLE_USB]/icem_station.py /home/pi/icem/
cp /media/pi/[NOM_CLE_USB]/serviceAccountKey.json /home/pi/icem/
```

---

## Étape 2 : Installer les dépendances Python

```bash
# Mise à jour du système
sudo apt update

# Firebase Admin SDK (connexion directe à Firestore)
pip3 install firebase-admin

# Tkinter (interface graphique) — normalement déjà installé
sudo apt install python3-tk -y

# GPIO pour le buzzer — normalement déjà installé
sudo apt install python3-rpi.gpio -y
```

> ⏳ `pip3 install firebase-admin` peut prendre 3-5 minutes.

---

## Étape 3 : Vérifier l'installation

```bash
cd /home/pi/icem
ls -la
```

Vous devez voir :
```
icem_station.py
serviceAccountKey.json
```

---

## Étape 4 : Lancer le script manuellement (pour tester)

```bash
cd /home/pi/icem
python3 icem_station.py
```

**Ce que vous devez voir :**
- Dans le terminal :
  ```
  ✅ GPIO 17 initialisé (BCM) — Buzzer prêt
  ✅ Firebase connecté avec succès
  👂 Écoute de la collection 'anomaly' démarrée
  🟢 0 anomalie(s) active(s)
  ```
- Sur l'écran HDMI : fond **VERT** avec le texte "PRODUCTION CONFORME"

**Pour tester l'alerte** : modifiez un document dans Firebase Firestore  
(champ `statut` → `detectee`). En moins d'1 seconde :
- L'écran passe au **ROUGE** avec les détails de l'anomalie
- Le **buzzer bipe** en continu

**Pour arrêter** : appuyez sur `Ctrl+C` dans le terminal, ou `Échap` sur l'écran.

---

## Étape 5 : Démarrage automatique au boot du Raspberry Pi

```bash
# Copier le fichier service
sudo cp /home/pi/icem/icem_station.service /etc/systemd/system/

# Activer le service au démarrage
sudo systemctl daemon-reload
sudo systemctl enable icem_station.service

# Démarrer maintenant (sans redémarrer)
sudo systemctl start icem_station.service

# Vérifier que ça tourne bien
sudo systemctl status icem_station.service
```

Vous devez voir : `Active: active (running) ✅`

---

## Étape 6 : Commandes utiles

```bash
# Voir les logs en temps réel
sudo journalctl -u icem_station.service -f

# Arrêter le service
sudo systemctl stop icem_station.service

# Redémarrer le service
sudo systemctl restart icem_station.service

# Désactiver le démarrage automatique
sudo systemctl disable icem_station.service

# Voir les logs du fichier log
cat /tmp/icem_station.log
```

---

## Résolution de problèmes

| Problème | Solution |
|:---|:---|
| `ModuleNotFoundError: firebase_admin` | `pip3 install firebase-admin` |
| `No module named 'tkinter'` | `sudo apt install python3-tk -y` |
| `ModuleNotFoundError: RPi.GPIO` | `sudo apt install python3-rpi.gpio -y` |
| `FileNotFoundError: serviceAccountKey.json` | Copiez le fichier dans `/home/pi/icem/` |
| Écran noir (service systemd) | Vérifiez `DISPLAY=:0` dans le .service et que le bureau graphique est démarré |
| Le buzzer fait du bruit en permanence | Les fils + et - sont inversés, échangez-les |
