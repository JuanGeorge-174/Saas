'use client';

import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '@/app/actions/audit';
import { Shield, User, Clock, Filter, Search, ChevronRight } from 'lucide-react';

export default function AuditPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ moduleName: '', action: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogs(filters);
            if (res.success) setLogs(res.logs);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="text-[#b361ea]" size={32} />
                    System Audit Trail
                </h1>
                <p className="text-gray-400 mt-1">Immutable security logs for clinical compliance</p>
            </div>

            {/* Filters Area */}
            <div className="bg-[#1a1525] p-6 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Module</label>
                    <select
                        value={filters.moduleName}
                        onChange={(e) => setFilters({ ...filters, moduleName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#b361ea]/50 text-sm"
                    >
                        <option value="">All Modules</option>
                        <option value="PATIENTS">Patients</option>
                        <option value="APPOINTMENTS">Appointments</option>
                        <option value="REVENUE">Revenue</option>
                        <option value="CLINICAL">Clinical</option>
                    </select>
                </div>
                {/* Add more filters if needed */}
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Search Action</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="e.g. RECORDED, UPDATED..."
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#b361ea]/50 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Audit List */}
            <div className="bg-[#1a1525] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">Timestamp</th>
                                <th className="px-8 py-5">Actor</th>
                                <th className="px-8 py-5">Module / Action</th>
                                <th className="px-8 py-5 text-right">Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-8 py-8"><div className="h-4 bg-white/5 rounded w-1/3"></div></td>
                                    </tr>
                                ))
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/[0.02] transition group">
                                    <td className="px-8 py-6 text-sm text-gray-300">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs capitalize">
                                                {log.user[0]}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-bold">{log.user}</p>
                                                <p className="text-[10px] text-gray-500 uppercase font-black">{log.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[10px] font-black px-2 py-1 bg-[#b361ea]/10 text-[#b361ea] rounded mr-2 tracking-tighter uppercase">{log.module}</span>
                                        <span className="text-sm font-medium text-gray-200">{log.action}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="text-[10px] text-gray-500 font-medium">RES: {log.resource}</p>
                                        <p className="text-[10px] text-indigo-400 font-mono">ID: {log.resourceId?.slice(-8)}</p>
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
