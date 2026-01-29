import React from 'react';
import { Wrench, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpcomingMaintenanceList = ({ tasks, loading }) => {
    const navigate = useNavigate();

    const getPriorityColor = (p) => {
        switch (p?.toLowerCase()) {
            case 'alta': return 'bg-red-50 text-red-600 border-red-100';
            case 'media': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    const getTypeIcon = (type) => {
        // Simplified mapping
        return <Wrench className="w-4 h-4" />;
    };

    return (
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Próximos Mantenimientos</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agenda prioritaria</p>
                </div>
                <button
                    onClick={() => navigate('/maintenance')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                >
                    Ver todo
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>)
                ) : tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getPriorityColor(task.priority)}`}>
                                {getTypeIcon(task.type_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{task.title}</h4>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {new Date(task.date).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 09:00 AM
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                                    {task.priority || 'Normal'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">No hay tareas próximas.</div>
                )}
            </div>
        </div>
    );
};

export default UpcomingMaintenanceList;
