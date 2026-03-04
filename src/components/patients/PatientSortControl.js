'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function PatientSortControl({ value = 'fullName' }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const onChange = (e) => {
        const params = new URLSearchParams(searchParams);
        params.set('sort', e.target.value);
        if (!params.get('order')) params.set('order', 'asc');
        router.push(`?${params.toString()}`);
    };

    return (
        <select
            value={value || 'fullName'}
            onChange={onChange}
            className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer"
        >
            <option value="fullName">Name</option>
            <option value="patientId">ID</option>
            <option value="lastVisitDate">Last Visit</option>
            <option value="createdAt">Registered</option>
        </select>
    );
}


