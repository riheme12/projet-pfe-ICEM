import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertCircle, Zap, Activity, Globe, ShieldCheck, UserPlus, User } from 'lucide-react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from '../services/firebase';
import { AuthService } from '../services/api';
import logo from '../assets/logo.png';
import buildingImg from '../assets/building.png';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('manager');
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
            
            const userData = response.data;
            const userRole = userData.role || (userData.roles && userData.roles[0]);
            
            if (userRole === 'technician') {
                await auth.signOut();
                setError('Accès refusé : l\'application web est réservée aux administrateurs et responsables.');
                setLoading(false);
                return;
            }

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(userData));
            navigate('/');
        } catch (err) {
            const code = err.code || '';
            if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
                setError('Identifiants incorrects.');
            } else {
                setError('Erreur de connexion. Vérifiez vos identifiants.');
            }
        } finally { setLoading(false); }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!fullName || !email || !password) {
                setError('Tous les champs requis doivent être remplis.');
                setLoading(false);
                return;
            }

            // 1. Appeler la route de signup du backend
            await AuthService.signup({
                email,
                password,
                fullName,
                username: username || email.split('@')[0],
                role: role
            });

            // 2. Automatiquement connecter l'utilisateur après inscription
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            const loginResponse = await AuthService.login(idToken);
            
            const userData = loginResponse.data;
            const userRole = userData.role || (userData.roles && userData.roles[0]);
            
            if (userRole === 'technician') {
                await auth.signOut();
                setError('Compte créé, mais l\'accès web est réservé aux administrateurs et responsables.');
                setLoading(false);
                return;
            }

            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(userData));
            navigate('/');
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.response?.data?.error || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail) { setResetError('Veuillez entrer votre email.'); return; }
        setResetLoading(true); setResetError('');
        try {
            await AuthService.forgotPassword(resetEmail);
            setResetSent(true);
        } catch (err) {
            console.error('Reset error:', err);
            setResetError(err.response?.data?.error || err.message || 'Impossible d\'envoyer l\'email.');
        } finally { setResetLoading(false); }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-['Inter'] overflow-hidden">
            
            {/* Left Side — Cinematic Professional Panel */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#1e1b4b]">
                <div 
                    className="absolute inset-0 z-0 animate-slow-zoom scale-110" 
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
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="relative w-24 h-24 rounded-[32px] bg-white backdrop-blur-xl flex items-center justify-center border border-white/40 shadow-2xl overflow-hidden">
                                <img src={logo} alt="ICEM" className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-700" />
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
                            <span className="text-sm font-black uppercase tracking-widest" style={{ color: 'white' }}>Système Certifié IA</span>
                        </div>
                        
                        <h1 className="text-7xl xl:text-8xl font-black leading-[0.9] mb-8 tracking-tighter" style={{ color: 'white' }}>
                            Contrôle <br/>
                            <span style={{ color: '#60a5fa' }}>Intelligent.</span>
                        </h1>
                        
                        <p className="text-xl xl:text-2xl leading-relaxed font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Expertise en contrôle qualité et traçabilité industrielle.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-black tracking-[0.4em] uppercase" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        <ShieldCheck size={18} style={{ color: '#60a5fa' }} />
                        <span style={{ color: 'white' }}>Excellence & Précision</span>
                    </div>
                </div>
            </div>

            {/* Right Side — Harmonized LIGHT Professional Login/Signup */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative bg-slate-50 overflow-y-auto">
                
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-indigo-600/[0.03] rounded-full blur-[150px]"></div>
                </div>

                <div className="w-full max-w-2xl relative z-10 py-10 animate-[fadeUp_0.6s_ease-out]">
                    
                    <div className="bg-white rounded-[60px] p-12 lg:p-20 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.06)] border border-blue-50 relative overflow-hidden">
                        
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap size={20} className="text-blue-600 fill-blue-600/20" />
                                <span className="text-sm font-black text-blue-600 uppercase tracking-widest">
                                    {isLogin ? 'Console de Supervision Industrielle' : 'Rejoindre la plateforme ICEM'}
                                </span>
                            </div>
                            <h2 className="text-6xl font-black text-[#1e1b4b] mb-4 tracking-tighter">
                                {isLogin ? 'Connexion' : 'Inscription'}
                            </h2>
                            <p className="text-xl text-slate-500 font-medium">
                                {isLogin ? 'Authentification sécurisée au portail ICEM.' : 'Créez votre compte de supervision ICEM.'}
                            </p>
                        </div>

                        {error && (
                            <div className={`flex items-center gap-4 ${error.includes('créé') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} border p-6 rounded-3xl mb-10 animate-[shake_0.5s_ease-in-out]`}>
                                {error.includes('créé') ? <CheckCircle size={28} /> : <AlertCircle size={28} />}
                                <p className="text-base font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-8">
                            {!isLogin && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Nom Complet</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                                <User size={24} />
                                            </div>
                                            <input
                                                type="text" required value={fullName}
                                                onChange={e => setFullName(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                                placeholder="Jean Dupont"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Nom d'utilisateur</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                                <UserPlus size={24} />
                                            </div>
                                            <input
                                                type="text" value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                                placeholder="jdupont"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Rôle sur la Plateforme</label>
                                        <div className="relative group/input">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                                <ShieldCheck size={24} />
                                            </div>
                                            <select
                                                value={role}
                                                onChange={e => setRole(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[#1e1b4b] focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                            >
                                                <option value="manager">Responsable Qualité</option>
                                                <option value="admin">Administrateur</option>
                                                <option value="director">Directeur</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-3">
                                <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Email Professionnel</label>
                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                        <Mail size={24} />
                                    </div>
                                    <input
                                        type="email" required value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                        placeholder="nom@icem.tn"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-2">
                                    <label className="block text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Mot de passe</label>
                                    {isLogin && (
                                        <button type="button" onClick={() => setShowForgotPassword(true)}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                            Oublié ?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-blue-600 transition-colors">
                                        <Lock size={24} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'} required value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-16 py-5 text-[#1e1b4b] placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-bold"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[24px] shadow-2xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-base mt-6 group/btn">
                                {loading ? (
                                    <Loader2 size={28} className="animate-spin" /> 
                                ) : (
                                    <>
                                        {isLogin ? "S'authentifier" : "Créer le compte"}
                                        <Zap size={20} className="fill-white" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                                className="text-base font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
                            </button>
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-6">
                            <div className="w-16 h-1 bg-slate-100 rounded-full"></div>
                            <div className="flex items-center gap-3 text-slate-300 text-sm font-black uppercase tracking-[0.5em]">
                                <Globe size={14} />
                                <span>Plateforme Certifiée ICEM • V1.2.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recovery Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-white rounded-[50px] p-16 shadow-2xl animate-[modal-in_0.3s_ease-out] relative">
                        <button onClick={() => setShowForgotPassword(false)}
                            className="relative z-10 flex items-center gap-2 text-slate-400 hover:text-blue-600 text-sm font-black uppercase tracking-widest mb-10 transition-colors">
                            <ArrowLeft size={16} /> Retour
                        </button>

                        {resetSent ? (
                            <div className="relative z-10 text-center py-6">
                                <CheckCircle size={80} className="text-blue-500 mx-auto mb-8" />
                                <h3 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tighter">Email Envoyé</h3>
                                <p className="text-xl text-slate-500 font-medium mb-12">Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.</p>
                                <button onClick={() => { setShowForgotPassword(false); setResetSent(false); }}
                                    className="w-full bg-blue-600 text-white font-black py-6 rounded-[28px] transition-all uppercase tracking-widest">
                                    Compris
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black text-[#1e1b4b] mb-4 tracking-tighter">Récupération</h3>
                                <p className="text-xl text-slate-500 font-medium mb-10">Réinitialisez votre accès sécurisé.</p>
                                {resetError && (
                                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold text-sm">
                                        {resetError}
                                    </div>
                                )}
                                <form onSubmit={handleForgotPassword} className="space-y-8">
                                    <div className="relative">
                                        <Mail size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="email" required value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] pl-16 pr-6 py-6 text-xl focus:outline-none focus:border-blue-600 font-bold"
                                            placeholder="votre.email@icem.tn" />
                                    </div>
                                    <button type="submit" disabled={resetLoading}
                                        className="w-full bg-blue-600 text-white font-black py-6 rounded-[28px] transition-all uppercase tracking-widest shadow-xl shadow-blue-600/20">
                                        {resetLoading ? <Loader2 size={32} className="animate-spin mx-auto" /> : 'Envoyer le lien'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
