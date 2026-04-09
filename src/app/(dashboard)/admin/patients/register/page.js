'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerPatient, checkDuplicates } from '@/app/actions/patients';
import { User, Phone, Mail, Calendar, MapPin, ChevronLeft, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPatientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [duplicates, setDuplicates] = useState([]);

    const [form, setForm] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        dateOfBirth: '',
        gender: 'Male',
        relationToContact: 'self',
        address: '',
        medicalHistory: '',
        allergies: ''
    });

    // Live background matching logic (PRD Rule)
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (form.fullName.length > 2 || form.phoneNumber.length > 5) {
                const res = await checkDuplicates({
                    fullName: form.fullName,
                    phoneNumber: form.phoneNumber,
                    dateOfBirth: form.dateOfBirth
                });
                if (res.success) setDuplicates(res.matches);
            } else {
                setDuplicates([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.fullName, form.phoneNumber, form.dateOfBirth]);

    const handleSubmit = async (e, forceCreate = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        setDuplicates([]);

        try {
            const result = await registerPatient({ ...form, forceCreate });

            if (result.success) {
                router.push('/admin/patients');
            } else if (result.type === 'DUPLICATE_FOUND') {
                setDuplicates(result.matches);
            } else {
                console.error('Register patient error:', result);
                setError('Unable to register patient. Please try again.');
            }
        } catch (err) {
            console.error('Register patient error:', err);
            setError('Unable to register patient. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/patients" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 transition">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Register Patient</h1>
                    <p className="text-gray-400">Create a permanent identity record</p>
                </div>
            </div>

            <div className="bg-[#1a1525] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Permanent Identity Details</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}

                    {duplicates.length > 0 && (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4">
                            <div className="flex items-center gap-3 text-amber-500">
                                <AlertCircle size={20} />
                                <h3 className="font-bold">Possible Existing Records Found</h3>
                            </div>
                            <div className="space-y-3">
                                {duplicates.map((match, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
                                        <div>
                                            <p className="text-white font-bold">{match.patient.fullName}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Match Strength: {match.strength}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/admin/patients/${match.patient.id}`)}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 transition"
                                        >
                                            View Record
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-white/5 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(null, true)}
                                    className="flex-1 py-3 bg-amber-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400 transition"
                                >
                                    Proceed Anyway
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDuplicates([])}
                                    className="flex-1 py-3 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition"
                                >
                                    Modify Details
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                                <input
                                    required
                                    type="text"
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition"
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Verified Phone</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                                <input
                                    required
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition"
                                    placeholder="+91..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Date of Birth</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                                <input
                                    required
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Gender</label>
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition appearance-none cursor-pointer"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Relation to Contact</label>
                            <select
                                value={form.relationToContact}
                                onChange={(e) => setForm({ ...form, relationToContact: e.target.value })}
                                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition appearance-none cursor-pointer"
                            >
                                <option value="self">Self (Primary)</option>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                                <option value="spouse">Spouse</option>
                                <option value="parent">Parent</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email (Optional)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition"
                                placeholder="patient@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Residential Address</label>
                        <div className="relative group">
                            <MapPin className="absolute left-4 top-6 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition h-24 resize-none"
                                placeholder="Street, City, Zip..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Medical History</label>
                            <div className="relative group">
                                <FileText className="absolute left-4 top-6 text-gray-500 group-focus-within:text-[#b361ea] transition" size={18} />
                                <textarea
                                    value={form.medicalHistory}
                                    onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-[#b361ea]/50 transition h-32 resize-none"
                                    placeholder="Previous conditions, surgeries..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Allergies</label>
                            <div className="relative group">
                                <AlertCircle className="absolute left-4 top-6 text-rose-500/50 group-focus-within:text-rose-500 transition" size={18} />
                                <textarea
                                    value={form.allergies}
                                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                    className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-rose-500/30 transition h-32 resize-none"
                                    placeholder="Latex, Penicillin, etc..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end items-center gap-6">
                        <Link href="/admin/patients" className="text-gray-500 hover:text-white transition font-black text-xs uppercase tracking-widest">
                            Discard
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || duplicates.length > 0}
                            className={`px-10 py-4 bg-gradient-to-r from-[#b361ea] to-[#eeb0f4] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                        >
                            {loading ? 'Processing...' : 'Register Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
