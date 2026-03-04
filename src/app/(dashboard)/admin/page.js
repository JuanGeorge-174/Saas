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
    Activity
} from 'lucide-react';
import { getSystemHealth } from '@/app/actions/health';

/**
 * PRODUCTION DASHBOARD (OPERATIONAL VIEW)
 * 
 * Derived from VISITS and APPOINTMENTS.
 * Features Real-time Queue and Live Operational Metrics.
 */

const MetricCard = ({ title, value, icon: Icon, colorClass, desc }) => (
    <div className="bg-[#1a1525] rounded-xl p-6 border border-white/10 hover:border-[#b361ea]/50 transition-all">
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

export default function AdminDashboard() {
    const [stats, setStats] = useState({ visitedToday: 0, pendingToday: 0, missedToday: 0, newPatientsToday: 0 });
    const [queue, setQueue] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [treatingVisit, setTreatingVisit] = useState(null);
    const [showTreatModal, setShowTreatModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchOperationalData = useCallback(async () => {
        try {
            const [metricsRes, queueRes, healthData] = await Promise.all([
                fetch('/api/dashboard/metrics', { cache: 'no-store' }),
                fetch('/api/dashboard/live-queue', { cache: 'no-store' }),
                getSystemHealth()
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

    const handleStartTreatment = async (visitId) => {
        try {
            const res = await fetch(`/api/dashboard/visit/${visitId}`);
            if (res.ok) {
                const data = await res.json();
                setTreatingVisit(data);
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
                alert('Treatment record secured!');
                if (finalStatus) setShowTreatModal(false);
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
            case 'red': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'blue': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            default: return 'text-green-400 bg-green-400/10 border-green-400/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Operational Hub</h1>
                    <p className="text-gray-400 mt-1">Live updates for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin/appointments" className="px-4 py-2 bg-[#b361ea] hover:bg-[#9D3DD4] text-white rounded-lg flex items-center gap-2 transition shadow-lg">
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
                />
                <MetricCard
                    title="Pending Appointments"
                    value={stats.pendingToday}
                    icon={Clock}
                    colorClass="text-blue-400 bg-blue-400/10"
                    desc="Scheduled for today"
                />
                <MetricCard
                    title="Missed Appointments"
                    value={stats.missedToday}
                    icon={AlertCircle}
                    colorClass="text-red-400 bg-red-400/10"
                    desc="Auto-marked after 15m delay"
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
                                <th className="px-6 py-4">Doctor</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {queue.map((item) => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full animate-pulse ${item.status === 'IN_PROGRESS' ? 'bg-indigo-400' : 'bg-[#b361ea]'
                                                }`} />
                                            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white/5 text-gray-300">
                                                {item.status === 'WAITING' ? 'QUEUED' : 'TREATING'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
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
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm ${getWaitColor(item.color)}`}>
                                            {item.waitingTime}m wait
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-300 flex items-center gap-1">
                                            <BriefcaseMedical size={14} className="text-[#b361ea]" />
                                            {item.doctor}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 isolate">
                                            <button
                                                onClick={() => handleStartTreatment(item.id)}
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
                <Link href="/admin/patients" className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-500/10 to-transparent border border-white/10 rounded-xl hover:border-[#b361ea]/50 transition group">
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

                <Link href="/admin/revenue" className="flex items-center justify-between p-6 bg-gradient-to-r from-[#b361ea]/10 to-transparent border border-white/10 rounded-xl hover:border-[#b361ea]/50 transition group">
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
                                            <textarea
                                                className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white focus:border-[#b361ea] outline-none transition h-24 resize-none"
                                                placeholder="What is the patient experiencing?"
                                                value={treatingVisit.chiefComplaint}
                                                onChange={(e) => setTreatingVisit({ ...treatingVisit, chiefComplaint: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Diagnosis</label>
                                                <textarea
                                                    className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white focus:border-[#b361ea] outline-none transition h-24 resize-none"
                                                    placeholder="Clinical diagnosis..."
                                                    value={treatingVisit.diagnosis}
                                                    onChange={(e) => setTreatingVisit({ ...treatingVisit, diagnosis: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Proposed Treatment</label>
                                                <textarea
                                                    className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white focus:border-[#b361ea] outline-none transition h-24 resize-none"
                                                    placeholder="Procedures to perform..."
                                                    value={treatingVisit.treatment}
                                                    onChange={(e) => setTreatingVisit({ ...treatingVisit, treatment: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Prescription & Advice</label>
                                            <textarea
                                                className="w-full bg-[#1a1525] border border-white/10 rounded-xl p-3 text-white focus:border-[#b361ea] outline-none transition h-24 resize-none"
                                                placeholder="Medications, dosage, follow-up instructions..."
                                                value={treatingVisit.prescription}
                                                onChange={(e) => setTreatingVisit({ ...treatingVisit, prescription: e.target.value })}
                                            />
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
                                        <textarea
                                            className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-sm text-gray-300 focus:border-[#b361ea] outline-none transition h-32 resize-none"
                                            placeholder="Private clinical notes..."
                                            value={treatingVisit.doctorNotes}
                                            onChange={(e) => setTreatingVisit({ ...treatingVisit, doctorNotes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock size={14} />
                                Visit started {new Date(treatingVisit.arrivalTime).toLocaleTimeString()}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSaveTreatment()}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center gap-2 transition"
                                >
                                    <Save size={18} />
                                    Save Draft
                                </button>
                                <button
                                    onClick={() => handleSaveTreatment('COMPLETED')}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-gradient-to-r from-[#b361ea] to-[#eeb0f4] text-white font-bold rounded-xl flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-[#b361ea]/20"
                                >
                                    {saving ? 'Processing...' : 'Complete & Discharge'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
