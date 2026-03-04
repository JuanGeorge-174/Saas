'use client';

import { useState, useEffect } from 'react';
import {
    Clock,
    User,
    FileText,
    Upload,
    CheckCircle2,
    History,
    FileImage,
    AlertCircle,
    ChevronRight,
    Save,
    Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorDashboard() {
    const [queue, setQueue] = useState([]);
    const [activeVisit, setActiveVisit] = useState(null);
    const [notes, setNotes] = useState({ chiefComplaint: '', diagnosis: '', treatment: '', prescription: '', doctorNotes: '' });
    const [loading, setLoading] = useState(true);
    const [clinic, setClinic] = useState(null);

    useEffect(() => {
        fetchQueue();
        fetchClinic();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/metrics');
            const result = await res.json();
            if (res.ok) setQueue(result.queue || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const fetchClinic = async () => {
        try {
            const res = await fetch('/api/dashboard/clinic');
            const data = await res.json();
            if (res.ok) setClinic(data.clinic);
        } catch (err) { console.error(err); }
    };

    const isFeatureAllowed = (feature) => {
        if (!clinic) return true; // Default to true while loading
        const plan = clinic.subscription.plan;
        const features = {
            'FREE': ['BASIC_DASHBOARD', 'PATIENT_LIST'],
            'BASIC': ['BASIC_DASHBOARD', 'PATIENT_LIST', 'APPOINTMENTS'],
            'PRO': ['BASIC_DASHBOARD', 'PATIENT_LIST', 'APPOINTMENTS', 'FILE_UPLOAD', 'REVENUE_ANALYTICS'],
            'ENTERPRISE': ['BASIC_DASHBOARD', 'PATIENT_LIST', 'APPOINTMENTS', 'FILE_UPLOAD', 'REVENUE_ANALYTICS', 'MULTI_BRANCH']
        };
        return features[plan]?.includes(feature) || false;
    };

    const startVisit = async (id) => {
        try {
            const appointment = queue.find(q => q.id === id);
            const res = await fetch('/api/dashboard/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'CONVERT_TO_VISIT' })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveVisit({
                    id: data.visitId,
                    patientId: appointment.patientId,
                    name: appointment.name,
                    patientMongoId: appointment.patientMongoId
                });
                setNotes({ chiefComplaint: '', diagnosis: '', treatment: '', prescription: '', doctorNotes: '' });
            }
        } catch (error) { console.error(error); }
    };

    const saveVisit = async (complete = false) => {
        if (!activeVisit) return;
        try {
            const res = await fetch(`/api/dashboard/visits/${activeVisit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...notes, status: complete ? 'COMPLETED' : 'IN_PROGRESS' })
            });
            if (res.ok) {
                if (complete) {
                    setActiveVisit(null);
                    fetchQueue();
                } else {
                    alert('Draft Saved Successfully');
                }
            }
        } catch (error) { console.error(error); }
    };

    if (activeVisit) {
        return (
            <div className="space-y-8 max-w-6xl mx-auto pb-20">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                        <User size={120} />
                    </div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black text-white border border-white/20">
                            {activeVisit.name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{activeVisit.name}</h1>
                            <p className="text-indigo-300 font-bold uppercase text-[11px] tracking-widest mt-1">Consultation in Progress • {activeVisit.patientId}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <button onClick={() => saveVisit(false)} className="px-6 py-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
                            <Save size={18} /> Save Draft
                        </button>
                        <button onClick={() => saveVisit(true)} className="px-8 py-4 bg-emerald-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-xl shadow-emerald-500/20 text-slate-900">
                            <CheckCircle2 size={18} /> Finish Visit
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><FileText size={20} /></div>
                                <h2 className="text-xl font-black text-slate-900">Clinical Assessment</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <Field label="Chief Complaint" value={notes.chiefComplaint} onChange={v => setNotes({ ...notes, chiefComplaint: v })} />
                                <Field label="Diagnosis" value={notes.diagnosis} onChange={v => setNotes({ ...notes, diagnosis: v })} />
                                <Field label="Treatment Summary" value={notes.treatment} onChange={v => setNotes({ ...notes, treatment: v })} rows={4} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><History size={20} /></div>
                                <h2 className="text-xl font-black text-slate-900">Prescription</h2>
                            </div>
                            <textarea
                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-mono text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                rows={8}
                                placeholder="Rx: Amoxicillin 500mg tid x 7 days..."
                                value={notes.prescription}
                                onChange={e => setNotes({ ...notes, prescription: e.target.value })}
                            />
                        </div>

                        <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-200 border-dashed space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Attachments</h3>
                                {!isFeatureAllowed('FILE_UPLOAD') && (
                                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 flex items-center gap-1">
                                        <Lock size={10} /> PRO FEATURE
                                    </span>
                                )}
                            </div>

                            <div className={`relative group cursor-pointer ${!isFeatureAllowed('FILE_UPLOAD') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                                <div className="border-2 border-dashed border-slate-300 rounded-[32px] p-10 text-center hover:border-indigo-500 transition-colors bg-white">
                                    <Upload className="mx-auto text-slate-400 mb-4 group-hover:text-indigo-500 group-hover:scale-110 transition-all" size={32} />
                                    <p className="text-sm font-bold text-slate-900">Upload Radiographs</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">X-Rays, Reports (Max 5MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Doctor's Console</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">Today's Active Consultations</p>
                </div>
                <button onClick={fetchQueue} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-slate-100 shadow-sm transition-all hover:rotate-180">
                    <History size={20} />
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {queue.filter(q => q.status === 'CHECKED_IN').length === 0 ? (
                    <div className="col-span-full py-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                            <Clock size={40} className="text-slate-200" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Queue is Clear</h2>
                        <p className="text-slate-500 mt-2">No patients are currently checked in and waiting.</p>
                    </div>
                ) : queue.filter(q => q.status === 'CHECKED_IN').map((item) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        key={item.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -mt-4 -mr-4">
                            <Stethoscope size={80} />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                                {item.name[0]}
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 leading-none">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.patientId}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-2"><Clock size={14} className="text-indigo-400" /> Arrived {item.time}</span>
                                <span className="flex items-center gap-2 tracking-widest">{item.age}Y • {item.sex[0]}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => startVisit(item.id)}
                            className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-600 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                        >
                            Start Consultation <ChevronRight size={18} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function Field({ label, value, onChange, rows = 2 }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
            <textarea
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl font-medium focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                rows={rows}
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    );
}

function Stethoscope({ size, className }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3Z" /><path d="M10 2a2 2 0 1 0-4 0" /><path d="M12 14a6 6 0 1 0-12 0" /><path d="M10 2a2 2 0 1 1-4 0" /><path d="M8 4v6" /><path d="M17 14h-4" /><path d="M21 14h-4" /><path d="m14.5 16 1.5 1.5-1.5 1.5" /><path d="M5.5 16s0-1.5 1.5-1.5h1.5l1.5 1.5" /></svg>;
}
