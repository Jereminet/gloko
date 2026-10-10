import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  QrCode,
  X,
  Copy,
  Check,
  CheckCircle,
  Camera,
  CameraOff,
  SwitchCamera,
  Upload,
  AlertCircle,
  Heart,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { COUNTRY_LIST } from '../data/countries';
import { playBellSound, playBubbleSound } from '../utils/audio';

interface ScannedFriendData {
  name: string;
  countryId: string;
  countryName?: string;
  city?: string;
  contact?: string;
  notes?: string;
  geolocationEnabled?: boolean;
  liveCountryId?: string;
}

interface QRAddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any; // User profile
  homeCountryId: string;
  userGeolocationEnabled?: boolean;
  onAddFriendFromQR: (friendData: {
    name: string;
    countryId: string;
    city: string;
    contact: string;
    notes: string;
    geolocationEnabled?: boolean;
    liveCountryId?: string;
  }) => void;
}

export default function QRAddFriendModal({
  isOpen,
  onClose,
  currentUser,
  homeCountryId,
  userGeolocationEnabled,
  onAddFriendFromQR,
}: QRAddFriendModalProps) {
  const [activeTab, setActiveTab] = useState<'my-qr' | 'scan'>('scan');
  const [copied, setCopied] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [scanResult, setScanResult] = useState<ScannedFriendData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  // Refs for camera video and scanning loop
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  }, []);

  // Parse raw scanned text or decoded QR string
  const parseQRContent = useCallback((raw: string): ScannedFriendData | null => {
    const text = raw.trim();
    if (!text) return null;

    // 1. Try Base64 encoded JSON
    try {
      const decoded = atob(text);
      const parsed = JSON.parse(decoded);
      if (parsed && (parsed.name || parsed.countryId)) {
        return {
          name: parsed.name || 'Friend',
          countryId: (parsed.countryId || '840').toString(),
          city: parsed.city || '',
          contact: parsed.contact || '',
          notes: parsed.notes || 'Added via GLOKO QR Share Code',
          geolocationEnabled: parsed.geolocationEnabled !== undefined ? parsed.geolocationEnabled : true,
          liveCountryId: parsed.liveCountryId || parsed.countryId || '840',
        };
      }
    } catch {}

    // 2. Try raw JSON
    try {
      const parsed = JSON.parse(text);
      if (parsed && (parsed.name || parsed.countryId)) {
        return {
          name: parsed.name || 'Friend',
          countryId: (parsed.countryId || '840').toString(),
          city: parsed.city || '',
          contact: parsed.contact || '',
          notes: parsed.notes || 'Added via GLOKO QR Share Code',
          geolocationEnabled: parsed.geolocationEnabled !== undefined ? parsed.geolocationEnabled : true,
          liveCountryId: parsed.liveCountryId || parsed.countryId || '840',
        };
      }
    } catch {}

    // 3. Try URL with parameters (e.g. ?data=... or ?name=...)
    try {
      if (text.startsWith('http') || text.includes('?')) {
        const url = new URL(text);
        const dataParam = url.searchParams.get('data') || url.searchParams.get('code');
        if (dataParam) {
          return parseQRContent(dataParam);
        }
        const nameParam = url.searchParams.get('name');
        const countryParam = url.searchParams.get('country') || url.searchParams.get('countryId');
        if (nameParam || countryParam) {
          return {
            name: nameParam || 'Friend',
            countryId: (countryParam || '840').toString(),
            city: url.searchParams.get('city') || '',
            contact: url.searchParams.get('contact') || '',
            notes: 'Scanned from URL',
            geolocationEnabled: true,
            liveCountryId: (countryParam || '840').toString(),
          };
        }
      }
    } catch {}

    // 4. Try plain text with key-value pairs or structured lines
    const lines = text.split('\n');
    let name = '';
    let countryId = '840';
    let city = '';
    let contact = '';

    for (const line of lines) {
      const [k, ...v] = line.split(':');
      if (v.length > 0) {
        const key = k.trim().toLowerCase();
        const val = v.join(':').trim();
        if (key.includes('name')) name = val;
        else if (key.includes('country')) countryId = val;
        else if (key.includes('city')) city = val;
        else if (key.includes('contact') || key.includes('email') || key.includes('phone')) contact = val;
      }
    }

    if (name || text.length > 2) {
      return {
        name: name || text.slice(0, 30),
        countryId: countryId || '840',
        city,
        contact,
        notes: 'Scanned from QR code',
        geolocationEnabled: true,
        liveCountryId: countryId || '840',
      };
    }

    return null;
  }, []);

  // Handle successful detection of QR code
  const handleQRDetected = useCallback((dataString: string) => {
    const friend = parseQRContent(dataString);
    if (friend) {
      try {
        playBellSound();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([80, 40, 80]);
        }
      } catch {}
      setScanResult(friend);
      setScanError(null);
      stopCameraStream();
    } else {
      setScanError('QR code detected, but could not read valid friend profile data.');
    }
  }, [parseQRContent, stopCameraStream]);

  // Real-time camera scanning loop
  const startScanningLoop = useCallback(() => {
    const checkFrame = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanLoopRef.current = requestAnimationFrame(checkFrame);
        return;
      }

      // Prepare off-screen canvas for frame capture
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // First attempt native BarcodeDetector if available
        if ('BarcodeDetector' in window && typeof (window as any).BarcodeDetector === 'function') {
          try {
            const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            detector
              .detect(video)
              .then((barcodes: any[]) => {
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleQRDetected(barcodes[0].rawValue);
                  return;
                }
              })
              .catch(() => {});
          } catch {}
        }

        // jsQR fallback (rock-solid on iOS Safari & all WebKit / Android browsers)
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data) {
            handleQRDetected(qrCode.data);
            return;
          }
        } catch {}
      }

      scanLoopRef.current = requestAnimationFrame(checkFrame);
    };

    scanLoopRef.current = requestAnimationFrame(checkFrame);
  }, [handleQRDetected]);

  // Start real phone camera
  const startCamera = useCallback(async (facing: 'environment' | 'user' = cameraFacing) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScanError('Camera is not supported on this browser or platform.');
      return;
    }

    setCameraLoading(true);
    setScanError(null);
    setCameraPermissionDenied(false);

    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      // Query available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {}

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setCameraLoading(false);
      startScanningLoop();
    } catch (err: any) {
      console.warn('Real camera access error:', err);
      setCameraLoading(false);
      setIsCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true);
        setScanError('Camera permission was denied. Please allow camera permissions in your browser or paste the Share Code below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setScanError('No camera was detected on this device.');
      } else {
        setScanError(`Could not access camera: ${err.message || 'Please check permissions.'}`);
      }
    }
  }, [cameraFacing, startScanningLoop]);

  // Toggle front / back camera
  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Process image uploaded from phone gallery / camera roll
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

          if (qrCode && qrCode.data) {
            handleQRDetected(qrCode.data);
          } else {
            setScanError('No QR code found in this photo. Please make sure the QR code is clearly visible and well-lit.');
          }
        } catch {
          setScanError('Could not process this image file.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be picked again if needed
    e.target.value = '';
  };

  // Clean up camera stream when modal closes, unmounts, or tab changes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'scan') {
      stopCameraStream();
    }
  }, [isOpen, activeTab, stopCameraStream]);

  if (!isOpen) return null;

  // Prepare profile JSON data for the QR code share payload
  const homeCountry = COUNTRY_LIST.find((c) => c.id === homeCountryId) || COUNTRY_LIST.find((c) => c.id === '840');
  const myProfileData = {
    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'GLOKO Friend',
    countryId: homeCountry?.id || '840',
    city: homeCountry?.continent || 'World Citizen',
    contact: currentUser?.email || 'hello@gloko.app',
    notes: 'Added via GLOKO QR Share Code',
    geolocationEnabled: userGeolocationEnabled ?? true,
    liveCountryId: homeCountry?.id || '840',
  };

  const rawShareString = btoa(JSON.stringify(myProfileData));
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(rawShareString)}`;

  const handleCopyCode = () => {
    playBubbleSound();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(rawShareString).catch(() => {});
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = rawShareString;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessCode = (code: string) => {
    const friend = parseQRContent(code);
    if (friend) {
      playBubbleSound();
      setScanResult(friend);
      setScanError(null);
    } else {
      setScanError("Oops! That code wasn't recognized. Make sure you copy/paste the entire Share Code correctly.");
      setScanResult(null);
    }
  };

  const handleAddScannedFriend = () => {
    if (scanResult) {
      playBellSound();
      onAddFriendFromQR({
        name: scanResult.name,
        countryId: scanResult.countryId,
        city: scanResult.city || '',
        contact: scanResult.contact || '',
        notes: scanResult.notes || '',
        geolocationEnabled: scanResult.geolocationEnabled !== undefined ? scanResult.geolocationEnabled : true,
        liveCountryId: scanResult.liveCountryId || scanResult.countryId,
      });
      stopCameraStream();
      onClose();
    }
  };

  const handleScanAnother = () => {
    playBubbleSound();
    setScanResult(null);
    setScanValue('');
    setScanError(null);
    startCamera();
  };

  const foundCountry = scanResult ? COUNTRY_LIST.find((c) => c.id === scanResult.countryId) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={() => {
          stopCameraStream();
          onClose();
        }}
      />

      {/* Main Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0a1e35] px-5 py-3.5 sm:py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider">Friend QR Connect</h3>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              playBubbleSound();
              stopCameraStream();
              setActiveTab('scan');
              setScanError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'border-indigo-600 text-indigo-650 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan with Phone Camera</span>
          </button>
          <button
            onClick={() => {
              playBubbleSound();
              stopCameraStream();
              setActiveTab('my-qr');
              setScanError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my-qr'
                ? 'border-indigo-600 text-indigo-650 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>My QR Code</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {activeTab === 'my-qr' ? (
            <div className="flex flex-col items-center text-center gap-3.5">
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans max-w-sm">
                Let your friend scan this QR code with their phone camera to instantly add you to their travel book!
              </p>

              {/* QR Code Graphic Frame */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm relative flex items-center justify-center w-52 h-52 sm:w-56 sm:h-56">
                <img
                  src={qrCodeUrl}
                  alt="My QR Code"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              </div>

              {/* Share Code Copy section */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">
                    Share Code (Text Backup)
                  </span>
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
            <div className="flex flex-col gap-3.5">
              {/* If friend is already found from scan */}
              {scanResult ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Friend Found!</span>
                    </div>
                    <button
                      onClick={handleScanAnother}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Scan Again</span>
                    </button>
                  </div>

                  <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg select-none shrink-0 shadow-2xs">
                      {scanResult.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{scanResult.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="text-sm select-none">{foundCountry?.flag || '🌍'}</span>
                        <span className="font-semibold text-slate-700">{foundCountry?.name || 'Unknown Country'}</span>
                        {scanResult.city && <span>• {scanResult.city}</span>}
                      </p>
                      {scanResult.contact && (
                        <p className="text-[10px] text-indigo-650 font-mono mt-1 truncate">{scanResult.contact}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200/60 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Geolocation Active</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddScannedFriend}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Add {scanResult.name} to my Friends Book</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Real Phone Camera Viewfinder Screen */}
                  <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-inner">
                    {/* Live Video Feed */}
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isCameraActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Camera Active Viewfinder Overlay */}
                    {isCameraActive && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Aiming Reticle / QR Target Box */}
                        <div className="relative w-44 h-44 sm:w-48 sm:h-48 border-2 border-indigo-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(10,15,30,0.5)]">
                          {/* Corner Accents */}
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-indigo-400 rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-indigo-400 rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-indigo-400 rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-indigo-400 rounded-br-lg" />

                          {/* Animated laser scanning bar */}
                          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_#818cf8] animate-bounce top-1/2 -translate-y-1/2" />
                        </div>

                        <span className="text-[10px] text-white/90 font-medium font-sans mt-3 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs rounded-full border border-white/10 shadow-xs">
                          Point camera at friend's QR code
                        </span>
                      </div>
                    )}

                    {/* Inactive Camera Prompt */}
                    {!isCameraActive && !cameraLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-md">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-sans">Phone Camera Scanner</p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs font-sans">
                            Use your phone's camera to scan your friend's code live.
                          </p>
                        </div>
                        <button
                          onClick={() => startCamera()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Start Camera</span>
                        </button>
                      </div>
                    )}

                    {/* Loading State */}
                    {cameraLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[11px] text-slate-300 font-sans">Connecting to phone camera...</span>
                      </div>
                    )}

                    {/* Camera Control Overlays (Flip camera, Stop camera) */}
                    {isCameraActive && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                        {hasMultipleCameras && (
                          <button
                            onClick={handleSwitchCamera}
                            className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-xs border border-white/15 cursor-pointer transition-colors shadow-sm"
                            title="Flip camera"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={stopCameraStream}
                          className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-xs border border-white/15 cursor-pointer transition-colors shadow-sm"
                          title="Stop camera"
                        >
                          <CameraOff className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Secondary options row: Upload Photo & Direct Code Entry */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Upload QR Code screenshot or photo"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Upload QR Image</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />

                    {!isCameraActive && !cameraLoading && (
                      <button
                        onClick={() => startCamera()}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Camera</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification */}
                  {scanError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <div className="text-[11px] leading-relaxed font-sans">
                        <span>{scanError}</span>
                      </div>
                    </div>
                  )}

                  {/* Manual Paste Code Fallback */}
                  <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      Or Paste Share Code Manually
                    </label>
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
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-sans text-slate-800 outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
