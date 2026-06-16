#!/usr/bin/env python3
# =============================================================================
#  ICEM Quality Control — Station d'Alerte Atelier
#  Fichier : icem_station.py
#
#  Branchement matériel :
#    Buzzer (+)  →  GPIO 17 (Pin physique n°11)
#    Buzzer (−)  →  GND     (Pin physique n°9)
#
#  Dépendances :
#    pip3 install pyrebase4
#    sudo apt install python3-rpi.gpio python3-tk -y
# =============================================================================

import sys, os, threading, time, logging, json
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    try: sys.stdout.reconfigure(encoding="utf-8")
    except: pass

import tkinter as tk
from tkinter import font as tkfont
import pyrebase

try:
    import RPi.GPIO as GPIO
    ON_PI = True
except (ImportError, RuntimeError):
    ON_PI = False

# =============================================================================
#  CONFIGURATION
# =============================================================================

FIREBASE_CONFIG = {
    "apiKey":        "AIzaSyBgtxAYFi2nPvLfyqXemw5R9kjflvnjWyg",
    "authDomain":    "testflutter-de1f5.firebaseapp.com",
    "projectId":     "testflutter-de1f5",
    "storageBucket": "testflutter-de1f5.firebasestorage.app",
    "databaseURL":   "https://testflutter-de1f5-default-rtdb.europe-west1.firebasedatabase.app",
}

BUZZER_PIN    = 17
BIP_ON        = 0.30
BIP_OFF       = 0.30
POLL_INTERVAL = 0.5

# Palette
C = {
    "bg_ok":       "#060f1e",
    "bg_alert":    "#100308",
    "green":       "#00e676",
    "green2":      "#00c853",
    "green_bg":    "#002714",
    "red":         "#ff1744",
    "red2":        "#b71c1c",
    "red_bg":      "#1a0208",
    "white":       "#eef2ff",
    "gray":        "#546e7a",
    "gray2":       "#90a4ae",
    "card_ok":     "#0b1f35",
    "card_alert":  "#1c0510",
    "sep_ok":      "#0d2137",
    "sep_alert":   "#3d0010",
}

# =============================================================================
#  LOGGING
# =============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-8s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/tmp/icem_station.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("ICEM")

# =============================================================================
#  BUZZER
# =============================================================================

class BuzzerController:
    def __init__(self):
        self._active = False
        self._stop   = threading.Event()
        self._thread = None
        if ON_PI:
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            GPIO.setup(BUZZER_PIN, GPIO.OUT)
            GPIO.output(BUZZER_PIN, GPIO.LOW)
            log.info(f"Buzzer GPIO {BUZZER_PIN} prêt")
        else:
            log.info("Mode simulation (non-Pi)")

    def start(self):
        if self._active: return
        self._active = True
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        if not self._active: return
        self._active = False
        self._stop.set()
        if self._thread: self._thread.join(timeout=2)
        self._write(False)

    def cleanup(self):
        self.stop()
        if ON_PI: GPIO.cleanup()

    def _loop(self):
        while not self._stop.is_set():
            self._write(True);  time.sleep(BIP_ON)
            self._write(False); time.sleep(BIP_OFF)

    def _write(self, high):
        if ON_PI:
            GPIO.output(BUZZER_PIN, GPIO.HIGH if high else GPIO.LOW)

# =============================================================================
#  FIREBASE
# =============================================================================

class FirebaseService:
    def __init__(self, on_update):
        self._on_update = on_update
        self._running   = False
        log.info(f"Connexion Firebase → {FIREBASE_CONFIG['projectId']}")
        try:
            app      = pyrebase.initialize_app(FIREBASE_CONFIG)
            self._db = app.database()
            log.info("Firebase OK")
        except Exception as e:
            log.critical(f"Firebase ERREUR : {e}")
            sys.exit(1)

    def start_listening(self):
        self._running = True
        threading.Thread(target=self._poll, daemon=True).start()

    def stop(self): self._running = False

    def resolve(self, anomaly_id):
        try:
            self._db.child("resolutions").child(anomaly_id).set({
                "statut": "traitee", "dateResol": datetime.now().isoformat()
            })
            log.info(f"Résolution envoyée : {anomaly_id[:10]}…")
            return True
        except Exception as e:
            log.error(f"Résolution ERREUR : {e}")
            return False

    def _poll(self):
        previous_json = None
        while self._running:
            try:
                raw    = self._db.child("active_anomalies").get().val()
                parsed = self._parse(raw)
                # Sérialiser en JSON pour une comparaison fiable des dicts
                current_json = json.dumps(parsed, sort_keys=True, default=str)
                if current_json != previous_json:
                    log.info(f"{len(parsed)} anomalie(s) critique(s) active(s)")
                    self._on_update(parsed)
                    previous_json = current_json
            except Exception as e:
                log.error(f"Sondage ERREUR : {e}")
            time.sleep(POLL_INTERVAL)

    def _parse(self, raw):
        items = []
        if isinstance(raw, dict):
            for k, v in raw.items():
                if isinstance(v, dict): items.append({"id": k, **v})
        elif isinstance(raw, list):
            items = [x for x in raw if isinstance(x, dict)]
        
        # Filtre de gravité : ne déclencher l'alerte que pour les anomalies critiques
        items = [x for x in items if str(x.get("severity") or "").lower() == "critique"]
        
        items.sort(key=self._ts, reverse=True)
        return items

    @staticmethod
    def _ts(item):
        v = item.get("detectedAt") or item.get("createdAt")
        if not v: return 0.0
        try: return datetime.fromisoformat(str(v).replace("Z", "+00:00")).timestamp()
        except: return 0.0

# =============================================================================
#  INTERFACE GRAPHIQUE
# =============================================================================

class WorkshopDisplay:
    """
    Interface plein écran robuste pour Raspberry Pi / tablette.
    Utilise overrideredirect + geometry pour forcer le plein écran même
    si l'attribut -fullscreen du WM ne fonctionne pas.
    """

    def __init__(self, root: tk.Tk, on_resolve):
        self._root        = root
        self._on_resolve  = on_resolve
        self._anomalies   = []
        self._blink       = False
        self._confirming  = False
        self._resolve_id  = None

        self._setup_window()
        self._calc_fonts()
        self._build()
        self._tick_clock()
        self._tick_blink()

    # ── Fenêtre plein écran robuste ───────────────────────────────────────────

    def _setup_window(self):
        root = self._root
        root.title("ICEM Quality Control")
        root.configure(bg=C["bg_ok"])

        # Récupérer la taille réelle de l'écran
        root.update_idletasks()
        self.SW = root.winfo_screenwidth()
        self.SH = root.winfo_screenheight()
        log.info(f"Écran détecté : {self.SW}×{self.SH}")

        self.is_small = self.SH < 600

        # Marges (paddings) et dimensions adaptatives
        self.pad_h = max(3 if self.is_small else 6, self.SH // 100)
        self.pad_w = max(10 if self.is_small else 16, self.SW // 60)
        self.pad_stripe = max(4 if self.is_small else 6, self.SH // 80)
        self.pad_title_y = (max(4 if self.is_small else 10, self.SH // 100), 2)
        self.pad_count_y = (0, 4 if self.is_small else 8)
        self.pad_card_y = max(5 if self.is_small else 10, self.SH // 70)
        self.pad_field_y = (0, max(3 if self.is_small else 6, self.SH // 90))
        self.pad_action_y = max(4 if self.is_small else 8, self.SH // 70)
        self.pad_btn_y = max(5 if self.is_small else 10, self.SH // 70)

        # 1. Utiliser le mode plein écran natif (recommandé pour masquer les barres des tâches et s'adapter exactement à l'écran)
        try:
            root.attributes("-fullscreen", True)
        except Exception as e:
            log.warning(f"Impossible d'activer le plein écran natif : {e}")

        # 2. Si le plein écran natif ne fonctionne pas, appliquer overrideredirect + geometry en fallback
        if not root.attributes("-fullscreen"):
            root.overrideredirect(True)
            root.geometry(f"{self.SW}x{self.SH}+0+0")

        # 3. Mettre au premier plan
        root.attributes("-topmost", True)
        root.lift()
        root.focus_force()

        # Quitter avec Échap (utile pour le debug)
        root.bind("<Escape>", lambda e: self._quit())
        root.bind("<F11>",    lambda e: self._quit())

    # ── Polices adaptées à la résolution ─────────────────────────────────────

    def _calc_fonts(self):
        H = self.SH
        is_small = self.is_small
        self._f = {
            "logo":     tkfont.Font(family="DejaVu Sans", size=max(10 if is_small else 14, H//55),  weight="bold"),
            "clock":    tkfont.Font(family="DejaVu Sans Mono", size=max(14 if is_small else 18, H//38), weight="bold"),
            "date":     tkfont.Font(family="DejaVu Sans Mono", size=max(8 if is_small else 10, H//72)),
            "hero":     tkfont.Font(family="DejaVu Sans", size=max(24 if is_small else 42, H//14),  weight="bold"),
            "hero_ico": tkfont.Font(family="DejaVu Sans", size=max(36 if is_small else 64, H//9),   weight="bold"),
            "sub":      tkfont.Font(family="DejaVu Sans", size=max(10 if is_small else 12, H//55)),
            "tag":      tkfont.Font(family="DejaVu Sans", size=max(8 if is_small else 10, H//65),  weight="bold"),
            "alert_h":  tkfont.Font(family="DejaVu Sans", size=max(16 if is_small else 22, H//30),  weight="bold"),
            "alert_c":  tkfont.Font(family="DejaVu Sans", size=max(9 if is_small else 11, H//60)),
            "lbl":      tkfont.Font(family="DejaVu Sans", size=max(8 if is_small else 9,  H//75)),
            "val_big":  tkfont.Font(family="DejaVu Sans", size=max(11 if is_small else 15, H//45),  weight="bold"),
            "val_med":  tkfont.Font(family="DejaVu Sans", size=max(10 if is_small else 13, H//52),  weight="bold"),
            "btn":      tkfont.Font(family="DejaVu Sans", size=max(10 if is_small else 12, H//55),  weight="bold"),
            "btn_sm":   tkfont.Font(family="DejaVu Sans", size=max(9 if is_small else 11, H//62),  weight="bold"),
            "footer":   tkfont.Font(family="DejaVu Sans", size=max(8 if is_small else 9,  H//80)),
        }

    # ── Construction de l'interface ───────────────────────────────────────────

    def _build(self):
        r = self._root

        # ── Bande supérieure ─────────────────────────────────────────────────
        self._stripe_top = tk.Frame(r, height=self.pad_stripe, bg=C["green"])
        self._stripe_top.pack(fill=tk.X, side=tk.TOP)
        self._stripe_top.pack_propagate(False)

        # ── Header ───────────────────────────────────────────────────────────
        self._hdr = tk.Frame(r, bg=C["bg_ok"],
                             padx=self.pad_w,
                             pady=self.pad_h)
        self._hdr.pack(fill=tk.X, side=tk.TOP)

        # Logo gauche
        logo_frame = tk.Frame(self._hdr, bg=C["bg_ok"])
        logo_frame.pack(side=tk.LEFT)

        tk.Label(logo_frame, text="⬡  ICEM",
                 font=self._f["logo"], fg=C["green"], bg=C["bg_ok"]).pack(side=tk.LEFT)
        tk.Label(logo_frame, text=" Quality Control",
                 font=self._f["logo"], fg=C["white"], bg=C["bg_ok"]).pack(side=tk.LEFT)

        # Horloge droite
        clk_frame = tk.Frame(self._hdr, bg=C["bg_ok"])
        clk_frame.pack(side=tk.RIGHT)

        self._lbl_date = tk.Label(clk_frame, text="",
                                  font=self._f["date"], fg=C["gray"], bg=C["bg_ok"])
        self._lbl_date.pack(anchor="e")

        self._lbl_clock = tk.Label(clk_frame, text="--:--:--",
                                   font=self._f["clock"], fg=C["green"], bg=C["bg_ok"])
        self._lbl_clock.pack(anchor="e")

        # Séparateur header
        tk.Frame(r, height=1, bg=C["sep_ok"]).pack(fill=tk.X, side=tk.TOP)

        # ── Corps (expand = occupe tout l'espace restant) ─────────────────────
        self._body = tk.Frame(r, bg=C["bg_ok"])
        self._body.pack(fill=tk.BOTH, expand=True, side=tk.TOP)

        self._build_normal_view()
        self._build_alert_view()

        # ── Séparateur footer ─────────────────────────────────────────────────
        tk.Frame(r, height=1, bg=C["sep_ok"]).pack(fill=tk.X, side=tk.BOTTOM)

        # ── Footer ────────────────────────────────────────────────────────────
        self._ftr = tk.Frame(r, bg=C["bg_ok"], padx=self.pad_w, pady=2 if self.is_small else 4)
        self._ftr.pack(fill=tk.X, side=tk.BOTTOM)

        self._lbl_ftr = tk.Label(
            self._ftr,
            text=f"● Firebase Realtime Database  |  GPIO {BUZZER_PIN} (BCM)  |  Station IoT ICEM",
            font=self._f["footer"], fg=C["gray"], bg=C["bg_ok"], anchor="w",
        )
        self._lbl_ftr.pack(side=tk.LEFT)

        btn_quit = tk.Button(
            self._ftr, text="✕ Quitter",
            font=self._f["footer"], fg=C["gray"], bg=C["bg_ok"],
            activebackground=C["red2"], activeforeground=C["white"],
            bd=0, highlightthickness=0, cursor="hand2",
            command=self._quit
        )
        btn_quit.pack(side=tk.RIGHT)

        # ── Bande inférieure ──────────────────────────────────────────────────
        self._stripe_bot = tk.Frame(r, height=self.pad_stripe, bg=C["green"])
        self._stripe_bot.pack(fill=tk.X, side=tk.BOTTOM)
        self._stripe_bot.pack_propagate(False)

        self._show_normal()

    # ── Vue NORMALE ───────────────────────────────────────────────────────────

    def _build_normal_view(self):
        self._v_ok = tk.Frame(self._body, bg=C["bg_ok"])

        # Espace flexible au-dessus
        tk.Frame(self._v_ok, bg=C["bg_ok"]).pack(fill=tk.BOTH, expand=True)

        tk.Label(self._v_ok, text="✓",
                 font=self._f["hero_ico"], fg=C["green"], bg=C["bg_ok"]).pack()

        tk.Label(self._v_ok, text="PRODUCTION CONFORME",
                 font=self._f["hero"], fg=C["white"], bg=C["bg_ok"]).pack(pady=(0, 8))

        tk.Label(self._v_ok,
                 text="Aucune anomalie active — Le système de surveillance est opérationnel",
                 font=self._f["sub"], fg=C["gray2"], bg=C["bg_ok"]).pack()

        # Badge
        badge = tk.Frame(self._v_ok, bg=C["green_bg"],
                         padx=16 if self.is_small else 24,
                         pady=6 if self.is_small else 10)
        badge.pack(pady=(10 if self.is_small else 16, 0))
        self._lbl_ok_badge = tk.Label(badge, text="● Système actif",
                                      font=self._f["tag"], fg=C["green"], bg=C["green_bg"])
        self._lbl_ok_badge.pack()

        # Espace flexible en-dessous
        tk.Frame(self._v_ok, bg=C["bg_ok"]).pack(fill=tk.BOTH, expand=True)

    # ── Vue ALERTE ────────────────────────────────────────────────────────────

    def _build_alert_view(self):
        W = self.SW
        self._v_alert = tk.Frame(self._body, bg=C["bg_alert"])

        # Titre
        self._lbl_al_title = tk.Label(
            self._v_alert, text="⚠   ANOMALIE DÉTECTÉE",
            font=self._f["alert_h"], fg=C["red"], bg=C["bg_alert"],
        )
        self._lbl_al_title.pack(pady=self.pad_title_y)

        self._lbl_al_count = tk.Label(
            self._v_alert, text="1 anomalie active — Intervention requise",
            font=self._f["alert_c"], fg=C["gray2"], bg=C["bg_alert"],
        )
        self._lbl_al_count.pack(pady=self.pad_count_y)

        # ── Carte de détails ─────────────────────────────────────────────────
        card_wrap = tk.Frame(self._v_alert, bg=C["bg_alert"],
                             padx=self.pad_w)
        card_wrap.pack(fill=tk.X)

        self._card = tk.Frame(
            card_wrap, bg=C["card_alert"],
            highlightbackground=C["red2"],
            highlightthickness=1,
            padx=max(10 if self.is_small else 14, W // 60),
            pady=self.pad_card_y,
        )
        self._card.pack(fill=tk.X)
        self._card.columnconfigure(0, weight=1)
        self._card.columnconfigure(1, weight=1)

        self._d = {}
        fields = [
            # (clé, libellé, colonne, ligne, gros?, span)
            ("type",     "TYPE DE DÉFAUT",  0, 0, True,  1),
            ("severity", "GRAVITÉ",         1, 0, True,  1),
            ("cable",    "CÂBLE / REF",     0, 1, False, 2),
        ]
        for key, lbl_txt, col, row, big, span in fields:
            wrap = tk.Frame(self._card, bg=C["card_alert"])
            wrap.grid(row=row, column=col, columnspan=span, sticky="ew",
                      padx=(0, max(8 if self.is_small else 12, W // 80)), pady=self.pad_field_y)

            tk.Label(wrap, text=lbl_txt,
                     font=self._f["lbl"], fg=C["gray"], bg=C["card_alert"],
                     anchor="w").pack(anchor="w")

            self._d[key] = tk.Label(
                wrap, text="—",
                font=self._f["val_big"] if big else self._f["val_med"],
                fg=C["white"], bg=C["card_alert"],
                anchor="w", wraplength=max(200, W // 3) if span == 1 else max(400, W * 2 // 3),
            )
            self._d[key].pack(anchor="w")

        # ── Zone action ───────────────────────────────────────────────────────
        self._z_action = tk.Frame(self._v_alert, bg=C["bg_alert"],
                                  pady=self.pad_action_y,
                                  padx=self.pad_w)
        self._z_action.pack(fill=tk.X)

        self._btn_resolve = tk.Button(
            self._z_action, text="✔   MARQUER COMME TRAITÉ",
            font=self._f["btn"], fg="#fff", bg=C["green2"],
            activebackground=C["green"], activeforeground="#000",
            relief=tk.FLAT,
            padx=max(15 if self.is_small else 20, W // 50), pady=self.pad_btn_y,
            cursor="hand2", command=self._ask_confirm,
        )
        self._btn_resolve.pack(side=tk.LEFT)

        tk.Label(self._z_action,
                 text="Appuyez après avoir traité le câble défectueux",
                 font=self._f["footer"], fg=C["gray"], bg=C["bg_alert"],
        ).pack(side=tk.LEFT, padx=14)

        # ── Zone confirmation ─────────────────────────────────────────────────
        self._z_confirm = tk.Frame(self._v_alert, bg=C["bg_alert"],
                                   pady=self.pad_action_y,
                                   padx=self.pad_w)

        tk.Label(self._z_confirm,
                 text="Confirmer la résolution de cette anomalie ?",
                 font=self._f["btn"], fg=C["white"], bg=C["bg_alert"],
        ).pack(anchor="w", pady=(0, 8))

        row_btns = tk.Frame(self._z_confirm, bg=C["bg_alert"])
        row_btns.pack(anchor="w")

        self._btn_yes = tk.Button(
            row_btns, text="✔   Oui, Confirmer",
            font=self._f["btn_sm"], fg="#fff", bg="#00c853",
            activebackground=C["green"], relief=tk.FLAT,
            padx=max(12 if self.is_small else 16, W // 60), pady=max(6 if self.is_small else 8, self.SH // 80),
            cursor="hand2", command=self._do_resolve,
        )
        self._btn_yes.pack(side=tk.LEFT, padx=(0, 10))

        tk.Button(
            row_btns, text="✖   Annuler",
            font=self._f["btn_sm"], fg="#fff", bg="#37474f",
            activebackground="#546e7a", relief=tk.FLAT,
            padx=max(12 if self.is_small else 16, W // 60), pady=max(6 if self.is_small else 8, self.SH // 80),
            cursor="hand2", command=self._cancel_confirm,
        ).pack(side=tk.LEFT)

    # ── Mise à jour des données ───────────────────────────────────────────────

    def update(self, anomalies: list):
        self._anomalies  = anomalies
        self._confirming = False
        if anomalies:
            self._fill(anomalies[0], len(anomalies))
            self._show_alert()
        else:
            self._show_normal()

    def _fill(self, a: dict, total: int):
        s = lambda v, d="Non spécifié": str(v).strip() if v else d
        n = total
        self._lbl_al_count.configure(
            text=f"{n} anomalie{'s' if n>1 else ''} active{'s' if n>1 else ''} — Intervention requise"
        )
        self._d["type"].configure(text=s(a.get("type") or a.get("typeDefaut")))
        self._d["severity"].configure(text=s(a.get("severity"), "—").upper())
        self._d["cable"].configure(
            text=f"#{a['cableId'][:18]}" if a.get("cableId") else "—"
        )
        self._resolve_id = a.get("id")

    # ── Transitions ───────────────────────────────────────────────────────────

    def _show_normal(self):
        self._v_alert.pack_forget()
        self._v_ok.pack(fill=tk.BOTH, expand=True)
        self._theme(False)

    def _show_alert(self):
        self._v_ok.pack_forget()
        self._z_confirm.pack_forget()
        self._z_action.pack(fill=tk.X,
                            padx=self.pad_w)
        self._v_alert.pack(fill=tk.BOTH, expand=True)
        self._theme(True)

    def _theme(self, alert: bool):
        bg     = C["bg_alert"]  if alert else C["bg_ok"]
        accent = C["red"]       if alert else C["green"]
        clk    = C["red"]       if alert else C["green"]
        sep    = C["sep_alert"] if alert else C["sep_ok"]

        self._root.configure(bg=bg)
        self._hdr.configure(bg=bg)
        self._body.configure(bg=bg)
        self._ftr.configure(bg=bg)
        self._lbl_ftr.configure(bg=bg)
        self._lbl_clock.configure(bg=bg, fg=clk)
        self._lbl_date.configure(bg=bg)
        for w in self._hdr.winfo_children():
            if isinstance(w, tk.Frame):
                w.configure(bg=bg)
                for c in w.winfo_children():
                    if isinstance(c, tk.Label): c.configure(bg=bg)
        self._stripe_top.configure(bg=accent)
        self._stripe_bot.configure(bg=accent)

    # ── Boutons ───────────────────────────────────────────────────────────────

    def _ask_confirm(self):
        self._confirming = True
        self._z_action.pack_forget()
        self._z_confirm.pack(fill=tk.X, padx=self.pad_w)

    def _cancel_confirm(self):
        self._confirming = False
        self._z_confirm.pack_forget()
        self._z_action.pack(fill=tk.X, padx=self.pad_w)

    def _do_resolve(self):
        if not self._resolve_id: return
        self._btn_yes.configure(text="⏳  En cours…", state=tk.DISABLED)
        
        def run():
            success = self._on_resolve(self._resolve_id)
            if not success:
                self._root.after(0, self._resolve_failed)
        
        threading.Thread(target=run, daemon=True).start()

    def _resolve_failed(self):
        self._btn_yes.configure(text="✔   Oui, Confirmer", state=tk.NORMAL)
        self._cancel_confirm()

    # ── Animations ────────────────────────────────────────────────────────────

    def _tick_blink(self):
        if self._anomalies:
            color = C["red"] if self._blink else C["red2"]
            self._stripe_top.configure(bg=color)
            self._stripe_bot.configure(bg=color)
            self._blink = not self._blink
        self._root.after(550, self._tick_blink)

    def _tick_clock(self):
        now = datetime.now()
        self._lbl_clock.configure(text=now.strftime("%H:%M:%S"))
        self._lbl_date.configure(text=now.strftime("%d/%m/%Y"))
        self._root.after(1000, self._tick_clock)

    def _quit(self):
        self._root.destroy()

# =============================================================================
#  ORCHESTRATEUR
# =============================================================================

class ICEMStation:
    def __init__(self):
        self._buzzer   = BuzzerController()
        self._root     = tk.Tk()
        self._display  = WorkshopDisplay(self._root, on_resolve=self._handle_resolve)
        self._firebase = FirebaseService(on_update=self._on_data)
        self._firebase.start_listening()

    def _on_data(self, anomalies):
        if anomalies: self._buzzer.start()
        else:         self._buzzer.stop()
        self._root.after(0, self._display.update, anomalies)

    def _handle_resolve(self, anomaly_id):
        success = self._firebase.resolve(anomaly_id)
        if not success:
            log.error("Résolution échouée — vérifiez la connexion")
        return success

    def run(self):
        log.info("Démarrage — Échap/F11 pour quitter")
        try:
            self._root.mainloop()
        finally:
            log.info("Arrêt propre…")
            self._firebase.stop()
            self._buzzer.cleanup()

# =============================================================================
#  POINT D'ENTRÉE
# =============================================================================

if __name__ == "__main__":
    log.info("=" * 55)
    log.info("  ICEM Quality Control — Station Atelier")
    log.info(f"  Firebase : {FIREBASE_CONFIG['projectId']}")
    log.info(f"  Buzzer   : GPIO {BUZZER_PIN} | Pi: {ON_PI}")
    log.info("=" * 55)
    ICEMStation().run()
