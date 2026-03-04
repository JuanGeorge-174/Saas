"use client";
import { useState, useEffect } from 'react';
import { Shield, Building2, UserCircle, CheckCircle2, XCircle, Settings, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminPage() {
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

    useEffect(() => {
        fetchClinics();
    }, []);

    const fetchClinics = async () => {
        try {
            const res = await fetch('/api/super-admin/clinics');
            const data = await res.json();
            if (data.clinics) {
                setClinics(data.clinics);
                setStats({
                    total: data.clinics.length,
                    active: data.clinics.filter(c => c.isActive).length,
                    pending: data.clinics.filter(c => c.subscriptionStatus === 'TRIAL').length
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-indigo-500 w-10 h-10" />
                        System Overlord
                    </h1>
                    <p className="text-slate-400 mt-2 font-bold uppercase text-[11px] tracking-widest">Global Clinic Management</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl">
                        <span className="text-indigo-400 font-black text-sm uppercase tracking-widest">Root Access</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { label: 'Total Clinics', val: stats.total, icon: Building2, color: 'text-blue-400' },
                    { label: 'Active Licenses', val: stats.active, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Trial Mode', val: stats.pending, icon: Settings, color: 'text-amber-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <stat.icon className={`${stat.color} w-8 h-8`} />
                            <span className="text-slate-500 text-xs font-black uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-3xl font-black text-white">{stat.val}</div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                <div className="bg-white/5 border-b border-white/5 p-8 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight">Clinic Database</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-4">Clinic Name</th>
                                <th className="px-8 py-4">Admin</th>
                                <th className="px-8 py-4">Plan</th>
                                <th className="px-8 py-4">Users</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Created</th>
                                <th className="px-8 py-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {clinics.map((clinic) => (
                                <tr key={clinic._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="text-white font-bold">{clinic.clinicName}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{clinic.clinicSlug}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="text-slate-300 font-medium">{clinic.adminName}</div>
                                        <div className="text-[10px] text-slate-500">{clinic.email}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${clinic.subscriptionPlan === 'PRO' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {clinic.subscriptionPlan}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-white font-black">
                                            <Users size={14} className="text-slate-500" />
                                            {clinic.usage.userCount} / {clinic.limits.maxUsers}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {clinic.isActive ? (
                                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                                Active
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase tracking-widest">
                                                <XCircle size={14} />
                                                Suspended
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-slate-500 text-xs font-mono">
                                        {new Date(clinic.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group-hover:border-indigo-500/30">
                                            <Settings className="text-slate-500 group-hover:text-indigo-400 transition-colors" size={18} />
                                        </button>
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
