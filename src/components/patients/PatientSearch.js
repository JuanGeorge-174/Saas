'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming a debounce hook exists or creating it

export default function PatientSearch({ defaultValue }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(defaultValue || '');

    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }
        router.push(`?${params.toString()}`);
    }, [debouncedSearch]);

    return (
        <div className="flex flex-1 max-w-md bg-white/5 rounded-xl border border-white/10 px-4 py-2 items-center gap-3 group focus-within:border-[#b361ea]/50 transition">
            <Search size={18} className="text-gray-500 group-focus-within:text-[#b361ea]" />
            <input
                type="text"
                placeholder="Search by Name, Phone, or ID..."
                className="bg-transparent text-sm text-white outline-none w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    );
}
