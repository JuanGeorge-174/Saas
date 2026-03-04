import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getPatients } from '@/app/actions/patients';
import PatientSearch from '@/components/patients/PatientSearch';
import PatientTable from '@/components/patients/PatientTable';
import PatientHeaderActions from '@/components/patients/PatientHeaderActions';
import PatientSortControl from '@/components/patients/PatientSortControl';

export default async function PatientsPage({ searchParams }) {
    const session = await getSession();
    if (!session) return null;

    const queryParams = await searchParams;
    const { search, sort, order, startDate, endDate } = queryParams;

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
                <div className="flex gap-3 items-center">
                    <PatientHeaderActions role={session.role} />

                    <Link
                        href="/admin/patients/register"
                        className="bg-[#b361ea] hover:bg-[#9D3DD4] px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={20} /> Register Patient
                    </Link>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-[#1a1525] p-6 rounded-2xl border border-white/5 flex flex-wrap gap-4 items-center justify-between">
                <PatientSearch defaultValue={search} />

                <div className="flex gap-4 items-center">
                    <div className="bg-white/5 rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 uppercase font-black">Sort</span>
                        <PatientSortControl value={sort || 'fullName'} />
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest hidden md:block">Server-side Data Grid</p>
                </div>
            </div>

            <PatientTable
                patients={patients}
                role={session.role}
            />
        </div>
    );
}
