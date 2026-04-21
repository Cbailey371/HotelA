import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import RequestPortal from './pages/RequestPortal';
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
import WorkOrdersHistoryPage from './pages/WorkOrdersHistoryPage';
import MaintenanceHistoryPage from './pages/MaintenanceHistoryPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import PurchaseQuotesPage from './pages/PurchaseQuotesPage';
import PurchasesPage from './pages/PurchasesPage';
import PurchasesInvoicesPage from './pages/PurchasesInvoicesPage';
import InvoiceReceivingPage from './pages/InvoiceReceivingPage';
import ReceivingPage from './pages/ReceivingPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import HolidaysPage from './pages/HolidaysPage';
import NotificationsPage from './pages/NotificationsPage';
import PublicCalendar from './pages/PublicCalendar';
import MaintenanceDetailPage from './pages/MaintenanceDetailPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import { NAV_GROUPS, isNavItemVisible } from './components/Sidebar';

const ProtectedRoute = ({ children, permiso, anyPermisos }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  const hasPermission = anyPermisos 
    ? anyPermisos.some(p => user.permisos?.includes(p))
    : (permiso ? user.permisos?.includes(permiso) : true);

  if (!hasPermission) {
    // Si no tiene el permiso, pero es un usuario de portal, mandarlo al portal
    if (['RECEPCION', 'LIMPIEZA', 'SOLICITANTE'].includes(user?.role?.toUpperCase())) {
      return <Navigate to="/portal" />;
    }
    return <Navigate to="/" />;
  }
  
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;

  // 1. Prioridad: Si es un rol de portal y tiene acceso al portal, ir allí directamente
  // Esto evita que caigan en otros módulos por accidente si tienen permisos heredados
  const userRole = user?.role?.toUpperCase();
  if (['RECEPCION', 'LIMPIEZA', 'SOLICITANTE'].includes(userRole)) {
    const portalItem = NAV_GROUPS.flatMap(g => g.items || [g]).find(i => i.path === '/portal');
    if (portalItem && isNavItemVisible(portalItem, user)) {
      return <Navigate to="/portal" />;
    }
  }

  // 2. Verificar si tiene acceso al Dashboard (para administradores/técnicos)
  const dashboardGroup = NAV_GROUPS.find(g => g.id === 'dashboard');
  if (dashboardGroup && isNavItemVisible(dashboardGroup, user)) {
    return <Dashboard />;
  }

  // 3. Buscar el primer módulo disponible dinámicamente
  for (const group of NAV_GROUPS) {
    // Si es un link directo (que no sea el Dashboard ya verificado)
    if (group.isDirect && group.path !== '/' && isNavItemVisible(group, user)) {
      return <Navigate to={group.path} />;
    }
    // Si es un grupo con sub-ítems
    if (group.items) {
      const firstVisibleItem = group.items.find(item => isNavItemVisible(item, user));
      if (firstVisibleItem) {
        return <Navigate to={firstVisibleItem.path} />;
      }
    }
  }

  // Fallback por defecto si nada coincide
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/public/calendar" element={<PublicCalendar />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<HomeRedirect />} />
                <Route path="portal" element={<ProtectedRoute permiso="acceso_portal"><RequestPortal /></ProtectedRoute>} />
                <Route path="assets" element={<ProtectedRoute permiso="assets_view"><AssetsPage /></ProtectedRoute>} />
                <Route path="assets/:id" element={<ProtectedRoute permiso="assets_view"><AssetDetailPage /></ProtectedRoute>} />
                <Route path="maintenance" element={<ProtectedRoute permiso="maintenance_plan_view"><MaintenancePage /></ProtectedRoute>} />
                <Route path="maintenance/:id" element={<ProtectedRoute permiso="maintenance_plan_view"><MaintenanceDetailPage /></ProtectedRoute>} />
                <Route path="maintenance/history" element={<ProtectedRoute permiso="maintenance_view"><MaintenanceHistoryPage /></ProtectedRoute>} />
                <Route path="inventory" element={<ProtectedRoute permiso="inventory_view"><InventoryPage /></ProtectedRoute>} />
                <Route path="providers" element={<ProtectedRoute permiso="providers_view"><ProvidersPage /></ProtectedRoute>} />
                <Route path="technicians" element={<ProtectedRoute permiso="techs_view"><TechniciansPage /></ProtectedRoute>} />
                <Route path="audit" element={<ProtectedRoute permiso="audit_view"><AuditPage /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute permiso="users_admin"><UsersPage /></ProtectedRoute>} />
                <Route path="roles" element={<ProtectedRoute permiso="roles_view"><RolesPage /></ProtectedRoute>} />
                <Route path="work-orders" element={<ProtectedRoute permiso="work_orders_view"><WorkOrdersPage /></ProtectedRoute>} />
                <Route path="work-orders/history" element={<ProtectedRoute anyPermisos={["work_orders_history", "acceso_portal"]}><WorkOrdersHistoryPage /></ProtectedRoute>} />
                <Route path="work-orders/:id" element={<ProtectedRoute anyPermisos={["work_orders_view", "acceso_portal"]}><WorkOrderDetailPage /></ProtectedRoute>} />
                <Route path="purchases" element={<ProtectedRoute permiso="purchases_view"><PurchaseOrdersPage /></ProtectedRoute>} />
                <Route path="purchases/quotes" element={<ProtectedRoute permiso="quotes_view"><PurchaseQuotesPage /></ProtectedRoute>} />
                <Route path="purchases/invoices" element={<ProtectedRoute permiso="invoices_view"><PurchasesInvoicesPage /></ProtectedRoute>} />
                <Route path="purchases/invoices/receive/:invoiceId" element={<ProtectedRoute permiso="purchases_receive"><InvoiceReceivingPage /></ProtectedRoute>} />
                <Route path="purchases/receive/:orderId" element={<ProtectedRoute permiso="purchases_receive"><ReceivingPage /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute permiso="settings_view"><SettingsPage /></ProtectedRoute>} />
                <Route path="holidays" element={<ProtectedRoute permiso="holidays_view"><HolidaysPage /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute permiso="reports_view"><ReportsPage /></ProtectedRoute>} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
