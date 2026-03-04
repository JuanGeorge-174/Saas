'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Clock,
    UserPlus,
    CheckCircle2,
    AlertCircle,
    Phone,
    Calendar,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ReceptionDashboard() {
    const [data, setData] = useState({ metrics: {}, queue: [] });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const [metricsRes, apptRes] = await Promise.all([
                fetch('/api/dashboard/metrics'),
                fetch(`/api/dashboard/appointment?date=${today}&status=all`)
            ]);

            const metricsJson = await metricsRes.json();
            const apptsJson = await apptRes.json();

            if (metricsRes.ok) {
                setData({
                    metrics: metricsJson.metrics || {},
                    queue: Array.isArray(apptsJson) ? apptsJson : []
                });
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await (action === 'CHECK_IN'
                ? fetch('/api/dashboard/live-queue/arrive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'APPOINTMENT', appointmentId: id })
                })
                : fetch('/api/dashboard/queue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action })
                }));
            if (res.ok) {
                fetchDashboardData();
            }
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    if (loading && !data.queue.length) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>;
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Quick Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Front Desk</h1>
                    <p className="text-slate-500 font-medium">Manage Today's Arrivals</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/patients" className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <UserPlus size={18} className="text-indigo-600" /> Register Patient
                    </Link>
                    <Link href="/admin/appointments" className="px-6 py-3 bg-indigo-600 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20">
                        <Calendar size={18} /> New Appointment
                    </Link>
                </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Waiting Now</p>
                    <p className="text-4xl font-black text-indigo-600">
                        {data.queue.filter(q => q.status === 'ARRIVED').length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Visits</p>
                    <p className="text-4xl font-black text-emerald-600">{data.metrics.pendingToday || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Missed Today</p>
                    <p className="text-4xl font-black text-rose-600">{data.metrics.missedToday || 0}</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Current Time</p>
                    <p className="text-3xl font-black text-white">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Arrivals Queue */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900">Today's Queue</h2>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">Live Tracker</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                <th className="px-8 py-5">Arrival Status</th>
                                <th className="px-8 py-5">Patient Details</th>
                                <th className="px-8 py-5">Sch. Time</th>
                                <th className="px-8 py-5 text-right">Queue Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.queue.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center text-slate-300 italic">
                                        No appointments scheduled for today.
                                    </td>
                                </tr>
                            ) : data.queue.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-8 py-6">
                                        {item.status === 'ARRIVED' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-xs font-black text-emerald-600 uppercase">Arrived</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                <span className="text-xs font-black text-slate-400 uppercase">Wait Arrival</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                                {(item.patient || '?')[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{item.patient}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.patientId} • {item.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black text-slate-900">{item.time}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {item.status !== 'ARRIVED' ? (
                                            <button
                                                onClick={() => handleAction(item.id, 'CHECK_IN')}
                                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/10 active:scale-95"
                                            >
                                                Check In
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] font-black uppercase text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full">Checked In</span>
                                                <button
                                                    onClick={() => handleAction(item.id, 'MARK_NO_SHOW')}
                                                    className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                                    title="Cancel"
                                                >
                                                    <AlertCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
