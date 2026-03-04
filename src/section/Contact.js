"use client";
import React, { useEffect, useState } from "react";

function ContactContent() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a000a] text-white bg-[radial-gradient(circle,rgba(54,8,37,1)_0%,rgba(54,8,37,1)_35%,rgba(0,0,0,1)_100%)]">
      <main className="flex-grow">
        <section id="contact" className="py-24 px-6 mt-30 text-center relative z-10">
          <div className="absolute top-0 left-0 w-full h-[300px]"></div>
          <h2 className="text-4xl font-extrabold mb-6 z-10 relative">Let's Get In Touch</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6 relative z-10">
            Have questions? Reach out and we'll get back to you shortly.
          </p>
          <form className="max-w-xl mx-auto grid gap-4 z-10 relative">
            <input
              type="text"
              placeholder="Your Name"
              autoComplete="off"
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/60"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              autoComplete="off"
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/60"
              required
            />
            <textarea
              placeholder="Your Message"
              rows={4}
              className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/60"
              required
            />
            <button
              type="submit"
              className="py-3 w-full h-11 px-4 text-base rounded-full font-semibold text-white bg-gradient-to-r from-[#ff66cc] to-[#4d0733] shadow hover:scale-105 hover:shadow-[#ff66cc]/40 transition-all duration-300"
            >
              Send Message
            </button>
          </form>
        </section>
      </main>

      <footer className="w-full py-6 text-center text-white/60 text-sm border-t border-white/10">
        © {new Date().getFullYear()} Noctira. All rights reserved.
      </footer>
    </div>
  );
}

export default function Contact() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay state update to prevent synchronous setState warning
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return <ContactContent />;
}
