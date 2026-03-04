'use client';

import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Search,
    AlertTriangle,
    Truck,
    Activity,
    ArrowRight,
    BarChart3,
    Filter,
    Edit,
    Trash2,
    CheckCircle2,
    X,
    ShoppingCart,
    Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Form state
    const [form, setForm] = useState({
        name: '',
        category: 'CONSUMABLE',
        quantity: '',
        unit: 'pcs',
        threshold: '10',
        supplier: { name: '', contact: '' }
    });

    useEffect(() => {
        fetchInventory();
    }, [categoryFilter, search]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/inventory?category=${categoryFilter}&search=${search}`);
            const data = await res.json();
            if (res.ok) setItems(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/dashboard/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                fetchInventory();
                setForm({ name: '', category: 'CONSUMABLE', quantity: '', unit: 'pcs', threshold: '10', supplier: { name: '', contact: '' } });
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Stock & Supplies</h1>
                    <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-2 px-1">Clinic Resource Optimization</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/20 font-black flex items-center gap-3 transition-all active:scale-95"
                >
                    <Plus size={20} /> New Category Item
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Critical Low" value={items.filter(i => i.isLow).length} icon={<AlertTriangle className="text-rose-500" />} color="rose" />
                <StatCard label="Consumables" value={items.filter(i => i.category === 'CONSUMABLE').length} icon={<Archive className="text-indigo-500" />} color="indigo" />
                <StatCard label="Equipments" value={items.filter(i => i.category === 'EQUIPMENT').length} icon={<Package className="text-emerald-500" />} color="emerald" />
                <StatCard label="Active Suppliers" value={new Set(items.map(i => i.supplier?.name).filter(Boolean)).size} icon={<Truck className="text-amber-500" />} color="amber" />
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-10 py-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {['ALL', 'CONSUMABLE', 'EQUIPMENT', 'MEDICINE'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative group flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-sm"
                            placeholder="Find supply item..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-10 py-5">Item Details</th>
                                <th className="px-6 py-5">Stock Level</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Supplier</th>
                                <th className="px-10 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && items.length === 0 ? (
                                Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="5" className="px-10 py-8 animate-pulse"><div className="h-10 bg-slate-50 rounded-2xl"></div></td></tr>)
                            ) : items.length === 0 ? (
                                <tr><td colSpan="5" className="px-10 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] italic">No inventory items registered</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.isLow ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{item.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updated {new Date(item.lastRestocked).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-black ${item.isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</span>
                                            {item.isLow && (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest">
                                                    Low
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${item.category === 'EQUIPMENT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 font-bold text-slate-500 text-xs">
                                        {item.supplier?.name || 'In-House'}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl relative z-10 overflow-hidden" >
                            <div className="bg-slate-900 p-10 text-white relative">
                                <Archive className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none" size={160} />
                                <h2 className="text-3xl font-black tracking-tight">Stock Registration</h2>
                                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest mt-2">Resource Intake Module</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Item Nomenclature</label>
                                        <input required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="e.g. Disposable Nitrile Gloves (Large)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Current Stock</label>
                                            <input type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Restock Threshold</label>
                                            <input type="number" required className="w-full px-6 py-4 bg-rose-50/50 border border-rose-100 rounded-2xl outline-none font-bold text-rose-600" placeholder="10" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Category & Sourcing</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                                <option value="CONSUMABLE">Consumable</option>
                                                <option value="EQUIPMENT">Equipment</option>
                                                <option value="MEDICINE">Medicine</option>
                                                <option value="PERSONAL_PROTECTION">PPE</option>
                                            </select>
                                            <input className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="Supplier Name" value={form.supplier.name} onChange={e => setForm({ ...form, supplier: { ...form.supplier, name: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-bold uppercase text-[11px] rounded-2xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-5 bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Add to Inventory</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon, color }) {
    const colors = {
        rose: 'bg-rose-50 text-rose-500 border-rose-100',
        indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
        amber: 'bg-amber-50 text-amber-500 border-amber-100'
    };
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</p>
            </div>
        </div>
    );
}
