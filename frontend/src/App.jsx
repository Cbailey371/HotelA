import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import InventoryPage from './pages/InventoryPage';
import ProvidersPage from './pages/ProvidersPage';
import TechniciansPage from './pages/TechniciansPage';
import AuditPage from './pages/AuditPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchasesPage from './pages/PurchasesPage';
import ReceivingPage from './pages/ReceivingPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import HolidaysPage from './pages/HolidaysPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="assets/:id" element={<AssetDetailPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="providers" element={<ProvidersPage />} />
              <Route path="technicians" element={<TechniciansPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="work-orders" element={<WorkOrdersPage />} />
              <Route path="purchases" element={<PurchaseOrdersPage />} />
              <Route path="purchases/receive/:orderId" element={<ReceivingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="holidays" element={<HolidaysPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
