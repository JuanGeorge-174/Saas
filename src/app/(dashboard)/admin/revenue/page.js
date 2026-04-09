'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, X, User, TrendingUp, AlertCircle, Clock, ChevronRight, Receipt, Search } from 'lucide-react';

import { recordPayment, getRevenue, updateBillAmount, addManualRevenue } from '@/app/actions/revenue';
import { getPatients } from '@/app/actions/patients';
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [metrics, setMetrics] = useState({ totalPaid: 0, totalPending: 0 });
    const [filter, setFilter] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState([]);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeBill, setActiveBill] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        mode: 'CASH',
        note: ''
    });
    const [isEditingBill, setIsEditingBill] = useState(false);
    const [billAmountVal, setBillAmountVal] = useState('');
    const [showManualRevenueModal, setShowManualRevenueModal] = useState(false);
    const [manualRevenueForm, setManualRevenueForm] = useState({
        patientId: '',
        patientName: '',
        totalAmount: '',
        paidAmount: '',
        mode: 'CASH',
        notes: ''
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchRevenue();
    }, [filter, debouncedSearch]);

    useEffect(() => {
        if (!patientSearch || manualRevenueForm.patientId) {
            setPatientResults([]);
            return;
        }
        const handler = setTimeout(async () => {
            setIsSearchingPatients(true);
            try {
                const res = await getPatients({ search: patientSearch, limit: 5 });
                if (res.success) setPatientResults(res.patients);
            } catch (e) { }
            setIsSearchingPatients(false);
        }, 300);
        return () => clearTimeout(handler);
    }, [patientSearch, manualRevenueForm.patientId]);

    const fetchRevenue = async () => {
        setLoading(true);
        try {
            const result = await getRevenue(filter, debouncedSearch);
            if (result.success) {
                setPayments(result.payments);
                setMetrics(result.metrics);
            }
        } catch (error) {
            console.error('Revenue Load Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async () => {
        if (!paymentForm.amount || !showPaymentModal) return;
        setProcessing(true);
        try {
            const res = await recordPayment({
                paymentId: showPaymentModal.id, // This is the Payment document ID
                amount: parseFloat(paymentForm.amount),
                method: paymentForm.mode,
                notes: paymentForm.note
            });

            if (res.success) {
                fetchRevenue();
                setShowPaymentModal(null);
                setActiveBill(null);
                setPaymentForm({ amount: '', mode: 'CASH', note: '' });
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error('Payment Error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateBillAmount = async () => {
        const item = activeBill || showPaymentModal;
        if (!item) return;
        setProcessing(true);
        try {
            const res = await updateBillAmount({
                paymentId: item.id,
                amount: billAmountVal
            });
            if (res.success) {
                await fetchRevenue();
                setIsEditingBill(false);
                // Also update the active item so UI reflects instantly without re-opening modal
                if (activeBill) setActiveBill({ ...activeBill, total: parseFloat(billAmountVal), pending: parseFloat(billAmountVal) - activeBill.paid });
                if (showPaymentModal) setShowPaymentModal({ ...showPaymentModal, total: parseFloat(billAmountVal), pending: parseFloat(billAmountVal) - showPaymentModal.paid });
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleAddManualRevenue = async () => {
        if (!manualRevenueForm.patientId || !manualRevenueForm.totalAmount) return;
        setProcessing(true);
        try {
            const res = await addManualRevenue(manualRevenueForm);
            if (res.success) {
                fetchRevenue();
                setShowManualRevenueModal(false);
                setManualRevenueForm({ patientId: '', patientName: '', totalAmount: '', paidAmount: '', mode: 'CASH', notes: '' });
                router.refresh();
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PAID': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'PARTIAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-red-500/20 text-red-400 border-red-500/30';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Financial Collections</h1>
                    <p className="text-gray-400 mt-1">Revenue tracking and manual entries</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex bg-[#1a1525] px-4 py-2 rounded-xl border border-white/10 items-center gap-2">
                        <Search size={16} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent text-white text-sm outline-none placeholder:text-gray-600 w-32 md:w-48"
                        />
                    </div>
                    <button
                        onClick={() => setShowManualRevenueModal(true)}
                        className="flex items-center gap-2 bg-[#b361ea] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition shadow-lg active:scale-95"
                    >
                        <Plus size={16} /> Add Manual Revenue
                    </button>
                    {/* PERIOD FILTERS (STRICT RULE: Filter Today, Range, All) */}
                    <div className="flex bg-[#1a1525] p-1 rounded-xl border border-white/10 shadow-lg">
                    {['today', 'month', 'year', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-[#b361ea] text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* REVENUE METRICS (STRICT RULE: Total Paid, Total Pending) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1a1525] rounded-2xl p-8 border border-white/10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={80} className="text-green-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Collected</p>
                    <h2 className="text-4xl font-black text-white mt-2">₹{metrics.totalPaid.toLocaleString()}</h2>
                    <div className="mt-4 flex items-center gap-2 text-green-400 text-xs font-bold">
                        <DollarSign size={14} />
                        Successfully Reconciled
                    </div>
                </div>

                <div className="bg-[#1a1525] rounded-2xl p-8 border border-white/10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={80} className="text-red-400" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Outstanding Balance</p>
                    <h2 className="text-4xl font-black text-white mt-2">₹{metrics.totalPending.toLocaleString()}</h2>
                    <div className="mt-4 flex items-center gap-2 text-red-100/50 text-xs font-bold italic">
                        <Clock size={14} />
                        Awaiting Collection
                    </div>
                </div>
            </div>

            {/* BILLING TABLE (STRICT RULE: Recompute pending, Audit Trail) */}
            <div className="bg-[#1a1525] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">Patient Transaction</th>
                                <th className="px-8 py-5">Bill Amount</th>
                                <th className="px-8 py-5">Paid</th>
                                <th className="px-8 py-5">Balance</th>
                                <th className="px-8 py-5 text-center">Outcome</th>
                                <th className="px-8 py-5 text-right">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-8"><div className="h-4 bg-white/5 rounded w-1/2"></div></td>
                                    </tr>
                                ))
                            ) : payments.map((p) => (
                                <tr key={p.id} className="hover:bg-white/[0.02] transition group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-black shadow-lg">
                                                {p.patient[0]}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold group-hover:text-[#b361ea] transition">{p.patient}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">#{p.patientId} • {new Date(p.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-white font-bold">₹{p.total.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-green-400 font-bold">₹{p.paid.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-red-400 font-bold blur-[0.3px]">₹{p.pending.toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border tracking-wider ${getStatusStyle(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => setActiveBill(p)}
                                            className="p-2.5 text-gray-400 hover:text-white transition bg-white/5 rounded-xl border border-white/5 hover:border-[#b361ea]/50 hover:bg-[#b361ea]/10"
                                        >
                                            <TrendingUp size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TRANSACTION AUDIT & ADD PAYMENT MODAL */}
            {(activeBill || showPaymentModal) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-[#120e1b] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(179,97,234,0.2)]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black text-white">
                                    {showPaymentModal ? 'Collect Payment' : 'Payment Audit Log'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
                                    Ref: {(activeBill || showPaymentModal).id.slice(-8)}
                                </p>
                            </div>
                            <button
                                onClick={() => { setActiveBill(null); setShowPaymentModal(null); setIsEditingBill(false); }}
                                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Summary Header */}
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 relative">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer</p>
                                    <p className="text-white font-bold">{(activeBill || showPaymentModal).patient}</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    {!isEditingBill ? (
                                        <div className="group cursor-pointer" onClick={() => { setBillAmountVal((activeBill || showPaymentModal).total); setIsEditingBill(true); }}>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-[#b361ea] transition flex items-center justify-end gap-1">Total Bill <Edit size={10} /></p>
                                            <p className="text-white font-bold">₹{(activeBill || showPaymentModal).total.toLocaleString()}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input type="number"
                                                value={billAmountVal}
                                                onChange={e => setBillAmountVal(e.target.value)}
                                                className="w-24 bg-black/50 border border-[#b361ea] rounded text-white px-2 py-1 text-sm outline-none"
                                                autoFocus
                                            />
                                            <button onClick={handleUpdateBillAmount} disabled={processing} className="bg-[#b361ea] text-white px-3 py-1 rounded text-xs font-bold hover:opacity-80 disabled:opacity-50">Save</button>
                                        </div>
                                    )}
                                    <div className="pl-4 border-l border-white/10">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance</p>
                                        <p className="text-red-400 font-black">₹{(activeBill || showPaymentModal).pending.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {showPaymentModal ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount to Collect</label>
                                        <input
                                            type="number"
                                            placeholder="Enter amount..."
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-[#b361ea]/50 transition"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['CASH', 'CARD', 'UPI'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentForm({ ...paymentForm, mode })}
                                                className={`py-3 rounded-xl text-[10px] font-black tracking-widest border transition-all ${paymentForm.mode === mode
                                                    ? 'bg-[#b361ea] border-[#b361ea] text-white shadow-lg'
                                                    : 'bg-white/5 border-white/10 text-gray-400'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder="Note (optional)..."
                                        value={paymentForm.note}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#b361ea]/50 transition h-20 resize-none"
                                    />
                                    <button
                                        onClick={handleAddPayment}
                                        disabled={!paymentForm.amount || processing}
                                        className="w-full py-4 bg-gradient-to-r from-[#b361ea] to-[#eeb0f4] text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : 'Confirm Transaction'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-[#b361ea] uppercase tracking-[0.2em]">Transaction History</h3>
                                        {activeBill.pending > 0 && (
                                            <button
                                                onClick={() => setShowPaymentModal(activeBill)}
                                                className="text-[10px] font-black text-green-400 hover:text-green-300 transition uppercase underline underline-offset-4"
                                            >
                                                Add Payment
                                            </button>
                                        )}
                                    </div>
                                    {activeBill.transactions.length === 0 ? (
                                        <div className="py-8 text-center text-gray-600 italic text-sm">No transaction records found.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {activeBill.transactions.map((t, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-[#b361ea]/20 transition">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                                                            <Receipt size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold">₹{t.amount.toLocaleString()}</p>
                                                            <p className="text-[10px] text-gray-500 font-medium italic">{new Date(t.timestamp).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black px-2 py-1 bg-white/5 rounded text-gray-400 uppercase tracking-tighter">{t.mode}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!showPaymentModal && (
                            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
                                <button
                                    onClick={() => setActiveBill(null)}
                                    className="px-8 py-3 bg-[#b361ea] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg active:scale-95"
                                >
                                    Close Logs
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ADD MANUAL REVENUE MODAL */}
            {showManualRevenueModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-[#120e1b] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(179,97,234,0.2)] flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white">Add Manual Revenue</h2>
                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">New Financial Record</p>
                            </div>
                            <button
                                onClick={() => setShowManualRevenueModal(false)}
                                className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-4">
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select Patient</label>
                                    {!manualRevenueForm.patientId ? (
                                        <div className="relative">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Type patient name or ID..."
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-[#b361ea]/50 transition pl-11"
                                                />
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            </div>
                                            {patientSearch && (
                                                <div className="absolute z-10 w-full mt-2 bg-[#1a1525] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                                    {isSearchingPatients ? (
                                                        <div className="p-4 text-center text-gray-500 text-xs">Searching...</div>
                                                    ) : patientResults.length > 0 ? (
                                                        patientResults.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setManualRevenueForm({ ...manualRevenueForm, patientId: p.id, patientName: p.fullName });
                                                                    setPatientSearch('');
                                                                }}
                                                                className="w-full text-left p-4 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between transition group"
                                                            >
                                                                <div>
                                                                    <p className="text-white font-bold text-sm">{p.fullName}</p>
                                                                    <p className="text-xs text-gray-500">{p.patientId} • {p.phone}</p>
                                                                </div>
                                                                <div className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 group-hover:bg-[#b361ea] group-hover:text-white transition">SELECT</div>
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500 text-xs">No patients found.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-[#b361ea]/10 border border-[#b361ea]/30 rounded-xl p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#b361ea]/20 flex items-center justify-center text-[#b361ea]">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{manualRevenueForm.patientName}</p>
                                                    <p className="text-[10px] text-[#b361ea] uppercase tracking-widest font-black">Selected Patient</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setManualRevenueForm({ ...manualRevenueForm, patientId: '', patientName: '' })}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Bill Amount</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={manualRevenueForm.totalAmount}
                                            onChange={(e) => setManualRevenueForm({ ...manualRevenueForm, totalAmount: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-[#b361ea]/50 transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount Paid Now</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={manualRevenueForm.paidAmount}
                                            onChange={(e) => setManualRevenueForm({ ...manualRevenueForm, paidAmount: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-[#b361ea]/50 transition"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['CASH', 'CARD', 'UPI'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setManualRevenueForm({ ...manualRevenueForm, mode })}
                                                className={`py-3 rounded-xl text-[10px] font-black tracking-widest border transition-all ${manualRevenueForm.mode === mode
                                                    ? 'bg-[#b361ea] border-[#b361ea] text-white shadow-lg'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    placeholder="Notes (optional)..."
                                    value={manualRevenueForm.notes}
                                    onChange={(e) => setManualRevenueForm({ ...manualRevenueForm, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-[#b361ea]/50 transition h-20 resize-none"
                                />
                                <button
                                    onClick={handleAddManualRevenue}
                                    disabled={!manualRevenueForm.patientName || !manualRevenueForm.totalAmount || processing}
                                    className="w-full py-4 bg-gradient-to-r from-[#b361ea] to-[#eeb0f4] text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Processing...' : 'Save Manual Revenue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
