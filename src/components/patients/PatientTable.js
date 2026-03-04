'use client';

import React, { useState } from 'react';
import { Edit, Phone, Clock } from 'lucide-react';
import PatientModal from './PatientModal';
import { getPatientDetail } from '@/app/actions/patients';

export default function PatientTable({ patients, role }) {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRowClick = async (id) => {
        try {
            const result = await getPatientDetail(id);
            if (result.success) {
                setSelectedPatient(result.patient);
                setIsModalOpen(true);
            } else {
                alert(result.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!patients || patients.length === 0) {
        return (
            <div className="bg-[#1a1525] rounded-xl border border-white/10 p-20 text-center text-gray-500 italic">
                No patient records found.
            </div>
        );
    }

    return (
        <>
            <div className="bg-[#1a1525] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-5">Patient Name & ID</th>
                                <th className="px-6 py-5">Age / Gender</th>
                                <th className="px-6 py-5">Last Visit</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {patients.map((patient) => (
                                <tr
                                    key={patient.id}
                                    className="hover:bg-white/[0.02] transition group cursor-pointer"
                                    onClick={() => handleRowClick(patient.id)}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/10">
                                                {patient.fullName?.[0] || 'P'}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium group-hover:text-[#b361ea] transition">{patient.fullName}</p>
                                                <p className="text-[10px] text-gray-500 tracking-tighter">ID: {patient.patientId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-sm text-gray-300 font-medium">{patient.age}y</span>
                                        <span className="mx-2 text-gray-600">/</span>
                                        <span className="text-xs text-gray-400 uppercase">{patient.gender}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-indigo-400" />
                                            <span className="text-sm text-indigo-100 font-semibold blur-[0.2px]">
                                                {patient.lastVisitDate ? new Date(patient.lastVisitDate).toLocaleDateString() : 'Never'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRowClick(patient.id);
                                            }}
                                            className="p-2 text-gray-500 hover:text-white transition bg-white/5 rounded-lg group-hover:bg-[#b361ea] group-hover:text-white"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                patient={selectedPatient}
                role={role}
            />
        </>
    );
}
