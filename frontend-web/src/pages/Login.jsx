import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { auth, signInWithEmailAndPassword } from '../services/firebase';
import { AuthService } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
                            <span className="text-blue-400 text-xs hover:underline cursor-pointer">Oublié ?</span>
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
        </div>
    );
};

export default Login;
