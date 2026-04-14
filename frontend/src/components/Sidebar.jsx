import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Wrench, Users, Settings, LogOut, Moon, Sun, Box, 
    Calendar, ClipboardList, Building2, ShoppingCart, Shield, FileText, 
    CalendarDays, Archive, ChevronDown, ChevronRight 
} from 'lucide-react';
import logo from '../assets/andros_logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';



export const isNavItemVisible = (target, user) => {
    const userRole = user?.role?.toUpperCase();
    
    // Si el rol está en la lista de excluidos, no es visible pase lo que pase
    if (target.excludeRoles && target.excludeRoles.includes(userRole)) {
        return false;
    }

    if (!target.roles && !target.permiso && !target.anyPermisos) return true;
    
    const hasRole = target.roles ? target.roles.includes(userRole) : false;
    const hasPermiso = target.permiso ? user?.permisos?.includes(target.permiso) : false;
    const hasAnyPermiso = target.anyPermisos ? target.anyPermisos.some(p => user?.permisos?.includes(p)) : false;
    
    return hasRole || hasPermiso || hasAnyPermiso;
};

export const NAV_GROUPS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/',
        permiso: 'acceso_dashboard',
        roles: ['ADMINISTRADOR', 'SUPER-ADMIN', 'ADMIN'],
        isDirect: true
    },
    {
        id: 'mantenimiento',
        label: 'Mantenimiento',
        icon: Wrench,
        items: [
            { icon: ClipboardList, label: 'Portal de Solicitudes', path: '/portal', permiso: 'acceso_portal' },
            { icon: ClipboardList, label: 'Órdenes de Trabajo', path: '/work-orders', permiso: 'work_orders_view' },
            { icon: Archive, label: 'Historial de OTs', path: '/work-orders/history', anyPermisos: ['work_orders_history', 'acceso_portal'] },
            { icon: Calendar, label: 'Planes de Mantenimiento', path: '/maintenance', permiso: 'maintenance_plan_view' },
            { icon: Archive, label: 'Historial de Mantenimiento', path: '/maintenance/history', permiso: 'maintenance_view' },
        ]
    },
    {
        id: 'logistica',
        label: 'Logística y Activos',
        icon: Box,
        items: [
            { icon: Box, label: 'Activos', path: '/assets', permiso: 'assets_view' },
            { icon: Box, label: 'Inventario', path: '/inventory', permiso: 'inventory_view' },
            { icon: Building2, label: 'Proveedores', path: '/providers', permiso: 'providers_view' },
            { icon: Wrench, label: 'Técnicos', path: '/technicians', permiso: 'techs_view' },
        ]
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: ShoppingCart,
        items: [
            { icon: FileText, label: 'Cotizaciones', path: '/purchases/quotes', permiso: 'quotes_view' },
            { icon: ShoppingCart, label: 'Órdenes de Compra', path: '/purchases', permiso: 'purchases_view' },
            { icon: FileText, label: 'Facturas de Compra', path: '/purchases/invoices', permiso: 'invoices_view' },
        ]
    },
    {
        id: 'configuracion',
        label: 'Configuración',
        icon: Settings,
        items: [
            { icon: Users, label: 'Usuarios', path: '/users', permiso: 'users_admin' },
            { icon: Shield, label: 'Roles y Permisos', path: '/roles', permiso: 'roles_view' },
            { icon: LayoutDashboard, label: 'Auditoría', path: '/audit', permiso: 'audit_view' },
            { icon: CalendarDays, label: 'Feriados', path: '/holidays', permiso: 'holidays_view' },
            { icon: FileText, label: 'Reportes', path: '/reports', permiso: 'reports_view' },
            { icon: Settings, label: 'Ajustes', path: '/settings', permiso: 'settings_view' },
        ]
    }
];

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [expandedGroups, setExpandedGroups] = useState({});


    // Auto-expand group based on current path
    useEffect(() => {
        const currentPath = location.pathname;
        const groupToExpand = NAV_GROUPS.find(group => 
            group.items?.some(item => 
                item.path === currentPath || 
                (item.path !== '/' && currentPath.startsWith(item.path))
            )
        );
        if (groupToExpand) {
            setExpandedGroups(prev => ({ ...prev, [groupToExpand.id]: true }));
        }
    }, [location.pathname]);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    const isVisible = (target) => isNavItemVisible(target, user);

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 
                flex flex-col h-[100dvh] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
                md:relative md:translate-x-0 
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'}
            `}
        >
            <div className="p-6 flex items-center justify-between md:justify-center border-b border-slate-200 dark:border-slate-800/50">
                <img src={logo} alt="Andros Logo" className="h-12 w-auto object-contain" />
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {NAV_GROUPS.map((group) => {
                    const visibleItems = group.items?.filter(isVisible) || [];
                    const groupVisible = group.isDirect ? isVisible(group) : visibleItems.length > 0;

                    if (!groupVisible) return null;

                    if (group.isDirect) {
                        return (
                            <NavLink
                                key={group.path}
                                to={group.path}
                                onClick={() => onClose && onClose()}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-1
                                    ${isActive 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                                `}
                            >
                                <group.icon className="w-4.5 h-4.5 flex-shrink-0" />
                                <span className="font-semibold text-sm">{group.label}</span>
                            </NavLink>
                        );
                    }

                    const isExpanded = expandedGroups[group.id];

                    return (
                        <div key={group.id} className="mb-2">
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={`
                                    w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200
                                    ${isExpanded ? 'text-blue-600 bg-blue-50/50 dark:bg-blue-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <group.icon className={`w-4.5 h-4.5 ${isExpanded ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span className={`text-sm font-bold tracking-tight uppercase ${isExpanded ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500'}`}>
                                        {group.label}
                                    </span>
                                </div>
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-500" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <div className="pl-4 space-y-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800">
                                    {visibleItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => onClose && onClose()}
                                            className={({ isActive }) => {
                                                let active = isActive;
                                                // Matches logic for specific modules
                                                if (item.path === '/purchases' && (location.pathname.startsWith('/purchases/invoices') || location.pathname.startsWith('/purchases/quotes'))) active = false;
                                                if (item.path === '/work-orders' && location.pathname.includes('/work-orders/history')) active = false;
                                                if (item.path === '/maintenance' && location.pathname.includes('/maintenance/history')) active = false;

                                                return `flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-xs font-medium ${active
                                                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`;
                                            }}
                                        >
                                            <item.icon className="w-3.5 h-3.5" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 pb-8 md:pb-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 text-sm font-medium"
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                        </>
                    ) : (
                        <>
                            <Moon className="w-4 h-4 text-indigo-500" /> Dark Mode
                        </>
                    )}
                </button>

                <button
                    onClick={logout}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group text-left border border-slate-200 dark:border-transparent"
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-md flex-shrink-0">
                        {user?.nombre?.[0]}{user?.apellido?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {user?.nombre} {user?.apellido}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{user?.cargo || 'Staff'}</p>
                    </div>
                    <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0" />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
