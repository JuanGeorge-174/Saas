'use client';

import React, { useState } from 'react';
import { X, Phone, Mail, FileText, Download, MapPin } from 'lucide-react';
import { registerPatient } from '@/app/actions/patients';
import { useRouter } from 'next/navigation';

export default function PatientModal({ isOpen, onClose, patient = null, role }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [creatingVisit, setCreatingVisit] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const isDetailView = !!patient?.id;

    const handleNewVisit = async () => {
        if (!patient?.id) return;
        if (!confirm('Create a new visit for this patient and add them to today’s queue?')) return;

        setCreatingVisit(true);
        setError(null);
        try {
            const res = await fetch('/api/dashboard/live-queue/arrive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'WALK_IN', patientId: patient.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to create visit');

            // Send staff to their operational dashboard
            if (role === 'RECEPTIONIST') router.push('/reception');
            else router.push('/admin');
            router.refresh();
            onClose();
        } catch (e) {
            setError(e.message || 'Failed to create visit');
        } finally {
            setCreatingVisit(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-[#120e1b] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(179,97,234,0.2)] flex flex-col">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            {patient?.fullName?.[0] || 'N'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">
                                {isDetailView ? patient.fullName : 'Register New Patient'}
                            </h2>
                            {isDetailView && (
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.2em] font-bold">
                                    ID: {patient.patientId} • {patient.gender} • {patient.age} years
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isDetailView ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Contact Info</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Phone size={14} className="text-[#b361ea]" /> {patient.contact?.phoneNumber || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-300">
                                            <Mail size={14} className="text-[#b361ea]" /> {patient.contact?.email || 'No email provided'}
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-gray-300">
                                            <MapPin size={14} className="text-[#b361ea] mt-1" /> {patient.address || 'No address provided'}
                                        </div>
                                    </div>
                                </div>
                                {(role === 'ADMIN' || role === 'DOCTOR') && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Medical Summary</h3>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Medical History</p>
                                                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{patient.medicalHistory || 'No recorded history'}</p>
                                            </div>
                                            <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Allergies</p>
                                                <p className="text-xs text-rose-200 whitespace-pre-wrap">{patient.allergies || 'NONE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                    Clinical Visit Timeline
                                    <span className="text-[#b361ea]">RESTRICTED ACCESS</span>
                                </h3>
                                <p className="text-gray-500 italic text-sm py-10 text-center border border-dashed border-white/5 rounded-3xl">
                                    Visit history and notes are managed in the Clinical module.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-white">Registration form would go here, linking to the <code>registerPatient</code> Server Action.</p>
                    )}
                </div>

                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <div className="flex items-center gap-3">
                        {isDetailView && (role === 'ADMIN' || role === 'RECEPTIONIST') && (
                            <button
                                onClick={handleNewVisit}
                                disabled={creatingVisit}
                                className="px-6 py-3 bg-[#b361ea] hover:bg-[#9D3DD4] text-white font-black text-xs uppercase tracking-widest rounded-xl transition disabled:opacity-60"
                            >
                                {creatingVisit ? 'Creating…' : 'New Visit'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
