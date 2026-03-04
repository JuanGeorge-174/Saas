"use client";

const features = [
  {
    title: "All-in-One Practice Management",
    description:
      "Manage appointments, billing, records, and insights under one sleek dashboard.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    title: "Secure & Compliant",
    description:
      "HIPAA-ready and cloud-encrypted. Your data stays safe, private, and compliant.",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    title: "Scalable as You Grow",
    description:
      "From solo practice to multiple branches - the system grows with your clinic.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    title: "Smart Navigation",
    description:
      "Your staff finds everything instantly with a clean, focused layout.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Seamless Integration",
    description:
      "Easily connects with your current tools - no disruption, just improvements.",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    title: "Real-Time Insights",
    description:
      "Track performance, revenue, and patients live. Make smarter decisions.",
    gradient: "from-teal-500/20 to-blue-500/20",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="min-h-screen bg-black flex flex-col justify-center py-16 px-4 md:px-12 lg:px-16"
    >
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-white text-4xl md:text-5xl font-extrabold text-center mt-4 mb-16">
          Why Choose Us
        </h2>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 w-full">
            {features.map((item, index) => (
              <div
                key={index}
                className={`group w-full sm:w-[90%] md:w-full h-80 p-6 md:p-8 rounded-2xl border border-white/10 
                bg-[#09090b] relative overflow-hidden flex flex-col 
                transition-all duration-500 hover:scale-105 hover:shadow-2xl 
                animate-fadeInUp`}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "both",
                }}
              >
                {/* Glow on Hover */}
                <div
                  className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                  transition-opacity duration-500 pointer-events-none 
                  bg-gradient-to-br ${item.gradient}`}
                />

                {/* Icon Placeholder */}
                <div
                  className={`w-14 h-14 mb-6 rounded-xl flex items-center justify-center 
                  shadow-lg z-10 relative group-hover:scale-110 group-hover:rotate-3 
                  transition-transform duration-300 bg-white/10`}
                >
                  <div className="w-7 h-7 bg-white rounded-full" />
                </div>

                {/* Text */}
                <div className="flex-1 flex flex-col z-10 relative">
                  <h3 className="text-xl font-semibold text-white mb-4 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed text-base flex-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
