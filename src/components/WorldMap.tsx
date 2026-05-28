import React, { useEffect, useState, useRef } from 'react';
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
}

export default function WorldMap({
  contacts,
  selectedCountryId,
  onSelectCountry,
  countryColors = {},
}: WorldMapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SVG dimensions
  const width = 960;
  const height = 500;

  // Track map transform (Zoom/Pan state)
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Auto-fit and center nicely on mobile mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setZoom(1.85);
        setPosition({ x: -280, y: -45 });
      }
    }
  }, []);
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
  const contactCounts = contacts.reduce<Record<string, number>>((acc, c) => {
    const padded = c.countryId.padStart(3, '0');
    acc[padded] = (acc[padded] || 0) + 1;
    return acc;
  }, {});

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
        })
        .catch((err) => {
          console.warn(`Failed to fetch from host ${urls[index]}:`, err);
          // Try next mirrors
          tryFetch(index + 1);
        });
    };

    tryFetch(0);
  }, []);

  // Configure projection: GeoNaturalEarth1 looks extremely elegant
  const projection = d3
    .geoNaturalEarth1()
    .scale(170)
    .translate([width / 2, height / 2.3]);

  const pathGenerator = d3.geoPath().projection(projection);

  // Helper to resolve coloring: unrecorded stays light slate gray, recorded receives customized or default pretty pastel hue!
  const getCountryColor = (countryId: string, count: number, isSelected: boolean) => {
    const paddedId = countryId.padStart(3, '0');
    
    if (countryColors && countryColors[paddedId]) {
      return countryColors[paddedId];
    }

    if (count === 0) {
      if (isSelected) {
        return '#cca670'; // Rich/deep warm golden-biscuit color when selected (very strong contrast!)
      }
      return '#efe5d3'; // Elegant clear light beige for countries without friends
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

  // Zoom handlers
  const scaleRelative = (factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : width / 2;
    const centerY = rect ? rect.height / 2 : height / 2;
    
    const nextZoom = Math.max(0.8, Math.min(zoom * factor, 12));
    setPosition((prev) => ({
      x: centerX - (nextZoom / zoom) * (centerX - prev.x),
      y: centerY - (nextZoom / zoom) * (centerY - prev.y),
    }));
    setZoom(nextZoom);
  };

  const handleZoomIn = () => scaleRelative(1.5);
  const handleZoomOut = () => scaleRelative(1 / 1.5);
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Pan handlers (Mouse + Touch support for mobile devices)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mobileHoveredId) return; // Map is locked!
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mobileHoveredId) return; // Map is locked!
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mobileHoveredId) return; // Map is locked!
    if (e.touches.length === 2) {
      // Two fingers: pinch zoom
      setIsDragging(false); // Disable dragging
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      touchStartZoom.current = zoom;
      
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        touchStartMidpoint.current = {
          x: ((t1.clientX + t2.clientX) / 2) - rect.left,
          y: ((t1.clientY + t2.clientY) / 2) - rect.top,
        };
      }
      // Store starting position of the map so we can zoom dynamically relative to it
      dragStart.current = { x: position.x, y: position.y };
    } else if (e.touches.length === 1) {
      // One finger: pan of map
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
      touchStartDist.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (mobileHoveredId) return; // Map is locked!
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDist === 0) return;
      
      const scale = currentDist / touchStartDist.current;
      const nextZoom = Math.max(0.8, Math.min(touchStartZoom.current * scale, 12));
      
      const mid = touchStartMidpoint.current;
      const initZoom = touchStartZoom.current;
      
      // Calculate focal centered zoom point using original map position and current scale
      setPosition({
        x: mid.x - (mid.x - dragStart.current.x) * (nextZoom / initZoom),
        y: mid.y - (mid.y - dragStart.current.y) * (nextZoom / initZoom),
      });
      setZoom(nextZoom);
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.current.x,
        y: touch.clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  // Extremely smooth, responsive mouse-centered focal wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (mobileHoveredId) return; // Map is locked!
    e.preventDefault();
    if (loading) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.max(0.8, Math.min(zoom * zoomFactor, 12));

    setPosition((prev) => {
      const dx = mouseX - prev.x;
      const dy = mouseY - prev.y;
      return {
        x: mouseX - dx * (nextZoom / zoom),
        y: mouseY - dy * (nextZoom / zoom),
      };
    });
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
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-3" />
          <span className="text-xs text-slate-500 font-sans font-medium">Loading map boundaries...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 z-10 text-center">
          <span className="text-2xl mb-2">⚡</span>
          <span className="text-xs text-red-500 font-sans font-medium">{error}</span>
        </div>
      )}

      {/* Floating Control panel top-left containing Stats + Search */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute top-[76px] sm:top-[92px] left-4 sm:left-6 z-40 flex flex-col gap-3 pointer-events-auto w-64 max-w-[calc(100vw-32px)]"
      >
        {/* Statistics bubble */}
        <div 
          onClick={() => setShowStatsDetail((prev) => !prev)}
          className="bg-white/95 backdrop-blur-sm px-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-md flex flex-col gap-1 select-none font-sans cursor-pointer hover:bg-slate-50 transition-all hover:shadow-lg active:scale-[0.98]"
          title="Click to view/hide friends directory"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-650 uppercase tracking-widest leading-none">
              <span>📊</span> Statistics
            </span>
            <span className="text-[8px] text-slate-400 font-medium font-sans bg-slate-100 px-1 py-0.5 rounded">
              {showStatsDetail ? 'Hide list' : 'Click to expand'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-slate-800 leading-none">
              {new Set(contacts.map((c) => c.countryId.padStart(3, '0'))).size}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Countries</span>
            <span className="text-xs text-slate-300 mx-1">|</span>
            <span className="text-base font-bold text-slate-800 leading-none">{contacts.length}</span>
            <span className="text-[10px] text-slate-400 font-medium font-sans">Friends</span>
          </div>
        </div>

        {/* Small Popup directory of friends per country */}
        {showStatsDetail && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col w-full max-h-[260px] sm:max-h-[350px] animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Pop-up header */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Friends Directory
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatsDetail(false);
                }}
                className="p-1 hover:bg-slate-200/50 hover:text-slate-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                title="Close directory"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Menu Directory Content */}
            <div className="overflow-y-auto flex-grow divide-y divide-slate-100/60 p-1 bg-white">
              {contacts.length === 0 ? (
                <div className="py-8 px-4 text-center text-[11px] text-slate-400">
                  You don't have any connections recorded yet. Click a country to add!
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

        {/* Floating Google-Maps-Style Search Bar */}
        <div className="relative w-full shadow-md rounded-xl bg-white border border-slate-200/80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search country..."
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
            <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => {
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
                })
              ) : (
                <div className="py-3 px-4 text-xs text-slate-400 text-center font-sans">
                  No countries match
                </div>
              )}
            </div>
          )}

          {showDropdown && !searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
              <div className="p-2 bg-slate-50 text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-3">
                Visited Countries
              </div>
              {COUNTRY_LIST.filter(c => (contactCounts[c.id] || 0) > 0).length > 0 ? (
                COUNTRY_LIST.filter(c => (contactCounts[c.id] || 0) > 0).map((country) => {
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
                      <span className="bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                        {count}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-3 px-4 text-xs text-slate-400 text-center font-sans">
                  Click map to pin friends!
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
            {COUNTRY_BY_ID[selectedCountryId]?.flag} {COUNTRY_BY_ID[selectedCountryId]?.name || 'Selected'}: {contactCounts[selectedCountryId] || 0} Contacts
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
        <button
          onClick={handleReset}
          className="p-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-950 transition-colors pointer-events-auto cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SVG Render Container */}
      {geoData && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full overflow-hidden"
          style={{ pointerEvents: 'auto' }}
        >
          <g 
            style={{
              transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: '0 0'
            }}
            transform={`translate(${position.x}, ${position.y}) scale(${zoom})`}
          >
            {/* Ocean / Background styling */}
            <rect
              width={width * 3}
              height={height * 3}
              x={-width}
              y={-height}
              fill="transparent"
              onClick={() => {
                onSelectCountry(null, '');
                setMobileHoveredId(null);
                setHoveredCountry(null);
              }}
            />

            {/* Render Country Paths */}
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
                <path
                  key={paddedId}
                  d={pathData}
                  fill={getCountryColor(paddedId, count, isSelected)}
                  stroke={isSelected ? '#4f46e5' : '#000000'}
                  strokeWidth={isSelected ? 1.8 / zoom : (isMobileHovered ? 2.8 / zoom : 0.75 / zoom)}
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
              {hoveredCountry.count} {hoveredCountry.count === 1 ? 'Contact' : 'Contacts'}
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
}
