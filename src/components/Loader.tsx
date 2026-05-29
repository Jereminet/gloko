import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Star, Plane } from 'lucide-react';

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
    <div className="fixed inset-0 min-h-screen bg-[#eef5fc] flex flex-col items-center justify-center overflow-hidden z-50 select-none">
      
      {/* Decorative background grid with radial fade */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,rgba(238,245,252,0)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

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

          {/* Central Pulsating Globe Passport Icon */}
          <motion.div
            className="relative w-16 h-16 bg-white border border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.06)] rounded-2xl flex items-center justify-center text-indigo-500"
            animate={{
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Compass className="h-8 w-8 text-indigo-600 animate-pulse" />
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
            className="text-lg font-black tracking-widest uppercase italic font-sans select-none"
            style={{
              WebkitTextStroke: '0.65px #000000',
              WebkitTextFillColor: '#ffffff',
              color: '#ffffff',
              textShadow: '1.5px 2px 0px rgba(0, 0, 0, 0.15)'
            }}
          >
            GLOKO EXPEDITION
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

        {/* Background Coordinates Line Decorator */}
        <p className="font-mono text-[9px] text-slate-400 mt-12 tracking-widest uppercase">
          METRES • RADS • EQUATORIAL PLANE
        </p>
      </div>
    </div>
  );
}
