import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth/tokens';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
    Home,
    Users,
    Calendar,
    RefreshCcw,
    DollarSign,
    Settings,
    LogOut,
    Shield,
    Package,
    ClipboardList,
    UserCog,
    Building2,
    User
} from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';

export default async function DashboardLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    let user = null;
    if (token) {
        user = verifyAccessToken(token);
    }

    if (!user) {
        redirect('/login?reason=unauthorized');
    }

    const role = user.role;
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isDoctor = role === 'DOCTOR';
    const isReceptionist = role === 'RECEPTIONIST';

    // Base paths for different roles
    let basePath = '/admin';
    if (isSuperAdmin) basePath = '/super-admin';
    else if (isDoctor) basePath = '/doctor';
    else if (isReceptionist) basePath = '/reception';

    return (
        <div className="flex h-screen overflow-hidden bg-[#0e0b13]">
            {/* Sidebar - Dark Purple Theme */}
            <aside className="w-64 bg-[#120e1b] border-r border-gray-800/50 flex flex-col fixed h-screen shadow-2xl z-30">
                {/* Logo & User Profile */}
                <div className="p-6 border-b border-gray-800/50">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-bold shadow-lg">
                            {user?.clinicName?.[0] || user?.fullName?.[0] || 'C'}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-white truncate">
                                {user?.clinicName || 'Clinic'}
                            </h2>
                            <p className="text-xs text-gray-400 truncate">{user?.fullName || 'User'}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {isSuperAdmin ? (
                        <>
                            <SidebarLink href="/super-admin" icon={<Home size={18} />} label="Global Overview" />
                            <SidebarLink href="/super-admin/clinics" icon={<Building2 size={18} />} label="All Clinics" />
                        </>
                    ) : (
                        <>
                            <SidebarLink href={basePath} icon={<Home size={18} />} label="Dashboard" />
                            <SidebarLink href="/admin/patients" icon={<Users size={18} />} label="Patients" />
                            <SidebarLink href="/admin/appointments" icon={<Calendar size={18} />} label="Appointments" />
                            <SidebarLink href="/admin/recalls" icon={<RefreshCcw size={18} />} label="Recalls" />
                            <SidebarLink href="/admin/revenue" icon={<DollarSign size={18} />} label="Revenue" />

                            {isAdmin && (
                                <>
                                    <SidebarLink href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-3 mb-4 p-3 bg-[#1a1525] rounded-lg">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#b361ea] to-[#eeb0f4] flex items-center justify-center text-white font-bold text-sm">
                            {user?.fullName?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'User'}</p>
                            <p className="text-[10px] font-medium text-gray-400 uppercase">{role}</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 flex flex-col min-w-0 bg-[#0e0b13] relative overflow-hidden">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 relative scroll-smooth custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto pb-20">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarLink({ href, icon, label }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
            <span className="text-gray-500 group-hover:text-[#b361ea] transition-colors">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}
