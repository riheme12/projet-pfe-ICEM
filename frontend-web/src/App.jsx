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
import Settings from './pages/Settings';
import AdminProfile from './pages/AdminProfile';
import { getCurrentUser } from './hooks/useAuth';
import { ROLE_PERMISSIONS } from './hooks/useAuth';

// Composant pour protéger les routes (authentification)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Composant pour protéger les routes par rôle (RBAC)
const RoleRoute = ({ page, children }) => {
  const user = getCurrentUser();
  const role = user?.role || 'technician';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.technician;

  if (!permissions.pages.includes(page)) {
    return <Navigate to="/" replace />;
  }

  return children;
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
          <Route path="inspections/:id" element={<InspectionDetails />} />
          <Route path="settings" element={
            <RoleRoute page="settings"><Settings /></RoleRoute>
          } />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
