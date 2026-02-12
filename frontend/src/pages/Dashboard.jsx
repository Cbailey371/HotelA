import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Activity } from 'lucide-react';
import KPIsSection from '../components/dashboard/KPIsSection';
import CostChart from '../components/dashboard/CostChart';
import UpcomingMaintenanceList from '../components/dashboard/UpcomingMaintenanceList';
import MaintenanceCalendar from '../components/dashboard/MaintenanceCalendar';
import LowStockWidget from '../components/dashboard/LowStockWidget';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_assets: 0,
        active_maintenance: 0,
        pending_orders: 0,
        upcoming_events_7d: 0,
        monthly_costs: [],
        daily_costs: [],
        upcoming_maintenance: [],
        low_stock_items: 0,
        low_stock_details: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Panel de Control</h2>
                    <p className="text-slate-500 text-sm font-bold">Visión general en tiempo real</p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2 animate-pulse">
                        <Activity className="w-3.5 h-3.5" /> En línea
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <KPIsSection stats={stats} loading={loading} />

            {/* Charts & Lists Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[600px]">
                {/* Cost Chart (2 cols) */}
                <div className="lg:col-span-2 h-full">
                    <CostChart monthlyData={stats.monthly_costs} dailyData={stats.daily_costs} loading={loading} />
                </div>
                {/* Side Lists (1 col) */}
                <div className="h-full flex flex-col gap-6">
                    <div className="flex-1 min-h-[280px]">
                        <UpcomingMaintenanceList tasks={stats.upcoming_maintenance} loading={loading} />
                    </div>
                    <div className="flex-1 min-h-[280px]">
                        <LowStockWidget items={stats.low_stock_details || []} loading={loading} />
                    </div>
                </div>
            </div>

            {/* Calendar Row */}
            <div>
                <MaintenanceCalendar events={stats.calendar_events || []} />
            </div>
        </div>
    );
};

export default Dashboard;
