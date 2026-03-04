import React from 'react';
import { getPatients } from '@/app/actions/patients';
import { getSession } from '@/lib/auth/session';
import PatientTable from '@/components/patients/PatientTable';
import { Plus, Download, Upload } from 'lucide-react';
import Link from 'next/link';

export default async function PatientsPage({ searchParams }) {
    const session = await getSession();
    if (!session) return null;

    const { search, sort, order, startDate, endDate } = await searchParams;

    const result = await getPatients({
        search,
        sort,
        order,
        startDate,
        endDate
    });

    const patients = result.success ? result.patients : [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Patient Directory</h1>
                    <p className="text-gray-400 mt-1">Production-grade secure medical records</p>
                </div>
                <div className="flex gap-3">
                    {session.role === 'ADMIN' && (
                        <>
                            <button className="bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl text-gray-300 font-bold flex items-center gap-2 transition">
                                <Download size={20} /> Export
                            </button>
                            <button className="bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-3 rounded-xl text-indigo-400 font-bold flex items-center gap-2 transition">
                                <Upload size={20} /> Import
                            </button>
                        </>
                    )}

                    <Link
                        href="/admin/patients/register"
                        className="bg-[#b361ea] hover:bg-[#9D3DD4] px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={20} /> Register Patient
                    </Link>
                </div>
            </div>

            {/* Filter Section (Server-side handled via URL) */}
            <div className="bg-[#1a1525] p-6 rounded-2xl border border-white/5 flex flex-wrap gap-4">
                {/* Search & Sort UI would go here - abstracted to Client Component for better UX if needed */}
                <p className="text-gray-500 italic text-sm">Server-side filtering & sorting enabled via search parameters.</p>
            </div>

            <PatientTable
                patients={patients}
                role={session.role}
            // onEdit and onView would navigate to sub-pages or open modals via state management
            />
        </div>
    );
}
