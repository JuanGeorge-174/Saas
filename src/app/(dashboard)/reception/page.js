'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Users,
    Calendar,
    DollarSign,
    Clock,
    User,
    Download,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    UserCheck,
    BriefcaseMedical,
    ExternalLink,
    Stethoscope,
    FileText,
    Save,
    X,
    Upload,
    Paperclip,
    Trash2,
    Activity,
    ChevronLeft,
    ChevronRight,
    Printer
} from 'lucide-react';
import { getSystemHealth } from '@/app/actions/health';
import { saveClinicalNotes } from '@/app/actions/clinical';
import { updateAppointmentDoctor } from '@/app/actions/appointments';

/**
 * PRODUCTION DASHBOARD (OPERATIONAL VIEW)
 * 
 * Derived from VISITS and APPOINTMENTS.
 * Features Real-time Queue and Live Operational Metrics.
 */

const MetricCard = ({ title, value, icon: Icon, colorClass, desc, href }) => {
    const Inner = (
        <div className={`bg-[#1a1525] rounded-xl p-6 border border-white/10 transition-all ${href ? 'hover:border-[#b361ea]/50 cursor-pointer' : 'hover:border-[#b361ea]/50'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
    return href ? <Link href={href} className="block">{Inner}</Link> : Inner;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState({ visitedToday: 0, pendingToday: 0, missedToday: 0, newPatientsToday: 0 });
    const [queue, setQueue] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    const [treatingVisit, setTreatingVisit] = useState(null);
    const [pastNotes, setPastNotes] = useState([]);
    const [currentNotePage, setCurrentNotePage] = useState(0);
    const [showTreatModal, setShowTreatModal] = useState(false);
    const [noteOnlyMode, setNoteOnlyMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchOperationalData = useCallback(async () => {
        try {
            const [metricsRes, queueRes, healthData, usersRes] = await Promise.all([
                fetch('/api/dashboard/metrics', { cache: 'no-store' }),
                fetch('/api/dashboard/live-queue', { cache: 'no-store' }),
                getSystemHealth(),
                fetch('/api/dashboard/users', { cache: 'no-store' })
            ]);

            if (metricsRes.ok && queueRes.ok) {
                const metrics = await metricsRes.json();
                const queueData = await queueRes.json();
                setStats(metrics.metrics);
                setQueue(queueData.queue);
            }

            if (healthData.success) {
                setHealth(healthData.stats);
            }

            if (usersRes.ok) {
                const usersData = await usersRes.json();
                if (usersData.users) {
                    setDoctors(usersData.users.filter(u => u.role === 'DOCTOR'));
                }
            }
        } catch (error) {
            console.error('Operational Refresh Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and polling every 30 seconds (Rule 2)
    useEffect(() => {
        fetchOperationalData();
        const interval = setInterval(fetchOperationalData, 30000);
        return () => clearInterval(interval);
    }, [fetchOperationalData]);

    const handleStartTreatment = async (visitId, mode = 'full') => {
        try {
            const res = await fetch(`/api/dashboard/visit/${visitId}`);
            if (res.ok) {
                const data = await res.json();
                
                // Fetch past history
                let history = [];
                try {
                    const histRes = await fetch(`/api/dashboard/patient/${data.patientId._id}/history`);
                    if (histRes.ok) {
                        const histData = await histRes.json();
                        history = (histData.visits || []).filter(v => v._id !== visitId).reverse(); 
                    }
                } catch (err) {
                    console.error('History Fetch Error:', err);
                }
                setPastNotes(history);
                setCurrentNotePage(history.length);

                // If opened from "Note", retain existing notes or start blank
                if (mode === 'note') {
                    setTreatingVisit({
                        ...data,
                        prescription: data.prescription || '',
                        doctorNotes: data.doctorNotes || ''
                    });
                    setNoteOnlyMode(true);
                } else {
                    setTreatingVisit(data);
                    setNoteOnlyMode(false);
                }
                setShowTreatModal(true);
                // Automatically move to IN_PROGRESS if WAITING
                if (data.status === 'WAITING') {
                    await fetch(`/api/dashboard/visit/${visitId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'IN_PROGRESS' })
                    });
                }
            }
        } catch (error) {
            console.error('Fetch Visit Error:', error);
        }
    };

    const handleSaveTreatment = async (finalStatus = null) => {
        if (!treatingVisit || saving) return;
        setSaving(true);
        try {
            const res = await saveClinicalNotes(treatingVisit._id, {
                chiefComplaint: treatingVisit.chiefComplaint,
                diagnosis: treatingVisit.diagnosis,
                treatment: treatingVisit.treatment,
                prescription: treatingVisit.prescription,
                doctorNotes: treatingVisit.doctorNotes
            });

            if (res.success) {
                if (finalStatus) {
                    // Update visit status if completing
                    await fetch(`/api/dashboard/visit/${treatingVisit._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: finalStatus })
                    });
                }
                if (finalStatus || noteOnlyMode) setShowTreatModal(false);
                fetchOperationalData();
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error('Save Error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !treatingVisit) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', treatingVisit.patientId._id);
        formData.append('visitId', treatingVisit._id);
        formData.append('category', 'XRAY'); // For now default to XRAY, can add a dropdown

        try {
            const res = await fetch('/api/dashboard/files/upload', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                // Refresh visit data to show new file
                const refreshRes = await fetch(`/api/dashboard/visit/${treatingVisit._id}`);
                if (refreshRes.ok) {
                    const updatedVisit = await refreshRes.json();
                    setTreatingVisit(updatedVisit);
                }
            }
        } catch (error) {
            console.error('File Upload Error:', error);
        } finally {
            setUploading(false);
        }
    };

    const getWaitColor = (color) => {
        switch (color) {
            case 'purple':
                return 'text-[#b361ea] bg-[#b361ea]/10 border-[#b361ea]/20';
            case 'green':
            default:
                return 'text-green-400 bg-green-400/10 border-green-400/20';
        }
    };

    const getPointerColorClass = (color) => {
        return color === 'green' ? 'bg-green-400' : 'bg-[#b361ea]';
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Operational Hub</h1>
                    <p className="text-gray-400 mt-1">
                        Live updates for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/reception/appointments" className="px-4 py-2 bg-[#b361ea] hover:bg-[#9D3DD4] text-white rounded-lg flex items-center gap-2 transition shadow-lg">
                        <Calendar size={18} />
                        Appointments
                    </Link>
                </div>
            </div>

            {/* SYSTEM HEALTH BANNER (DIAGNOSTIC) */}
            {health && (
                <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${health.patients > 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                    <div className="flex items-center gap-3">
                        <Activity className={health.patients > 0 ? 'text-green-400' : 'text-rose-400'} size={20} />
                        <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">System Status: {health.patients > 0 ? 'Operational' : 'Diagnostic Required'}</p>
                            <p className="text-xs text-gray-500">Clinic: {health.clinicId} • {health.patients} Patients Found in DB</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP METRIC CARDS (REAL-TIME) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Patients Visited Today"
                    value={stats.visitedToday}
                    icon={UserCheck}
                    colorClass="text-green-400 bg-green-400/10"
                    desc="Currently in clinic or exited"
                    href="/reception/patients"
                />
                <MetricCard
                    title="Pending Appointments"
                    value={stats.pendingToday}
                    icon={Clock}
                    colorClass="text-blue-400 bg-blue-400/10"
                    desc="Scheduled for today"
                    href="/reception/appointments"
                />
                <MetricCard
                    title="Missed Appointments"
                    value={stats.missedToday}
                    icon={AlertCircle}
                    colorClass="text-red-400 bg-red-400/10"
                    desc="Auto-marked after 15m delay"
                    href="/reception/recalls"
                />
            </div>

            {/* LIVE QUEUE (CORE FEATURE) */}
            <div className="bg-[#1a1525] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-transparent to-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="text-[#b361ea]" size={20} />
                            Live Patient Queue
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Sorted by Arrival Time (Live Tracker)</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchOperationalData} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400">
                            <TrendingUp size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-gray-400 text-sm font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Patient Details</th>
                                <th className="px-6 py-4">Arrival</th>
                                <th className="px-6 py-4 text-center">Wait Time</th>
                                <th className="px-6 py-4 text-center">Visit Status</th>
                                <th className="px-6 py-4 text-center">Prescription</th>
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {queue.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${item.isAppointment ? 'bg-slate-400' :
                                                item.status === 'IN_PROGRESS' ? 'bg-indigo-400' : 'bg-[#b361ea]'
                                                }`} />
                                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-gray-300">
                                                {item.isAppointment ? (item.status === 'MISSED' ? 'MISSED' : 'SCHEDULED') : item.status === 'WAITING' ? 'QUEUED' : 'VISITED'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${getPointerColorClass(item.color)}`} />
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-bold">
                                                {item.patient.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium group-hover:text-[#b361ea] transition">{item.patient.name}</p>
                                                <p className="text-xs text-gray-500">#{item.patient.id} • {item.patient.age}y {item.patient.sex}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 text-sm">
                                        {new Date(item.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <div className="text-[10px] text-gray-500">{item.visitType}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm whitespace-nowrap ${item.isAppointment ? 'text-slate-400 bg-slate-400/10 border-slate-400/20' : getWaitColor(item.color)
                                            }`}>
                                            {item.isAppointment ? 'Upcoming' : `${item.waitingTime}m wait`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <div className="flex justify-center items-center">
                                            <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded flex items-center gap-1 ${item.status === 'IN_PROGRESS' || item.doctorSigned ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-400'}`}>
                                                {item.status === 'IN_PROGRESS' || item.doctorSigned ? 'Visited' : 'Waiting'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                let visitId = item.id;
                                                if (item.isAppointment) {
                                                    const arrRes = await fetch('/api/dashboard/live-queue/arrive', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ type: 'APPOINTMENT', appointmentId: item.appointmentId })
                                                    });
                                                    const arrData = await arrRes.json();
                                                    if(arrData.success) visitId = arrData.visitId;
                                                    else return;
                                                }
                                                handleStartTreatment(visitId, 'note');
                                            }}
                                            className="px-4 py-2 text-xs font-bold rounded-md bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition cursor-pointer relative z-10 flex items-center gap-2 mx-auto"
                                        >
                                            <FileText size={14} className="text-[#b361ea]" />
                                            Note
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-300 flex items-center gap-2">
                                            <BriefcaseMedical size={14} className="text-[#b361ea] shrink-0" />
                                            {item.doctor === 'Unassigned' ? (
                                                <select 
                                                    className="bg-black/20 border border-[#b361ea]/30 rounded-md px-2 py-1.5 outline-none focus:border-[#b361ea] text-xs text-gray-300 w-full hover:bg-white/5 cursor-pointer"
                                                    value=""
                                                    onChange={async (e) => {
                                                        const docId = e.target.value;
                                                        if (!docId) return;
                                                        try {
                                                            if (item.isAppointment) {
                                                                await updateAppointmentDoctor(item.appointmentId, docId);
                                                            } else {
                                                                await fetch(`/api/dashboard/visit/${item.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ assignedDoctorId: docId })
                                                                });
                                                            }
                                                            fetchOperationalData();
                                                        } catch(err) { console.error('Assign doctor error:', err); }
                                                    }}
                                                >
                                                    <option value="" disabled>Assign Doctor</option>
                                                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}
                                                </select>
                                            ) : (
                                                <span className="truncate max-w-[120px]" title={item.doctor}>
                                                    {item.doctor}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 isolate">
                                            {item.isAppointment && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await fetch('/api/dashboard/live-queue/arrive', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ type: 'APPOINTMENT', appointmentId: item.appointmentId })
                                                            });
                                                            fetchOperationalData();
                                                        } catch (e) { }
                                                    }}
                                                    className="px-4 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-bold transition whitespace-nowrap"
                                                    title="Mark as Arrived"
                                                >
                                                    Arrive
                                                </button>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    let visitId = item.id;
                                                    if (item.isAppointment) {
                                                        const arrRes = await fetch('/api/dashboard/live-queue/arrive', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ type: 'APPOINTMENT', appointmentId: item.appointmentId })
                                                        });
                                                        const arrData = await arrRes.json();
                                                        if(arrData.success) visitId = arrData.visitId;
                                                        else return;
                                                    }
                                                    handleStartTreatment(visitId, 'full');
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg text-[#b361ea] transition"
                                                title="Examine Patient"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {queue.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500 italic">
                                        The queue is currently empty. Start arrivals to see them here.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/reception/patients" className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500/10 to-transparent border border-white/10 rounded-xl hover:border-[#b361ea]/50 transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Walk-in Arrival</h3>
                            <p className="text-xs text-gray-400">Register and queue a new patient</p>
                        </div>
                    </div>
                    <CheckCircle className="text-gray-600 group-hover:text-[#b361ea]" />
                </Link>

                <Link href="/reception/revenue" className="flex items-center justify-between p-6 bg-gradient-to-r from-[#b361ea]/10 to-transparent border border-white/10 rounded-xl hover:border-[#b361ea]/50 transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#b361ea]/20 text-[#b361ea] rounded-lg group-hover:scale-110 transition">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Patient Billing</h3>
                            <p className="text-xs text-gray-400">View revenue and collections</p>
                        </div>
                    </div>
                    <ExternalLink className="text-gray-600 group-hover:text-[#b361ea]" />
                </Link>
            </div>

            {/* TREATMENT MODAL (DOCTOR WORKSPACE) */}
            {showTreatModal && treatingVisit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#120e1b] border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#b361ea]/10 to-transparent">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white text-xl font-bold font-outfit">
                                    {treatingVisit.patientId.fullName[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white leading-none">{treatingVisit.patientId.fullName}</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Patient ID: {treatingVisit.patientId.patientId} • {treatingVisit.patientId.age}y {treatingVisit.patientId.sex}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowTreatModal(false)} className="text-gray-400 hover:text-white transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {noteOnlyMode ? (
                                <div className="space-y-6 max-w-3xl mx-auto flex flex-col bg-[#1a1525] rounded-xl border border-white/10 p-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#b361ea]/50 via-indigo-500/50 to-[#b361ea]/50" />
                                    
                                    {/* Pagination & Actions Header */}
                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setCurrentNotePage(Math.max(0, currentNotePage - 1))}
                                                disabled={currentNotePage === 0}
                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${currentNotePage === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-[#b361ea] hover:bg-[#b361ea]/10 hover:text-[#eeb0f4]'}`}
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            
                                            <div className="text-center min-w-[150px]">
                                                {currentNotePage === pastNotes.length ? (
                                                    <div>
                                                        <span className="text-sm font-bold text-white uppercase tracking-wider block">Current Visit</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(treatingVisit.arrivalTime || Date.now()).toLocaleDateString()}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className="text-sm font-bold text-gray-300 uppercase tracking-wider block">Past Record</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(pastNotes[currentNotePage]?.visitDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button 
                                                onClick={() => setCurrentNotePage(Math.min(pastNotes.length, currentNotePage + 1))}
                                                disabled={currentNotePage === pastNotes.length}
                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${currentNotePage === pastNotes.length ? 'text-gray-600 cursor-not-allowed' : 'text-[#b361ea] hover:bg-[#b361ea]/10 hover:text-[#eeb0f4]'}`}
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const content = currentNotePage === pastNotes.length ? treatingVisit.prescription : pastNotes[currentNotePage]?.prescription;
                                                    if (!content) return;
                                                    const date = currentNotePage === pastNotes.length ? new Date().toISOString().split('T')[0] : new Date(pastNotes[currentNotePage]?.visitDate).toISOString().split('T')[0];
                                                    const blob = new Blob([`Patient Note: ${treatingVisit.patientId.fullName}\nDate: ${date}\n\n${content}`], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `Note_${treatingVisit.patientId.fullName.replace(/\s+/g, '_')}_${date}.txt`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="p-2 text-gray-400 hover:text-[#b361ea] hover:bg-[#b361ea]/10 rounded-lg transition-colors group/btn"
                                                title="Download Note"
                                            >
                                                <Download size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const content = currentNotePage === pastNotes.length ? treatingVisit.prescription : pastNotes[currentNotePage]?.prescription;
                                                    if (!content) return;
                                                    const date = currentNotePage === pastNotes.length ? new Date().toLocaleDateString() : new Date(pastNotes[currentNotePage]?.visitDate).toLocaleDateString();
                                                    const printWindow = window.open('', '', 'width=800,height=600');
                                                    printWindow.document.write(`
                                                        <html>
                                                            <head>
                                                                <title>Patient Note - ${treatingVisit.patientId.fullName}</title>
                                                                <style>
                                                                    body { font-family: system-ui, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                                                    .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                                                                    h1 { font-size: 24px; margin: 0 0 5px 0; }
                                                                    .meta { color: #555; font-size: 14px; }
                                                                    .content { white-space: pre-wrap; font-size: 16px; margin-bottom: 40px; }
                                                                    .footer { border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777; text-align: center; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <div class="header">
                                                                    <h1>Patient Note</h1>
                                                                    <div class="meta">
                                                                        <strong>Patient:</strong> ${treatingVisit.patientId.fullName} (ID: ${treatingVisit.patientId.patientId})<br>
                                                                        <strong>Date:</strong> ${date}
                                                                    </div>
                                                                </div>
                                                                <div class="content">${content}</div>
                                                                <div class="footer">Confidential Medical Record</div>
                                                            </body>
                                                        </html>
                                                    `);
                                                    printWindow.document.close();
                                                    printWindow.focus();
                                                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                                                }}
                                                className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors group/btn"
                                                title="Print Note"
                                            >
                                                <Printer size={18} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notebook Lines Background Effect */}
                                    <div className="flex-1 relative mt-4">
                                        <div className="absolute inset-x-0 bottom-0 top-1 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.1) 31px, rgba(255,255,255,0.1) 32px)' }} />
                                        
                                        {currentNotePage === pastNotes.length ? (
                                            <div 
                                                className="w-full h-[400px] bg-transparent border border-transparent rounded-xl px-4 py-2 text-white outline-none overflow-y-auto text-base relative z-10 custom-scrollbar whitespace-pre-wrap block"
                                                style={{ lineHeight: '32px' }}
                                            >
                                                {treatingVisit.prescription || <span className="text-gray-500 italic">No notes recorded for this visit yet.</span>}
                                            </div>
                                        ) : (
                                            <div 
                                                className="w-full h-[400px] bg-transparent border border-transparent rounded-xl px-4 py-2 text-gray-300 outline-none overflow-y-auto text-base relative z-10 custom-scrollbar whitespace-pre-wrap block"
                                                style={{ lineHeight: '32px' }}
                                            >
                                                {pastNotes[currentNotePage]?.prescription || <span className="text-gray-500 italic">No notes recorded for this visit.</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Attached Files Section for Note */}
                                    {(() => {
                                        const noteFiles = currentNotePage === pastNotes.length ? treatingVisit.files : pastNotes[currentNotePage]?.files;
                                        const canUpload = currentNotePage === pastNotes.length;
                                        
                                        return (
                                            <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/5 mx-4 mb-2">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                        <Paperclip size={16} className="text-[#b361ea]" />
                                                        Attached Files
                                                    </h4>
                                                    {canUpload && (
                                                        <label className="cursor-pointer text-[#b361ea] hover:text-[#eeb0f4] transition flex items-center gap-1 text-xs">
                                                            <Upload size={14} />
                                                            <span>{uploading ? '...' : 'Add File'}</span>
                                                            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                                        </label>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                    {noteFiles && noteFiles.length > 0 ? (
                                                        noteFiles.map((f, i) => (
                                                            <a
                                                                key={i}
                                                                href={f.filePath}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition group"
                                                            >
                                                                <FileText size={14} className="text-indigo-400" />
                                                                <span className="max-w-[150px] truncate">{f.fileName || 'Attachment'}</span>
                                                                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-600 italic">No files attached to this note.</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                                        <span>Page {currentNotePage + 1} of {pastNotes.length + 1}</span>
                                        {currentNotePage !== pastNotes.length && (
                                            <span className="italic text-gray-400">Read-only historical note</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Clinical Notes Form */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                                            <Stethoscope size={20} className="text-[#b361ea]" />
                                            Clinical Findings
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Chief Complaint</label>
                                                <div className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white outline-none h-24 overflow-y-auto opacity-80">
                                                    {treatingVisit.chiefComplaint || <span className="text-gray-500 italic">No chief complaint.</span>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Diagnosis</label>
                                                    <div className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white outline-none h-24 overflow-y-auto opacity-80">
                                                        {treatingVisit.diagnosis || <span className="text-gray-500 italic">No diagnosis.</span>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Proposed Treatment</label>
                                                    <div className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white outline-none h-24 overflow-y-auto opacity-80">
                                                        {treatingVisit.treatment || <span className="text-gray-500 italic">No treatment proposed.</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Prescription & Advice</label>
                                                <div className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white outline-none h-24 overflow-y-auto opacity-80 whitespace-pre-wrap">
                                                    {treatingVisit.prescription || <span className="text-gray-500 italic">No prescription.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Patient Summary Sidebar */}
                                    <div className="space-y-6">
                                        <div className="bg-[#1a1525] border border-white/10 rounded-xl p-5 space-y-4">
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={16} className="text-[#b361ea]" />
                                                Medical Summary
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <span className="text-xs text-gray-500 block">History</span>
                                                    <div className="text-sm text-white">
                                                        {Array.isArray(treatingVisit.patientId.medicalHistory) && treatingVisit.patientId.medicalHistory.length > 0
                                                            ? treatingVisit.patientId.medicalHistory.map((h, i) => <div key={i}>{h}</div>)
                                                            : 'No history recorded'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500 block">Allergies</span>
                                                    <div className="text-sm text-red-400 font-medium">
                                                        {Array.isArray(treatingVisit.patientId.allergies) && treatingVisit.patientId.allergies.length > 0
                                                            ? treatingVisit.patientId.allergies.map((a, i) => <div key={i}>{a}</div>)
                                                            : 'No known allergies'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#1a1525] border border-white/10 rounded-xl p-5 space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                    <Paperclip size={16} className="text-[#b361ea]" />
                                                    Attachments
                                                </h4>
                                                <label className="cursor-pointer text-[#b361ea] hover:text-[#eeb0f4] transition flex items-center gap-1 text-xs">
                                                    <Upload size={14} />
                                                    <span>{uploading ? '...' : 'Add'}</span>
                                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                                </label>
                                            </div>
                                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {treatingVisit.files && treatingVisit.files.length > 0 ? (
                                                    treatingVisit.files.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.filePath}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-3 p-2 bg-black/20 border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition group"
                                                        >
                                                            <FileText size={14} className="text-indigo-400" />
                                                            <span className="flex-1 truncate">{file.fileName}</span>
                                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                                                        </a>
                                                    ))
                                                ) : (
                                                    <p className="text-[10px] text-gray-600 italic">No files attached to this visit.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-[#1a1525] border border-[#b361ea]/20 rounded-xl p-5">
                                            <h4 className="text-sm font-bold text-[#b361ea] uppercase tracking-wider mb-3">Internal Note</h4>
                                            <div className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-sm text-gray-400 h-32 overflow-y-auto">
                                                {treatingVisit.doctorNotes || <span className="italic">No internal notes.</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={14} />
                                Visit started {new Date(treatingVisit.arrivalTime).toLocaleTimeString()}
                            </div>
                            <div className="flex gap-3">
                                <span className="px-6 py-2.5 bg-white/5 text-gray-400 rounded-xl flex items-center gap-2 italic text-sm">
                                    <AlertCircle size={16} /> Read-Only Mode
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
