import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (countryId: string, enableGeolocation: boolean) => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [requesting, setRequesting] = useState(false);

  if (!isOpen) return null;

  const handleEnable = () => {
    setRequesting(true);
    if (navigator.geolocation && typeof navigator.geolocation.getCurrentPosition === 'function') {
      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setRequesting(false);
            onComplete('840', true); // Default home country '840' (USA), with geolocation = true
          },
          (error) => {
            console.error("Geolocation error callback:", error);
            setRequesting(false);
            onComplete('840', false); // Fallback to false if user blocks it
          }
        );
      } catch (error) {
        console.error("Synchronous geolocation error:", error);
        setRequesting(false);
        onComplete('840', false);
      }
    } else {
      setRequesting(false);
      onComplete('840', false);
    }
  };

  const handleSkip = () => {
    onComplete('840', false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Simple Pop-up Dialog Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 z-50 text-slate-850 flex flex-col items-center text-center"
      >
        {/* Animated Icon Container */}
        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 relative">
          <Navigation className="w-6 h-6 text-indigo-650 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2">
          Enable Geolocation?
        </h3>
        <p className="text-xs text-slate-500 font-sans leading-relaxed mb-6 px-1">
          Gloko uses your location to automatically center the map on your region and personalize your home travel coordinates.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            type="button"
            disabled={requesting}
            onClick={handleEnable}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{requesting ? 'Enabling...' : 'Yes, Enable Location'}</span>
          </button>

          <button
            type="button"
            disabled={requesting}
            onClick={handleSkip}
            className="w-full py-2 text-slate-500 hover:text-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </div>
  );
}
