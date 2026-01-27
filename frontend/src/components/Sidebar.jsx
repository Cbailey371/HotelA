import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, Settings, LogOut, Moon, Sun, Box, Calendar, ClipboardList, Building2, ShoppingCart } from 'lucide-react';
import logo from '../assets/andros_logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Box, label: 'Activos', path: '/assets' },
        { icon: Calendar, label: 'Mantenimiento', path: '/maintenance' },
        { icon: ClipboardList, label: 'Órdenes de Trabajo', path: '/work-orders' },
        { icon: ShoppingCart, label: 'Compras', path: '/purchases' },
        { icon: Box, label: 'Inventario', path: '/inventory' },
        { icon: Building2, label: 'Proveedores', path: '/providers' },
        { icon: Wrench, label: 'Técnicos', path: '/technicians' },
        { icon: Users, label: 'Usuarios', path: '/users', roles: ['ADMINISTRADOR', 'SUPER-ADMIN'] },
        { icon: LayoutDashboard, label: 'Auditoría', path: '/audit', roles: ['ADMINISTRADOR', 'SUPER-ADMIN'] },
        { icon: Settings, label: 'Configuración', path: '/settings' },
    ];

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role?.toUpperCase());
    });

    return (
        <aside className="w-64 bg-white dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="p-6 flex items-center justify-center border-b border-slate-200 dark:border-slate-800/50">
                <img src={logo} alt="Andros Logo" className="h-12 w-auto object-contain" />
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
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
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold uppercase shadow-md">
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
