import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { auth } from '../services/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import logo from '../assets/logo.png';
import buildingImg from '../assets/building.png';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(true);
    const [codeError, setCodeError] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Get oobCode from URL
    const queryParams = new URLSearchParams(window.location.search);
    const oobCode = queryParams.get('oobCode');

    useEffect(() => {
        const verifyCode = async () => {
            if (!oobCode) {
                setCodeError("Le code de réinitialisation est manquant. Veuillez utiliser le lien reçu par e-mail.");
                setVerifyingCode(false);
                return;
            }
            try {
                // Verify that the code is valid before showing the form
                await verifyPasswordResetCode(auth, oobCode);
                setVerifyingCode(false);
            } catch (err) {
                console.error("Code verification error:", err);
                setCodeError("Ce lien est invalide, expiré ou a déjà été utilisé. Veuillez effectuer une nouvelle demande.");
                setVerifyingCode(false);
            }
        };
        verifyCode();
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error("Reset error:", err);
            setError("Une erreur est survenue lors de la réinitialisation du mot de passe. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-['Inter'] overflow-hidden">
            
            {/* Left Side — Cinematic Professional Panel */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#1e1b4b]">
                <div 
                    className="absolute inset-0 z-0 scale-110" 
                    style={{ 
                        backgroundImage: `url(${buildingImg})`, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/80 via-[#1e1b4b]/70 to-[#2563eb]/30 z-10 backdrop-blur-[1px]"></div>

                <div className="relative z-20 w-full h-full flex flex-col justify-between p-16 xl:p-24">
                    {/* Premium Logo Header */}
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 transition-opacity"></div>
                            <div className="relative w-24 h-24 rounded-[32px] bg-white backdrop-blur-xl flex items-center justify-center border border-white/40 shadow-2xl overflow-hidden">
                                <img src={logo} alt="ICEM" className="w-14 h-14 object-contain" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent"></div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter leading-none mb-1 text-white">ICEM</h1>
                            <p className="text-sm font-black uppercase tracking-[0.5em] text-blue-300">Quality Control</p>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-10">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            <span className="text-sm font-black uppercase tracking-widest text-white">Système Certifié IA</span>
                        </div>
                        
                        <h1 className="text-7xl xl:text-8xl font-black leading-[0.9] mb-8 tracking-tighter text-white">
                            Accès <br/>
                            <span className="text-blue-400">Sécurisé.</span>
                        </h1>
                        
                        <p className="text-xl xl:text-2xl leading-relaxed font-medium text-white/90">
                            Mise à jour sécurisée des informations d'accès opérateurs et encadrement.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-black tracking-[0.4em] uppercase text-white/60">
                        <ShieldCheck size={18} className="text-blue-400" />
                        <span className="text-white">Excellence & Précision</span>
                    </div>
                </div>
            </div>

            {/* Right Side — Password Reset Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative bg-slate-50 overflow-y-auto">
                
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[150px]"></div>
                </div>

                <div className="w-full max-w-2xl relative z-10 py-10">
                    
                    <div className="bg-white rounded-[60px] p-12 lg:p-20 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.06)] border border-blue-50 relative overflow-hidden">
                        
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                        {verifyingCode ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Vérification du code de sécurité...</p>
                            </div>
                        ) : codeError ? (
                            <div className="text-center py-10 space-y-8">
                                <AlertCircle size={80} className="text-red-500 mx-auto" />
                                <div>
                                    <h2 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tighter">Lien non valide</h2>
                                    <p className="text-xl text-slate-500 font-medium">{codeError}</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-slate-900 text-white font-black py-6 rounded-[24px] active:scale-[0.98] transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        ) : success ? (
                            <div className="text-center py-10 space-y-8">
                                <CheckCircle size={80} className="text-emerald-500 mx-auto" />
                                <div>
                                    <h2 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tighter">Mot de passe modifié !</h2>
                                    <p className="text-xl text-slate-500 font-medium">Votre accès a été mis à jour avec succès. Vous allez être redirigé vers l'écran de connexion.</p>
                                </div>
                                <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-12">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Zap size={20} className="text-blue-600 fill-blue-600/20" />
                                        <span className="text-sm font-black text-blue-600 uppercase tracking-widest">
                                            Mise à jour d'accès
                                        </span>
                                    </div>
                                    <h2 className="text-6xl font-black text-[#1e1b4b] mb-4 tracking-tighter">
                                        Nouveau Mot de Passe
                                    </h2>
                                    <p className="text-xl text-slate-500 font-medium">
                                        Choisissez un nouveau mot de passe sécurisé pour votre compte.
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-4 bg-red-50 text-red-600 border border-red-100 p-6 rounded-3xl mb-10">
                                        <AlertCircle size={28} />
                                        <p className="text-base font-bold">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Nouveau mot de passe</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                                <Lock size={24} />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'} 
                                                required 
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-16 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                                placeholder="Saisir au moins 6 caractères"
                                                minLength={6}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Confirmer le mot de passe</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                                <Lock size={24} />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'} 
                                                required 
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-16 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                                placeholder="Confirmer votre mot de passe"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[24px] shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-base mt-6"
                                    >
                                        {loading ? (
                                            <Loader2 size={28} className="animate-spin" /> 
                                        ) : (
                                            <>
                                                Enregistrer et Continuer
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
