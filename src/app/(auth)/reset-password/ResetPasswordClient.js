"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResetPasswordClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new one.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            let data = null;
            try {
                const text = await res.text();
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            if (data && data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                console.error('Reset password error:', data);
                setError('Failed to reset password. Please try again.');
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="p-4 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
                            <Lock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Set New Password</h1>
                        <p className="text-slate-400 mt-2">Enter your strong new password below</p>
                    </div>

                    {success ? (
                        <div className="text-center">
                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl mb-8 flex flex-col items-center gap-4">
                                <div className="p-3 bg-emerald-500 rounded-full">
                                    <Check className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-black text-lg">Password Reset Successfully!</p>
                                    <p className="text-emerald-400 text-sm mt-1">Redirecting to login in 3 seconds...</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="text-red-400 shrink-0" size={20} />
                                    <p className="text-red-400 text-sm font-medium">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? 'Updating Password...' : 'Save New Password'}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}


