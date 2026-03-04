'use client';

import React, { useState, useEffect } from 'react';
import {
    Stethoscope,
    Plus,
    Search,
    ChevronRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    ClipboardList,
    Layers,
    X,
    Trash2,
    DollarSign,
    Milestone,
    Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getPriorityColor = (priority) => {
    switch (priority) {
        case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
        case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-100';
        case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
};

export default function TreatmentPlanPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [patients, setPatients] = useState([]);

    // Create/Edit form state
    const [form, setForm] = useState({
        patientMongoId: '',
        title: '',
        description: '',
        procedures: []
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/treatment-plans');
            const data = await res.json();
            if (res.ok) setPlans(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const searchPatients = async (term) => {
        if (term.length < 2) return;
        try {
            const res = await fetch(`/api/dashboard/patient?search=${term}`);
            const data = await res.json();
            if (data.patients) setPatients(data.patients);
        } catch (err) { console.error(err); }
    };

    const addProcedure = () => {
        setForm({
            ...form,
            procedures: [...form.procedures, { toothNumber: '', procedureName: '', priority: 'MEDIUM', estimatedCost: '', status: 'PLANNED' }]
        });
    };

    const removeProcedure = (index) => {
        const updated = [...form.procedures];
        updated.splice(index, 1);
        setForm({ ...form, procedures: updated });
    };

    const updateProcedure = (index, field, value) => {
        const updated = [...form.procedures];
        updated[index][field] = value;
        setForm({ ...form, procedures: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/treatment-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                fetchPlans();
                setForm({ patientMongoId: '', title: '', description: '', procedures: [] });
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Case Planning</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">Advanced Clinical Orchestration</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 font-black flex items-center gap-3 transition-all active:scale-95"
                >
                    <Plus size={20} /> New Plan
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {loading && plans.length === 0 ? (
                    Array(3).fill(0).map((_, i) => <div key={i} className="h-40 bg-slate-50 animate-pulse rounded-[40px]"></div>)
                ) : plans.length === 0 ? (
                    <div className="py-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                            <ClipboardList size={40} className="text-slate-200" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">No active plans</h2>
                        <p className="text-slate-500 mt-2">Start a new clinical case to track complex treatments.</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            key={plan.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group lg:flex items-center justify-between gap-10"
                        >
                            <div className="flex items-center gap-6 mb-6 lg:mb-0 lg:flex-1">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                                    {plan.patientName[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">{plan.title}</h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">{plan.patientName}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.procedures?.length || 0} Procedures</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-8 lg:flex-none">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Est. Cost</p>
                                    <p className="text-lg font-black text-slate-900">₹{plan.totalCost.toLocaleString()}</p>
                                </div>

                                <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl tracking-[0.2em]">
                                    {plan.status}
                                </span>

                                <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-3xl bg-white rounded-[50px] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="bg-indigo-900 p-10 text-white relative">
                                <Target className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none" size={160} />
                                <h2 className="text-3xl font-black tracking-tight">Generate Treatment Plan</h2>
                                <p className="text-indigo-300 font-bold uppercase text-[11px] tracking-widest mt-2">Clinical Case Designer</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-8">
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Assign Patient</label>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                required
                                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold placeholder:text-slate-300"
                                                placeholder="Resident search..."
                                                onChange={(e) => searchPatients(e.target.value)}
                                            />
                                        </div>
                                        {patients.length > 0 && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 max-h-48 overflow-y-auto">
                                                {patients.map(p => (
                                                    <button
                                                        key={p.id} type="button"
                                                        onClick={() => { setForm({ ...form, patientMongoId: p.id }); setPatients([]); }}
                                                        className={`w-full p-4 flex items-center justify-between hover:bg-indigo-50 transition-colors ${form.patientMongoId === p.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                                    >
                                                        <span className="font-black text-sm text-slate-900">{p.fullName}</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">{p.patientId}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <input
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-black text-lg text-slate-900 placeholder:text-slate-300"
                                            placeholder="Plan Title (e.g., Full Mouth Rehabilitation)"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                        />
                                        <textarea
                                            rows="2"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-600"
                                            placeholder="Plan objective or case notes..."
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedural Sequence</h3>
                                            <button
                                                type="button" onClick={addProcedure}
                                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                                            >
                                                <Plus size={12} /> Add Procedure
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {form.procedures.map((proc, idx) => (
                                                <div key={idx} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 relative group/proc">
                                                    <button
                                                        type="button" onClick={() => removeProcedure(idx)}
                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white text-rose-500 rounded-full border border-slate-100 flex items-center justify-center shadow-lg opacity-0 group-hover/proc:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="md:col-span-2">
                                                            <input
                                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-bold text-sm"
                                                                placeholder="Procedure Name"
                                                                value={proc.procedureName}
                                                                onChange={e => updateProcedure(idx, 'procedureName', e.target.value)}
                                                            />
                                                        </div>
                                                        <input
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-bold text-sm"
                                                            placeholder="Tooth #"
                                                            value={proc.toothNumber}
                                                            onChange={e => updateProcedure(idx, 'toothNumber', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-bold text-sm text-emerald-600"
                                                            placeholder="Amount"
                                                            value={proc.estimatedCost}
                                                            onChange={e => updateProcedure(idx, 'estimatedCost', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button" onClick={() => setShowModal(false)}
                                        className="flex-1 py-5 bg-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-widest rounded-2xl hover:bg-slate-200"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
                                    >
                                        Activate Plan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
