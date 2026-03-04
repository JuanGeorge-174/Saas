'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        clinicName: '',
        adminName: '',
        email: '',
        phone: '',
        loginId: '',
        password: '',
        plan: 'FREE',
        termsAccepted: false
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!formData.termsAccepted) {
            setError("Please accept the terms and conditions");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            router.push('/admin');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const inputClasses = "w-full h-12 pl-4 pr-4 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all";
    const labelClasses = "text-white text-sm font-bold uppercase tracking-wider mb-2 block";

    return (
        <div className="bg-background-dark min-h-screen flex flex-col font-display text-slate-300 bg-mesh">

            <main className="flex-1 flex items-center justify-center p-6 py-12">
                <div className="w-full max-w-[500px] flex flex-col items-center">
                    <div className="mb-8 text-center text-balance">
                        <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Expand Your Practice</h1>
                        <p className="text-slate-400 text-base">Join 100+ clinics managing their practice with confidence.</p>
                    </div>

                    <div className="w-full bg-card-dark rounded-2xl border border-white/10 p-8 shadow-2xl">
                        {/* Stepper */}
                        <div className="flex items-center justify-between mb-8 px-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-primary text-white border border-primary/50' : 'bg-white/5 text-slate-600 border border-white/5'
                                        }`}>
                                        {step > s ? <Check size={16} /> : s}
                                    </div>
                                    {s < 3 && <div className={`w-12 h-0.5 md:w-20 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-white/5'}`}></div>}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        Clinic Information
                                    </h2>
                                    <div>
                                        <label className={labelClasses}>Clinic Name</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="Clinic Name (Publicly Visible)"
                                                type="text"
                                                required
                                                value={formData.clinicName}
                                                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Admin Name</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="Legal name of administrator"
                                                type="text"
                                                required
                                                value={formData.adminName}
                                                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full bg-primary hover:brightness-180 active:scale-[0.98] text-white h-14 rounded-xl font-bold text-base shadow-xl shadow-primary/20 transition-all mt-4 flex items-center justify-center gap-2"
                                    >
                                        Continue
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                                    <div>
                                        <label className={labelClasses}>Clinic Email</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="email@clinic.com"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Clinic Phone</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="+1 (555) 000-0000"
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="flex-[2] bg-primary hover:brightness-180 active:scale-[0.98] text-white h-14 rounded-xl font-bold text-base shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Continue </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

                                    <div>
                                        <label className={labelClasses}>Login ID</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="Choose a Login ID"
                                                type="text"
                                                required
                                                value={formData.loginId}
                                                onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Password</label>
                                        <div className="relative group">
                                            <input
                                                className={inputClasses}
                                                placeholder="Create a Secure Password"
                                                type="password"
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="relative flex items-center pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.termsAccepted}
                                                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                                                    className="peer h-5 w-5 appearance-none rounded border border-white/20 bg-black/40 transition-all checked:bg-primary checked:border-primary cursor-pointer"
                                                />
                                                <Check className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 left-0 pointer-events-none transition-opacity p-1" />
                                            </div>
                                            <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors uppercase tracking-tight font-medium">
                                                I agree to the <Link href="/terms" className="text-white hover:brightness-150 transition-all duration-300 font-bold underline underline-offset-4">Terms of Service</Link> and <Link href="/privacy" className="text-white hover:brightness-150 transition-all duration-300 font-bold underline underline-offset-4">Privacy Policy</Link>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-[2] bg-primary hover:brightness-180 active:scale-[0.98] text-white h-14 rounded-xl font-bold text-base shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {loading ? "Registering..." : (
                                                <>
                                                    Create Account
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <p className="text-center text-sm text-slate-500 mt-8">
                            Already have a clinic?{" "}
                            <Link href="/login" className="text-white hover:brightness-150 transition-all duration-300 font-medium font-bold">
                                Login in
                            </Link>
                        </p>
                    </div>

                </div>
            </main>

        </div>
    );
}
