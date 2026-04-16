import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, Bell, Globe, Save, Loader2, RotateCcw, Sliders, Shield, Mail } from 'lucide-react';
import { SettingsService } from '../services/api';

const SectionHeader = ({ icon, title, description }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            {icon}
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </div>
);

const Settings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await SettingsService.get();
                setSettings(response.data);
            } catch (error) {
                console.error("Erreur chargement paramètres:", error);
                // Use defaults if backend fails
                setSettings({
                    ia: {
                        modelName: 'YOLOv8',
                        modelVersion: 'v8.1.0',
                        confidenceThreshold: 0.75,
                        iouThreshold: 0.45,
                        maxDetections: 100,
                        autoAnalysis: true,
                    },
                    alerts: {
                        minConfidenceForAlert: 0.6,
                        enableCriticalNotifications: true,
                        enableEmailNotifications: false,
                        emailRecipients: '',
                        autoEscalateCritical: true,
                    },
                    system: {
                        language: 'fr',
                        dateFormat: 'DD/MM/YYYY',
                        timezone: 'Africa/Tunis',
                        retentionDays: 365,
                    },
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            await SettingsService.update(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
            alert("Erreur lors de la sauvegarde des paramètres");
        } finally {
            setSaving(false);
        }
    };

    const updateIA = (key, value) => {
        setSettings(prev => ({ ...prev, ia: { ...prev.ia, [key]: value } }));
    };

    const updateAlerts = (key, value) => {
        setSettings(prev => ({ ...prev, alerts: { ...prev.alerts, [key]: value } }));
    };

    const updateSystem = (key, value) => {
        setSettings(prev => ({ ...prev, system: { ...prev.system, [key]: value } }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="w-10 h-10 border-3 border-slate-200 border-t-accent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Chargement des paramètres...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Paramètres du Système</h1>
                    <p className="text-sm text-slate-500 mt-1">Configuration du modèle IA, des alertes et des préférences système</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`btn-primary flex items-center gap-2 transition-all ${saved ? '!bg-emerald-600 !shadow-emerald-600/20' : ''}`}
                >
                    {saving ? (
                        <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
                    ) : saved ? (
                        <><Shield size={18} /> Sauvegardé !</>
                    ) : (
                        <><Save size={18} /> Enregistrer</>
                    )}
                </button>
            </div>

            {/* IA Model Configuration */}
            <div className="card">
                <SectionHeader
                    icon={<Cpu size={20} />}
                    title="Configuration du Modèle IA"
                    description="Paramètres de détection des défauts sur les câbles"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom du modèle</label>
                        <input
                            type="text"
                            className="input-field"
                            value={settings.ia.modelName}
                            onChange={(e) => updateIA('modelName', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Version</label>
                        <input
                            type="text"
                            className="input-field"
                            value={settings.ia.modelVersion}
                            onChange={(e) => updateIA('modelVersion', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Seuil de confiance — <span className="text-blue-600">{Math.round(settings.ia.confidenceThreshold * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={settings.ia.confidenceThreshold}
                            onChange={(e) => updateIA('confidenceThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>10%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Seuil IoU — <span className="text-blue-600">{Math.round(settings.ia.iouThreshold * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={settings.ia.iouThreshold}
                            onChange={(e) => updateIA('iouThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>10%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Détections max par image</label>
                        <input
                            type="number"
                            className="input-field"
                            min="1"
                            max="500"
                            value={settings.ia.maxDetections}
                            onChange={(e) => updateIA('maxDetections', parseInt(e.target.value))}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.ia.autoAnalysis}
                                onChange={(e) => updateIA('autoAnalysis', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Analyse automatique</p>
                            <p className="text-xs text-slate-400">Analyser les images dès réception</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert Configuration */}
            <div className="card">
                <SectionHeader
                    icon={<Bell size={20} />}
                    title="Configuration des Alertes"
                    description="Seuils et notifications pour les anomalies détectées"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Confiance min. pour alerte — <span className="text-amber-600">{Math.round(settings.alerts.minConfidenceForAlert * 100)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={settings.alerts.minConfidenceForAlert}
                            onChange={(e) => updateAlerts('minConfidenceForAlert', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>10%</span>
                            <span>Toutes les détections au-dessus de ce seuil déclenchent une alerte</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.alerts.enableCriticalNotifications}
                                    onChange={(e) => updateAlerts('enableCriticalNotifications', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Notifications critiques</p>
                                <p className="text-xs text-slate-400">Alertes visuelles pour les anomalies critiques</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.alerts.autoEscalateCritical}
                                    onChange={(e) => updateAlerts('autoEscalateCritical', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Escalade automatique</p>
                                <p className="text-xs text-slate-400">Notifier le responsable qualité automatiquement</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.alerts.enableEmailNotifications}
                                onChange={(e) => updateAlerts('enableEmailNotifications', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <div>
                            <p className="text-sm font-semibold text-slate-700">Notifications par email</p>
                            <p className="text-xs text-slate-400">Envoyer les alertes par email</p>
                        </div>
                    </div>

                    {settings.alerts.enableEmailNotifications && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                <Mail size={14} className="inline mr-1" />
                                Destinataires (séparés par virgule)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="admin@icem.tn, qualite@icem.tn"
                                value={settings.alerts.emailRecipients}
                                onChange={(e) => updateAlerts('emailRecipients', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* System Configuration */}
            <div className="card">
                <SectionHeader
                    icon={<Globe size={20} />}
                    title="Paramètres Système"
                    description="Préférences générales de l'application"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Langue</label>
                        <select
                            className="input-field"
                            value={settings.system.language}
                            onChange={(e) => updateSystem('language', e.target.value)}
                        >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Format de date</label>
                        <select
                            className="input-field"
                            value={settings.system.dateFormat}
                            onChange={(e) => updateSystem('dateFormat', e.target.value)}
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fuseau horaire</label>
                        <select
                            className="input-field"
                            value={settings.system.timezone}
                            onChange={(e) => updateSystem('timezone', e.target.value)}
                        >
                            <option value="Africa/Tunis">Tunis (UTC+1)</option>
                            <option value="Europe/Paris">Paris (UTC+1/+2)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rétention des données (jours)</label>
                        <input
                            type="number"
                            className="input-field"
                            min="30"
                            max="3650"
                            value={settings.system.retentionDays}
                            onChange={(e) => updateSystem('retentionDays', parseInt(e.target.value))}
                        />
                        <p className="text-xs text-slate-400 mt-1">Durée de conservation des données d'inspection et d'anomalies</p>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="card bg-slate-50 border-dashed border-2 border-slate-200">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <Sliders size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-1">À propos du système IA</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Le modèle <strong>{settings.ia.modelName} {settings.ia.modelVersion}</strong> est utilisé pour la détection automatique
                            des défauts sur les câbles. Les images capturées par les techniciens sont analysées
                            automatiquement et les anomalies détectées avec une confiance supérieure à{' '}
                            <strong>{Math.round(settings.alerts.minConfidenceForAlert * 100)}%</strong> déclenchent
                            une alerte dans le système. Le seuil de confiance du modèle est fixé à{' '}
                            <strong>{Math.round(settings.ia.confidenceThreshold * 100)}%</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
