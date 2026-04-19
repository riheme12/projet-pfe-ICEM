import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../services/firebase';
import { AuthService } from '../services/api';

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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-[-10%] left-[-15%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-10%] right-[-15%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]"></div>

            <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-2xl p-8 z-10" style={{ animation: 'modal-in 0.4s ease-out' }}>
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/25 mb-6">
                        <Shield className="text-white" size={30} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                        ICEM Quality Control
                    </h1>
                    <p className="text-slate-400 text-sm">Système Industriel de Supervision Qualité</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl mb-6 flex items-center gap-3">
                        <Shield size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1">Adresse Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-600 text-sm"
                                placeholder="nom@icem.tn"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300 ml-1 flex justify-between">
                            Mot de passe
                            <span
                                onClick={() => { setShowForgotPassword(true); setResetSent(false); setResetError(''); setResetEmail(''); }}
                                className="text-blue-400 text-xs hover:underline cursor-pointer"
                            >Oublié ?</span>
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-12 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-600 text-sm"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:shadow-blue-600/30 active:scale-[0.98] mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Connexion en cours...
                            </>
                        ) : (
                            "Accéder au Dashboard"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Besoin d'aide ? <span className="text-slate-300 hover:text-white cursor-pointer transition-colors">Contacter l'administrateur</span>
                    </p>
                </div>
            </div>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-700 text-xs font-medium tracking-wider">
                © 2026 ICEM Industrial Solutions • v1.1.0
            </p>

            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-2xl p-8" style={{ animation: 'modal-in 0.3s ease-out' }}>
                        <button
                            onClick={() => setShowForgotPassword(false)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-6"
                        >
                            <ArrowLeft size={16} /> Retour à la connexion
                        </button>

                        {resetSent ? (
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6">
                                    <CheckCircle className="text-emerald-400" size={30} />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Email envoyé !</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Un lien de réinitialisation a été envoyé à <strong className="text-slate-200">{resetEmail}</strong>.
                                    Vérifiez votre boîte de réception (et le dossier spam).
                                </p>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                                >
                                    Retour à la connexion
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center mb-6 text-center">
                                    <div className="w-14 h-14 bg-amber-600/20 rounded-2xl flex items-center justify-center mb-4">
                                        <Lock className="text-amber-400" size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Mot de passe oublié</h2>
                                    <p className="text-slate-400 text-sm">Entrez votre email pour recevoir un lien de réinitialisation</p>
                                </div>

                                {resetError && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
                                        <Shield size={16} />{resetError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700/50 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-slate-600 text-sm"
                                            placeholder="votre-email@icem.tn"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={resetLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        {resetLoading ? (
                                            <><Loader2 className="animate-spin" size={18} /> Envoi en cours...</>
                                        ) : (
                                            'Envoyer le lien de réinitialisation'
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
