#!/usr/bin/env python3
# =============================================================================
#  ICEM Quality Control — Script Buzzer Raspberry Pi
#  Fichier : icem_buzzer.py
#
#  Ce script tourne en arrière-plan sur le Raspberry Pi.
#  Il interroge l'API du backend ICEM toutes les 5 secondes.
#  Si une anomalie est active → le buzzer connecté au GPIO émet des bips.
#  Quand tout est OK → le buzzer est silencieux.
#
#  Branchement matériel :
#    Buzzer (+)  → GPIO 17 (Pin physique n°11)
#    Buzzer (-)  → GND     (Pin physique n°9)
#
#  Installation des dépendances :
#    sudo apt install python3-requests -y
#    sudo apt install python3-rpi.gpio -y   (normalement déjà installé)
#
#  Lancement :
#    python3 icem_buzzer.py
#
#  Lancement automatique au démarrage du Raspberry Pi :
#    Voir le fichier icem_buzzer.service (systemd)
# =============================================================================

import RPi.GPIO as GPIO
import requests
import time
import sys
import logging
from datetime import datetime

# ─── CONFIGURATION ──────────────────────────────────────────────────────────

# ATTENTION IMPORTANT : Remplacez cette adresse par l'IP de votre PC Windows (serveur backend)
# Pour trouver l'IP de votre PC : ouvrez cmd.exe et tapez 'ipconfig'
# Cherchez "Adresse IPv4" sous "Carte réseau sans fil Wi-Fi"
BACKEND_IP   = "192.168.1.15"   # ← MODIFIER ICI avec l'IP de votre PC
BACKEND_PORT = 5000
API_URL = f"http://{BACKEND_IP}:{BACKEND_PORT}/api/iot/alert-status"

# Numéro GPIO du buzzer (numérotation BCM)
# GPIO 17 = Pin physique n°11 sur le Raspberry Pi
BUZZER_GPIO_PIN = 17

# Intervalle de vérification (en secondes)
CHECK_INTERVAL_SEC = 5

# Durée d'un bip (en secondes)
BIP_ON_DURATION  = 0.4   # 400ms buzzer activé
BIP_OFF_DURATION = 0.4   # 400ms buzzer silencieux

# ─── LOGGING ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/icem_buzzer.log', encoding='utf-8'),
    ]
)
log = logging.getLogger("ICEM_BUZZER")

# ─── INITIALISATION GPIO ────────────────────────────────────────────────────

def init_gpio():
    """Configure la broche GPIO du buzzer en mode sortie."""
    GPIO.setmode(GPIO.BCM)          # Utiliser la numérotation BCM (pas physique)
    GPIO.setwarnings(False)
    GPIO.setup(BUZZER_GPIO_PIN, GPIO.OUT)
    GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)  # Buzzer éteint au démarrage
    log.info(f"OK GPIO {BUZZER_GPIO_PIN} initialisé (BCM) — Buzzer prêt")

# ─── CONTRÔLE DU BUZZER ─────────────────────────────────────────────────────

def buzzer_on():
    """Active le buzzer (tension HIGH)."""
    GPIO.output(BUZZER_GPIO_PIN, GPIO.HIGH)

def buzzer_off():
    """Éteint le buzzer (tension LOW)."""
    GPIO.output(BUZZER_GPIO_PIN, GPIO.LOW)

def bip_once():
    """Émet un seul bip court (400ms ON, 400ms OFF)."""
    buzzer_on()
    time.sleep(BIP_ON_DURATION)
    buzzer_off()
    time.sleep(BIP_OFF_DURATION)

def bip_alert_pattern(count=3):
    """Émet une série de bips d'alerte (3 bips rapides)."""
    for _ in range(count):
        bip_once()

# ─── INTERROGATION DE L'API BACKEND ─────────────────────────────────────────

def check_alert_status():
    """
    Interroge l'API ICEM et retourne un tuple (has_alert, active_count).
    Retourne (None, 0) en cas d'erreur réseau.
    """
    try:
        response = requests.get(API_URL, timeout=4)
        if response.status_code == 200:
            data = response.json()
            return data.get("hasAlert", False), data.get("activeCount", 0)
        else:
            log.warning(f"ATTENTION API a répondu avec le code HTTP {response.status_code}")
            return None, 0
    except requests.exceptions.ConnectionError:
        log.error(f"ERREUR Impossible de joindre le serveur : {API_URL}")
        log.error("   Vérifiez que le backend Node.js est démarré sur votre PC")
        return None, 0
    except requests.exceptions.Timeout:
        log.error("ERREUR Délai d'attente dépassé (timeout 4s)")
        return None, 0
    except Exception as e:
        log.error(f"ERREUR Erreur inattendue : {e}")
        return None, 0

# ─── BOUCLE PRINCIPALE ──────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("  USINE ICEM Quality Control — Station d'Alerte IoT")
    log.info(f"  RESEAU API Backend : {API_URL}")
    log.info(f"  BIP GPIO Buzzer : GPIO {BUZZER_GPIO_PIN} (BCM)")
    log.info(f"  TEMPS  Intervalle  : {CHECK_INTERVAL_SEC}s")
    log.info("=" * 60)

    init_gpio()

    previous_alert_state = None   # Pour détecter les changements d'état

    try:
        while True:
            has_alert, active_count = check_alert_status()

            # ─ Erreur réseau : 2 bips courts pour signaler le problème ─────
            if has_alert is None:
                log.warning("RESEAU Serveur injoignable — Vérifiez le réseau Wi-Fi")
                bip_once()
                bip_once()
                time.sleep(CHECK_INTERVAL_SEC)
                continue

            # ─ Changement d'état : log de transition ─────────────────────
            if has_alert != previous_alert_state:
                if has_alert:
                    log.warning(f"ALERTE ALERTE : {active_count} anomalie(s) active(s) détectée(s) !")
                    log.warning("    Affichage rouge sur l'écran atelier")
                    # Bips d'alerte à la transition
                    bip_alert_pattern(count=5)
                else:
                    log.info("OK RETOUR A LA NORMALE — Toutes les anomalies sont traitées")
                    log.info("    Affichage vert sur l'écran atelier")
                previous_alert_state = has_alert

            # ─ État d'alerte maintenu : 1 bip toutes les 5 secondes ──────
            if has_alert:
                log.info(f"ALERTE Alerte active ({active_count} anomalie(s)) — Bip d'alerte")
                bip_once()
                # Attendre le reste de l'intervalle (on a déjà consommé ~0.8s avec les bips)
                remaining = CHECK_INTERVAL_SEC - BIP_ON_DURATION - BIP_OFF_DURATION
                if remaining > 0:
                    time.sleep(remaining)
            else:
                log.info(f"OK Production normale — Aucune anomalie")
                time.sleep(CHECK_INTERVAL_SEC)

    except KeyboardInterrupt:
        log.info("\nSTOP Arrêt du script par l'utilisateur (Ctrl+C)")
    finally:
        buzzer_off()
        GPIO.cleanup()
        log.info("NETTOYAGE GPIO nettoyé. Au revoir !")

# ─── POINT D'ENTRÉE ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    main()
