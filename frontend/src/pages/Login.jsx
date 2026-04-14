import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Sun, Moon } from 'lucide-react';
import logo from '../assets/andros_logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError('Credenciales inválidas. Por favor intente nuevamente.');
        }
    };

    return (
        <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4 transition-colors duration-300 relative">
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-lg shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all"
                title="Cambiar Tema"
            >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl transition-colors duration-300">
                <div className="text-center mb-8">
                    <img src={logo} alt="Andros Logo" className="h-24 mx-auto mb-4 object-contain" />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Bienvenido a Andros</h1>
                    <p className="text-slate-500 dark:text-slate-400">Ingrese sus credenciales para continuar</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-2">Usuario</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="admin"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-2">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/30 dark:shadow-blue-900/20"
                    >
                        Iniciar Sesión
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
