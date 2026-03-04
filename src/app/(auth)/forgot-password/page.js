"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Shield, Key, ArrowLeft, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ clinicName: '', loginId: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success || data.message) {
                setMessage(data.message);
                if (data.debugToken) {
                    console.log("DEBUG: Your reset token is:", data.debugToken);
                }
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
                            <Key className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Forgot Password?</h1>
                        <p className="text-slate-400 mt-2">Enter your clinic details to reset your access</p>
                    </div>

                    {message ? (
                        <div className="text-center">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-8">
                                <p className="text-emerald-400 text-sm font-medium">{message}</p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                    <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Clinic Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    placeholder="e.g. Smile Safe Clinic"
                                    value={formData.clinicName}
                                    onChange={e => setFormData({ ...formData, clinicName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Login ID</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    placeholder="Your username"
                                    value={formData.loginId}
                                    onChange={e => setFormData({ ...formData, loginId: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Sending Request...' : 'Reset Password'}
                                {!loading && <ArrowLeft size={18} className="rotate-180" />}
                            </button>

                            <div className="text-center pt-2">
                                <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">
                                    Suddenly remembered? <span className="text-indigo-400">Back to Login</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
