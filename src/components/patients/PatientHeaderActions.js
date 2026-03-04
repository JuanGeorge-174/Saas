'use client';

import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportPatients, importPatients } from '@/app/actions/patients';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';

export default function PatientHeaderActions({ role }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleExport = async () => {
        setLoading(true);
        try {
            const result = await exportPatients();
            if (result.success) {
                const blob = new Blob([result.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
            } else {
                alert(result.error);
            }
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const res = await importPatients(results.data);
                    if (res.success) {
                        alert(`Successfully imported ${res.count} patients.`);
                        router.refresh();
                    } else {
                        alert(res.error);
                    }
                } catch (err) {
                    alert('Import failed');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    return (
        <div className="flex gap-3">
            {role === 'ADMIN' && (
                <>
                    <button
                        onClick={handleExport}
                        className="bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl text-gray-300 font-bold flex items-center gap-2 transition"
                    >
                        <Download size={20} /> Export
                    </button>
                    <label className="bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-3 rounded-xl text-indigo-400 font-bold flex items-center gap-2 transition cursor-pointer">
                        <Upload size={20} /> Import
                        <input
                            type="file"
                            className="hidden"
                            accept=".csv"
                            onChange={handleImport}
                        />
                    </label>
                </>
            )}
        </div>
    );
}
