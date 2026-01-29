import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const CostChart = ({ monthlyData, dailyData, loading }) => {
    const [chartType, setChartType] = useState('area'); // 'area', 'bar', 'line'
    const [dataScope, setDataScope] = useState('daily'); // 'daily' or 'monthly'

    if (loading) return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse"></div>;

    const data = dataScope === 'daily' ? dailyData : monthlyData;
    const formatCurrency = (value) => `$${value?.toLocaleString()}`;

    return (
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Costos de Mantenimiento</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <button
                            onClick={() => setDataScope('daily')}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${dataScope === 'daily' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Mes Actual (Día)
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                            onClick={() => setDataScope('monthly')}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${dataScope === 'monthly' ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Semestre (Mes)
                        </button>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Barras
                    </button>
                    <button
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${chartType === 'area' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Área
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                <div className="absolute top-0 right-0 text-right z-10">
                    <p className="text-2xl font-black text-blue-600">
                        {data && data.length > 0 ? formatCurrency(data.reduce((acc, curr) => acc + curr.amount, 0)) : '$0'}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">Inversión Total</p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                formatter={(value) => [`$${value}`, 'Costo']}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAmount)"
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`$${value}`, 'Costo']}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CostChart;
