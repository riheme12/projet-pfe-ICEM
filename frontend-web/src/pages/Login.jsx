import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';
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
            console.error('Login error:', err);
            const code = err.code || '';
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('Identifiants incorrects. Veuillez réessayer.');
            } else if (code === 'auth/too-many-requests') {
                setError('Trop de tentatives. Veuillez réessayer plus tard.');
            } else if (code === 'auth/invalid-email') {
                setError('Adresse email invalide.');
            } else {
                setError('Erreur de connexion. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail) {
            setResetError('Veuillez entrer votre adresse email.');
            return;
        }
        setResetLoading(true);
        setResetError('');
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSent(true);
        } catch (err) {
            const code = err.code || '';
            if (code === 'auth/user-not-found') {
                setResetError('Aucun compte trouvé avec cet email.');
            } else if (code === 'auth/invalid-email') {
                setResetError('Adresse email invalide.');
            } else {
                setResetError('Erreur lors de l\'envoi. Veuillez réessayer.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Intro */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                        <img src={logo} alt="ICEM Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        ICEM Quality Control
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Portail de Supervision Qualité</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
                            <ShieldAlert size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Adresse Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="Identifiant ICEM"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1 flex justify-between">
                                Mot de passe
                                <button
                                    type="button"
                                    onClick={() => { setShowForgotPassword(true); setResetSent(false); setResetError(''); setResetEmail(''); }}
                                    className="text-blue-600 text-xs hover:underline font-bold"
                                >Oublié ?</button>
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-slate-400 font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Authentification...
                                </>
                            ) : (
                                "SE CONNECTER"
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-slate-400 text-sm font-medium">
                    © 2026 ICEM Industrial Solutions • Version 1.1.0
                </p>
            </div>

            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-200">
                        <button
                            onClick={() => setShowForgotPassword(false)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors mb-6"
                        >
                            <ArrowLeft size={16} /> Retour à la connexion
                        </button>

                        {resetSent ? (
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle className="text-emerald-500" size={30} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-2">Email envoyé !</h2>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Un lien de réinitialisation a été envoyé à <strong className="text-slate-900">{resetEmail}</strong>.
                                </p>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all"
                                >
                                    RETOUR
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center mb-6 text-center">
                                    <h2 className="text-2xl font-bold text-slate-900">Mot de passe oublié ?</h2>
                                    <p className="text-slate-500 mt-2">Entrez votre email pour recevoir les instructions</p>
                                </div>

                                {resetError && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
                                        <ShieldAlert size={16} />{resetError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all font-medium"
                                            placeholder="votre-email@icem.tn"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        {resetLoading ? (
                                            <><Loader2 className="animate-spin" size={18} /> Envoi...</>
                                        ) : (
                                            'ENVOYER LE LIEN'
                                        )}
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
