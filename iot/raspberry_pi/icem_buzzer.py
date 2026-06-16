#!/usr/bin/env python3
# =============================================================================
#  ICEM Quality Control — Script Buzzer Autonome
#  Fichier : icem_buzzer.py
#
#  Ce script tourne en arrière-plan sur le Raspberry Pi.
#  Il interroge l'API du backend ICEM toutes les CHECK_INTERVAL secondes.
#
#    Anomalie active  →  bips continus sur le buzzer GPIO 17
#    Tout OK          →  silencieux
#    Serveur injoignable → 2 bips courts + attente
#
#  Branchement matériel :
#    Buzzer (+)  →  GPIO 17  (Pin physique n°11)
#    Buzzer (−)  →  GND      (Pin physique n°9)
#
#  Dépendances :
#    sudo apt install python3-rpi.gpio python3-requests -y
#
#  Lancement :
#    python3 icem_buzzer.py
#
#  Service systemd : voir icem_buzzer.service
# =============================================================================

import sys
import time
import logging

import RPi.GPIO as GPIO
import requests


# =============================================================================
#  CONFIGURATION
# =============================================================================

BACKEND_IP      = "192.168.1.15"   # ← IP du PC hébergeant le backend Node.js
BACKEND_PORT    = 5000
API_URL         = f"http://{BACKEND_IP}:{BACKEND_PORT}/api/iot/alert-status"

BUZZER_PIN      = 17    # GPIO BCM — Pin physique n°11
CHECK_INTERVAL  = 5     # secondes entre deux requêtes API
BIP_ON          = 0.35  # durée buzzer ON (secondes)
BIP_OFF         = 0.35  # durée buzzer OFF (secondes)
REQUEST_TIMEOUT = 4     # timeout requête HTTP (secondes)


# =============================================================================
#  LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-8s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/tmp/icem_buzzer.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("ICEM_BUZZER")


# =============================================================================
#  GPIO
# =============================================================================

def gpio_init():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(BUZZER_PIN, GPIO.OUT)
    GPIO.output(BUZZER_PIN, GPIO.LOW)
    log.info(f"GPIO {BUZZER_PIN} initialisé (BCM) — Buzzer prêt")

def gpio_cleanup():
    GPIO.output(BUZZER_PIN, GPIO.LOW)
    GPIO.cleanup()
    log.info("GPIO nettoyé")

def _bip(on: bool):
    GPIO.output(BUZZER_PIN, GPIO.HIGH if on else GPIO.LOW)

def bip_single():
    """Un bip court (BIP_ON ON + BIP_OFF silence)."""
    _bip(True);  time.sleep(BIP_ON)
    _bip(False); time.sleep(BIP_OFF)

def bip_burst(count: int = 3):
    """Rafale de `count` bips courts."""
    for _ in range(count):
        bip_single()

def bip_error():
    """2 bips courts — signale une erreur réseau."""
    bip_burst(2)


# =============================================================================
#  REQUÊTE API
# =============================================================================

def fetch_alert_status():
    """
    Interroge l'API backend.
    Retourne (has_alert: bool | None, active_count: int).
      → None si erreur réseau ou HTTP inattendu.
    """
    try:
        r = requests.get(API_URL, timeout=REQUEST_TIMEOUT)
        if r.status_code == 200:
            data = r.json()
            return bool(data.get("hasAlert")), int(data.get("activeCount", 0))
        log.warning(f"API HTTP {r.status_code}")
        return None, 0
    except requests.ConnectionError:
        log.error(f"Serveur injoignable : {API_URL}")
        return None, 0
    except requests.Timeout:
        log.error(f"Timeout ({REQUEST_TIMEOUT}s)")
        return None, 0
    except Exception as exc:
        log.error(f"Erreur inattendue : {exc}")
        return None, 0


# =============================================================================
#  BOUCLE PRINCIPALE
# =============================================================================

def main():
    log.info("=" * 55)
    log.info("  ICEM Quality Control — Buzzer Autonome")
    log.info(f"  API         : {API_URL}")
    log.info(f"  GPIO        : {BUZZER_PIN} (BCM)")
    log.info(f"  Intervalle  : {CHECK_INTERVAL}s")
    log.info("=" * 55)

    gpio_init()

    prev_alert = None   # état précédent pour détecter les transitions

    try:
        while True:
            has_alert, count = fetch_alert_status()

            # ── Erreur réseau ─────────────────────────────────────────────────
            if has_alert is None:
                log.warning("Serveur injoignable — signal d'erreur (2 bips)")
                bip_error()
                time.sleep(CHECK_INTERVAL)
                continue

            # ── Transition vers l'alerte ──────────────────────────────────────
            if has_alert and not prev_alert:
                log.warning(f"ALERTE : {count} anomalie(s) détectée(s) — bips d'alerte")
                bip_burst(5)
                prev_alert = True

            # ── Retour à la normale ───────────────────────────────────────────
            elif not has_alert and prev_alert:
                log.info("Retour à la normale — toutes les anomalies traitées")
                prev_alert = False

            # ── État en cours ─────────────────────────────────────────────────
            if has_alert:
                log.info(f"Alerte active ({count} anomalie(s)) — bip")
                bip_single()
                # On a consommé BIP_ON + BIP_OFF, on attend le reste de l'intervalle
                remaining = CHECK_INTERVAL - BIP_ON - BIP_OFF
                if remaining > 0:
                    time.sleep(remaining)
            else:
                log.info("Production normale — aucune anomalie")
                if prev_alert is None:
                    prev_alert = False
                time.sleep(CHECK_INTERVAL)

    except KeyboardInterrupt:
        log.info("Arrêt demandé par l'utilisateur (Ctrl+C)")
    finally:
        gpio_cleanup()


# =============================================================================
#  POINT D'ENTRÉE
# =============================================================================

if __name__ == "__main__":
    main()
