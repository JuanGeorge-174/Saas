"use client";
import React from "react";

export default function Price() {
  const plans = [
    {
      name: "Starter",
      price: "29.00",
      period: "/month",
      description: "Perfect for individuals starting out",
      features: ["Basic Analytics", "1 User", "Email Support"],
      buttonText: "Start for free",
      dark: true,
    },
    {
      name: "Pro",
      price: "79.00",
      period: "/month",
      description: "Advanced tools for teams",
      features: ["Full Analytics", "5 Users", "Priority Support"],
      buttonText: "Get started",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "199.00",
      period: "/month",
      description: "Ultimate tools for large orgs",
      features: ["All Features", "Unlimited Users", "Dedicated Manager"],
      buttonText: "Contact us",
      dark: true,
    },
  ];

  return (
    <section
      id="price"
      className="relative bg-[#0a000a] text-white py-24 px-6 md:px-12 overflow-hidden"
    >
      {/* Top Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff66cc]/40 via-[#cc3399]/30 to-transparent blur-[120px]" />
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-[-1px] left-0 w-full h-20 bg-gradient-to-t from-[#0a000a] to-transparent z-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-sm text-white/60 mb-3">Plans that suit you</p>
          <h2 className="text-4xl font-extrabold mb-4">
            <span className="text-white">Noctira</span>{" "}
            <span className="text-[#ff66cc]">Pricing Plans</span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-lg">
            Start and scale your productivity with our flexible pricing.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 backdrop-blur-md border transition-all duration-300 ${
                plan.highlight
                  ? "bg-gradient-to-b from-white/5 via-[#991f5d]/20 to-[#360825]/10 border-[#ff66cc]/40 shadow-lg shadow-[#ff66cc]/30 scale-100 hover:scale-[1.05] hover:shadow-[0_0_30px_#ff66cc50]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:scale-[1.02]"
              }`}
            >
              <h3 className="text-xl font-semibold mb-4 text-white/90">
                {plan.name}
              </h3>
              <div className="text-4xl font-extrabold text-white mb-1">
                {plan.price}
                <span className="text-lg font-medium text-white/60 ml-1">
                  {plan.period}
                </span>
              </div>
              <p className="text-white/60 text-sm mb-6">{plan.description}</p>

              <button
                className={`w-full py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.highlight
                    ? "bg-gradient-to-r from-[#ff66cc] to-[#cc3399] text-white hover:from-[#ff4db8] hover:to-[#b32d91] "
                    : "bg-black/20 text-white hover:bg-white/20"
                }`}
              >
                {plan.buttonText}
              </button>

              <ul className="mt-8 space-y-4 text-white/70 text-sm">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start">
                    <svg
                      className="w-5 h-5 mr-3 text-green-400 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-24 mb-11 text-white/50 text-sm">
          All plans include a 2-day free trial – no credit card required.
        </div>
      </div>
    </section>
  );
}
