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
      
      {/* Fixed map representation from the main menu, beautifully blurred */}
      <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
        <svg 
          className="w-full h-full opacity-55 scale-105" 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="xMidYMid slice"
          style={{ filter: 'blur(8px)' }}
        >
          {/* North America */}
          <path d="M 120,80 L 150,60 L 220,50 L 250,70 L 280,60 L 290,110 L 250,130 L 220,130 L 180,180 L 190,200 L 170,250 L 140,230 L 160,195 L 140,160 L 110,140 L 100,110 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 270,30 L 310,25 L 340,35 L 320,60 L 280,60 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* Greenland */}
          
          {/* South America */}
          <path d="M 170,260 L 190,265 L 225,290 L 250,330 L 230,390 L 210,430 L 195,450 L 190,440 L 190,400 L 170,340 L 160,290 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          
          {/* Africa */}
          <path d="M 420,185 L 450,180 L 490,190 L 510,220 L 530,240 L 535,270 L 510,320 L 490,350 L 475,340 L 470,295 L 440,280 L 415,240 L 405,200 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 535,310 L 545,315 L 540,340 L 532,335 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* Madagascar */}

          {/* Eurasia (Europe + Asia) */}
          <path d="M 390,150 L 390,120 L 420,100 L 450,60 L 500,50 L 600,45 L 750,45 L 820,60 L 850,90 L 840,130 L 810,160 L 830,190 L 790,210 L 760,180 L 730,225 L 680,240 L 660,190 L 610,200 L 580,235 L 560,200 L 521,215 L 480,180 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          
          {/* Australia & Oceania */}
          <path d="M 720,330 L 750,320 L 790,340 L 780,380 L 740,380 L 710,350 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 795,395 L 805,405 L 810,395 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" /> {/* New Zealand */}
          
          {/* Great Britain & Iceland */}
          <path d="M 380,85 L 390,95 L 380,105 L 375,95 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
          <path d="M 330,65 L 345,60 L 340,75 Z" fill="#f4f1ea" stroke="#b2a897" strokeWidth="1" />
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

          {/* Central Pulsating Badge with Favicon */}
          <motion.div
            className="relative w-16 h-16 bg-white border border-slate-200 shadow-[0_8px_20px_rgba(15,23,42,0.06)] rounded-2xl flex items-center justify-center p-3.5 select-none pointer-events-none"
            animate={{
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img src="/favicon.png" alt="GLOKO" className="w-full h-full object-contain pointer-events-none select-none" />
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
            className="text-base sm:text-lg font-sans font-extrabold uppercase tracking-widest text-[#0a1e35] flex items-center justify-center select-none"
          >
            GL
            <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_2px_5px_rgba(15,23,42,0.1)] p-[2.5px]">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
            </span>
            K
            <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_2px_5px_rgba(15,23,42,0.1)] p-[2.5px]">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
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
