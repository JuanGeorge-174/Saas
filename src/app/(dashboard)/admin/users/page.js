'use client';

import React, { useState, useEffect } from 'react';
import {
    UserCog,
    Plus,
    Search,
    Shield,
    Mail,
    Phone,
    Edit,
    Trash2,
    X,
    CheckCircle2,
    AlertCircle,
    Lock,
    Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        fullName: '',
        loginId: '',
        role: 'RECEPTIONIST',
        password: '',
        email: '',
        phone: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        userId: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/users?search=${search}`);
            const data = await res.json();
            if (res.ok) setUsers(data.users || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        try {
            const res = await fetch('/api/dashboard/users/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: passwordForm.userId,
                    newPassword: passwordForm.newPassword
                })
            });
            if (res.ok) {
                alert('Password changed successfully!');
                setShowPasswordModal(false);
                setPasswordForm({ userId: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser ? { ...form, id: editingUser.id } : form)
            });
            if (res.ok) {
                setShowModal(false);
                fetchUsers();
                resetForm();
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch('/api/dashboard/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchUsers();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setForm({ fullName: '', loginId: '', role: 'RECEPTIONIST', password: '', email: '', phone: '' });
        setEditingUser(null);
    };

    const getRoleBadge = (role) => {
        const styles = {
            ADMIN: 'bg-rose-50 text-rose-600 border-rose-100',
            DOCTOR: 'bg-indigo-50 text-indigo-600 border-indigo-100',
            RECEPTIONIST: 'bg-emerald-50 text-emerald-600 border-emerald-100'
        };
        return styles[role] || 'bg-slate-50 text-slate-600 border-slate-100';
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Staff & Users</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">Team Access Management</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 font-black flex items-center gap-3 transition-all active:scale-95"
                >
                    <Plus size={20} /> Add User
                </button>
            </header>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold placeholder:text-slate-300"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && users.length === 0 ? (
                    Array(6).fill(0).map((_, i) => <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[40px]"></div>)
                ) : users.length === 0 ? (
                    <div className="col-span-full py-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                            <UserCog size={40} className="text-slate-200" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">No users found</h2>
                        <p className="text-slate-500 mt-2">Add your first team member to get started.</p>
                    </div>
                ) : users.map((user) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        key={user.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                                    {user.fullName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{user.fullName}</h3>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Mail size={14} className="text-slate-400" />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Phone size={14} className="text-slate-400" />
                                {user.phone || 'Not provided'}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-50">
                            <button
                                onClick={() => { setEditingUser(user); setForm({ ...user, loginId: user.loginId || '' }); setShowModal(true); }}
                                className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Edit size={14} /> Edit
                            </button>
                            <button
                                onClick={() => { setPasswordForm({ ...passwordForm, userId: user.id }); setShowPasswordModal(true); }}
                                className="flex-1 py-3 bg-amber-50 text-amber-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Lock size={14} /> Pass
                            </button>
                            <button
                                onClick={() => handleDelete(user.id)}
                                className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowModal(false); resetForm(); }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl relative z-10 overflow-hidden">
                            <div className="bg-indigo-600 p-10 text-white relative">
                                <Shield className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none" size={160} />
                                <h2 className="text-3xl font-black tracking-tight">{editingUser ? 'Update User' : 'New Team Member'}</h2>
                                <p className="text-indigo-200 font-bold uppercase text-[11px] tracking-widest mt-2">Access Control Panel</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Full Name *</label>
                                        <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Dr. John Smith" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Username (Login ID) *</label>
                                        <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="john_smith" value={form.loginId} onChange={e => setForm({ ...form, loginId: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Email</label>
                                            <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs" placeholder="john@clinic.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Phone</label>
                                            <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs" placeholder="+1 234 567 8900" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Role & Permissions *</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {ROLES.map(role => (
                                                <button
                                                    key={role} type="button"
                                                    onClick={() => setForm({ ...form, role })}
                                                    className={`py-3 rounded-xl border text-[10px] font-black transition-all ${form.role === role ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {!editingUser && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Initial Password *</label>
                                            <input type="password" required={!editingUser} className="w-full px-6 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none font-bold text-rose-600" placeholder="Minimum 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1 py-5 bg-slate-100 text-slate-400 font-bold uppercase text-[11px] rounded-2xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">{editingUser ? 'Update User' : 'Create Account'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Change Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPasswordModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="w-full max-w-md bg-white rounded-[40px] shadow-2xl relative z-10 overflow-hidden">
                            <div className="bg-amber-500 p-8 text-white">
                                <h2 className="text-2xl font-black tracking-tight">Security Update</h2>
                                <p className="text-amber-100 font-bold uppercase text-[10px] tracking-widest mt-1">Change User Password</p>
                            </div>
                            <form onSubmit={handlePasswordChange} className="p-8 space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">New Password *</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                        placeholder="Enter new password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Confirm Password *</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                                        placeholder="Repeat new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-bold uppercase text-[10px] rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all">Update</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
