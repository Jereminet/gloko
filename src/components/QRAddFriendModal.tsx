import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, X, Copy, Check, Upload, CheckCircle, Search, Compass, ShieldAlert, Heart } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { COUNTRY_LIST } from '../data/countries';

interface QRAddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any; // User profile
  homeCountryId: string;
  onAddFriendFromQR: (friendData: { name: string; countryId: string; city: string; contact: string; notes: string }) => void;
}

export default function QRAddFriendModal({
  isOpen,
  onClose,
  currentUser,
  homeCountryId,
  onAddFriendFromQR,
}: QRAddFriendModalProps) {
  const t = getTranslation();
  const [activeTab, setActiveTab] = useState<'my-qr' | 'scan'>('my-qr');
  const [copied, setCopied] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  if (!isOpen) return null;

  // Prepare profile JSON data for the QR code share payload
  const homeCountry = COUNTRY_LIST.find(c => c.id === homeCountryId) || COUNTRY_LIST.find(c => c.id === "840");
  const myProfileData = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || "GLOKO Friend",
    countryId: homeCountry?.id || "840",
    city: homeCountry?.continent || "World Citizen",
    contact: currentUser?.email || "hello@gloko.app",
    notes: "Added via GLOKO QR Share Code"
  };

  const rawShareString = btoa(JSON.stringify(myProfileData));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawShareString)}`;

  const handleCopyCode = () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(rawShareString).catch((err) => {
        console.error("Clipboard copy failed: ", err);
      });
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = rawShareString;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error("Fallback clipboard copy failed: ", err);
      }
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessCode = (code: string) => {
    try {
      const decoded = atob(code.trim());
      const parsed = JSON.parse(decoded);
      if (!parsed.name || !parsed.countryId) {
        throw new Error("Invalid profile payload structure.");
      }
      setScanResult(parsed);
      setScanError(null);
    } catch (e) {
      setScanError("Oops! That code wasn't recognized. Make sure you copy/paste the entire Share Code correctly.");
      setScanResult(null);
    }
  };

  const handleSimulateScan = () => {
    setIsSimulatingCamera(true);
    setScanError(null);
    setScanResult(null);
    
    // Simulate camera feed decoding
    setTimeout(() => {
      // Simulate scanning someone's code (we'll generate a fun traveler friend!)
      const travelers = [
        { name: "Martina S.", countryId: "380", city: "Kyiv", contact: "@martina_travels", notes: "Met at a cozy hostel in Tokyo!" },
        { name: "Carlos Ruiz", countryId: "724", city: "Madrid", contact: "carlos.ruiz@hola.es", notes: "Shared a surfboard in Bali!" },
        { name: "Yuki Tanaka", countryId: "392", city: "Kyoto", contact: "@yuki_t", notes: "Gave great coffee recommendations!" },
        { name: "Sophie Dubois", countryId: "250", city: "Paris", contact: "sophie@dubois.fr", notes: "Climbed Mount Fuji together!" }
      ];
      
      const randomTraveler = travelers[Math.floor(Math.random() * travelers.length)];
      setScanResult(randomTraveler);
      setIsSimulatingCamera(false);
      setSimulatedSuccess(true);
      setTimeout(() => setSimulatedSuccess(false), 3000);
    }, 2000);
  };

  const handleAddScannedFriend = () => {
    if (scanResult) {
      onAddFriendFromQR(scanResult);
      onClose();
    }
  };

  const foundCountry = scanResult ? COUNTRY_LIST.find(c => c.id === scanResult.countryId) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0a1e35] px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider">Friend QR Connect</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setActiveTab('my-qr'); setScanError(null); setScanResult(null); }}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'my-qr' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My QR Code
          </button>
          <button
            onClick={() => { setActiveTab('scan'); setScanError(null); setScanResult(null); }}
            className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'scan' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Scan / Add Friend
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'my-qr' ? (
            <div className="flex flex-col items-center text-center gap-4">
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans max-w-sm">
                Let your friend scan this code with their camera, or copy your unique GLOKO Share Code below to send to them.
              </p>

              {/* QR Code Graphic Frame */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shadow-inner relative flex items-center justify-center w-52 h-52">
                <img src={qrCodeUrl} alt="My QR Code" className="w-44 h-44 object-contain rounded-lg" />
              </div>

              {/* Share Code Copy section */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Your Share Code</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-lg cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <div className="bg-white px-2.5 py-1.5 border border-slate-100 rounded-md text-[9px] font-mono text-slate-500 break-all select-all text-left max-h-12 overflow-y-auto">
                  {rawShareString}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Paste your friend's Share Code below, or scan via simulated camera to quickly add them to your directory.
              </p>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSimulateScan}
                  disabled={isSimulatingCamera}
                  className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isSimulatingCamera 
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0 animate-spin-slow" />
                  <span>{isSimulatingCamera ? 'Simulating Scanner...' : 'Simulate Camera Scan'}</span>
                </button>
              </div>

              {/* Camera Simulation Screen */}
              {isSimulatingCamera && (
                <div className="h-44 w-full bg-slate-900 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-lg">
                  {/* Neon laser line scanning */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_#6366f1] animate-bounce w-full" />
                  <QrCode className="w-12 h-12 text-slate-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">Initializing video stream...</span>
                </div>
              )}

              {/* Paste Code Section */}
              {!isSimulatingCamera && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Paste Share Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste friend's long share code here..."
                      value={scanValue}
                      onChange={(e) => {
                        setScanValue(e.target.value);
                        if (e.target.value.trim()) {
                          handleProcessCode(e.target.value);
                        } else {
                          setScanResult(null);
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-sans text-slate-800 outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              {/* Scan Error Message */}
              {scanError && (
                <div className="bg-red-50 border border-red-150 rounded-xl p-3 flex items-start gap-2.5 text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span className="text-[11px] leading-relaxed font-sans font-medium">{scanError}</span>
                </div>
              )}

              {/* Scanned/Parsed Friend Details Preview */}
              {scanResult && (
                <div className="bg-green-50/70 border border-green-150 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-green-800">Friend Found!</span>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-white/80 p-3 rounded-lg border border-green-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base select-none shrink-0">
                      {scanResult.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{scanResult.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>{foundCountry?.flag || '🌍'}</span>
                        <span className="font-semibold">{foundCountry?.name || 'Unknown Country'}</span>
                        {scanResult.city && <span>• {scanResult.city}</span>}
                      </p>
                      <p className="text-[9px] text-indigo-600 font-mono mt-1 truncate">{scanResult.contact}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleAddScannedFriend}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Add {scanResult.name} to my Friends Book</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
