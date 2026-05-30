import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { COUNTRY_BY_ID, getCountryInfo, COUNTRY_LIST } from '../data/countries';
import { Contact } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Search, MapPin, X } from 'lucide-react';

interface WorldMapProps {
  contacts: Contact[];
  selectedCountryId: string | null;
  onSelectCountry: (countryId: string | null, countryName: string) => void;
  countryColors?: Record<string, string>;
  onMapLoaded?: () => void;
  onLogoClick?: () => void;
}

const WorldMap = forwardRef<any, WorldMapProps>(({
  contacts,
  selectedCountryId,
  onSelectCountry,
  countryColors = {},
  onMapLoaded,
  onLogoClick,
}, ref) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SVG dimensions
  const width = 960;
  const height = 500;

  // Configure projection: Mercator flat map (Google Maps style) centered beautifully so upper parts are not crushed
  const projection = d3
    .geoMercator()
    .center([8, 12]) // Offset slightly north so land mass is vertically balanced
    .scale(125)      // Balanced scale to fit the 960x500 box well
    .translate([width / 2, height / 2 + 35]);

  const pathGenerator = d3.geoPath().projection(projection);

  // Track map transform (Zoom/Pan state) focusing on Niger on load
  const [zoom, setZoom] = useState(1.25);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Screen-to-SVG viewBox coordinates conversion taking preserveAspectRatio="xMidYMid slice" into account
  const clientToSvgCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    const R = Math.max(rect.width / width, rect.height / height);
    const offsetX = (rect.width - width * R) / 2;
    const offsetY = (rect.height - height * R) / 2;
    return {
      x: ((clientX - rect.left) - offsetX) / R,
      y: ((clientY - rect.top) - offsetY) / R,
    };
  };

  // Get mathematically exact position centering on Niger [8, 17.5] dynamically projected
  const getNigerCenteredPosition = (currentZoom: number) => {
    let svgCenterX = width / 2;
    let svgCenterY = height / 2;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const R = Math.max(rect.width / width, rect.height / height);
      const offsetX = (rect.width - width * R) / 2;
      const offsetY = (rect.height - height * R) / 2;
      svgCenterX = ((rect.width / 2) - offsetX) / R;
      svgCenterY = ((rect.height / 2) - offsetY) / R;
    }
    
    // Niger center is projected dynamically using the Equirectangular projection
    const nigerPos = projection([8, 17.5]);
    const centerX = nigerPos ? nigerPos[0] : 480;
    const centerY = nigerPos ? nigerPos[1] : 201.13;
    
    return {
      x: svgCenterX - centerX * currentZoom,
      y: svgCenterY - centerY * currentZoom,
    };
  };

  // Center nicely on mount depending on device type and container boundaries
  useEffect(() => {
    if (geoData) {
      const timer = setTimeout(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const initialZoom = isMobile ? 1.15 : 1.25;
        const initialPos = getNigerCenteredPosition(initialZoom);
        setZoom(initialZoom);
        setPosition(initialPos);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [geoData]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);
  const touchStartMidpoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Country search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const friendsBookRef = useRef<HTMLDivElement>(null);

  // Close Friends Book panel if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (friendsBookRef.current && !friendsBookRef.current.contains(event.target as Node)) {
        setShowStatsDetail(false);
      }
    }
    function handleTouchOutside(event: TouchEvent) {
      if (friendsBookRef.current && !friendsBookRef.current.contains(event.target as Node)) {
        setShowStatsDetail(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  // Hover state for tooltip
  const [hoveredCountry, setHoveredCountry] = useState<{
    id: string;
    name: string;
    code: string;
    flag: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  // Track double tap / mobile hover state
  const [mobileHoveredId, setMobileHoveredId] = useState<string | null>(null);

  // Calculate contact counts by country ID (padded)
  const contactCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    const padded = c.countryId.padStart(3, '0');
    contactCounts[padded] = (contactCounts[padded] || 0) + 1;
  });

  // Fetch and parse world map boundaries with multiple CDN fallbacks
  useEffect(() => {
    const urls = [
      'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
      'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
      'https://fastly.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
      'https://gcore.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json'
    ];

    const tryFetch = (index: number) => {
      if (index >= urls.length) {
        setError('Could not load map data from any network mirror. Please try refreshing.');
        setLoading(false);
        onMapLoaded?.();
        return;
      }

      fetch(urls[index])
        .then((res) => {
          if (!res.ok) throw new Error(`Network issue fetching boundaries from mirror ${index + 1}`);
          return res.json();
        })
        .then((data) => {
          if (!data || !data.objects || !data.objects.countries) {
            throw new Error('Invalid map bounds data structure');
          }
          // Convert TopoJSON to GeoJSON
          const countriesGeo = feature(data, data.objects.countries) as any;
          setGeoData(countriesGeo);
          setLoading(false);
          onMapLoaded?.();
        })
        .catch((err) => {
          console.warn(`Failed to fetch from host ${urls[index]}:`, err);
          // Try next mirrors
          tryFetch(index + 1);
        });
    };

    tryFetch(0);
  }, []);

  // Helper to resolve coloring: unrecorded stays light slate gray, recorded receives customized or default pretty pastel hue!
  const getCountryColor = (countryId: string, count: number, isSelected: boolean) => {
    const paddedId = countryId.padStart(3, '0');
    
    if (countryColors && countryColors[paddedId]) {
      return countryColors[paddedId];
    }

    if (count === 0) {
      if (isSelected) {
        return '#e0ccaa'; // Rich/deep warm golden-biscuit color when selected
      }
      return '#f4f1ea'; // Beautiful crisp sandy off-white (Google Maps style!)
    }

    // Convert country ID to hash-based hue
    let hash = 0;
    for (let i = 0; i < paddedId.length; i++) {
      hash = paddedId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;

    if (isSelected) {
      return `hsl(${hue}, 95%, 45%)`; // Extremely rich, vibrant, highly saturated color when selected (strong click feedback!)
    }

    return `hsl(${hue}, 75%, 72%)`; // Soft beautiful natural pastel
  };

  // Expose imperative handle to allow resetting view from parent
  useImperativeHandle(ref, () => ({
    resetView: () => {
      handleReset();
    }
  }));

  // Prevent map from scrolling away/indefinitely by locking edges beautifully based on global size
  const limitPosition = (pos: { x: number; y: number }, currentZoom: number) => {
    const viewW = width;
    const viewH = height;

    const mapW = width * currentZoom;
    const mapH = height * currentZoom;

    // Use generous viewport-linked padding so map transitions and relative zooming do not snap or restrict arbitrarily
    const padX = Math.max(100, viewW * 0.85);
    const padY = Math.max(100, viewH * 0.85);

    let minX, maxX, minY, maxY;

    if (mapW > viewW) {
      minX = viewW - mapW - padX;
      maxX = padX;
    } else {
      const defaultX = (viewW - mapW) / 2;
      minX = defaultX - padX;
      maxX = defaultX + padX;
    }

    if (mapH > viewH) {
      minY = viewH - mapH - padY;
      maxY = padY;
    } else {
      const defaultY = (viewH - mapH) / 2;
      minY = defaultY - padY;
      maxY = defaultY + padY;
    }

    return {
      x: Math.max(minX, Math.min(pos.x, maxX)),
      y: Math.max(minY, Math.min(pos.y, maxY)),
    };
  };

  // Zoom handlers
  const scaleRelative = (factor: number) => {
    let centerX = width / 2;
    let centerY = height / 2;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const midPoint = clientToSvgCoords(rect.left + rect.width / 2, rect.top + rect.height / 2);
      centerX = midPoint.x;
      centerY = midPoint.y;
    }
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const minZoom = isMobile ? 0.5 : 0.7;
    const nextZoom = Math.max(minZoom, Math.min(zoom * factor, 12));
    const nextPos = {
      x: centerX - (nextZoom / zoom) * (centerX - position.x),
      y: centerY - (nextZoom / zoom) * (centerY - position.y),
    };
    setPosition(limitPosition(nextPos, nextZoom));
    setZoom(nextZoom);
  };

  const handleZoomIn = () => {
    if (selectedCountryId) return;
    scaleRelative(1.5);
  };
  const handleZoomOut = () => {
    if (selectedCountryId) return;
    scaleRelative(1 / 1.5);
  };
  const handleReset = () => {
    if (selectedCountryId) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const initialZoom = isMobile ? 1.15 : 1.25;
    const initialPos = getNigerCenteredPosition(initialZoom);
    setZoom(initialZoom);
    setPosition(initialPos);
  };

  // Pan handlers (Mouse + Touch support with focal-centered touch coordinate pinch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    const svgPoint = clientToSvgCoords(e.clientX, e.clientY);
    dragStart.current = { x: svgPoint.x - position.x, y: svgPoint.y - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (!isDragging) return;
    const svgPoint = clientToSvgCoords(e.clientX, e.clientY);
    const nextPos = {
      x: svgPoint.x - dragStart.current.x,
      y: svgPoint.y - dragStart.current.y,
    };
    setPosition(limitPosition(nextPos, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (e.touches.length === 2) {
      // Two fingers: pinch zoom
      setIsDragging(false); // Disable dragging
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      touchStartZoom.current = zoom;
      
      const midPoint = clientToSvgCoords(
        (t1.clientX + t2.clientX) / 2,
        (t1.clientY + t2.clientY) / 2
      );
      touchStartMidpoint.current = midPoint;
      // Store starting position of the map so we can zoom dynamically relative to it
      dragStart.current = { x: position.x, y: position.y };
    } else if (e.touches.length === 1) {
      // One finger: pan of map
      setIsDragging(true);
      const touch = e.touches[0];
      const svgPoint = clientToSvgCoords(touch.clientX, touch.clientY);
      dragStart.current = { x: svgPoint.x - position.x, y: svgPoint.y - position.y };
      touchStartDist.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDist === 0) return;
      
      const scale = currentDist / touchStartDist.current;
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const minZoom = isMobile ? 0.35 : 0.7;
      const nextZoom = Math.max(minZoom, Math.min(touchStartZoom.current * scale, 12));
      
      const mid = touchStartMidpoint.current;
      const initZoom = touchStartZoom.current;
      
      // Compute accurate zoom relative to the pinch gesture's dynamic touch midpoint
      const nextPos = {
        x: mid.x - (mid.x - dragStart.current.x) * (nextZoom / initZoom),
        y: mid.y - (mid.y - dragStart.current.y) * (nextZoom / initZoom),
      };
      
      setPosition(limitPosition(nextPos, nextZoom));
      setZoom(nextZoom);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const svgPoint = clientToSvgCoords(touch.clientX, touch.clientY);
      const nextPos = {
        x: svgPoint.x - dragStart.current.x,
        y: svgPoint.y - dragStart.current.y,
      };
      setPosition(limitPosition(nextPos, zoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  // Extremely smooth, responsive mouse-centered focal wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (mobileHoveredId) {
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }
    e.preventDefault();
    if (loading) return;

    const svgPoint = clientToSvgCoords(e.clientX, e.clientY);
    const mouseX = svgPoint.x;
    const mouseY = svgPoint.y;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const minZoom = isMobile ? 0.5 : 0.7;
    const nextZoom = Math.max(minZoom, Math.min(zoom * zoomFactor, 12));

    const nextPos = {
      x: mouseX - (mouseX - position.x) * (nextZoom / zoom),
      y: mouseY - (mouseY - position.y) * (nextZoom / zoom),
    };

    setPosition(limitPosition(nextPos, nextZoom));
    setZoom(nextZoom);
  };

  // Click handler on paths with double-click simulation on mobile touchscreens
  const handleCountryClick = (e: React.MouseEvent | React.TouchEvent, feature: any) => {
    if (!feature || feature.id === undefined || feature.id === null) return;
    const rawId = feature.id.toString();
    const paddedId = rawId.padStart(3, '0');
    const info = getCountryInfo(paddedId);
    if (!info) return;
    const countryName = info.name || `Country (${rawId})`;

    // Detect touch / mobile interface
    const isMobile = typeof window !== 'undefined' && (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.innerWidth <= 768
    );

    if (isMobile) {
      if (mobileHoveredId === paddedId) {
        // Second click/tap: trigger actual country selection!
        onSelectCountry(paddedId, countryName);
        setMobileHoveredId(null);
        setHoveredCountry(null);
      } else {
        // First click/tap: mock the desktop "hover" detail tooltip
        setMobileHoveredId(paddedId);
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          let clientX = 0;
          let clientY = 0;
          
          if ('clientX' in e) {
            clientX = (e as any).clientX;
            clientY = (e as any).clientY;
          } else if ('touches' in e && (e as any).touches.length > 0) {
            clientX = (e as any).touches[0].clientX;
            clientY = (e as any).touches[0].clientY;
          } else if ('changedTouches' in e && (e as any).changedTouches.length > 0) {
            clientX = (e as any).changedTouches[0].clientX;
            clientY = (e as any).changedTouches[0].clientY;
          }

          const mouseX = clientX - rect.left;
          const mouseY = clientY - rect.top;

          setHoveredCountry({
            id: paddedId,
            name: info.name,
            code: info.code,
            flag: info.flag,
            count: contactCounts[paddedId] || 0,
            x: mouseX,
            y: mouseY - 15,
          });
        }
      }
    } else {
      // Laptop or Desktop: single click immediately reveals selection
      onSelectCountry(paddedId, countryName);
    }
  };

  // Mouse hover details (for Tooltip) - disabled on mobile/touch screen to avoid conflicts
  const handleCountryMouseEnter = (e: React.MouseEvent, feature: any) => {
    // Detect mobile touch
    const isMobile = typeof window !== 'undefined' && (
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.innerWidth <= 768
    );
    if (isMobile) return;

    if (!feature || feature.id === undefined || feature.id === null) return;
    const rawId = feature.id.toString();
    const paddedId = rawId.padStart(3, '0');
    const info = getCountryInfo(paddedId);

    if (!info) return;

    // Retrieve bounding box to position relative to SVG parent wrapper
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setHoveredCountry({
      id: paddedId,
      name: info.name,
      code: info.code,
      flag: info.flag,
      count: contactCounts[paddedId] || 0,
      x: mouseX,
      y: mouseY - 15, // offset above cursor
    });
  };

  const handleCountryMouseMove = (e: React.MouseEvent, feature: any) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !hoveredCountry) return;

    setHoveredCountry((prev) =>
      prev
        ? {
            ...prev,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 15,
          }
        : null
    );
  };

  const handleCountryMouseLeave = () => {
    setHoveredCountry(null);
  };

  // Search filtered lists
  const filteredCountries = searchQuery.trim()
    ? COUNTRY_LIST.filter((country) =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredFriends = searchQuery.trim()
    ? contacts.filter((contact) =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.city && contact.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSearchSelect = (countryId: string, countryName: string) => {
    onSelectCountry(countryId, countryName);
    setSearchQuery('');
    setShowDropdown(false);
    setMobileHoveredId(null);
    setHoveredCountry(null);

    // Focus / slide map to center approximately based on projection
    // For extreme simplicity and polish, we center on selection or reset zoom
    handleReset();
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className={`w-full h-full relative cursor-grab select-none overflow-hidden bg-[#d4e5f7] touch-none ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-10 text-center">
          <span className="text-2xl mb-2">⚡</span>
          <span className="text-xs text-red-500 font-sans font-medium">{error}</span>
        </div>
      )}

      {/* Floating Control panel top-left containing Logo, Friends Book, and Search Bar */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 z-40 flex flex-col gap-3.5 pointer-events-auto w-64 max-w-[calc(100vw-32px)]"
      >
        {/* GLOKO Floating Logo & Title perfectly aligned vertically */}
        <div
          className="flex items-center justify-start cursor-pointer select-none hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group self-start px-4 py-1"
          onClick={() => {
            if (onLogoClick) {
              onLogoClick();
            } else {
              onSelectCountry(null, '');
              handleReset();
            }
          }}
          title="Reset map view and view overall statistics"
        >
          <span 
            className="text-xl sm:text-2xl font-sans font-extrabold uppercase tracking-widest text-[#0a1e35] flex items-center select-none drop-shadow-[0_1px_2.5px_rgba(255,255,255,1)]"
          >
            GL
            <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_2px_5px_rgba(15,23,42,0.1)] p-[2.5px]">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
            </span>
            K
            <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_2px_5px_rgba(15,23,42,0.1)] p-[2.5px]">
              <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
            </span>
          </span>
        </div>

        {/* Unified Friends Book panel */}
        <div 
          ref={friendsBookRef}
          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-md select-none font-sans overflow-hidden transition-all flex flex-col w-full"
        >
          {/* Header section which expands/collapses the popup inline */}
          <div 
            onClick={() => setShowStatsDetail((prev) => !prev)}
            className="px-4 py-3.5 flex flex-col gap-1 cursor-pointer hover:bg-slate-50 transition-colors select-none"
            title="Click to view/hide friends list"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-650 uppercase tracking-widest leading-none">
                <span>📖</span> Friends Book
              </span>
              <span className="text-[8px] text-slate-400 font-medium font-sans bg-slate-150 px-1.5 py-0.5 rounded">
                {showStatsDetail ? 'Hide list' : 'Click to expand'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-base font-bold text-slate-800 leading-none">
                {new Set(contacts.map((c) => c.countryId.padStart(3, '0'))).size}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Countries</span>
              <span className="text-xs text-slate-400 mx-1">|</span>
              <span className="text-base font-bold text-slate-800 leading-none">{contacts.length}</span>
              <span className="text-[10px] text-slate-400 font-medium font-sans">Friends</span>
            </div>
          </div>

          {/* Inline Expanded Directory Area */}
          {showStatsDetail && (
            <div className="border-t border-slate-100 flex flex-col w-full max-h-[250px] sm:max-h-[320px] bg-white animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="overflow-y-auto flex-grow divide-y divide-slate-100/60 p-1">
                {contacts.length === 0 ? (
                  <div className="py-8 px-4 text-center text-[11px] text-slate-400">
                    You don't have any friends recorded yet. Click a country to add!
                  </div>
                ) : (
                  Object.keys(contactCounts).map((paddedId) => {
                    const country = COUNTRY_BY_ID[paddedId];
                    const countryName = country?.name || `Country #${paddedId}`;
                    const countryFlag = country?.flag || '🗺️';
                    const countryFriends = contacts.filter(
                      (c) => c.countryId.padStart(3, '0') === paddedId
                    );

                    return {
                      id: paddedId,
                      name: countryName,
                      flag: countryFlag,
                      friends: countryFriends,
                    };
                  })
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((group) => (
                    <div key={group.id} className="p-2 flex flex-col gap-1.5 hover:bg-slate-50/40 rounded-xl transition-colors">
                      {/* Header trigger to select country on map */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCountry(group.id, group.name);
                        }}
                        className="w-full text-left flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-indigo-650 transition-colors group cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="text-base shrink-0 leading-none">{group.flag}</span>
                          <span className="truncate group-hover:underline">{group.name}</span>
                        </span>
                        <span className="text-[9px] text-indigo-650 bg-indigo-50/70 py-0.5 px-1.5 font-bold rounded">
                          {group.friends.length}
                        </span>
                      </button>

                      {/* Compact list of individual connections for this country */}
                      <div className="pl-5.5 flex flex-col gap-1">
                        {group.friends.map((friend) => (
                          <div 
                            key={friend.id}
                            className="bg-slate-50/40 border border-slate-100/50 p-1.5 rounded-lg flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-705 truncate">
                                {friend.name}
                              </span>
                            </div>
                            {friend.city && (
                              <span className="text-[9px] text-slate-400 font-normal">
                                📍 {friend.city}
                              </span>
                            )}
                            {friend.contactInfo && (
                              <span className="text-[8px] text-slate-400 font-mono tracking-tight pt-0.5 line-clamp-1 truncate">
                                ✉️ {friend.contactInfo}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Google-Maps-Style Search Bar */}
        <div className="relative w-full shadow-md rounded-xl bg-white border border-slate-200/80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search country or friend name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full text-xs py-2.5 pl-8 pr-4 bg-white/95 rounded-xl border-none outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-sans"
            />
            <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
          </div>

          {showDropdown && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100/90">
              {filteredCountries.length > 0 && (
                <div>
                  <div className="px-3 py-1 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 font-sans">
                    Countries ({filteredCountries.length})
                  </div>
                  {filteredCountries.map((country) => {
                    const count = contactCounts[country.id] || 0;
                    return (
                      <button
                        key={country.id}
                        onClick={() => handleSearchSelect(country.id, country.name)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors font-sans cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base select-none">{country.flag}</span>
                          <span className="font-semibold text-slate-700">{country.name}</span>
                        </span>
                        {count > 0 ? (
                          <span className="bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                            {count}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">0</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredFriends.length > 0 && (
                <div>
                  <div className="px-3 py-1 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 font-sans">
                    Friends ({filteredFriends.length})
                  </div>
                  {filteredFriends.map((friend) => {
                    const paddedId = friend.countryId.padStart(3, '0');
                    const country = COUNTRY_BY_ID[paddedId];
                    const countryFlag = country?.flag || '🗺️';
                    return (
                      <button
                        key={friend.id}
                        onClick={() => handleSearchSelect(paddedId, country?.name || `Country #${paddedId}`)}
                        className="w-full text-left px-3 py-2.5 text-xs flex flex-col gap-0.5 hover:bg-slate-50/70 transition-colors font-sans cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{friend.name}</span>
                          <span className="text-[10px] select-none flex items-center gap-1 bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded font-bold font-sans">
                            <span>{countryFlag}</span>
                            <span>{country?.name || 'World'}</span>
                          </span>
                        </div>
                        {friend.city && (
                          <span className="text-[9px] text-slate-400">📍 {friend.city}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredCountries.length === 0 && filteredFriends.length === 0 && (
                <div className="py-3 px-4 text-xs text-slate-400 text-center font-sans">
                  No country or friend matches
                </div>
              )}
            </div>
          )}


        </div>
      </div>

      {/* Dynamic selection banner at bottom-right matching instructions */}
      {selectedCountryId && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:bottom-4 sm:right-4 bg-white p-3 py-2.5 sm:p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2.5 animate-pulse z-10 max-w-[calc(100vw-24px)] text-xs font-semibold text-slate-800">
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-indigo-600 rounded-full shrink-0 animate-ping"></div>
          <div className="truncate">
            {COUNTRY_BY_ID[selectedCountryId]?.flag} {COUNTRY_BY_ID[selectedCountryId]?.name || 'Selected'}: {contactCounts[selectedCountryId] || 0} {contactCounts[selectedCountryId] === 1 ? 'Friend' : 'Friends'}
          </div>
        </div>
      )}

      {/* Map Control Actions */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-1.5 z-40"
      >
        <button
          onClick={handleZoomIn}
          className="p-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors pointer-events-auto cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors pointer-events-auto cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SVG Render Container with Realistic Ocean & Ground Textures */}
      {geoData && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full overflow-hidden"
          style={{ pointerEvents: 'auto' }}
        >
          <defs>
            {/* Handcrafted sand/eggshall/paper grain land pattern overlay */}
            <pattern id="land-texture" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.6" fill="#8c7755" opacity="0.10" />
              <circle cx="15" cy="15" r="0.6" fill="#8c7755" opacity="0.10" />
              <circle cx="9" cy="8" r="0.5" fill="#8c7755" opacity="0.06" />
              <circle cx="21" cy="4" r="0.5" fill="#8c7755" opacity="0.06" />
            </pattern>

          </defs>

          <g 
            style={{
              transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: '0 0'
            }}
            transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}
          >
            {/* Ocean / Background styling (Solid antique sea color) */}
            <rect
              width={width * 3}
              height={height * 3}
              x={-width}
              y={-height}
              fill="#d4e5f7"
              onClick={() => {
                onSelectCountry(null, '');
                setMobileHoveredId(null);
                setHoveredCountry(null);
              }}
            />

            {/* Handcrafted Non-Repeating Ocean Decorations: waves, sailboat, submarine, squid & fish */}
            <g id="ocean-decorations">
              {/* Scattered Waves */}
              {/* Pacific Left */}
              <g transform="translate(60, 150)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(270, 110)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(80, 360)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(290, 460)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              {/* Atlantic Middle */}
              <g transform="translate(370, 130)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(480, 370)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              {/* Indian Middle-Right */}
              <g transform="translate(640, 260)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(770, 320)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              {/* Pacific Right */}
              <g transform="translate(930, 120)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>
              <g transform="translate(860, 470)" opacity="0.65">
                <g className="animate-wave">
                  <path d="M 0 0 Q 4 -3 8 0 M 14 3 Q 18 0 22 3" stroke="#9bbce0" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </g>
              </g>

              {/* SAILBOATS (Various occurrences, non-repeating positions/scales) */}
              {/* Sailboat 1 (North Atlantic) */}
              <g transform="translate(320, 180)" opacity="0.8">
                <g className="animate-boat">
                  <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
                  <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -11 7 Q -2 5 8 7" stroke="#9bbce0" strokeWidth="0.6" fill="none" />
                </g>
              </g>
              {/* Sailboat 2 (South Indian Ocean) */}
              <g transform="translate(740, 440)" opacity="0.8">
                <g className="animate-boat">
                  <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
                  <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -11 7 Q -2 5 8 7" stroke="#9bbce0" strokeWidth="0.6" fill="none" />
                </g>
              </g>
              {/* Sailboat 3 (North Pacific Left, slightly rotated) */}
              <g transform="translate(140, 110) rotate(-5)" opacity="0.75">
                <g className="animate-boat">
                  <path d="M -1 -10 L -1 -1 L -5 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.7" />
                  <path d="M 1 -11 L 1 -1 L 5 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.7" />
                  <path d="M -7 1 L 7 1 L 4.5 4.5 L -4.5 4.5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.7" />
                  <line x1="0" y1="-11" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.7" />
                </g>
              </g>
              {/* Sailboat 4 (North Pacific Right, slightly larger) */}
              <g transform="translate(870, 140) scale(1.15)" opacity="0.8">
                <g className="animate-boat">
                  <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f1f5f9" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#f8fafc" stroke="#6b7280" strokeWidth="0.75" />
                </g>
              </g>

              {/* SUBMARINES (Multiple occurrences, varied scales) */}
              {/* Submarine 1 (South Pacific Left) */}
              <g transform="translate(140, 440)" opacity="0.85">
                <g className="animate-sub">
                  <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#9bbad6" stroke="#5d7b96" strokeWidth="0.8" />
                  <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#7594b0" stroke="#5d7b96" strokeWidth="0.7" />
                  <line x1="-12" y1="-2" x2="-12" y2="2" stroke="#5d7b96" strokeWidth="0.8" />
                  <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#9bbad6" stroke="#5d7b96" strokeWidth="0.8" />
                  <path d="M 1 -11 L 1 -6" fill="none" stroke="#5d7b96" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M 1 -11 L 4 -11" fill="none" stroke="#5d7b96" strokeWidth="0.8" strokeLinecap="round" />
                  <circle cx="-3" cy="0" r="1.3" fill="#ffffff" stroke="#5d7b96" strokeWidth="0.5" />
                  <circle cx="2" cy="0" r="1.3" fill="#ffffff" stroke="#5d7b96" strokeWidth="0.5" />
                  <circle cx="7" cy="0" r="1.3" fill="#ffffff" stroke="#5d7b96" strokeWidth="0.5" />
                  <circle cx="-19" cy="-1" r="0.75" fill="#ffffff" opacity="0.7" />
                  <circle cx="-23" cy="-3" r="1" fill="#ffffff" opacity="0.5" />
                </g>
              </g>
              {/* Submarine 2 (South Atlantic, scaled down) */}
              <g transform="translate(410, 320) scale(0.85)" opacity="0.8">
                <g className="animate-sub">
                  <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#8baec9" stroke="#4d6b85" strokeWidth="0.85" />
                  <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#6a879e" stroke="#4d6b85" strokeWidth="0.75" />
                  <line x1="-12" y1="-2" x2="-12" y2="2" stroke="#4d6b85" strokeWidth="0.8" />
                  <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#8baec9" stroke="#4d6b85" strokeWidth="0.85" />
                  <path d="M 1 -10 L 1 -6" fill="none" stroke="#4d6b85" strokeWidth="0.8" />
                  <circle cx="-3" cy="0" r="1.2" fill="#ffffff" />
                  <circle cx="2" cy="0" r="1.2" fill="#ffffff" />
                  <circle cx="-18" cy="0" r="0.7" fill="#ffffff" opacity="0.75" />
                </g>
              </g>
              {/* Submarine 3 (East Indian Ocean, facing other side) */}
              <g transform="translate(700, 330) scale(-0.9, 0.9)" opacity="0.8">
                <g className="animate-sub">
                  <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#adbcd6" stroke="#667794" strokeWidth="0.8" />
                  <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#8e9eb8" stroke="#667794" strokeWidth="0.7" />
                  <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#adbcd6" stroke="#667794" strokeWidth="0.8" />
                  <path d="M 1 -11 L 1 -6" fill="none" stroke="#667794" strokeWidth="0.8" />
                  <circle cx="-3" cy="0" r="1.2" fill="#ffffff" />
                  <circle cx="2" cy="0" r="1.2" fill="#ffffff" />
                  <circle cx="-20" cy="-2" r="0.8" fill="#ffffff" opacity="0.6" />
                </g>
              </g>
              {/* Submarine 4 (South Pacific East) */}
              <g transform="translate(840, 420) scale(0.95)" opacity="0.8">
                <g className="animate-sub">
                  <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
                  <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#69869c" stroke="#49657a" strokeWidth="0.75" />
                  <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
                  <circle cx="1" cy="0" r="1.3" fill="#ffffff" />
                </g>
              </g>

              {/* SQUIDS (Multiple occurrences) */}
              {/* Squid 1 (Middle Indian Ocean) */}
              <g transform="translate(580, 350)" opacity="0.75">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#dfabb5" stroke="#a37682" strokeWidth="0.8" />
                  <circle cx="-1.8" cy="3" r="0.85" fill="#1e293b" />
                  <circle cx="1.8" cy="3" r="0.85" fill="#1e293b" />
                  <path d="M -5 -1 L -9 -3 L -5 -4 Z" fill="#dfabb5" stroke="#a37682" strokeWidth="0.7" />
                  <path d="M 5 -1 L 9 -3 L 5 -4 Z" fill="#dfabb5" stroke="#a37682" strokeWidth="0.7" />
                  <path d="M -2.5 9 Q -4 14 -2.8 17" fill="none" stroke="#a37682" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M -1 9 Q -1.5 15 -0.5 18" fill="none" stroke="#a37682" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M 1 9 Q 1.5 15 0.5 18" fill="none" stroke="#a37682" strokeWidth="0.8" strokeLinecap="round" />
                  <path d="M 2.5 9 Q 4 14 2.8 17" fill="none" stroke="#a37682" strokeWidth="0.8" strokeLinecap="round" />
                </g>
              </g>
              {/* Squid 2 (North Pacific, scaled down/light pinkish-teal) */}
              <g transform="translate(230, 240) scale(0.8) rotate(15)" opacity="0.78">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#ccdbe8" stroke="#7e95a8" strokeWidth="0.8" />
                  <circle cx="-1.5" cy="3" r="0.8" fill="#1e293b" />
                  <circle cx="1.5" cy="3" r="0.8" fill="#1e293b" />
                  <path d="M -5 -1 L -8 -3" stroke="#7e95a8" strokeWidth="0.7" />
                  <path d="M 5 -1 L 8 -3" stroke="#7e95a8" strokeWidth="0.7" />
                  <path d="M -2.5 9 C -3.5 13 -2.5 16 -2.5 16" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                  <path d="M 0 9 C -0.5 13 0.5 17 0.5 17" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                  <path d="M 2.5 9 C 1.5 13 2.5 16 2.5 16" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                </g>
              </g>
              {/* Squid 3 (South Atlantic) */}
              <g transform="translate(450, 430) scale(0.9)" opacity="0.72">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#ebc5b8" stroke="#ad887c" strokeWidth="0.8" />
                  <circle cx="-1.7" cy="3" r="0.8" fill="#1e293b" />
                  <circle cx="1.7" cy="3" r="0.8" fill="#1e293b" />
                  <path d="M -2.5 9 Q -4 13 -2.8 16" fill="none" stroke="#ad887c" strokeWidth="0.8" />
                  <path d="M 0 9 Q -1 14 0.5 17" fill="none" stroke="#ad887c" strokeWidth="0.8" />
                  <path d="M 2.5 9 Q 4 13 2.8 16" fill="none" stroke="#ad887c" strokeWidth="0.8" />
                </g>
              </g>
              {/* Squid 4 (South Pacific East, slightly larger) */}
              <g transform="translate(910, 380) scale(1.1) rotate(-10)" opacity="0.75">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#dfabb5" stroke="#a37682" strokeWidth="0.8" />
                  <circle cx="-1.8" cy="3" r="0.85" fill="#1e293b" />
                  <circle cx="1.8" cy="3" r="0.85" fill="#1e293b" />
                  <path d="M -2.5 9 L -3.5 18" fill="none" stroke="#a37682" strokeWidth="0.8" />
                  <path d="M -1 9 L -1.5 19" fill="none" stroke="#a37682" strokeWidth="0.8" />
                  <path d="M 1 9 L 1.5 19" fill="none" stroke="#a37682" strokeWidth="0.8" />
                  <path d="M 2.5 9 L 3.5 18" fill="none" stroke="#a37682" strokeWidth="0.8" />
                </g>
              </g>

              {/* FISH SCHOOLS (Varied occurrence patterns) */}
              {/* Fish School A (South Pacific Left) */}
              <g transform="translate(120, 450)" opacity="0.8">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" strokeLinejoin="round" />
                  </g>
                  <g transform="translate(12, 5) scale(0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" strokeLinejoin="round" />
                  </g>
                  <g transform="translate(6, -7) scale(0.9)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" strokeLinejoin="round" />
                  </g>
                </g>
              </g>
              {/* Fish School B (North Pacific Left, reversed) */}
              <g transform="translate(100, 220)" opacity="0.8">
                <g className="animate-fish">
                  <g transform="translate(0, 0) scale(-1, 1)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" strokeLinejoin="round" />
                  </g>
                  <g transform="translate(12, 6) scale(-0.8, 0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" strokeLinejoin="round" />
                  </g>
                </g>
              </g>
              {/* Fish School C (North Atlantic) */}
              <g transform="translate(440, 240) scale(0.95)" opacity="0.75">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(-10, -5) scale(0.85)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(-8, 6) scale(0.75)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>
              {/* Fish School D (South Atlantic Deep) */}
              <g transform="translate(520, 470) scale(0.9)" opacity="0.8">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(10, 4) scale(0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>
              {/* Fish School E (East Indian Ocean) */}
              <g transform="translate(670, 280) scale(-1, 1)" opacity="0.8">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(11, -5) scale(0.85)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>
              {/* Fish School F (North Pacific Right) */}
              <g transform="translate(890, 220) scale(1.05)" opacity="0.75">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(8, 4) scale(0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>

              {/* Additional Occurrences of Ocean Decorations to increase density & randomized occurrences */}
              {/* Sailboat 5 (Arabian Sea / West Indian Ocean) */}
              <g transform="translate(560, 260) scale(0.9)" opacity="0.8">
                <g className="animate-boat">
                  <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
                  <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
                </g>
              </g>
              {/* Sailboat 6 (South Pacific near Tahiti / Cook Islands) */}
              <g transform="translate(240, 380) scale(1.1) rotate(6)" opacity="0.8">
                <g className="animate-boat">
                  <path d="M -1 -12 L -1 -1 L -6 -1 Z" fill="#ffffff" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M 1 -13 L 1 -1 L 6 -1 Z" fill="#f8fafc" stroke="#728fa8" strokeWidth="0.75" />
                  <path d="M -8 1 L 8 1 L 5 5 L -5 5 Z" fill="#e2e8f0" stroke="#728fa8" strokeWidth="0.75" strokeLinejoin="round" />
                  <line x1="0" y1="-13" x2="0" y2="1" stroke="#728fa8" strokeWidth="0.75" />
                </g>
              </g>
              {/* Submarine 5 (Southern Ocean / Cold Antarctica margin) */}
              <g transform="translate(340, 470) scale(0.9)" opacity="0.8">
                <g className="animate-sub">
                  <path d="M -12 0 C -12 -7 12 -7 12 0 C 12 7 -12 7 -12 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
                  <path d="M -12 0 L -16 -4 L -16 4 Z" fill="#69869c" stroke="#49657a" strokeWidth="0.75" />
                  <path d="M -2 -6 L 4 -6 L 4 0 L -2 0 Z" fill="#8ca9bf" stroke="#49657a" strokeWidth="0.85" />
                  <circle cx="1" cy="0" r="1.3" fill="#ffffff" />
                </g>
              </g>
              {/* Squid 5 (Central Pacific near Equator) */}
              <g transform="translate(80, 290) scale(0.85) rotate(-15)" opacity="0.75">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#dfabb5" stroke="#a37682" strokeWidth="0.8" />
                  <circle cx="-1.8" cy="3" r="0.85" fill="#1e293b" />
                  <circle cx="1.8" cy="3" r="0.85" fill="#1e293b" />
                  <path d="M -2.5 9 Q -4 14 -2.8 17" fill="none" stroke="#a37682" strokeWidth="0.8" />
                  <path d="M 0 9 Q -1 14 0.5 17" fill="none" stroke="#a37682" strokeWidth="0.8" />
                  <path d="M 2.5 9 Q 4 14 2.8 17" fill="none" stroke="#a37682" strokeWidth="0.8" />
                </g>
              </g>
              {/* Squid 6 (North Atlantic Western Ridge) */}
              <g transform="translate(390, 100) scale(0.7) rotate(25)" opacity="0.76">
                <g className="animate-squid">
                  <path d="M -5 4 C -5 -6 5 -6 5 4 C 5 7 3 9 0 9 C -3 9 -5 7 -5 4 Z" fill="#ccdbe8" stroke="#7e95a8" strokeWidth="0.8" />
                  <circle cx="-1.5" cy="3" r="0.8" fill="#1e293b" />
                  <circle cx="1.5" cy="3" r="0.8" fill="#1e293b" />
                  <path d="M -2.5 9 C -3.5 13 -2.5 16 -2.5 16" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                  <path d="M 0 9 C -0.5 13 0.5 17 0.5 17" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                  <path d="M 2.5 9 C 1.5 13 2.5 16 2.5 16" fill="none" stroke="#7e95a8" strokeWidth="0.8" />
                </g>
              </g>
              {/* Fish School G (Central Atlantic near Equator) */}
              <g transform="translate(420, 310) scale(0.9)" opacity="0.8">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(10, -5) scale(0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>
              {/* Fish School H (West Pacific near Japan) */}
              <g transform="translate(760, 160) scale(1.1)" opacity="0.75">
                <g className="animate-fish">
                  <g transform="translate(0, 0)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                  <g transform="translate(-8, -4) scale(0.8)">
                    <path d="M -6 0 Q -1 -3 2 0 L 4 -2 L 4 2 L 2 0 Q -1 3 -6 0 Z" fill="#8ca9c7" stroke="#6887a3" strokeWidth="0.5" />
                  </g>
                </g>
              </g>
            </g>

            {/* Render Country Paths with Double-Layer Texture overlays */}
            {geoData.features.map((feature: any) => {
              if (!feature || feature.id === undefined || feature.id === null) return null;
              const rawId = feature.id.toString();
              const paddedId = rawId.padStart(3, '0');
              const pathData = pathGenerator(feature);

              // Check if this country path failed to generate (e.g., empty coordinates or Antarctica placeholder issue)
              if (!pathData) return null;

              // Antarctica (id "010" or similar) can sometimes take up too much space. We display it but can ignore details
              const isAntarctica = paddedId === '010';
              if (isAntarctica) return null;

              const count = contactCounts[paddedId] || 0;
              const isSelected = selectedCountryId === paddedId;
              const isMobileHovered = mobileHoveredId === paddedId;

              return (
                <g key={paddedId}>
                  {/* Crisp flat country base path */}
                  <path
                    d={pathData}
                    fill={getCountryColor(paddedId, count, isSelected)}
                    stroke={isSelected ? '#4f46e5' : '#b2a897'}
                    strokeWidth={isSelected ? 1.8 / zoom : (isMobileHovered ? 2.8 / zoom : 0.55 / zoom)}
                    className="map-country select-none outline-none"
                    style={{
                      fill: getCountryColor(paddedId, count, isSelected),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCountryClick(e, feature);
                    }}
                    onMouseEnter={(e) => handleCountryMouseEnter(e, feature)}
                    onMouseMove={(e) => handleCountryMouseMove(e, feature)}
                    onMouseLeave={handleCountryMouseLeave}
                  />
                  {/* Paper land texture overlay */}
                  <path
                    d={pathData}
                    fill="url(#land-texture)"
                    stroke="none"
                    className="pointer-events-none select-none"
                    style={{ opacity: isSelected ? 0.35 : 0.75 }}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* Custom Interactive Tooltip */}
      {hoveredCountry && (
        <div
          className="absolute rounded-xl px-2.5 py-1.5 bg-slate-900/95 text-white shadow-md text-xs flex flex-col gap-1 pointer-events-none z-30 font-sans border border-slate-800"
          style={{
            left: `${hoveredCountry.x}px`,
            top: `${hoveredCountry.y - 45}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="text-base leading-none select-none">{hoveredCountry.flag}</span>
            <span>{hoveredCountry.name}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-medium">
            <MapPin className="h-3 w-3 text-indigo-400" />
            <span>
              {hoveredCountry.count} {hoveredCountry.count === 1 ? 'Friend' : 'Friends'}
            </span>
          </div>
        </div>
      )}

      {/* Backdrop detector for click away searches */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
});

export default WorldMap;
