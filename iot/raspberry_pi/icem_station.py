#!/usr/bin/env python3
# =============================================================================
#  ICEM Quality Control — Station d'Alerte Atelier (Version Autonome)
#  Fichier : icem_station.py
#
#  Ce script tourne directement sur le Raspberry Pi.
#  Il se connecte à Firebase Firestore en temps réel (sans passer par le backend).
#  Il affiche une interface graphique plein écran sur l'écran HDMI branché au Pi.
#  Il contrôle le buzzer connecté au GPIO 17.
#
#  ┌─────────────────────────────────────────────────────────────────┐
#  │ Architecture :                                                   │
#  │   Firebase Firestore ──(on_snapshot)──▶ Raspberry Pi            │
#  │                                              │                   │
#  │                               ┌─────────────┴──────────────┐   │
#  │                               │  Tkinter GUI (HDMI Screen) │   │
#  │                               │  GPIO 17 → Buzzer          │   │
#  │                               └────────────────────────────┘   │
#  └─────────────────────────────────────────────────────────────────┘
#
#  Branchement matériel :
#    Buzzer (+)  →  GPIO 17 (Pin physique n°11)
#    Buzzer (−)  →  GND     (Pin physique n°9)
#
#  Installation des dépendances (une seule fois sur le Raspberry Pi) :
#    pip3 install firebase-admin
#    sudo apt install python3-rpi.gpio -y
#    sudo apt install python3-tk -y
#
#  Lancement :
#    python3 icem_station.py
#
#  Le fichier serviceAccountKey.json doit être dans le même dossier que ce script.
# =============================================================================

import threading
import time
import logging
import sys
import os
from datetime import datetime

# Reconfigurer la sortie standard en UTF-8 pour éviter les crashes liés aux emojis sous Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ── Tkinter (interface graphique) ────────────────────────────────────────────
import tkinter as tk
from tkinter import font as tkfont

# ── Pyrebase (SDK tiers) ─────────────────────────────────────────────────────
import pyrebase

# ── GPIO (buzzer) — importé avec gestion d'erreur pour tester sur PC aussi ──
try:
    import RPi.GPIO as GPIO
    RUNNING_ON_PI = True
except (ImportError, RuntimeError):
    RUNNING_ON_PI = False
    print("[AVERTISSEMENT] RPi.GPIO non disponible. Le buzzer sera simulé (mode PC).")

# =============================================================================
#  CONFIGURATION — À MODIFIER SELON VOTRE INSTALLATION
# =============================================================================

# Configuration Firebase Web pour Pyrebase
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyBgtxAYFi2nPvLfyqXemw5R9kjflvnjWyg",
    "authDomain": "testflutter-de1f5.firebaseapp.com",
    "projectId": "testflutter-de1f5",
    "storageBucket": "testflutter-de1f5.firebasestorage.app",
    "databaseURL": "https://testflutter-de1f5-default-rtdb.europe-west1.firebasedatabase.app"
}

# Broche GPIO du buzzer (numérotation BCM)
# GPIO 17 = Pin physique n°11 sur le Raspberry Pi
BUZZER_PIN = 17

# Durée d'un bip (secondes)
BIP_ON  = 0.35
BIP_OFF = 0.35

# =============================================================================
#  LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/tmp/icem_station.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("ICEM_STATION")

# =============================================================================
#  CONTRÔLEUR GPIO (Buzzer)
# =============================================================================

class BuzzerController:
    """Gère le buzzer branché sur le GPIO 17 du Raspberry Pi."""

    def __init__(self):
        self._thread = None
        self._stop_event = threading.Event()
        self._active = False

        if RUNNING_ON_PI:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(BUZZER_PIN, GPIO.OUT)
            GPIO.output(BUZZER_PIN, GPIO.LOW)
            log.info(f"OK Buzzer initialisé sur GPIO {BUZZER_PIN} (BCM)")
        else:
            log.info("SIMULATION Mode simulation PC : buzzer désactivé")

    def _bip_loop(self):
        """Boucle de bips qui tourne dans un thread séparé."""
        log.info("SON Bips d'alerte démarrés")
        while not self._stop_event.is_set():
            self._set_buzzer(True)
            time.sleep(BIP_ON)
            self._set_buzzer(False)
            time.sleep(BIP_OFF)

    def _set_buzzer(self, state: bool):
        if RUNNING_ON_PI:
            GPIO.output(BUZZER_PIN, GPIO.HIGH if state else GPIO.LOW)
        else:
            print("BIP BIP" if state else "   ---", end="\r", flush=True)

    def start_alert(self):
        """Déclenche les bips en continu (dans un thread)."""
        if self._active:
            return
        self._active = True
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._bip_loop, daemon=True)
        self._thread.start()

    def stop_alert(self):
        """Arrête les bips et éteint le buzzer."""
        if not self._active:
            return
        self._active = False
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
        self._set_buzzer(False)
        log.info("SILENCE Buzzer silencieux")

    def cleanup(self):
        """Libère les ressources GPIO."""
        self.stop_alert()
        if RUNNING_ON_PI:
            GPIO.cleanup()
            log.info("NETTOYAGE GPIO nettoyé")

# =============================================================================
#  CONNEXION FIREBASE
# =============================================================================

class FirebaseService:
    """Gère la connexion à Firebase Realtime Database avec Pyrebase."""

    def __init__(self, callback):
        """
        callback : fonction appelée à chaque changement de données.
                   Signature : callback(active_anomalies: list)
        """
        self._callback = callback
        self._active = False
        self._thread = None

        log.info(f"RESEAU Connexion à Firebase Realtime Database (projet : {FIREBASE_CONFIG['projectId']})...")

        try:
            self._firebase = pyrebase.initialize_app(FIREBASE_CONFIG)
            self._db = self._firebase.database()
            log.info("OK Firebase connecté avec succès")
        except Exception as e:
            log.error(f"ERREUR Impossible d'initialiser Pyrebase : {e}")
            sys.exit(1)

    def start_listening(self):
        """Démarre le thread de sondage en temps réel."""
        self._active = True
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()

    def _poll_loop(self):
        log.info("ECOUTE Écoute en temps réel de 'active_anomalies' démarrée (sondage 2s)")
        previous_data = None
        while self._active:
            try:
                res = self._db.child("active_anomalies").get()
                data = res.val()
                
                # On ne met à jour le GUI que si les données ont changé
                if data != previous_data:
                    active = []
                    if data:
                        # Si c'est un dictionnaire d'anomalies (cas standard)
                        if isinstance(data, dict):
                            for doc_id, anomaly_data in data.items():
                                if isinstance(anomaly_data, dict):
                                    active.append({"id": doc_id, **anomaly_data})
                        # Si c'est une liste
                        elif isinstance(data, list):
                            for item in data:
                                if item and isinstance(item, dict):
                                    active.append(item)

                    # Trier par date de détection de manière robuste (la plus récente en premier)
                    def get_sort_key(x):
                        val = x.get("detectedAt")
                        if not val:
                            return 0.0
                        try:
                            return datetime.fromisoformat(str(val).replace("Z", "+00:00")).timestamp()
                        except Exception:
                            return 0.0

                    active.sort(key=get_sort_key, reverse=True)

                    log.info(f"MISE A JOUR Realtime Database mis à jour : {len(active)} anomalie(s) active(s)")
                    self._callback(active)
                    previous_data = data
            except Exception as e:
                log.error(f"ERREUR lors du sondage des données : {e}")
            
            time.sleep(2)

    def resolve_anomaly(self, anomaly_id: str):
        """Écrit la résolution de l'anomalie dans la Realtime Database pour traitement par le backend."""
        try:
            self._db.child("resolutions").child(anomaly_id).set({
                "statut": "traitee",
                "dateResol": datetime.now().isoformat()
            })
            log.info(f"OK Anomalie {anomaly_id[:8]}... envoyée pour résolution")
            return True
        except Exception as e:
            log.error(f"ERREUR lors de la demande de résolution : {e}")
            return False

    def stop(self):
        self._active = False
        log.info("DECONNEXION Écoute Firebase arrêtée")

# =============================================================================
#  INTERFACE GRAPHIQUE TKINTER (Écran HDMI)
# =============================================================================

class WorkshopGUI:
    """
    Interface graphique plein écran affichée sur l'écran HDMI du Raspberry Pi.
    - Fond VERT  : Aucune anomalie active → Production conforme
    - Fond ROUGE : Anomalie détectée → Affiche les détails + bouton de résolution
    """

    # ── Couleurs ──────────────────────────────────────────────────────────────
    COLOR_BG_NORMAL   = "#052e16"   # Vert foncé
    COLOR_BG_ALERT    = "#1a0000"   # Rouge très foncé
    COLOR_STRIPE_OK   = "#10b981"   # Vert vif
    COLOR_STRIPE_WARN = "#ef4444"   # Rouge vif
    COLOR_TEXT_WHITE  = "#ffffff"
    COLOR_TEXT_GREEN  = "#6ee7b7"
    COLOR_TEXT_RED    = "#fca5a5"
    COLOR_BADGE_OK    = "#065f46"
    COLOR_BADGE_WARN  = "#7f1d1d"
    COLOR_BTN_RESOLVE = "#059669"
    COLOR_BTN_CANCEL  = "#334155"

    def __init__(self, root: tk.Tk, on_resolve_callback):
        self._root = root
        self._on_resolve = on_resolve_callback
        self._current_anomalies = []
        self._blink_state = True
        self._confirm_mode = False
        self._pending_resolve_id = None

        # ── Configuration de la fenêtre ──────────────────────────────────────
        self._root.title("ICEM Quality Control — Station Atelier")
        self._root.configure(bg=self.COLOR_BG_NORMAL)
        self._root.attributes("-fullscreen", True)       # Plein écran
        self._root.attributes("-topmost", True)          # Toujours au premier plan
        self._root.bind("<Escape>", self._quit)           # Ctrl+Esc pour quitter
        self._root.bind("<F11>", self._toggle_fullscreen)

        # ── Polices ──────────────────────────────────────────────────────────
        self._font_giant  = tkfont.Font(family="DejaVu Sans", size=52, weight="bold")
        self._font_title  = tkfont.Font(family="DejaVu Sans", size=38, weight="bold")
        self._font_large  = tkfont.Font(family="DejaVu Sans", size=26, weight="bold")
        self._font_medium = tkfont.Font(family="DejaVu Sans", size=20)
        self._font_small  = tkfont.Font(family="DejaVu Sans", size=14)
        self._font_clock  = tkfont.Font(family="DejaVu Sans Mono", size=34, weight="bold")
        self._font_btn    = tkfont.Font(family="DejaVu Sans", size=22, weight="bold")

        # ── Construction de l'interface ──────────────────────────────────────
        self._build_layout()

        # ── Lancer les mises à jour périodiques ─────────────────────────────
        self._update_clock()
        self._blink_tick()

    # ── Construction des widgets ──────────────────────────────────────────────

    def _build_layout(self):
        """Crée tous les widgets de l'interface."""

        # Bande de couleur en haut
        self._stripe_top = tk.Frame(self._root, height=14, bg=self.COLOR_STRIPE_OK)
        self._stripe_top.pack(fill=tk.X, side=tk.TOP)

        # En-tête (logo + horloge)
        self._header = tk.Frame(self._root, bg=self.COLOR_BG_NORMAL, pady=12, padx=30)
        self._header.pack(fill=tk.X, side=tk.TOP)

        self._lbl_logo = tk.Label(
            self._header, text="ICEM  Quality Control",
            font=self._font_large, fg=self.COLOR_TEXT_WHITE,
            bg=self.COLOR_BG_NORMAL,
        )
        self._lbl_logo.pack(side=tk.LEFT)

        self._lbl_clock = tk.Label(
            self._header, text="--:--:--",
            font=self._font_clock, fg=self.COLOR_TEXT_GREEN,
            bg=self.COLOR_BG_NORMAL,
        )
        self._lbl_clock.pack(side=tk.RIGHT)

        self._lbl_date = tk.Label(
            self._header, text="",
            font=self._font_small, fg=self.COLOR_TEXT_GREEN,
            bg=self.COLOR_BG_NORMAL,
        )
        self._lbl_date.pack(side=tk.RIGHT, padx=20)

        # Séparateur
        tk.Frame(self._root, height=2, bg="#334155").pack(fill=tk.X)

        # Zone de contenu principal (occupe tout l'espace restant)
        self._content = tk.Frame(self._root, bg=self.COLOR_BG_NORMAL)
        self._content.pack(fill=tk.BOTH, expand=True)

        # ── Vue "Production normale" ─────────────────────────────────────────
        self._view_normal = tk.Frame(self._content, bg=self.COLOR_BG_NORMAL)

        tk.Label(self._view_normal, text="OK",
                 font=tkfont.Font(size=90), bg=self.COLOR_BG_NORMAL).pack(pady=(60, 20))

        tk.Label(self._view_normal,
                 text="PRODUCTION CONFORME",
                 font=self._font_giant, fg=self.COLOR_TEXT_WHITE,
                 bg=self.COLOR_BG_NORMAL).pack()

        tk.Label(self._view_normal,
                 text="Aucune anomalie active — Le système de surveillance veille",
                 font=self._font_medium, fg=self.COLOR_TEXT_GREEN,
                 bg=self.COLOR_BG_NORMAL).pack(pady=14)

        self._lbl_normal_count = tk.Label(
            self._view_normal,
            text="● Système actif",
            font=self._font_small, fg=self.COLOR_TEXT_GREEN,
            bg=self.COLOR_BG_NORMAL,
        )
        self._lbl_normal_count.pack(pady=8)

        # ── Vue "Alerte anomalie" ────────────────────────────────────────────
        self._view_alert = tk.Frame(self._content, bg=self.COLOR_BG_ALERT)

        # Titre alerte
        self._lbl_alert_title = tk.Label(
            self._view_alert,
            text="ALERTE  ANOMALIE DÉTECTÉE  ALERTE",
            font=self._font_title, fg=self.COLOR_TEXT_WHITE,
            bg=self.COLOR_BG_ALERT,
        )
        self._lbl_alert_title.pack(pady=(24, 6))

        self._lbl_alert_count = tk.Label(
            self._view_alert,
            text="1 anomalie active — Intervention requise",
            font=self._font_medium, fg=self.COLOR_TEXT_RED,
            bg=self.COLOR_BG_ALERT,
        )
        self._lbl_alert_count.pack(pady=(0, 16))

        # Carte de détails de l'anomalie
        self._card = tk.Frame(
            self._view_alert,
            bg="#2a0000",
            bd=0, padx=30, pady=20,
            highlightbackground="#ef4444",
            highlightthickness=2,
        )
        self._card.pack(fill=tk.X, padx=40, pady=8)

        # Grille de détails (2 colonnes)
        self._details_frame = tk.Frame(self._card, bg="#2a0000")
        self._details_frame.pack(fill=tk.X)

        self._lbl_type     = self._make_detail_row(self._details_frame, "TYPE DE DÉFAUT", "—", 0, large=True)
        self._lbl_severity = self._make_detail_row(self._details_frame, "GRAVITÉ",        "—", 1)
        self._lbl_cable    = self._make_detail_row(self._details_frame, "CÂBLE / REF",    "—", 2)
        self._lbl_techname = self._make_detail_row(self._details_frame, "INSPECTÉ PAR",   "—", 3)
        self._lbl_time     = self._make_detail_row(self._details_frame, "DÉTECTÉ À",      "—", 4)
        self._lbl_desc     = self._make_detail_row(self._details_frame, "DESCRIPTION",    "—", 5, colspan=2)

        # ── Zone de bouton (résolution) ──────────────────────────────────────
        self._btn_area = tk.Frame(self._view_alert, bg=self.COLOR_BG_ALERT, pady=16)
        self._btn_area.pack(fill=tk.X, padx=40)

        # Bouton principal "Marquer comme traité"
        self._btn_resolve = tk.Button(
            self._btn_area,
            text="OK   MARQUER COMME TRAITÉ",
            font=self._btn_font_large(),
            fg="#ffffff", bg=self.COLOR_BTN_RESOLVE,
            activebackground="#047857", activeforeground="#ffffff",
            relief=tk.FLAT, padx=40, pady=18,
            cursor="hand2",
            command=self._on_resolve_click,
        )
        self._btn_resolve.pack(side=tk.LEFT, padx=(0, 20))

        tk.Label(
            self._btn_area,
            text="Appuyez après avoir traité le câble défectueux",
            font=self._font_small, fg="#94a3b8",
            bg=self.COLOR_BG_ALERT,
        ).pack(side=tk.LEFT)

        # ── Zone de confirmation ─────────────────────────────────────────────
        self._confirm_area = tk.Frame(self._view_alert, bg=self.COLOR_BG_ALERT, pady=10)
        self._confirm_area.pack(fill=tk.X, padx=40)

        tk.Label(
            self._confirm_area,
            text="Confirmer la résolution de cette anomalie ?",
            font=self._font_large, fg="#d1fae5",
            bg=self.COLOR_BG_ALERT,
        ).pack(pady=(0, 12))

        btn_row = tk.Frame(self._confirm_area, bg=self.COLOR_BG_ALERT)
        btn_row.pack()

        self._btn_confirm_yes = tk.Button(
            btn_row,
            text="OK  Oui, Confirmer",
            font=self._btn_font_large(),
            fg="#ffffff", bg="#10b981",
            activebackground="#059669",
            relief=tk.FLAT, padx=30, pady=14,
            cursor="hand2",
            command=self._do_resolve,
        )
        self._btn_confirm_yes.pack(side=tk.LEFT, padx=(0, 16))

        self._btn_confirm_no = tk.Button(
            btn_row,
            text="  Annuler",
            font=self._btn_font_large(),
            fg="#ffffff", bg=self.COLOR_BTN_CANCEL,
            activebackground="#1e293b",
            relief=tk.FLAT, padx=30, pady=14,
            cursor="hand2",
            command=self._cancel_confirm,
        )
        self._btn_confirm_no.pack(side=tk.LEFT)

        # Bande de couleur en bas
        self._stripe_bottom = tk.Frame(self._root, height=14, bg=self.COLOR_STRIPE_OK)
        self._stripe_bottom.pack(fill=tk.X, side=tk.BOTTOM)

        # ── Pied de page ─────────────────────────────────────────────────────
        self._footer = tk.Frame(self._root, bg=self.COLOR_BG_NORMAL, pady=6)
        self._footer.pack(fill=tk.X, side=tk.BOTTOM)
        tk.Label(
            self._footer,
            text="Station d'Alerte Atelier IoT — ICEM Quality Control | Firebase Firestore (temps réel)",
            font=self._font_small, fg="#475569",
            bg=self.COLOR_BG_NORMAL,
        ).pack()

        # Afficher la vue normale par défaut
        self._show_normal_view()

    def _btn_font_large(self):
        return tkfont.Font(family="DejaVu Sans", size=20, weight="bold")

    def _make_detail_row(self, parent, label_text, value_text, row, large=False, colspan=1):
        """Crée une ligne label + valeur dans la grille de détails."""
        col = (row % 2) * 2
        actual_row = row // 2

        tk.Label(parent, text=label_text,
                 font=self._font_small, fg="#94a3b8",
                 bg="#2a0000", anchor="w").grid(
            row=actual_row * 2, column=col, columnspan=colspan * 2 if colspan > 1 else 1,
            sticky="w", padx=(0, 30), pady=(8, 0)
        )

        lbl = tk.Label(parent, text=value_text,
                       font=tkfont.Font(family="DejaVu Sans",
                                        size=24 if large else 18,
                                        weight="bold"),
                       fg="#ffffff", bg="#2a0000", anchor="w")
        lbl.grid(
            row=actual_row * 2 + 1, column=col,
            columnspan=colspan * 2 if colspan > 1 else 1,
            sticky="w", padx=(0, 30), pady=(2, 12)
        )
        return lbl

    # ── Mise à jour des données ───────────────────────────────────────────────

    def update_anomalies(self, active_anomalies: list):
        """
        Appelé depuis le thread Firebase via root.after() pour mettre à jour
        l'interface en toute sécurité depuis le thread principal Tkinter.
        """
        self._current_anomalies = active_anomalies
        self._confirm_mode = False

        if not active_anomalies:
            self._show_normal_view()
        else:
            anomaly = active_anomalies[0]
            self._show_alert_view(anomaly, len(active_anomalies))

    def _show_normal_view(self):
        """Passe en mode Production Normale (fond vert)."""
        self._view_alert.pack_forget()
        self._view_normal.pack(fill=tk.BOTH, expand=True)

        self._root.configure(bg=self.COLOR_BG_NORMAL)
        self._header.configure(bg=self.COLOR_BG_NORMAL)
        self._lbl_logo.configure(bg=self.COLOR_BG_NORMAL, fg=self.COLOR_TEXT_WHITE)
        self._lbl_clock.configure(bg=self.COLOR_BG_NORMAL, fg=self.COLOR_TEXT_GREEN)
        self._lbl_date.configure(bg=self.COLOR_BG_NORMAL, fg=self.COLOR_TEXT_GREEN)
        self._footer.configure(bg=self.COLOR_BG_NORMAL)
        self._stripe_top.configure(bg=self.COLOR_STRIPE_OK)
        self._stripe_bottom.configure(bg=self.COLOR_STRIPE_OK)

    def _show_alert_view(self, anomaly: dict, total_count: int):
        """Passe en mode Alerte (fond rouge) avec les détails de l'anomalie."""
        self._view_normal.pack_forget()
        self._pending_resolve_id = anomaly.get("id")

        # Mettre à jour les labels de détails
        def _safe(val, default="Non spécifié"):
            return str(val).strip() if val else default

        self._lbl_alert_count.configure(
            text=f"{total_count} anomalie{'s' if total_count > 1 else ''} active{'s' if total_count > 1 else ''} — Intervention requise"
        )
        self._lbl_type.configure(text=_safe(anomaly.get("type") or anomaly.get("typeDefaut")))
        self._lbl_severity.configure(text=_safe(anomaly.get("severity")).upper())
        self._lbl_cable.configure(
            text=f"#{anomaly['cableId'][:14]}" if anomaly.get("cableId") else "—"
        )
        self._lbl_techname.configure(text=_safe(anomaly.get("technicianName"), "Auto / IA Roboflow"))

        # Formater la date
        raw_time = anomaly.get("detectedAt") or anomaly.get("createdAt")
        if raw_time:
            try:
                if hasattr(raw_time, "strftime"):  # Timestamp Firestore
                    time_str = raw_time.strftime("%H:%M:%S")
                else:
                    dt = datetime.fromisoformat(str(raw_time).replace("Z", "+00:00"))
                    time_str = dt.strftime("%H:%M:%S")
            except Exception:
                time_str = str(raw_time)[:8]
        else:
            time_str = "--:--:--"
        self._lbl_time.configure(text=time_str)

        desc = anomaly.get("description", "")
        self._lbl_desc.configure(text=f'« {desc} »' if desc else "Anomalie détectée par vision artificielle (IA Roboflow)")

        # Afficher/masquer la zone de confirmation
        if self._confirm_mode:
            self._btn_area.pack_forget()
            self._confirm_area.pack(fill=tk.X, padx=40)
        else:
            self._confirm_area.pack_forget()
            self._btn_area.pack(fill=tk.X, padx=40)

        self._view_alert.pack(fill=tk.BOTH, expand=True)

        # Fond et header en rouge
        self._root.configure(bg=self.COLOR_BG_ALERT)
        self._header.configure(bg=self.COLOR_BG_ALERT)
        self._lbl_logo.configure(bg=self.COLOR_BG_ALERT)
        self._lbl_clock.configure(bg=self.COLOR_BG_ALERT, fg=self.COLOR_TEXT_RED)
        self._lbl_date.configure(bg=self.COLOR_BG_ALERT, fg=self.COLOR_TEXT_RED)
        self._footer.configure(bg=self.COLOR_BG_ALERT)

    # ── Boutons de résolution ─────────────────────────────────────────────────

    def _on_resolve_click(self):
        """Premier clic : demande de confirmation."""
        self._confirm_mode = True
        self._btn_area.pack_forget()
        self._confirm_area.pack(fill=tk.X, padx=40)

    def _cancel_confirm(self):
        """Annuler la confirmation."""
        self._confirm_mode = False
        self._confirm_area.pack_forget()
        self._btn_area.pack(fill=tk.X, padx=40)

    def _do_resolve(self):
        """Deuxième clic : résolution confirmée → appel au callback."""
        if self._pending_resolve_id:
            self._btn_confirm_yes.configure(text="⏳  En cours...", state=tk.DISABLED)
            threading.Thread(
                target=self._on_resolve,
                args=(self._pending_resolve_id,),
                daemon=True
            ).start()

    # ── Animations ────────────────────────────────────────────────────────────

    def _blink_tick(self):
        """Fait clignoter les bandes de couleur en mode alerte."""
        if self._current_anomalies:
            color = self.COLOR_STRIPE_WARN if self._blink_state else "#7f1d1d"
            self._stripe_top.configure(bg=color)
            self._stripe_bottom.configure(bg=color)
            self._blink_state = not self._blink_state
        self._root.after(700, self._blink_tick)

    def _update_clock(self):
        """Met à jour l'horloge toutes les secondes."""
        now = datetime.now()
        self._lbl_clock.configure(text=now.strftime("%H:%M:%S"))
        self._lbl_date.configure(text=now.strftime("%d / %m / %Y"))
        self._root.after(1000, self._update_clock)

    # ── Utilitaires ───────────────────────────────────────────────────────────

    def _quit(self, event=None):
        self._root.destroy()

    def _toggle_fullscreen(self, event=None):
        state = self._root.attributes("-fullscreen")
        self._root.attributes("-fullscreen", not state)

# =============================================================================
#  APPLICATION PRINCIPALE
# =============================================================================

class ICEMStation:
    """Orchestre le GUI, Firebase, et le buzzer."""

    def __init__(self):
        self._buzzer = BuzzerController()
        self._root = tk.Tk()

        # Créer l'interface graphique
        self._gui = WorkshopGUI(
            root=self._root,
            on_resolve_callback=self._handle_resolve,
        )

        # Créer la connexion Firebase
        self._firebase = FirebaseService(callback=self._on_firebase_update)

        # Démarrer l'écoute Firebase
        self._firebase.start_listening()

    def _on_firebase_update(self, active_anomalies: list):
        """
        Appelé depuis le thread Firebase.
        On doit passer dans le thread Tkinter via root.after().
        """
        # Contrôle du buzzer
        if active_anomalies:
            self._buzzer.start_alert()
        else:
            self._buzzer.stop_alert()

        # Mise à jour de l'interface (thread-safe)
        self._root.after(0, self._gui.update_anomalies, active_anomalies)

    def _handle_resolve(self, anomaly_id: str):
        """Appelé depuis le thread de résolution quand l'opérateur confirme."""
        success = self._firebase.resolve_anomaly(anomaly_id)
        if not success:
            log.error("ERREUR Échec de la résolution — Vérifiez la connexion internet")

    def run(self):
        """Démarre la boucle principale Tkinter."""
        log.info("ECRAN  Interface graphique démarrée")
        log.info("   Appuyez sur Échap pour quitter | F11 pour basculer le plein écran")
        try:
            self._root.mainloop()
        finally:
            self._cleanup()

    def _cleanup(self):
        """Libère toutes les ressources proprement."""
        log.info("MISE A JOUR Arrêt propre du système...")
        self._buzzer.cleanup()
        self._firebase.stop()
        log.info("OK Arrêt terminé. Au revoir !")

# =============================================================================
#  POINT D'ENTRÉE
# =============================================================================

if __name__ == "__main__":
    log.info("=" * 65)
    log.info("  USINE ICEM Quality Control — Station d'Alerte Atelier")
    log.info("  RESEAU Connexion directe Firebase Realtime Database (Pyrebase)")
    log.info("  ECRAN  Interface Tkinter (Plein écran HDMI)")
    log.info(f"  BIP  Buzzer GPIO {BUZZER_PIN} | Mode Pi: {RUNNING_ON_PI}")
    log.info("=" * 65)

    station = ICEMStation()
    station.run()
