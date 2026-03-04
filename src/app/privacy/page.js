export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-24 px-6 text-slate-700">
            <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
            <p className="text-lg mb-6">Last Updated: January 2026</p>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">1. Data Isolation</h2>
                <p>We use strict clinic-level data isolation. No data is ever shared across different dental practices.</p>

                <h2 className="text-2xl font-bold text-slate-900">2. HIPAA Compliance</h2>
                <p>Our systems are designed with HIPAA-awareness, ensuring that Patient Health Information (PHI) is encrypted at rest and in transit.</p>

                <h2 className="text-2xl font-bold text-slate-900">3. Audit Logging</h2>
                <p>Administrator actions are logged for security and forensic purposes. Logins, data modifications, and security resets are tracked.</p>
            </section>
        </div>
    );
}
