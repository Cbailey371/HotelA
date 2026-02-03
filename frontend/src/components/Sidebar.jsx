import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, Settings, LogOut, Moon, Sun, Box, Calendar, ClipboardList, Building2, ShoppingCart, Shield, FileText } from 'lucide-react';
import logo from '../assets/andros_logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Box, label: 'Activos', path: '/assets' },
        { icon: Calendar, label: 'Mantenimiento', path: '/maintenance' },
        { icon: ClipboardList, label: 'Órdenes de Trabajo', path: '/work-orders' },
        { icon: ShoppingCart, label: 'Órdenes de Compra', path: '/purchases' },
        { icon: Box, label: 'Inventario', path: '/inventory' },
        { icon: Building2, label: 'Proveedores', path: '/providers' },
        { icon: Wrench, label: 'Técnicos', path: '/technicians' },
        { icon: FileText, label: 'Reportes', path: '/reports' },
        { icon: Users, label: 'Usuarios', path: '/users', roles: ['ADMINISTRADOR', 'SUPER-ADMIN'] },
        { icon: Shield, label: 'Roles y Permisos', path: '/roles', roles: ['ADMINISTRADOR', 'SUPER-ADMIN'] },
        { icon: LayoutDashboard, label: 'Auditoría', path: '/audit', roles: ['ADMINISTRADOR', 'SUPER-ADMIN'] },
        { icon: Settings, label: 'Configuración', path: '/settings' },
    ];

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role?.toUpperCase());
    });

    return (
        <aside
            className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 
                flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
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

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => onClose && onClose()}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
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
