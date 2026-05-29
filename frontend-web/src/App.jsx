import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Anomalies from './pages/Anomalies';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import InspectionDetails from './pages/InspectionDetails';
import Profile from './pages/Profile';
import Cables from './pages/Cables';
import Evolution from './pages/Evolution';
import WorkshopDisplay from './pages/WorkshopDisplay';
import { useAuth } from './hooks/useAuth';
import { auth, onAuthStateChanged } from './services/firebase';
import { AuthService } from './services/api';
import { Toaster } from 'react-hot-toast';

// Composant pour protéger les routes (authentification)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Composant pour restreindre l'accès selon les privilèges RBAC
const RoleGuard = ({ page, children }) => {
  const { hasPageAccess } = useAuth();
  return hasPageAccess(page) ? children : <Navigate to="/" replace />;
};


function App() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // L'utilisateur Firebase est restauré → synchroniser avec le backend
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await AuthService.login(idToken);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('currentUser', JSON.stringify(response.data));
        } catch (err) {
          console.error('Session restoration error:', err);
          // Garder la session locale si le backend est inaccessible
        }
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement de la session...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#334155',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' }, duration: 5000 },
        }}
      />
      <Routes>
        {/* Route publique — Écran Atelier IoT (Raspberry Pi / Tablette) */}
        <Route path="/workshop-display" element={<WorkshopDisplay />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<RoleGuard page="orders"><Orders /></RoleGuard>} />
          <Route path="anomalies" element={<RoleGuard page="anomalies"><Anomalies /></RoleGuard>} />
          <Route path="alerts" element={<RoleGuard page="alerts"><Alerts /></RoleGuard>} />
          <Route path="reports" element={<RoleGuard page="reports"><Reports /></RoleGuard>} />
          <Route path="evolution" element={<RoleGuard page="evolution"><Evolution /></RoleGuard>} />
          <Route path="users" element={<RoleGuard page="users"><Users /></RoleGuard>} />
          <Route path="cables" element={<RoleGuard page="cables"><Cables /></RoleGuard>} />
          <Route path="inspections/:id" element={<InspectionDetails />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
