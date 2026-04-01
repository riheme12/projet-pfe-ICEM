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

// Composant pour protéger les routes
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
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
          <Route path="orders" element={<Orders />} />
          <Route path="cables" element={<Cables />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="inspections/:id" element={<InspectionDetails />} />
          <Route path="settings" element={<div className="card"><h1 className="text-xl font-bold text-slate-800 mb-2">Paramètres</h1><p className="text-slate-500">Configuration du système en cours de développement...</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
