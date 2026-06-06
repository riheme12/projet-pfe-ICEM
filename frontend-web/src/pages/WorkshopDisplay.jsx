import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { AnomalyService } from '../services/api';

// =============================================================================
//  ICEM Workshop Andon Display — Page IoT Atelier
//  Optimisée pour affichage plein écran sur Raspberry Pi + Tablette/Écran HDMI
//  Route: /workshop-display (publique, pas besoin de login)
// =============================================================================

const REFRESH_INTERVAL_MS = 5000; // Intervalle de polling de secours (en ms)

/**
 * Formater une date en heure locale
 */
function formatTime(dateStr) {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formater une date complète
 */
function formatDate(dateStr) {
    if (!dateStr) return '-- / -- / ----';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// =============================================================================
//  Composant principal
// =============================================================================
export default function WorkshopDisplay() {
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [blink, setBlink] = useState(true);
    const [showConfirm, setShowConfirm] = useState(null); // ID de l'anomalie à confirmer
    const blinkRef = useRef(null);
    const clockRef = useRef(null);

    // ── Horloge temps réel ───────────────────────────────────────────────────
    useEffect(() => {
        clockRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockRef.current);
    }, []);

    // ── Animation clignotante pour alerte rouge ──────────────────────────────
    useEffect(() => {
        blinkRef.current = setInterval(() => setBlink(b => !b), 800);
        return () => clearInterval(blinkRef.current);
    }, []);

    // ── Écoute Firestore en temps réel ──────────────────────────────────────
    useEffect(() => {
        let unsubscribe;
        try {
            const q = query(
                collection(db, 'anomaly'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    // Filtrer les anomalies actives (non traitées)
                    const active = allDocs.filter(a => {
                        const s = (a.statut || '').toLowerCase();
                        return !['traitee', 'archivee', 'resolue'].includes(s);
                    });
                    setAnomalies(active);
                    setLoading(false);
                },
                (error) => {
                    console.error('Erreur Firestore onSnapshot:', error);
                    // Fallback : polling API REST
                    fallbackPolling();
                    setLoading(false);
                }
            );
        } catch (e) {
            console.error('Firestore listener error:', e);
            fallbackPolling();
            setLoading(false);
        }

        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    // ── Polling de secours via API REST ─────────────────────────────────────
    async function fallbackPolling() {
        const poll = async () => {
            try {
                const resp = await AnomalyService.getAll();
                const all = resp.data || [];
                const active = all.filter(a => {
                    const s = (a.statut || '').toLowerCase();
                    return !['traitee', 'archivee', 'resolue'].includes(s);
                });
                setAnomalies(active);
            } catch (err) {
                console.error('API polling error:', err);
            }
        };
        poll();
        const intervalId = setInterval(poll, REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }

    // ── Résolution d'une anomalie depuis l'écran tactile ────────────────────
    async function handleResolve(anomalyId) {
        setResolving(true);
        try {
            const anomalyRef = doc(db, 'anomaly', anomalyId);
            await updateDoc(anomalyRef, {
                statut: 'traitee',
                dateTraitement: serverTimestamp(),
                traitePar: 'Station Atelier (IoT)',
            });
            setShowConfirm(null);
        } catch (error) {
            console.error('Erreur résolution:', error);
            // Essai fallback API
            try {
                await AnomalyService.update(anomalyId, {
                    statut: 'traitee',
                    traitePar: 'Station Atelier (IoT)',
                });
                setShowConfirm(null);
            } catch (fallbackErr) {
                console.error('Fallback API error:', fallbackErr);
            }
        } finally {
            setResolving(false);
        }
    }

    // ── Gravité → couleur ────────────────────────────────────────────────────
    const getSeverityColor = (severity) => {
        const s = (severity || '').toLowerCase();
        if (s === 'critique' || s === 'haute') return '#ef4444'; // rouge vif
        if (s === 'majeur' || s === 'moyenne') return '#f97316'; // orange
        return '#eab308'; // jaune
    };

    const hasAlert = anomalies.length > 0;
    const mainAnomaly = anomalies[0]; // La plus récente anomalie active

    // ========================================================================
    //  ÉTAT CHARGEMENT
    // ========================================================================
    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.loadingSpinner} />
                <p style={styles.loadingText}>Connexion à la station de surveillance ICEM...</p>
                <p style={styles.loadingSubText}>Système d'Alerte Atelier — IoT</p>
            </div>
        );
    }

    // ========================================================================
    //  ÉTAT ALERTE (Anomalie active)
    // ========================================================================
    if (hasAlert && mainAnomaly) {
        const severityColor = getSeverityColor(mainAnomaly.severity);

        return (
            <div style={{
                ...styles.fullScreen,
                background: blink
                    ? `linear-gradient(135deg, #1a0000 0%, #3b0000 50%, #1a0000 100%)`
                    : `linear-gradient(135deg, #2a0000 0%, #500000 50%, #2a0000 100%)`,
                transition: 'background 0.4s ease',
            }}>
                {/* Bande lumineuse d'alerte en haut */}
                <div style={{
                    ...styles.alertStripe,
                    background: blink ? '#ef4444' : '#b91c1c',
                    transition: 'background 0.4s ease',
                }} />

                {/* En-tête */}
                <div style={styles.alertHeader}>
                    <div style={styles.alertHeaderLeft}>
                        <div>
                            <h1 style={styles.alertTitle}>ANOMALIE DETECTEE</h1>
                            <p style={styles.alertSubTitle}>
                                {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''} active{anomalies.length > 1 ? 's' : ''} — Intervention requise
                            </p>
                        </div>
                    </div>

                    <div style={styles.headerRight}>
                        <div style={styles.clockBox}>
                            <p style={styles.clockTime}>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                            <p style={styles.clockDate}>{formatDate(currentTime.toISOString())}</p>
                        </div>
                        <div style={styles.icemBadge}>
                            <span style={styles.icemLogo}>ICEM</span>
                            <span style={styles.icemSubLogo}>Quality Control</span>
                        </div>
                    </div>
                </div>

                {/* Corps principal */}
                <div style={styles.alertBody}>
                    {/* Carte d'anomalie principale */}
                    <div style={styles.mainAnomalyCard}>
                        {/* Image du défaut IA */}
                        <div style={styles.imageContainer}>
                            {mainAnomaly.imageUrl ? (
                                <img
                                    src={mainAnomaly.imageUrl}
                                    alt="Défaut câble détecté par IA"
                                    style={styles.defectImage}
                                />
                            ) : (
                                <div style={styles.noImage}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                    <p style={styles.noImageText}>Image non disponible</p>
                                </div>
                            )}
                            {/* Badge IA */}
                            <div style={styles.aiBadge}>
                                IA Roboflow
                                {mainAnomaly.confidence && (
                                    <span style={styles.confidenceChip}>
                                        {(mainAnomaly.confidence * 100).toFixed(0)}% confiance
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Détails de l'anomalie */}
                        <div style={styles.anomalyDetails}>
                            {/* Gravité */}
                            <div style={{ ...styles.severityBanner, background: severityColor }}>
                                <span style={styles.severityLabel}>GRAVITÉ</span>
                                <span style={styles.severityValue}>{(mainAnomaly.severity || 'Non définie').toUpperCase()}</span>
                            </div>

                            {/* Informations clés */}
                            <div style={styles.infoGrid}>
                                <InfoBlock label="TYPE DE DÉFAUT" value={mainAnomaly.type || mainAnomaly.typeDefaut || 'Non spécifié'} large />
                                <InfoBlock label="CÂBLE / REF" value={mainAnomaly.cableId ? `#${mainAnomaly.cableId.substring(0, 12)}` : '—'} />
                                <InfoBlock label="INSPECTÉ PAR" value={mainAnomaly.technicianName || 'Auto / IA Roboflow'} />
                                <InfoBlock label="DÉTECTÉ À" value={formatTime(mainAnomaly.detectedAt || mainAnomaly.createdAt)} />
                                <InfoBlock label="DATE" value={formatDate(mainAnomaly.detectedAt || mainAnomaly.createdAt)} />
                            </div>

                            {/* Description */}
                            {mainAnomaly.description && (
                                <div style={styles.descriptionBox}>
                                    <p style={styles.descriptionLabel}>DESCRIPTION</p>
                                    <p style={styles.descriptionText}>« {mainAnomaly.description} »</p>
                                </div>
                            )}

                            {/* Compteur d'anomalies */}
                            {anomalies.length > 1 && (
                                <div style={styles.moreAnomalies}>
                                    <span style={styles.moreAnomaliesNumber}>{anomalies.length - 1}</span>
                                    <span style={styles.moreAnomaliesText}>autre{anomalies.length > 2 ? 's' : ''} anomalie{anomalies.length > 2 ? 's' : ''} en attente</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bouton d'action tactile */}
                    <div style={styles.actionArea}>
                        {showConfirm === mainAnomaly.id ? (
                            <div style={styles.confirmBox}>
                                <p style={styles.confirmText}>Confirmer la résolution de cette anomalie ?</p>
                                <div style={styles.confirmButtons}>
                                    <button
                                        onClick={() => handleResolve(mainAnomaly.id)}
                                        disabled={resolving}
                                        style={styles.confirmYes}
                                    >
                                        {resolving ? 'En cours...' : 'Oui, marquer comme Traité'}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirm(null)}
                                        style={styles.confirmNo}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowConfirm(mainAnomaly.id)}
                                style={styles.resolveButton}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                MARQUER COMME TRAITÉ
                            </button>
                        )}
                        <p style={styles.actionHint}>Appuyez sur le bouton après avoir traité le câble défectueux</p>
                    </div>
                </div>

                {/* Bande lumineuse d'alerte en bas */}
                <div style={{
                    ...styles.alertStripe,
                    background: blink ? '#ef4444' : '#b91c1c',
                    transition: 'background 0.4s ease',
                }} />
            </div>
        );
    }

    // ========================================================================
    //  ÉTAT NORMAL (Aucune anomalie)
    // ========================================================================
    return (
        <div style={styles.normalScreen}>
            {/* En-tête */}
            <div style={styles.normalHeader}>
                <div style={styles.icemBadgeDark}>
                    <span style={styles.icemLogoDark}>ICEM</span>
                    <span style={styles.icemSubLogoDark}>Quality Control</span>
                </div>
                <div style={styles.clockBoxDark}>
                    <p style={styles.clockTimeDark}>{currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                    <p style={styles.clockDateDark}>{formatDate(currentTime.toISOString())}</p>
                </div>
            </div>

            {/* Centre */}
            <div style={styles.normalCenter}>
                <div style={styles.normalIconRing}>
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <h1 style={styles.normalTitle}>PRODUCTION CONFORME</h1>
                <p style={styles.normalSubTitle}>Aucune anomalie active détectée dans l'atelier</p>
                <div style={styles.normalStatusChip}>
                    <div style={styles.greenDot} />
                    <span>Système de surveillance actif — Tout est sous contrôle</span>
                </div>
            </div>

            {/* Bas de page */}
            <div style={styles.normalFooter}>
                <p style={styles.footerText}>
                    Système d'Alerte Atelier IoT ICEM — Station de Contrôle Qualité
                </p>
                <p style={styles.footerText}>
                    Actualisation en temps réel via Firebase Firestore
                </p>
            </div>
        </div>
    );
}

// =============================================================================
//  Sous-composant : Bloc d'information
// =============================================================================
function InfoBlock({ label, value, large }) {
    return (
        <div style={{ ...styles.infoBlock, gridColumn: large ? 'span 2' : undefined }}>
            <p style={styles.infoLabel}>{label}</p>
            <p style={{ ...styles.infoValue, fontSize: large ? 26 : 22 }}>{value}</p>
        </div>
    );
}

// =============================================================================
//  Styles en objets JS (évite les dépendances Tailwind pour l'affichage kiosk)
// =============================================================================
const styles = {
    // ── Loading ──────────────────────────────────────────────────────────────
    loadingScreen: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#0f172a', color: '#fff', gap: 20, fontFamily: "'Inter', sans-serif",
    },
    loadingSpinner: {
        width: 60, height: 60, border: '5px solid rgba(255,255,255,0.1)',
        borderTop: '5px solid #3b82f6', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    loadingText: { fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 },
    loadingSubText: { fontSize: 16, fontWeight: 500, color: '#475569' },

    // ── Plein écran de base ──────────────────────────────────────────────────
    fullScreen: {
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', width: '100%',
        fontFamily: "'Inter', sans-serif", color: '#fff',
        overflow: 'hidden',
    },

    // ── Bande clignotante ────────────────────────────────────────────────────
    alertStripe: { height: 12, width: '100%', flexShrink: 0 },

    // ── En-tête alerte ───────────────────────────────────────────────────────
    alertHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 32px', background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
    },
    alertHeaderLeft: {
        display: 'flex', alignItems: 'center', gap: 16,
    },
    alertIcon: { fontSize: 48, lineHeight: 1 },
    alertTitle: {
        fontSize: 42, fontWeight: 900, margin: 0,
        letterSpacing: 4, textTransform: 'uppercase',
        textShadow: '0 0 30px rgba(239,68,68,0.8)',
    },
    alertSubTitle: {
        fontSize: 18, fontWeight: 500, color: '#fca5a5', margin: 0, marginTop: 4,
        letterSpacing: 1,
    },
    headerRight: { display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 },
    clockBox: { textAlign: 'right' },
    clockTime: { fontSize: 36, fontWeight: 900, color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' },
    clockDate: { fontSize: 14, fontWeight: 500, color: '#94a3b8', margin: 0 },
    icemBadge: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
        padding: '8px 20px', borderRadius: 12,
    },
    icemLogo: { fontSize: 22, fontWeight: 900, letterSpacing: 4, color: '#fff' },
    icemSubLogo: { fontSize: 11, color: '#fca5a5', fontWeight: 600, letterSpacing: 2 },

    // ── Corps de l'alerte ────────────────────────────────────────────────────
    alertBody: {
        flex: 1, display: 'flex', flexDirection: 'column', gap: 20,
        padding: '20px 32px',
    },
    mainAnomalyCard: {
        flex: 1, display: 'flex', gap: 24,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 24, overflow: 'hidden',
        backdropFilter: 'blur(10px)',
    },

    // ── Image du défaut ──────────────────────────────────────────────────────
    imageContainer: {
        width: '40%', minWidth: 300, position: 'relative', flexShrink: 0,
        background: 'rgba(0,0,0,0.5)',
    },
    defectImage: {
        width: '100%', height: '100%', objectFit: 'cover',
        display: 'block',
    },
    noImage: {
        width: '100%', height: '100%', minHeight: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, color: '#64748b',
    },
    noImageText: { fontSize: 16, fontWeight: 600, color: '#475569' },
    aiBadge: {
        position: 'absolute', bottom: 16, left: 16,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        color: '#fff', padding: '8px 16px', borderRadius: 10,
        fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
        border: '1px solid rgba(255,255,255,0.1)',
    },
    confidenceChip: {
        background: '#10b981', color: '#fff',
        padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800,
    },

    // ── Détails anomalie ─────────────────────────────────────────────────────
    anomalyDetails: {
        flex: 1, padding: '24px 28px 24px 12px',
        display: 'flex', flexDirection: 'column', gap: 16,
    },
    severityBanner: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 20px', borderRadius: 12,
    },
    severityLabel: { fontSize: 13, fontWeight: 800, letterSpacing: 3, opacity: 0.8 },
    severityValue: { fontSize: 28, fontWeight: 900, letterSpacing: 2 },

    infoGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    },
    infoBlock: {
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '12px 16px',
    },
    infoLabel: { fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 2, margin: 0, marginBottom: 4 },
    infoValue: { fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 },

    descriptionBox: {
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '14px 18px',
    },
    descriptionLabel: { fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: 2, margin: 0, marginBottom: 6 },
    descriptionText: { fontSize: 16, fontWeight: 500, color: '#e2e8f0', margin: 0, fontStyle: 'italic' },

    moreAnomalies: {
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(251, 146, 60, 0.15)', border: '1px solid rgba(251,146,60,0.3)',
        borderRadius: 12, padding: '12px 20px',
    },
    moreAnomaliesNumber: { fontSize: 28, fontWeight: 900, color: '#f97316' },
    moreAnomaliesText: { fontSize: 16, fontWeight: 600, color: '#fdba74' },

    // ── Zone d'action (bouton tactile) ───────────────────────────────────────
    actionArea: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        paddingBottom: 8,
    },
    resolveButton: {
        background: 'linear-gradient(135deg, #059669, #10b981)',
        color: '#fff', border: 'none',
        fontSize: 26, fontWeight: 900, letterSpacing: 2,
        padding: '22px 60px', borderRadius: 20,
        cursor: 'pointer', boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        textTransform: 'uppercase', fontFamily: "'Inter', sans-serif",
    },
    actionHint: { fontSize: 14, color: '#94a3b8', margin: 0 },
    confirmBox: {
        background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(16,185,129,0.4)',
        borderRadius: 20, padding: '24px 36px', textAlign: 'center',
        backdropFilter: 'blur(10px)',
    },
    confirmText: { fontSize: 22, fontWeight: 700, color: '#d1fae5', margin: 0, marginBottom: 20 },
    confirmButtons: { display: 'flex', gap: 16, justifyContent: 'center' },
    confirmYes: {
        background: '#10b981', color: '#fff', border: 'none',
        fontSize: 20, fontWeight: 800, padding: '16px 36px', borderRadius: 14,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    },
    confirmNo: {
        background: 'rgba(255,255,255,0.1)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.2)',
        fontSize: 20, fontWeight: 600, padding: '16px 28px', borderRadius: 14,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
    },

    // ── Écran normal (Vert) ──────────────────────────────────────────────────
    normalScreen: {
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', width: '100%',
        background: 'linear-gradient(135deg, #052e16 0%, #064e3b 40%, #065f46 100%)',
        fontFamily: "'Inter', sans-serif", color: '#fff',
    },
    normalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    icemBadgeDark: {
        display: 'flex', flexDirection: 'column',
        background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
        padding: '10px 24px', borderRadius: 12,
    },
    icemLogoDark: { fontSize: 24, fontWeight: 900, letterSpacing: 4, color: '#fff' },
    icemSubLogoDark: { fontSize: 11, color: '#6ee7b7', fontWeight: 600, letterSpacing: 2 },
    clockBoxDark: { textAlign: 'right' },
    clockTimeDark: { fontSize: 38, fontWeight: 900, color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' },
    clockDateDark: { fontSize: 14, fontWeight: 500, color: '#6ee7b7', margin: 0 },

    normalCenter: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 28,
        padding: 40,
    },
    normalIconRing: {
        width: 200, height: 200,
        background: 'rgba(16,185,129,0.15)',
        border: '4px solid rgba(16,185,129,0.4)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 60px rgba(16,185,129,0.3), 0 0 120px rgba(16,185,129,0.1)',
    },
    normalTitle: {
        fontSize: 64, fontWeight: 900, margin: 0,
        letterSpacing: 6, textTransform: 'uppercase',
        textShadow: '0 0 40px rgba(52,211,153,0.6)',
    },
    normalSubTitle: {
        fontSize: 24, fontWeight: 500, color: '#6ee7b7', margin: 0, letterSpacing: 1,
    },
    normalStatusChip: {
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
        padding: '12px 28px', borderRadius: 50,
        fontSize: 16, fontWeight: 600, color: '#a7f3d0',
    },
    greenDot: {
        width: 12, height: 12, borderRadius: '50%', background: '#10b981',
        boxShadow: '0 0 8px #10b981',
        animation: 'pulse 2s infinite',
    },

    normalFooter: {
        padding: '20px 40px', textAlign: 'center',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    footerText: { fontSize: 13, color: '#6ee7b7', margin: '4px 0', fontWeight: 500, letterSpacing: 1 },
};
