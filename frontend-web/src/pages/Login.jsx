import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../services/firebase';
import { AuthService } from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetError, setResetError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            const response = await AuthService.login(idToken);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(response.data));
            navigate('/');
        } catch (err) {
            const code = err.code || '';
            if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
                setError('Identifiants incorrects. Veuillez réessayer.');
            } else if (code.includes('too-many-requests')) {
                setError('Trop de tentatives. Réessayez plus tard.');
            } else if (code.includes('invalid-email')) {
                setError('Adresse email invalide.');
            } else {
                setError('Erreur de connexion. Vérifiez vos identifiants.');
            }
        } finally { setLoading(false); }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail) { setResetError('Veuillez entrer votre email.'); return; }
        setResetLoading(true); setResetError('');
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSent(true);
        } catch (err) {
            const code = err.code || '';
            if (code.includes('user-not-found')) setResetError('Aucun compte avec cet email.');
            else if (code.includes('invalid-email')) setResetError('Email invalide.');
            else setResetError('Erreur lors de l\'envoi. Réessayez.');
        } finally { setResetLoading(false); }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left — Purple Hero Panel */}
            <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-10 relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)' }}>
                {/* Decorative circles */}
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5"></div>
                <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/8"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/3"></div>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/10">
                        <img src={logo} alt="ICEM" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-base leading-tight">ICEM Quality</p>
                        <p className="text-indigo-200 text-xs">Control System</p>
                    </div>
                </div>

                {/* Main Text */}
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold text-white leading-tight mb-4">
                        Gérez la qualité<br />industrielle avec<br />précision.
                    </h1>
                    <p className="text-indigo-200 text-sm leading-relaxed mb-8">
                        Plateforme de contrôle qualité avec détection d'anomalies par IA et traçabilité complète de la production.
                    </p>

                    {/* Stats Pills */}
                    <div className="flex gap-3">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center">
                            <p className="text-xl font-extrabold text-white">99.2%</p>
                            <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">Conformité</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center">
                            <p className="text-xl font-extrabold text-white">24/7</p>
                            <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">Surveillance</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 text-center">
                            <p className="text-xl font-extrabold text-white">IA</p>
                            <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">Détection</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="relative z-10 text-indigo-300 text-[11px]">© 2026 ICEM Industrial Solutions</p>
            </div>

            {/* Right — Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-sm">
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden items-center gap-2.5 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <img src={logo} alt="ICEM" className="w-5 h-5 object-contain" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">ICEM Quality</p>
                            <p className="text-[10px] text-gray-400">Control System</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Connexion</h2>
                    <p className="text-sm text-gray-400 mb-7">Accédez à votre espace de supervision</p>

                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-xs font-medium p-3.5 rounded-xl mb-5">
                            <AlertCircle size={15} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="email" required value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="votre.email@icem.tn"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mot de passe</label>
                                <button type="button" onClick={() => { setShowForgotPassword(true); setResetSent(false); setResetEmail(''); setResetError(''); }}
                                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                                    Oublié ?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type={showPassword ? 'text' : 'password'} required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-10"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="btn-primary w-full justify-center py-3 text-sm mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
                            {loading ? <><Loader2 size={16} className="animate-spin" />Authentification...</> : 'SE CONNECTER'}
                        </button>
                    </form>

                    <p className="text-center text-[11px] text-gray-300 mt-8">v1.2.0 • ICEM Industrial Solutions</p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(15, 20, 50, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7"
                        style={{ animation: 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <button onClick={() => setShowForgotPassword(false)}
                            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs font-semibold mb-5 transition-colors">
                            <ArrowLeft size={13} /> Retour
                        </button>

                        {resetSent ? (
                            <div className="text-center py-3">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={24} className="text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Email envoyé !</h3>
                                <p className="text-sm text-gray-400 mb-6">
                                    Lien de réinitialisation envoyé à <strong className="text-gray-700">{resetEmail}</strong>
                                </p>
                                <button onClick={() => setShowForgotPassword(false)}
                                    className="btn-primary w-full justify-center py-3">
                                    RETOUR À LA CONNEXION
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Mot de passe oublié</h3>
                                <p className="text-sm text-gray-400 mb-5">Entrez votre email pour recevoir un lien</p>
                                {resetError && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-xl mb-4">
                                        <AlertCircle size={13} />{resetError}
                                    </div>
                                )}
                                <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input type="email" required value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            className="input-field pl-10"
                                            placeholder="votre.email@icem.tn" />
                                    </div>
                                    <button type="submit" disabled={resetLoading}
                                        className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                                        {resetLoading ? <><Loader2 size={15} className="animate-spin" />Envoi...</> : 'ENVOYER LE LIEN'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
