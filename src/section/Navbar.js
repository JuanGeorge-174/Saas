"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const navlinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#price" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const handleLinkClick = () => setMobileMenuOpen(false);

  return (
    <header className={`${poppins.className} fixed top-0 left-0 right-0 z-50 w-full px-6 lg:px-8 backdrop-blur-xl bg-black/30 border-b border-white/5`}>
      <div className="max-w-7xl mx-auto py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-white tracking-tight">
            <span className="flex items-center gap-2">
              <span className="h-6 w-6 rounded bg-gradient-to-r from-[#ff66cc] to-[#360825]" />
              Noctira
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex text-md items-center gap-8 text-white font-[550]">
            {navlinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="relative group text-white/80 hover:text-white transition-colors duration-200"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#ff66cc] to-[#360825] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-4 z-50">
            {/* Desktop Buttons */}
            <div className="hidden md:flex gap-2">
              <Link href="/login">
                <button className="h-11 px-6 text-base font-medium rounded-full border border-white/60 text-white/80 hover:text-white hover:bg-white/10 transition duration-300">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="h-11 px-6 text-base rounded-full font-semibold text-white bg-gradient-to-r from-[#ff66cc] to-[#360825] shadow-md hover:scale-105 hover:shadow-[#ff66cc]/50 transition-all duration-300">
                  Sign Up
                </button>
              </Link>
            </div>

            {/* Hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 w-full z-40 bg-[#0a000a] text-white p-6 pt-24 space-y-6 md:hidden backdrop-blur-xl shadow-xl border-t border-white/10"
            >
              {navlinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="block text-lg font-medium bg-gradient-to-r from-[#ff66cc] to-[#360825] bg-clip-text text-white/80 hover:text-white transition-colors duration-200 hover:scale-105 "
                >
                  {link.label}
                </a>
              ))}

              <div className="flex flex-col gap-3 pt-6">
                <Link href="/login" onClick={handleLinkClick}>
                  <button className="w-full h-11 px-4 text-base rounded-xl border border-white/60 text-white/80 hover:text-white hover:bg-white/10 transition duration-300">
                    Login
                  </button>
                </Link>
                <Link href="/signup" onClick={handleLinkClick}>
                  <button className="w-full h-11 px-4 text-base rounded-full font-semibold text-white bg-gradient-to-r from-[#ff66cc] to-[#360825] shadow hover:scale-105 hover:shadow-[#ff66cc]/40 transition-all duration-300">
                    Sign Up
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
