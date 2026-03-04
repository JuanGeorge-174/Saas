'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Clock, PlusCircle, Calendar as CalendarIcon, X, MoreVertical, Edit, Trash2, CheckCircle
} from 'lucide-react';

const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
        case 'SCHEDULED':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'ARRIVED':
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'MISSED':
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'CANCELLED':
            return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        default:
            return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    }
};

import { createAppointment, updateAppointmentStatus, getAppointments } from '@/app/actions/appointments';
import { getPatients } from '@/app/actions/patients';
import { useRouter } from 'next/navigation';

export default function AppointmentPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [form, setForm] = useState({
        patientMongoId: '',
        date: '',
        time: '',
        notes: '',
        status: 'SCHEDULED',
    });

    useEffect(() => {
        fetchAppointments();
    }, [filterStatus]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const result = await getAppointments(filterStatus === 'all' ? 'all' : filterStatus);
            if (result.success) {
                setAppointments(result.appointments);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleArrival = async (appointmentId) => {
        if (!confirm('Mark patient as arrived and add to queue?')) return;
        setProcessingId(appointmentId);
        try {
            const res = await fetch('/api/dashboard/live-queue/arrive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'APPOINTMENT', appointmentId: appointmentId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Arrival failed');

            alert('Patient arrived! Added to live queue.');
            fetchAppointments();
            router.refresh();
        } catch (err) {
            console.error('Arrival error:', err);
            alert(err.message || 'Arrival failed');
        } finally {
            setProcessingId(null);
        }
    };

    const searchPatients = async (term) => {
        if (term.length < 2) return;
        try {
            const res = await getPatients({ search: term });
            if (res.success) setPatients(res.patients);
        } catch (err) { console.error(err); }
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel this appointment?')) return;
        try {
            const res = await updateAppointmentStatus(id, 'CANCELLED');
            if (res.success) {
                fetchAppointments();
                router.refresh();
            }
        } catch (err) { console.error(err); }
    };

    const handleAddAppointment = async () => {
        try {
            const res = await createAppointment({
                patientId: form.patientMongoId,
                doctorId: null, // TODO: doctor selection
                date: form.date,
                time: form.time,
                notes: form.notes,
                visitReason: form.notes
            });
            if (res.success) {
                fetchAppointments();
                setForm({ patientMongoId: '', date: '', time: '', notes: '', status: 'SCHEDULED' });
                setShowModal(false);
                setPatients([]);
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Appointment Desk</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage schedules and patient arrivals</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#1a1525] text-white px-4 py-2 rounded-lg border border-white/10 outline-none focus:border-[#b361ea] transition"
                    >
                        <option value="all">All Statuses</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="ARRIVED">Arrived</option>
                        <option value="MISSED">Missed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#b361ea] hover:bg-[#9D3DD4] px-5 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <PlusCircle size={18} /> New Appointment
                    </button>
                </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-[#1a1525] rounded-xl border border-white/5 animate-pulse"></div>
                    ))
                ) : appointments.length === 0 ? (
                    <div className="bg-[#1a1525] rounded-xl p-16 text-center border border-white/5 border-dashed">
                        <CalendarIcon className="w-16 h-16 text-gray-700 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400">No appointments found for the selected filter.</p>
                    </div>
                ) : appointments.map((a) => (
                    <div
                        key={a.id}
                        className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[#1a1525] rounded-xl border border-white/5 hover:border-[#b361ea]/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-bold shadow-inner">
                                {a.patient ? a.patient[0] : '?'}
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-lg">{a.patient || 'Unknown Patient'}</h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} className="text-[#b361ea]" />
                                        {a.time}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CalendarIcon size={14} className="text-[#b361ea]" />
                                        {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <span className={`px-4 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(a.status)} uppercase tracking-wider`}>
                                {a.status}
                            </span>

                            {a.status === 'SCHEDULED' && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleArrival(a.id)}
                                        disabled={processingId === a.id}
                                        className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-2 rounded-lg hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 font-medium text-sm"
                                    >
                                        {processingId === a.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <CheckCircle size={18} />
                                        )}
                                        Arrived
                                    </button>

                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setForm({
                                                    id: a.id,
                                                    patientMongoId: a.patientMongoId,
                                                    date: new Date(a.date).toISOString().split('T')[0],
                                                    time: a.time,
                                                    notes: a.notes || '',
                                                    status: 'SCHEDULED'
                                                });
                                                setShowModal(true);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition"
                                            title="Reschedule"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleCancel(a.id)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition"
                                            title="Cancel Appointment"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-[#1f1b2d] rounded-xl p-6 w-[90%] max-w-md shadow-lg border border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-white text-lg font-semibold">Add Appointment</h2>
                                <button onClick={() => { setShowModal(false); setPatients([]); }}>
                                    <X className="text-white" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Patient Search */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search Patient..."
                                        onChange={(e) => searchPatients(e.target.value)}
                                        className="w-full p-2 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                    />
                                    {patients.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#2a2636] border border-white/10 rounded max-h-40 overflow-y-auto z-10">
                                            {patients.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => { setForm({ ...form, patientMongoId: p.id }); setPatients([]); }}
                                                    className="w-full p-2 text-left text-white hover:bg-[#b361ea]/20 transition"
                                                >
                                                    {p.fullName} - {p.patientId}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full p-2 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                                    className="w-full p-2 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    className="w-full p-2 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full p-2 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                >
                                    <option value="SCHEDULED">Scheduled</option>
                                </select>
                                <button
                                    onClick={handleAddAppointment}
                                    className="w-full bg-[#b361ea] hover:bg-[#9D3DD4] py-2 rounded text-white font-semibold transition-all"
                                >
                                    Save Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
