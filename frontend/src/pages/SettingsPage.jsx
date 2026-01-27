import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, Bell, Database, Lock, Palette } from 'lucide-react';

const SettingsPage = () => {
    const sections = [
        {
            title: 'Seguridad y Acceso',
            items: [
                {
                    icon: Users,
                    label: 'Gestión de Usuarios',
                    desc: 'Administra cuentas, roles y permisos del sistema.',
                    path: '/users',
                    color: 'text-blue-600',
                    bg: 'bg-blue-100 dark:bg-blue-500/10'
                },
                {
                    icon: Shield,
                    label: 'Registro de Auditoría',
                    desc: 'Consulta el historial de acciones realizadas por los usuarios.',
                    path: '/audit',
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-100 dark:bg-indigo-500/10'
                },
                {
                    icon: Lock,
                    label: 'Mi Perfil / Contraseña',
                    desc: 'Actualiza tus datos y cambia tu clave de acceso.',
                    path: '#',
                    color: 'text-amber-600',
                    bg: 'bg-amber-100 dark:bg-amber-500/10'
                }
            ]
        },
        {
            title: 'Sistema',
            items: [
                {
                    icon: Database,
                    label: 'Base de Datos',
                    desc: 'Mantenimiento y respaldos (Próximamente).',
                    path: '#',
                    color: 'text-slate-600',
                    bg: 'bg-slate-100 dark:bg-slate-500/10'
                },
                {
                    icon: Palette,
                    label: 'Apariencia',
                    desc: 'Personaliza colores y logos del sistema.',
                    path: '#',
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-100 dark:bg-emerald-500/10'
                }
            ]
        }
    ];

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Configuración General</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Panel de administración y preferencias del sistema</p>
            </div>

            <div className="space-y-12">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">{section.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {section.items.map((item, itemIdx) => (
                                <Link
                                    key={itemIdx}
                                    to={item.path}
                                    className="group flex items-start gap-5 p-6 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                                >
                                    <div className={`p-4 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.label}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsPage;
