import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#020617] font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-blue-500 selection:text-white transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
