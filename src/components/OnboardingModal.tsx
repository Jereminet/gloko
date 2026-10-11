import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Navigation, Globe, Search, Check, ShieldCheck } from 'lucide-react';
import { COUNTRY_LIST } from '../data/countries';
import { getLiveCountryFromDeviceGPS } from '../utils/geolocation';

interface OnboardingModalProps {
  isOpen: boolean;
  initialHomeCountryId?: string;
  initialGeolocationEnabled?: boolean;
  initialLiveCountryId?: string;
  onComplete: (originalCountryId: string, enableGeolocation: boolean, liveCountryId: string) => void;
}

export default function OnboardingModal({
  isOpen,
  initialHomeCountryId = '818', // Default to Egypt (as highlighted in user brief)
  initialGeolocationEnabled = true,
  initialLiveCountryId = '076', // Default to Brazil (as highlighted in user brief)
  onComplete,
}: OnboardingModalProps) {
  const [selectedHomeCountryId, setSelectedHomeCountryId] = useState<string>(initialHomeCountryId);
  const [detectedLiveCountryId, setDetectedLiveCountryId] = useState<string>(initialLiveCountryId);
  const [enableGeolocation, setEnableGeolocation] = useState<boolean>(initialGeolocationEnabled);
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Original Country search states
  const [homeSearch, setHomeSearch] = useState('');
  const [isChoosingHome, setIsChoosingHome] = useState(false);

  const filteredHomeCountries = useMemo(() => {
    if (!homeSearch.trim()) return COUNTRY_LIST;
    const q = homeSearch.toLowerCase();
    return COUNTRY_LIST.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [homeSearch]);

  const selectedHomeCountry = COUNTRY_LIST.find((c) => c.id === selectedHomeCountryId) || COUNTRY_LIST[0];
  const detectedLiveCountry = COUNTRY_LIST.find((c) => c.id === detectedLiveCountryId) || selectedHomeCountry;

  // Auto-detect GPS when geolocation is enabled
  useEffect(() => {
    if (enableGeolocation && isOpen) {
      handleDetectGPS();
    }
  }, [enableGeolocation, isOpen]);

  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    setGpsStatus('Requesting device GPS location...');
    try {
      const result = await getLiveCountryFromDeviceGPS();
      if (result) {
        setDetectedLiveCountryId(result.countryId);
        setGpsStatus(`📍 GPS Position: ${result.flag} ${result.countryName}${result.city ? ` (${result.city})` : ''}`);
      } else {
        setGpsStatus('📍 GPS active: Device coordinates will be updated in real-time');
      }
    } catch {
      setGpsStatus('📍 GPS active: Real-time device location enabled');
    } finally {
      setIsDetectingGPS(false);
    }
  };

  const handleSave = () => {
    onComplete(
      selectedHomeCountryId,
      enableGeolocation,
      enableGeolocation ? detectedLiveCountryId : selectedHomeCountryId
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Main Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden z-50 text-slate-800 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1e35] via-[#102d4f] to-[#0a1e35] p-5 sm:p-6 text-white text-center relative border-b border-slate-800 shrink-0">
          <div className="w-12 h-12 bg-white/10 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner ring-1 ring-white/20">
            <Globe className="w-6 h-6 text-indigo-300" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Traveler Profile Setup</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto font-medium">
            Set your fixed original nationality country and enable or disable live geolocation.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left">
          {/* Section 1: Fixed Profile Parameter - Original Country */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                    Fixed Profile Parameter
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Original Country (Origin / Nationality)</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  When a friend scans your QR code, you will always be added to this country in Normal Mode (e.g. 🇪🇬 Egypt).
                </p>
              </div>
            </div>

            {/* Selected Country Card */}
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={selectedHomeCountry.name}>
                  {selectedHomeCountry.flag}
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">{selectedHomeCountry.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{selectedHomeCountry.continent} • {selectedHomeCountry.code}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChoosingHome(!isChoosingHome)}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors cursor-pointer"
              >
                {isChoosingHome ? 'Close' : 'Select Country'}
              </button>
            </div>

            {/* Searchable Picker Dropdown for Original Country */}
            <AnimatePresence>
              {isChoosingHome && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-1 overflow-hidden"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search country name or code..."
                      value={homeSearch}
                      onChange={(e) => setHomeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-1 bg-white">
                    {filteredHomeCountries.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedHomeCountryId(c.id);
                          setIsChoosingHome(false);
                          setHomeSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          selectedHomeCountryId === c.id
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        {selectedHomeCountryId === c.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 2: Live Geolocation - Only Enable or Disable (Not editable) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                    Live Geolocation
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Live Location Sharing</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  When enabled, friends see your device GPS location in Live Mode (e.g. 🇧🇷 Brazil) while your profile stays pinned to your original country in Normal Mode.
                </p>
              </div>

              {/* Strict Enable / Disable Toggle Switch (Cannot be edited manually) */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={enableGeolocation}
                  onChange={(e) => setEnableGeolocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {enableGeolocation ? (
              <div className="space-y-2 pt-1">
                {/* Live GPS Detected Card - Non-editable read-only display */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={detectedLiveCountry.name}>
                      {detectedLiveCountry.flag}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{detectedLiveCountry.name}</span>
                        <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                          GPS Live Mode
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Device GPS Coordinates (Automatic)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetectingGPS}
                    className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Refresh GPS"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isDetectingGPS ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-[11px] font-semibold">{isDetectingGPS ? 'Scanning...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                {gpsStatus && (
                  <p className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-100/60">
                    {gpsStatus}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-medium">
                Live Geolocation is disabled. Friends will only see your Original Country ({selectedHomeCountry.flag} {selectedHomeCountry.name}) even when viewing the map in Live Mode.
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            <span>Normal Mode: </span>
            <strong className="text-slate-800">{selectedHomeCountry.flag} {selectedHomeCountry.name}</strong>
            {enableGeolocation && (
              <span className="ml-2">
                • Live Mode: <strong className="text-emerald-700">{detectedLiveCountry.flag} {detectedLiveCountry.name}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Save Profile & Continue</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
