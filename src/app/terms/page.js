export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-24 px-6 text-slate-700">
            <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
            <p className="text-lg mb-6">Last Updated: January 2026</p>

            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">1. License</h2>
                <p>We grant you a non-exclusive license to use DentalOS for your clinical practice based on your subscription tier.</p>

                <h2 className="text-2xl font-bold text-slate-900">2. Accuracy of Data</h2>
                <p>You are responsible for the accuracy of clinical notes and patient records entered into the system.</p>

                <h2 className="text-2xl font-bold text-slate-900">3. Termination</h2>
                <p>Failure to comply with payment terms may result in account suspension after the 7-day grace period.</p>
            </section>
        </div>
    );
}
