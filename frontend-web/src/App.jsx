import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Cables from './pages/Cables';
import Anomalies from './pages/Anomalies';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Login from './pages/Login';
import InspectionDetails from './pages/InspectionDetails';
import Profile from './pages/Profile';
import Trends from './pages/Trends';
import { useAuth } from './hooks/useAuth';
import { auth, onAuthStateChanged } from './services/firebase';
import { AuthService } from './services/api';

// Composant pour protéger les routes (authentification)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Composant pour protéger les routes par rôle (RBAC)
const RoleRoute = ({ page, children }) => {
  const { hasPageAccess } = useAuth();

  if (!hasPageAccess(page)) {
    return <Navigate to="/" replace />;
  }

  return children;
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
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={
            <RoleRoute page="orders"><Orders /></RoleRoute>
          } />
          <Route path="cables" element={
            <RoleRoute page="cables"><Cables /></RoleRoute>
          } />
          <Route path="anomalies" element={
            <RoleRoute page="anomalies"><Anomalies /></RoleRoute>
          } />
          <Route path="alerts" element={
            <RoleRoute page="alerts"><Alerts /></RoleRoute>
          } />
          <Route path="reports" element={
            <RoleRoute page="reports"><Reports /></RoleRoute>
          } />
          <Route path="users" element={
            <RoleRoute page="users"><Users /></RoleRoute>
          } />
          <Route path="trends" element={
            <RoleRoute page="trends"><Trends /></RoleRoute>
          } />
          <Route path="inspections/:id" element={<InspectionDetails />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
