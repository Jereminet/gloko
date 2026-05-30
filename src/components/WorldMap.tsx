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

  // States for dynamic ocean decorations and labels layout
  const [randomDecorations, setRandomDecorations] = useState<any[]>([]);
  const [computedOceanLabels, setComputedOceanLabels] = useState<any[]>([]);
  const rawFeaturesRef = useRef<any[]>([]);

  // Dynamically compute complete-word ocean labels with positional candidates and safety clearance
  useEffect(() => {
    if (!geoData || !geoData.features) return;

    const isPointOnLand = (lon: number, lat: number) => {
      // Normalize longitude to [-180, 180] for accurate spherical test
      let normalizedLon = lon;
      while (normalizedLon > 180) normalizedLon -= 360;
      while (normalizedLon < -180) normalizedLon += 360;

      // Use rawFeaturesRef if populated, otherwise fallback to geoData.features
      const referenceFeatures = (rawFeaturesRef.current && rawFeaturesRef.current.length > 0)
        ? rawFeaturesRef.current 
        : geoData.features;

      for (let i = 0; i < referenceFeatures.length; i++) {
        const f = referenceFeatures[i];
        if (f && d3.geoContains(f, [normalizedLon, lat])) {
          return true;
        }
      }
      return false;
    };

    // Ocean icons/decorations have been completely removed per request
    setRandomDecorations([]);

    // Undivided Oceans Configuration with multiple candidate coordinates for smart fallbacks
    const labelsStructure = [
      {
        id: 'arctic',
        name: 'Arctic Ocean', // Complete full name matching 'Friends book'
        candidates: [
          { lon: -10, lat: 79 },
          { lon: 0, lat: 78 },
          { lon: 15, lat: 79 },
          { lon: -30, lat: 77 },
          { lon: 30, lat: 77 }
        ]
      },
      {
        id: 'pacific',
        name: 'Pacific Ocean',
        candidates: [
          { lon: -150, lat: 20 },  // North Pacific spacious area
          { lon: -140, lat: 5 },   // Centered between Hawaii & Asia
          { lon: -125, lat: -20 }, // South Pacific spacious area
          { lon: -160, lat: -10 },
          { lon: -130, lat: 30 }
        ]
      },
      {
        id: 'atlantic',
        name: 'Atlantic Ocean',
        candidates: [
          { lon: -38, lat: 28 },   // Perfect coordinates between the US and Spain
          { lon: -42, lat: 26 },
          { lon: -34, lat: 32 },
          { lon: -44, lat: 22 },
          { lon: -30, lat: 35 },
          { lon: -28, lat: 15 },   // Mid-Atlantic
          { lon: -20, lat: -22 }   // South Atlantic
        ]
      },
      {
        id: 'indian',
        name: 'Indian Ocean',
        candidates: [
          { lon: 80, lat: -18 },   // South central Indian Ocean
          { lon: 75, lat: -15 },
          { lon: 85, lat: -22 },
          { lon: 70, lat: -12 },
          { lon: 90, lat: -20 }
        ]
      },
      {
        id: 'southern',
        name: 'Southern Ocean',
        candidates: [
          { lon: 0, lat: -59 },    // Spacious sector
          { lon: 20, lat: -58 },
          { lon: 40, lat: -58 },
          { lon: -20, lat: -58 },
          { lon: -40, lat: -59 }
        ]
      }
    ];

    const labelsList: any[] = [];
    labelsStructure.forEach((lbl) => {
      let bestCandidate = lbl.candidates[0];
      let foundClear = false;

      // Adjust check dimensions depending on map container dimensions or zoom
      // checkW = 85, checkH = 34 represents a very generous safety margin area in pixels
      const checkW = 85; 
      const checkH = 34;

      for (let cIdx = 0; cIdx < lbl.candidates.length; cIdx++) {
        const cand = lbl.candidates[cIdx];
        const pos = projection([cand.lon, cand.lat]);
        if (!pos) continue;
        const [cx, cy] = pos;

        // Ensure predicted label is inside reasonable screen bounds
        if (cx < 60 || cx > width - 60 || cy < 40 || cy > height - 40) {
          continue;
        }

        let overlaps = false;
        // Sample points in a grid around this candidate to see if any point touches land
        const xSamples = [-checkW/2, -checkW/4, 0, checkW/4, checkW/2];
        const ySamples = [-checkH/2, 0, checkH/2];

        for (let xi = 0; xi < xSamples.length; xi++) {
          for (let yi = 0; yi < ySamples.length; yi++) {
            const pt = projection.invert([cx + xSamples[xi], cy + ySamples[yi]]);
            if (pt) {
              if (isPointOnLand(pt[0], pt[1])) {
                overlaps = true;
                break;
              }
            }
          }
          if (overlaps) break;
        }

        if (!overlaps) {
          bestCandidate = cand;
          foundClear = true;
          break; // Stop at first candidate that is perfectly clear!
        }
      }

      const finalPos = projection([bestCandidate.lon, bestCandidate.lat]);
      if (finalPos) {
        labelsList.push({
          id: lbl.id,
          name: lbl.name,
          lon: bestCandidate.lon,
          lat: bestCandidate.lat,
          x: finalPos[0],
          y: finalPos[1]
        });
      }
    });

    setComputedOceanLabels(labelsList);
  }, [geoData]);

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

          // Save complete deep copy of original unmutated features for clean isPointOnLand geo contains check
          if (countriesGeo && countriesGeo.features) {
            rawFeaturesRef.current = JSON.parse(JSON.stringify(countriesGeo.features));
          }

          // Heal Russia (ID is "643") coordinates so they are continuous on the eastern/right side of the Mercator map 
          // instead of splitting the Chukotka peninsula to the far left.
          if (countriesGeo && countriesGeo.features) {
            countriesGeo.features = countriesGeo.features.map((f: any) => {
              const fid = f.id ? f.id.toString() : '';
              if (fid === '643' || fid === 'RUS') {
                const healCoordinates = (coords: any): any => {
                  if (typeof coords[0] === 'number') {
                    let [lon, lat] = coords;
                    if (lon < 0) {
                      lon += 360;
                    }
                    return [lon, lat];
                  } else if (Array.isArray(coords[0])) {
                    return coords.map(healCoordinates);
                  }
                  return coords;
                };
                if (f.geometry && f.geometry.coordinates) {
                  return {
                    ...f,
                    geometry: {
                      ...f.geometry,
                      coordinates: healCoordinates(f.geometry.coordinates)
                    }
                  };
                }
              }
              return f;
            });
          }

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
        {/* Unified Friends Book panel with integrated GLOKO logo */}
        <div 
          ref={friendsBookRef}
          className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-md select-none font-sans overflow-hidden transition-all flex flex-col w-full"
        >
          {/* Integrated GLOKO Logo Block */}
          <div
            className="flex items-center justify-center cursor-pointer select-none border-b border-slate-100 bg-slate-50/45 hover:bg-slate-50 transition-colors py-2.5"
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
              className="text-lg sm:text-xl font-sans font-extrabold uppercase tracking-widest text-[#0a1e35] flex items-center select-none"
            >
              GL
              <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_1.5px_3.5px_rgba(15,23,42,0.06)] p-[2.5px]">
                <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
              </span>
              K
              <span className="inline-flex items-center justify-center h-[1em] w-[1em] mx-[0.08em] align-middle mt-[-0.08em] select-none pointer-events-none rounded-full bg-white border border-slate-200/80 shadow-[0_1.5px_3.5px_rgba(15,23,42,0.06)] p-[2.5px]">
                <img src="/favicon.png" alt="O" className="w-full h-full object-contain pointer-events-none select-none" />
              </span>
            </span>
          </div>

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

            {/* Dynamic Randomized Ocean Decorations & Labels (Optimized layout rendering dynamically on refresh) */}
            {/* Main Ocean Geographic Text Labels (Zoom-synchronized and beautifully formatted, rendered below continents to naturally truncate/hide overlaps) */}
            <g id="ocean-labels" className="pointer-events-none select-none" opacity="0.45">
              {computedOceanLabels.map((lbl) => {
                const words = lbl.name.split(' ');
                return (
                  <text
                    key={lbl.id}
                    x={lbl.x}
                    y={lbl.y}
                    textAnchor="middle"
                    className="font-sans font-bold text-[6px] sm:text-[7px] tracking-[0.14em] fill-[#456885] uppercase select-none pointer-events-none"
                  >
                    {words.map((word: string, idx: number) => (
                      <tspan
                        key={idx}
                        x={lbl.x}
                        dy={idx === 0 ? `${-(words.length - 1) * 0.55}em` : '1.1em'}
                      >
                        {word}
                      </tspan>
                    ))}
                  </text>
                );
              })}
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
