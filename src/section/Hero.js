"use client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

export default function Hero() {
  const containerRef = useRef(null);
  const parentRef = useRef(null);

  const beams = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
  ];

  return (
    <div
      id="hero"
      ref={parentRef}
      className="relative flex items-center justify-center h-screen overflow-hidden bg-gradient-to-b from-black via-[#1a0111] to-[#360825] text-white"
    >
      {/* Falling beams */}
      {beams.map((beam, i) => (
        <Beam key={i} beam={beam} containerRef={containerRef} parentRef={parentRef} />
      ))}

      {/* Hero Content */}
      <section className="z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-tight mb-3">
          Simplify Workflow
        </h1>
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-tight mb-6">
          Centralize Your Practice
        </h2>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed font-body mb-8">
          Manage patients, appointments, and payments with ease — all in one place.
        </p>

        <Link href="/signup">
          <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all transform hover:scale-105 font-body">
            Get Started
          </button>
        </Link>
      </section>

      {/* Bottom collision detection box */}
      <div
        ref={containerRef}
        className="absolute bottom-0 bg-[#360825] w-full h-2 opacity-0 pointer-events-none"
      />
    </div>
  );
}

function Beam({ beam, containerRef, parentRef }) {
  const beamRef = useRef(null);
  const [collision, setCollision] = useState({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

  useEffect(() => {
    const checkCollision = () => {
      if (
        beamRef.current &&
        containerRef.current &&
        parentRef.current &&
        !cycleCollisionDetected
      ) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();

        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;

          setCollision({
            detected: true,
            coordinates: { x: relativeX, y: relativeY },
          });
          setCycleCollisionDetected(true);
        }
      }
    };

    const interval = setInterval(checkCollision, 50);
    return () => clearInterval(interval);
  }, [cycleCollisionDetected]);

  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
      }, 2000);

      setTimeout(() => {
        setBeamKey(prev => prev + 1);
      }, 2000);
    }
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beam.initialY || "-200px",
          translateX: beam.initialX || "0px",
        }}
        variants={{
          animate: {
            translateY: beam.translateY || "1800px",
            translateX: beam.translateX || "0px",
          },
        }}
        transition={{
          duration: beam.duration || 8,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          delay: beam.delay || 0,
          repeatDelay: beam.repeatDelay || 0,
        }}
        className={`absolute left-0 top-20 w-px h-14 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent ${beam.className || ""}`}
      />

      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Deterministic Explosion (React 19 Safe)
function Explosion(props) {
  // deterministic hash → number
  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h >>> 0;
  }

  // Mulberry32 PRNG
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const seed =
    props?.style?.left?.toString() +
    props?.style?.top?.toString();

  const rand = mulberry32(hashString(seed));

  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(rand() * 80 - 40),
    directionY: Math.floor(rand() * -50 - 10),
    duration: rand() * 1.5 + 0.5,
  }));

  return (
    <div {...props} className={`absolute z-50 h-2 w-2 ${props?.className || ""}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-[#6E2B62] to-transparent blur-sm"
      />

      {spans.map(span => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{ x: span.directionX, y: span.directionY, opacity: 0 }}
          transition={{ duration: span.duration, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-[#6E2B62] to-[#360825]"
        />
      ))}
    </div>
  );
}
