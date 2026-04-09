'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Lock, Save, Edit, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('clinic');
    const [clinic, setClinic] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Clinic form
    const [clinicForm, setClinicForm] = useState({
        clinicName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: ''
    });

    // User form
    const [userForm, setUserForm] = useState({
        fullName: '',
        email: '',
        loginId: '',
        role: 'RECEPTIONIST',
        password: ''
    });

    // Password change form
    const [passwordForm, setPasswordForm] = useState({
        userId: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchClinicData();
        fetchUsers();
    }, []);

    const fetchClinicData = async () => {
        try {
            const res = await fetch('/api/dashboard/clinic');
            if (res.ok) {
                const data = await res.json();
                setClinic(data);
                setClinicForm({
                    clinicName: data.clinicName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address?.street || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    zip: data.address?.zip || ''
                });
            } else if (res.status === 401) {
                window.location.href = '/login?reason=unauthorized';
            }
        } catch (error) {
            console.error('Failed to fetch clinic data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            console.log('Fetching users...');
            const res = await fetch('/api/dashboard/users');
            if (res.ok) {
                const data = await res.json();
                console.log('Users fetched:', data.users?.length || 0);
                setUsers(data.users || []);
            } else {
                console.error('Failed to fetch users:', res.status);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleClinicUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/clinic', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clinicName: clinicForm.clinicName,
                    email: clinicForm.email,
                    phone: clinicForm.phone,
                    address: {
                        street: clinicForm.address,
                        city: clinicForm.city,
                        state: clinicForm.state,
                        zip: clinicForm.zip
                    }
                })
            });
            if (res.ok) {
                alert('Clinic details updated successfully!');
                fetchClinicData();
            }
        } catch (error) {
            console.error('Failed to update clinic:', error);
            alert('Failed to update clinic details');
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Submitting user form:', userForm);
            console.log('Editing user:', editingUser);
            
            const res = await fetch('/api/dashboard/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingUser ? { ...userForm, id: editingUser.id } : userForm)
            });
            
            console.log('User submit response status:', res.status);
            console.log('User submit response ok:', res.ok);
            
            const responseData = await res.json();
            console.log('User submit response data:', responseData);
            
            if (res.ok) {
                setShowUserModal(false);
                await fetchUsers();
                setUserForm({ fullName: '', email: '', loginId: '', role: 'RECEPTIONIST', password: '' });
                setEditingUser(null);
                alert(editingUser ? 'User updated successfully!' : 'User created successfully!');
            } else {
                const error = responseData;
                alert(error.error || 'Failed to save user');
            }
        } catch (error) {
            console.error('Failed to save user:', error);
            alert('Failed to save user. Please try again.');
        }
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

    const handleDeleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            console.log('Attempting to delete user with ID:', id);
            
            const res = await fetch('/api/dashboard/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            console.log('Delete response status:', res.status);
            console.log('Delete response ok:', res.ok);
            
            const responseData = await res.json();
            console.log('Delete response data:', responseData);
            
            if (res.ok) {
                alert('User deleted successfully!');
                // Force refresh the users list
                await fetchUsers();
            } else {
                const error = responseData;
                alert(error.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please try again.');
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            ADMIN: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
            DOCTOR: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
            RECEPTIONIST: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
        return styles[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b361ea]"></div></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-sm text-gray-400 mt-1">Manage clinic details and user accounts</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('clinic')}
                    className={`px-4 py-2 font-medium transition-all ${activeTab === 'clinic'
                        ? 'text-[#b361ea] border-b-2 border-[#b361ea]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Building2 className="inline w-4 h-4 mr-2" />
                    Clinic Details
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium transition-all ${activeTab === 'users'
                        ? 'text-[#b361ea] border-b-2 border-[#b361ea]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Users className="inline w-4 h-4 mr-2" />
                    User Management
                </button>
            </div>

            {/* Clinic Details Tab */}
            {activeTab === 'clinic' && (
                <form onSubmit={handleClinicUpdate} className="bg-[#1a1525] rounded-xl p-6 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-6">Clinic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Clinic Name *</label>
                            <input
                                type="text"
                                required
                                value={clinicForm.clinicName}
                                onChange={(e) => setClinicForm({ ...clinicForm, clinicName: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                            <input
                                type="email"
                                required
                                value={clinicForm.email}
                                onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Phone *</label>
                            <input
                                type="tel"
                                required
                                value={clinicForm.phone}
                                onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                            <input
                                type="text"
                                value={clinicForm.address}
                                onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">City</label>
                            <input
                                type="text"
                                value={clinicForm.city}
                                onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">State</label>
                            <input
                                type="text"
                                value={clinicForm.state}
                                onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 bg-[#b361ea] hover:bg-[#9D3DD4] text-white px-6 py-3 rounded flex items-center gap-2 transition-all"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </form>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowUserModal(true)}
                            className="bg-[#b361ea] hover:bg-[#9D3DD4] text-white px-4 py-2 rounded flex items-center gap-2 transition-all"
                        >
                            <Plus size={18} />
                            Add User
                        </button>
                    </div>

                    <div className="space-y-3">
                        {users.map((user) => (
                            <div key={user.id} className="bg-[#1a1525] p-4 rounded-lg border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-bold">
                                        {user.fullName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{user.fullName}</h3>
                                        <p className="text-sm text-gray-400">{user.email || user.loginId}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs rounded border ${getRoleBadge(user.role)}`}>
                                        {user.role}
                                        {user.role === 'ADMIN' && ' 🔒'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingUser(user);
                                            setUserForm({ fullName: user.fullName || '', email: user.email || '', loginId: user.loginId || '', role: user.role || 'RECEPTIONIST', password: '' });
                                            setShowUserModal(true);
                                        }}
                                        className="p-2 text-indigo-400 hover:bg-indigo-50/10 rounded transition"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setPasswordForm({ ...passwordForm, userId: user.id });
                                            setShowPasswordModal(true);
                                        }}
                                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded transition"
                                    >
                                        <Lock size={18} />
                                    </button>
                                    {user.role !== 'ADMIN' && (
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded transition"
                                            title="Delete user"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    {user.role === 'ADMIN' && (
                                        <div className="p-2 text-gray-600 cursor-not-allowed" title="Admin accounts cannot be deleted">
                                            <Trash2 size={18} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Admin Protection Notice */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-amber-400 mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-amber-400 font-semibold text-sm">Admin Account Protection</p>
                                <p className="text-amber-300/70 text-xs mt-1">
                                    Admin accounts cannot be deleted to ensure system security. At least one admin account must always exist for clinic management.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-[#1f1b2d] rounded-xl p-6 w-[90%] max-w-md shadow-lg border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white text-xl font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
                            <button onClick={() => { setShowUserModal(false); setEditingUser(null); }}>
                                <X className="text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={userForm.fullName}
                                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                                    className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Email *</label>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Username (Login ID) *</label>
                                <input
                                    type="text"
                                    placeholder="Login ID"
                                    required
                                    value={userForm.loginId}
                                    onChange={(e) => setUserForm({ ...userForm, loginId: e.target.value })}
                                    className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Role *</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="RECEPTIONIST">Receptionist</option>
                                </select>
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        required={!editingUser}
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                                    />
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-[#b361ea] hover:bg-[#9D3DD4] py-3 rounded text-white font-semibold transition-all"
                            >
                                {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-[#1f1b2d] rounded-xl p-6 w-[90%] max-w-md shadow-lg border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-white text-xl font-semibold">Change Password</h2>
                            <button onClick={() => setShowPasswordModal(false)}>
                                <X className="text-white" />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New Password *"
                                    required
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <input
                                type="password"
                                placeholder="Confirm Password *"
                                required
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full p-3 bg-[#2a2636] text-white rounded border border-white/10 outline-none"
                            />
                            <button
                                type="submit"
                                className="w-full bg-[#b361ea] hover:bg-[#9D3DD4] py-3 rounded text-white font-semibold transition-all"
                            >
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
