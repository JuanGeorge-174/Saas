'use client';

import { useState, useEffect } from 'react';
import {
    RefreshCcw,
    Bell,
    Calendar,
    Phone,
    ArrowRight,
    CheckCircle,
    User,
    Mail,
    Clock,
    AlertCircle,
    MessageSquare,
    ChevronRight,
    Moon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecallPage() {
    const [recalls, setRecalls] = useState({ due: [], hygiene: [], missed: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecalls();
    }, []);

    const fetchRecalls = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/recalls');
            const data = await res.json();
            if (res.ok) {
                setRecalls({
                    due: Array.isArray(data.due) ? data.due : [],
                    hygiene: Array.isArray(data.hygiene) ? data.hygiene : [],
                    missed: Array.isArray(data.missed) ? data.missed : []
                });
            }
        } catch (error) {
            console.error('Failed to fetch recalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (patientId, action) => {
        try {
            const res = await fetch('/api/dashboard/recalls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, action })
            });
            if (res.ok) fetchRecalls();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-10 pb-20 scroll-smooth">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Recall Engine</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">Growth & Patient Retention</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Live Tracking
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Missed Appointments (Newest priority) */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm w-fit">
                        <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-lg shadow-amber-600/20"><AlertCircle size={20} /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-none">Missed Apps</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recent No-Shows</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading && recalls.missed.length === 0 ? (
                            <div className="h-24 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>
                        ) : recalls.missed.length === 0 ? (
                            <div className="bg-amber-50/50 p-16 rounded-[3rem] border-2 border-dashed border-amber-100 text-center flex flex-col items-center">
                                <CheckCircle className="text-amber-200 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-900">Zero No-shows</h3>
                                <p className="text-slate-500 text-sm mt-1">All patients attended recently.</p>
                            </div>
                        ) : (
                            recalls.missed.map((p) => (
                                <RecallCard key={p.id} p={p} icon={<AlertCircle size={14} />} color="text-amber-600" onAction={handleAction} />
                            ))
                        )}
                    </div>
                </div>

                {/* Manual Recalls */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm w-fit">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20"><Bell size={20} /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-none">Due Recalls</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Follow-ups Required</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading && recalls.due.length === 0 ? (
                            <div className="h-24 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>
                        ) : recalls.due.length === 0 ? (
                            <div className="bg-indigo-50/50 p-16 rounded-[3rem] border-2 border-dashed border-indigo-100 text-center flex flex-col items-center">
                                <CheckCircle className="text-indigo-200 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-900">Inbox Zero</h3>
                                <p className="text-slate-500 text-sm mt-1">All scheduled recalls are up to date.</p>
                            </div>
                        ) : (
                            recalls.due.map((p) => (
                                <RecallCard key={p.id} p={p} icon={<Calendar size={14} />} color="text-indigo-600" onAction={handleAction} />
                            ))
                        )}
                    </div>
                </div>

                {/* Hygiene Alerts (6 months) */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm w-fit">
                        <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-600/20"><RefreshCcw size={20} /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-none">Dormant Alerts</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inactive {'>'} 6 Months</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading && recalls.hygiene.length === 0 ? (
                            <div className="h-24 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>
                        ) : recalls.hygiene.length === 0 ? (
                            <div className="bg-rose-50/50 p-16 rounded-[3rem] border-2 border-dashed border-rose-100 text-center flex flex-col items-center">
                                <User className="text-rose-200 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-900">Steady Retention</h3>
                                <p className="text-slate-500 text-sm mt-1">All active patients have visited recently.</p>
                            </div>
                        ) : (
                            recalls.hygiene.map((p) => (
                                <RecallCard key={p.id} p={p} icon={<Clock size={14} />} color="text-rose-600" showLastVisit={true} onAction={handleAction} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function RecallCard({ p, icon, color, showLastVisit, onAction }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl group transition-all"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                        {p.name[0]}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.patientId}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[10px] font-black text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Phone size={10} /> {p.phone}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 mb-1 ${color}`}>
                        {icon} {showLastVisit ? 'Last Appointment' : 'Next Scheduled'}
                    </span>
                    <p className="text-sm font-black text-slate-900">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-50 pt-6">
                <div className="flex items-center gap-2">
                    {p.lastContacted && (
                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <MessageSquare size={12} />
                            Last Contact: {new Date(p.lastContacted).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onAction(p.id, 'SNOOZE')}
                        className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 rounded-xl transition-all"
                    >
                        <Moon size={14} /> Snooze
                    </button>
                    <button
                        onClick={() => onAction(p.id, 'MARK_CONTACTED')}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                    >
                        <CheckCircle size={14} /> Mark Contacted
                    </button>
                    <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
