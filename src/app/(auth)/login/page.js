'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [clinicName, setClinicName] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clinicName: clinicName.trim(),
                    loginId: loginId.trim(),
                    password
                }),
            });

            let data = null;
            try {
                const text = await res.text();
                data = text ? JSON.parse(text) : null;
            } catch {
                data = null;
            }

            if (!res.ok) {
                const message = (data && data.error) || 'Login failed';
                throw new Error(message);
            }

            const role = data.user.role;
            if (role === 'ADMIN') router.push('/admin');
            else if (role === 'DOCTOR') router.push('/doctor');
            else if (role === 'RECEPTIONIST') router.push('/reception');
            else router.push('/admin');

        } catch (err) {
            console.error('Login error:', err);
            setError('Unable to login. Please check your details and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-background-dark min-h-screen flex flex-col font-display text-slate-300 bg-mesh">


            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-[440px] flex flex-col items-center">
                    <div className="mb-8 text-center">
                        <h1 className="text-white text-3xl font-bold tracking-tight mb-2">Login</h1>
                        <p className="text-slate-400 text-base">Secure access for clinical personnel</p>
                    </div>

                    <div className="w-full bg-card-dark rounded-2xl border border-white/10 p-8 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-bold uppercase tracking-wider">Clinic</label>
                                <div className="relative group">
                                    <input
                                        className="w-full h-12 pl-4 pr-4 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="Clinic Name"
                                        type="text"
                                        value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-bold uppercase tracking-wider">Username</label>
                                <div className="relative group">
                                    <input
                                        className="w-full h-12 pl-4 pr-4 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="Username"
                                        type="text"
                                        value={loginId}
                                        onChange={(e) => setLoginId(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-white text-sm font-bold uppercase tracking-wider">Password</label>
                                </div>
                                <div className="relative group">
                                    <input
                                        className="w-full h-12 pl-4 pr-11 bg-black/40 border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                                        placeholder="Password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <div
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors cursor-pointer"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Link className="text-xs font-semibold text-white hover:brightness-150 transition-all duration-300" href="/forgot-password">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <button
                                className="w-full bg-primary hover:brightness-180 active:scale-[0.98] text-white h-14 rounded-xl font-bold text-base shadow-xl shadow-primary/20 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Authorizing..." : "Login"}
                            </button>

                            <p className="text-center text-sm text-slate-500 pt-2">
                                Don't have a clinic?{" "}
                                <Link href="/signup" className="text-white hover:brightness-150 transition-all duration-300 font-medium font-bold">
                                    Register now
                                </Link>
                            </p>
                        </form>
                    </div>

                </div>
            </main>


        </div>
    );
}
