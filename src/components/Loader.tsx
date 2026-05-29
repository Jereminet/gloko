import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Star, Plane } from 'lucide-react';

export default function Loader() {
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    'Opening Travel Journal...',
    'Validating Passport Stamps...',
    'Scanning Global Coordinate Meridians...',
    'Rounding the Equator...',
    'Syncing Globetrotter Network...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 750);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 min-h-screen bg-[#d4e5f7] flex flex-col items-center justify-center overflow-hidden z-50 select-none">
      
      {/* Decorative full-screen ocean SVG background with Waves, Sailboats, Submarines, and Fish schools */}
      <div className="absolute inset-0 pointer-events-none w-full h-full">
        <svg className="w-full h-full opacity-60" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" fill="none">
          {/* Scattered Waves */}
          <g transform="translate(100, 100)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g transform="translate(350, 120)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g transform="translate(150, 450)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g transform="translate(450, 480)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g transform="translate(850, 150)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <g transform="translate(750, 420)" opacity="0.65">
            <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Sailboat */}
          <g transform="translate(200, 180) scale(1.2)" opacity="0.75">
            <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
            <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
            <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
            <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
          </g>
          <g transform="translate(800, 320) scale(1.1) rotate(5)" opacity="0.75">
            <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
            <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
            <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
            <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
          </g>

          {/* Submarine */}
          <g transform="translate(680, 160) scale(1.1)" opacity="0.75">
            <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
            <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#69869c" stroke="#49657a" strokeWidth="0.75" />
            <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
            <circle cx="1" cy="0" r="1.3" fill="#ffffff" />
          </g>

          {/* Fish School */}
          <g transform="translate(500, 280) scale(1.2)" opacity="0.7">
            <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
            <g transform="translate(10, -5) scale(0.8)">
              <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
            </g>
          </g>
        </svg>
      </div>

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        
        {/* Container for Centered Animated Radar and Globe */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          
          {/* Inner pulsating glow */}
          <motion.div
            className="absolute w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Outer Rotating Orbit (Orbit 1) */}
          <motion.div
            className="absolute border border-indigo-500/10 w-36 h-36 rounded-full border-dashed"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* Solid Indigo Accent Orbit with Plane (Orbit 2) */}
          <motion.div
            className="absolute border border-indigo-400/20 w-32 h-32 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            {/* Plane traveling along orbit */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-650">
              <Plane className="h-4 w-4 transform rotate-[45deg] drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
            </div>
          </motion.div>

          {/* Indigo Orbit with star (Orbit 3) */}
          <motion.div
            className="absolute border border-indigo-300/30 w-24 h-24 rounded-full"
            animate={{ rotate: 180 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-indigo-500">
              <Star className="h-2 w-2 fill-indigo-550" />
            </div>
          </motion.div>

          {/* Central Pulsating Pin Icon inside White Square */}
          <motion.div
            className="relative w-16 h-16 bg-white border border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.06)] rounded-2xl flex items-center justify-center text-indigo-505"
            animate={{
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <MapPin className="h-8 w-8 text-indigo-600 animate-pulse fill-indigo-50/50" />
          </motion.div>
        </div>

        {/* Loading text headings with premium Typography styling */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2"
        >
          <h2 
            className="text-base sm:text-lg font-sans font-semibold uppercase tracking-wide text-slate-800 flex items-center justify-center select-none"
          >
            GL
            <span className="inline-flex items-center justify-center h-[0.74em] w-[0.74em] mx-[0.04em] align-middle mt-[-0.08em] select-none pointer-events-none">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none" />
            </span>
            K
            <span className="inline-flex items-center justify-center h-[0.74em] w-[0.74em] mx-[0.04em] align-middle mt-[-0.08em] select-none pointer-events-none">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none" />
            </span>
          </h2>
          <div className="h-6 overflow-hidden flex items-center justify-center">
            <motion.p
              key={statusIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="text-xs font-sans font-semibold text-indigo-600 flex items-center gap-1.5"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-505 animate-ping mr-0.5" />
              {statuses[statusIndex]}
            </motion.p>
          </div>
        </motion.div>

        {/* Minimal Progress Line Accent */}
        <div className="w-48 bg-slate-205 h-1.5 rounded-full overflow-hidden mt-6 border border-slate-200">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-750"
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
    </div>
  );
}
