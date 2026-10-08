import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { COUNTRY_BY_ID, getCountryInfo, COUNTRY_LIST } from '../data/countries';
import { Contact } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Search, MapPin, X, Clock, Calendar, Radio } from 'lucide-react';
import { getTranslation, getAppLanguage, getTranslatedOcean } from '../utils/translations';
import PhotoModal from './PhotoModal';

interface WorldMapProps {
  contacts: Contact[];
  selectedCountryId: string | null;
  onSelectCountry: (countryId: string | null, countryName: string) => void;
  countryColors?: Record<string, string>;
  onMapLoaded?: () => void;
  onLogoClick?: () => void;
  userHomeCountryId?: string;
  userGeolocationEnabled?: boolean;
  isLiveMode?: boolean;
  onToggleLiveMode?: () => void;
}

const WorldMap = forwardRef<any, WorldMapProps>(({
  contacts,
  selectedCountryId,
  onSelectCountry,
  countryColors = {},
  onMapLoaded,
  onLogoClick,
  userHomeCountryId,
  userGeolocationEnabled,
  isLiveMode: controlledLiveMode,
  onToggleLiveMode,
}, ref) => {
  const t = getTranslation();
  
  const getFriendLabel = (count: number) => {
    return count === 1 ? t.friendSingular : t.friendPlural;
  };

  const getCountriesLabel = () => {
    return t.countriesLabel;
  };

  const [internalLiveMode, setInternalLiveMode] = useState(false);
  const isLiveMode = controlledLiveMode !== undefined ? controlledLiveMode : internalLiveMode;

  const handleToggleLiveMode = () => {
    if (onToggleLiveMode) {
      onToggleLiveMode();
    } else {
      setInternalLiveMode((prev) => !prev);
    }
    setFocusedCountryId(null);
    setMobileHoveredId(null);
    setHoveredCountry(null);
  };
  const [geoData, setGeoData] = useState<any>(null);
  const [landBounds, setLandBounds] = useState<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // SVG dimensions
  const width = 960;
  const height = 500;

  // Configure projection: Mercator flat map (Google Maps style) rotated precisely to the Bering Strait (-169°W)
  const projection = d3
    .geoMercator()
    .rotate([-11, 0]) // Shift cut to Bering Strait so Russia is seamlessly whole on the right
    .center([0, 12])  // Vertical balance centering on the rotated meridian
    .scale(125)       // Balanced scale to fit the 960x500 box well
    .translate([width / 2, height / 2 + 35]);

  const pathGenerator = d3.geoPath().projection(projection);

  // Compute absolute land bounding box under current projection
  useEffect(() => {
    if (!geoData || !geoData.features || geoData.features.length === 0) return;
    
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    geoData.features.forEach((feat: any) => {
      const bounds = pathGenerator.bounds(feat);
      if (bounds) {
        const [[x0, y0], [x1, y1]] = bounds;
        if (!isNaN(x0) && !isNaN(y0) && !isNaN(x1) && !isNaN(y1)) {
          if (x0 < minX) minX = x0;
          if (x1 > maxX) maxX = x1;
          if (y0 < minY) minY = y0;
          if (y1 > maxY) maxY = y1;
        }
      }
    });

    if (minX !== Infinity && maxX !== -Infinity) {
      setLandBounds({ minX, maxX, minY, maxY });
    }
  }, [geoData]);

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
  const touchStartClient = useRef<{ x: number; y: number } | null>(null);

  // Country search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const friendsBookRef = useRef<HTMLDivElement>(null);

  // Close Friends Book panel if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (friendsBookRef.current && !friendsBookRef.current.contains(event.target as Node)) {
        setShowStatsDetail(false);
        setIsSearchExpanded(false);
      }
    }
    function handleTouchOutside(event: TouchEvent) {
      if (friendsBookRef.current && !friendsBookRef.current.contains(event.target as Node)) {
        setShowStatsDetail(false);
        setIsSearchExpanded(false);
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

  // Track double tap / mobile hover state and focused country for city display & centering
  const [mobileHoveredId, setMobileHoveredId] = useState<string | null>(null);
  const [focusedCountryId, setFocusedCountryId] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<{ url: string; name: string } | null>(null);

  // Synchronize focused country when selectedCountryId changes
  useEffect(() => {
    if (selectedCountryId) {
      setFocusedCountryId(selectedCountryId);
    }
  }, [selectedCountryId]);

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
    if (!c.countryId) return;
    const padded = c.countryId.padStart(3, '0');
    contactCounts[padded] = (contactCounts[padded] || 0) + 1;
  });

  // Calculate live location contact counts by country ID (padded) - Friends only, excluding connected user
  const liveContactCounts: Record<string, number> = {};
  contacts.forEach((c) => {
    const isLive = Boolean(c.geolocationEnabled);
    if (!isLive) return;
    const targetCountry = c.liveCountryId || c.countryId;
    if (!targetCountry) return;
    const padded = targetCountry.padStart(3, '0');
    liveContactCounts[padded] = (liveContactCounts[padded] || 0) + 1;
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

  // Helper to resolve coloring: unrecorded stays crisp sandy off-white;
  // recorded countries have base color that starts light and gets darker for every 5 friends in that country
  // (ex: france 2 friends -> light orange, germany 13 friends -> darker orange, russia 33 friends -> even darker orange)
  const getCountryColor = (countryId: string, count: number, isSelected: boolean, inLiveMode: boolean = false) => {
    const paddedId = countryId.padStart(3, '0');

    // Unrecorded country (0 friends, or 0 live people in live mode)
    if (count === 0) {
      if (isSelected) {
        return '#e0ccaa'; // Rich/deep warm golden-biscuit color when selected
      }
      return '#f4f1ea'; // Beautiful crisp sandy off-white (Google Maps style)
    }

    // Tier based on 5 friends increments (0-4: tier 0, 5-9: tier 1, 10-14: tier 2, 15-19: tier 3, etc.)
    const tier = Math.floor(count / 5);

    // If user has customized this country's color, adjust that base hue by tier
    if (countryColors && countryColors[paddedId]) {
      try {
        const customHsl = d3.hsl(countryColors[paddedId]);
        if (customHsl && !isNaN(customHsl.h)) {
          customHsl.l = Math.max(0.18, customHsl.l - tier * 0.07);
          return isSelected ? customHsl.darker(0.25).formatHex() : customHsl.formatHex();
        }
      } catch (err) {
        // Fall back to orange/emerald scale
      }
    }

    if (inLiveMode) {
      // Distinct vibrant emerald live radar hue (representing real-time live GPS signals)
      const baseHue = 152; // Emerald green
      const saturation = 0.78;
      const lightness = Math.max(0.26, 0.65 - tier * 0.08);
      const emeraldHsl = d3.hsl(baseHue, saturation, lightness);
      if (isSelected) {
        return emeraldHsl.darker(0.2).formatHex();
      }
      return emeraldHsl.formatHex();
    }

    // Default base color: warm, vibrant Orange
    // Tier 0 (1-4 friends): Light Orange (lightness 82%)
    // Tier 1 (5-9 friends): Light-medium Orange (lightness 74%)
    // Tier 2 (10-14 friends): Darker Orange (lightness 66%)
    // Tier 3 (15-19 friends): Rich Orange (lightness 58%)
    // Tier 4 (20-24 friends): Deep Orange (lightness 50%)
    // Tier 5 (25-29 friends): Dark Rust Orange (lightness 42%)
    // Tier 6 (30-34 friends): Even Darker Orange (lightness 34%)
    // Tier 7+ (35+ friends): Deepest Dark Orange (lightness down to 24%)
    const baseHue = 27; // Warm orange hue
    const saturation = 0.92;
    const lightness = Math.max(0.24, 0.82 - tier * 0.08);
    const orangeHsl = d3.hsl(baseHue, saturation, lightness);

    if (isSelected) {
      return orangeHsl.darker(0.2).formatHex();
    }

    return orangeHsl.formatHex();
  };

  // Expose imperative handle to allow resetting view or clearing pop-ups from parent
  useImperativeHandle(ref, () => ({
    resetView: () => {
      handleReset();
    },
    clearFocusedCountry: () => {
      setFocusedCountryId(null);
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }
  }));

  // Prevent map from scrolling away/indefinitely by locking edges beautifully based on global size
  const limitPosition = (pos: { x: number; y: number }, currentZoom: number) => {
    const viewW = width;
    const viewH = height;

    if (!landBounds) {
      // Fallback if bounds are not computed yet
      const mapW = width * currentZoom;
      const mapH = height * currentZoom;
      let minX = viewW - mapW;
      let maxX = 0;
      let minY = viewH - mapH;
      let maxY = 0;
      if (mapW < viewW) {
        minX = (viewW - mapW) / 2;
        maxX = minX;
      }
      if (mapH < viewH) {
        minY = (viewH - mapH) / 2;
        maxY = minY;
      }
      return {
        x: Math.max(minX, Math.min(maxX, pos.x)),
        y: Math.max(minY, Math.min(maxY, pos.y)),
      };
    }

    // Adapt limits: Use 42% of viewport scale as a symmetric safe padding.
    // This aligns the distance beautifully, prevents seeing only water,
    // and guarantees that any country near extreme edges can be dragged up to 42% of the screen width/height,
    // making them fully visible and centerable!
    const padX = viewW * 0.42;
    const padY = viewH * 0.42;

    // Projected land width and height
    const landWidth = (landBounds.maxX - landBounds.minX) * currentZoom;
    const landHeight = (landBounds.maxY - landBounds.minY) * currentZoom;

    let targetX = pos.x;
    let targetY = pos.y;

    // Horizontal limit constraints
    if (landWidth <= viewW - 2 * padX) {
      // If land fits in view with margin, center it horizontally
      targetX = (viewW - (landBounds.maxX + landBounds.minX) * currentZoom) / 2;
    } else {
      // Otherwise, restrict panning symmetric to the country bounds.
      const minX = viewW - padX - landBounds.maxX * currentZoom;
      const maxX = padX - landBounds.minX * currentZoom;
      targetX = Math.max(minX, Math.min(maxX, pos.x));
    }

    // Vertical limit constraints
    if (landHeight <= viewH - 2 * padY) {
      // If land fits in view with margin, center it vertically
      targetY = (viewH - (landBounds.maxY + landBounds.minY) * currentZoom) / 2;
    } else {
      const minY = viewH - padY - landBounds.maxY * currentZoom;
      const maxY = padY - landBounds.minY * currentZoom;
      targetY = Math.max(minY, Math.min(maxY, pos.y));
    }

    return {
      x: targetX,
      y: targetY,
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
    
    // Clear dynamic country highlighted label and dismiss bottom pop-up if zoomed
    if (focusedCountryId) {
      setFocusedCountryId(null);
    }
    if (mobileHoveredId) {
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }

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
    if (focusedCountryId) setFocusedCountryId(null);
    scaleRelative(1.5);
  };
  const handleZoomOut = () => {
    if (selectedCountryId) return;
    if (focusedCountryId) setFocusedCountryId(null);
    scaleRelative(1 / 1.5);
  };
  const handleReset = () => {
    if (selectedCountryId) return;
    if (focusedCountryId) {
      setFocusedCountryId(null);
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }
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

    // Pop up for opening a country should disappear when the user moves the map
    if (focusedCountryId) {
      setFocusedCountryId(null);
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }

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
    if (selectedCountryId) return; // Lock map interaction when country modal is open completely
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
      touchStartClient.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open completely
    
    // Pop up for opening a country should disappear when the user moves the map
    if (focusedCountryId) {
      setFocusedCountryId(null);
      setMobileHoveredId(null);
      setHoveredCountry(null);
    }

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
      
      // Clear dynamic country highlighted label if zoomed on mobile via pinch
      if (isMobile && mobileHoveredId) {
        setMobileHoveredId(null);
        setHoveredCountry(null);
      }

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
      
      // Check swipe gesture on mobile
      if (touchStartClient.current) {
        const dx = touch.clientX - touchStartClient.current.x;
        const dy = touch.clientY - touchStartClient.current.y;
        const totalDist = Math.sqrt(dx * dx + dy * dy);
        
        // If they swiped/dragged, unselect any currently selected / hovered country immediately
        if (totalDist > 8) {
          if (selectedCountryId || mobileHoveredId) {
            onSelectCountry(null, '');
            setMobileHoveredId(null);
            setHoveredCountry(null);
          }
        }
      }

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
    touchStartClient.current = null;
  };

  // Extremely smooth, responsive mouse-centered focal wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (selectedCountryId) return; // Lock map interaction when country modal is open
    if (focusedCountryId) {
      setFocusedCountryId(null);
    }
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

  // Center screen smoothly around a specific country feature with zoom adapted to country physical size
  const centerOnCountry = (feat: any) => {
    if (!feat) return;

    // Isolate mainland / largest landmass for accurate bounding & centroid (filters out far-flung overseas territories)
    let targetGeometry = feat.geometry;
    if (feat.geometry && feat.geometry.type === 'MultiPolygon' && feat.geometry.coordinates) {
      let maxArea = 0;
      let largestPoly: any = null;
      feat.geometry.coordinates.forEach((polyCoords: any) => {
        const polyFeat = { type: 'Feature', geometry: { type: 'Polygon', coordinates: polyCoords } };
        const a = pathGenerator.area(polyFeat as any);
        if (a > maxArea) {
          maxArea = a;
          largestPoly = polyCoords;
        }
      });
      // If the largest polygon is substantial (e.g. mainland France vs French Guiana, or 48 contiguous US states), use it for framing
      if (largestPoly && maxArea > 15) {
        targetGeometry = { type: 'Polygon', coordinates: largestPoly };
      }
    }

    const framingFeature: any = { type: 'Feature', geometry: targetGeometry };
    const bounds = pathGenerator.bounds(framingFeature);
    if (!bounds) return;

    const [[x0, y0], [x1, y1]] = bounds;
    if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) return;

    const centroid = pathGenerator.centroid(framingFeature);
    const cx = !isNaN(centroid[0]) && !isNaN(centroid[1]) ? centroid[0] : (x0 + x1) / 2;
    const cy = !isNaN(centroid[1]) && !isNaN(centroid[1]) ? centroid[1] : (y0 + y1) / 2;

    const dx = Math.max(Math.abs(x1 - x0), 6);
    const dy = Math.max(Math.abs(y1 - y0), 6);

    let visibleW = width;
    let visibleH = height;
    let svgCenterX = width / 2;
    let svgCenterY = height / 2;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const R = Math.max(rect.width / width, rect.height / height);
      visibleW = rect.width / R;
      visibleH = rect.height / R;
      const offsetX = (rect.width - width * R) / 2;
      const offsetY = (rect.height - height * R) / 2;
      svgCenterX = (rect.width / 2 - offsetX) / R;
      svgCenterY = (rect.height / 2 - offsetY) / R;
    }

    // Adaptive zoom scaling directly proportional to the country's physical width and height
    const zoomX = (visibleW * 0.65) / dx;
    const zoomY = (visibleH * 0.58) / dy;
    let targetZoom = Math.min(zoomX, zoomY);
    // Smoothly clamp between 0.9 (continental giants like Russia/USA) and 6.8 (compact countries)
    targetZoom = Math.max(0.9, Math.min(targetZoom, 6.8));

    const nextPos = {
      x: svgCenterX - cx * targetZoom,
      y: svgCenterY - cy * targetZoom,
    };

    setPosition(limitPosition(nextPos, targetZoom));
    setZoom(targetZoom);
  };

  // Click handler on paths: centers on the country with adaptive zoom and shows bottom pop-up
  const handleCountryClick = (e: React.MouseEvent | React.TouchEvent, feature: any) => {
    if (!feature || feature.id === undefined || feature.id === null) return;
    const rawId = feature.id.toString();
    const paddedId = rawId.padStart(3, '0');
    const info = getCountryInfo(paddedId);
    if (!info) return;

    // Focus country and center on it with adaptive framing zoom
    setFocusedCountryId(paddedId);
    setMobileHoveredId(paddedId);
    centerOnCountry(feature);

    // Dismiss any hover tooltip so only the unified bottom pop-up appears
    setHoveredCountry(null);
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

    // If a country is already focused, do not show hover tooltip
    if (focusedCountryId) return;

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

    const count = (isLiveMode ? liveContactCounts[paddedId] : contactCounts[paddedId]) || 0;

    setHoveredCountry({
      id: paddedId,
      name: info.name,
      code: info.code,
      flag: info.flag,
      count,
      x: mouseX,
      y: mouseY - 15, // offset above cursor
    });
  };

  const handleCountryMouseMove = (e: React.MouseEvent, feature: any) => {
    if (focusedCountryId && hoveredCountry) {
      setHoveredCountry(null);
    }
  };

  const handleCountryMouseLeave = () => {
    setHoveredCountry(null);
  };

  // Search filtered lists
  const filteredCountries = searchQuery.trim()
    ? COUNTRY_LIST.map((country) => {
        const localizedName = getCountryInfo(country.id)?.name || country.name;
        return {
          ...country,
          name: localizedName,
        };
      }).filter((country) =>
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
    const paddedId = countryId.padStart(3, '0');
    onSelectCountry(paddedId, countryName);
    setFocusedCountryId(paddedId);
    setSearchQuery('');
    setShowDropdown(false);
    setMobileHoveredId(null);
    setHoveredCountry(null);

    // Center on the searched country
    if (geoData?.features) {
      const feat = geoData.features.find(
        (f: any) => f?.id?.toString()?.padStart(3, '0') === paddedId
      );
      if (feat) {
        centerOnCountry(feat);
        return;
      }
    }
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
          {/* Integrated GLOKO Logo Block with Search Cover */}
          <div
            className="flex items-center justify-between select-none border-b border-slate-100 bg-slate-50/45 py-2 px-3 relative min-h-[46px]"
          >
            {isSearchExpanded ? (
              <div className="flex items-center gap-2 bg-white border border-indigo-200/90 rounded-xl px-2.5 py-1.5 w-full animate-in fade-in duration-150 shadow-xs">
                <Search className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchMapPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent border-none text-xs outline-none font-sans text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => {
                    if (onLogoClick) {
                      onLogoClick();
                    } else {
                      onSelectCountry(null, '');
                      handleReset();
                    }
                  }}
                  title={t.overallStats}
                >
                  <span 
                    className="text-base sm:text-lg font-sans font-extrabold uppercase tracking-widest text-[#0a1e35] flex items-center select-none"
                  >
                    GLOKO
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsSearchExpanded(true)}
                    className="p-1.5 hover:bg-slate-150/55 rounded-lg text-slate-500 hover:text-indigo-650 transition-colors cursor-pointer flex items-center justify-center"
                    title={t.searchFriends}
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Search results shown inline directly inside the book body when search is active */}
          {isSearchExpanded && (
            <div className="border-t border-slate-100 flex flex-col w-full max-h-[300px] sm:max-h-[360px] bg-white animate-in fade-in duration-150 overflow-hidden">
              <div className="overflow-y-auto flex-grow divide-y divide-slate-100/60 p-1">
                {!searchQuery.trim() ? null : (
                  <>
                    {filteredCountries.length > 0 && (
                      <div className="pb-1.5">
                        <div className="px-3 py-1 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-105 font-sans">
                          {getCountriesLabel()} ({filteredCountries.length})
                        </div>
                        {filteredCountries.map((country) => {
                          const count = contactCounts[country.id] || 0;
                          return (
                            <button
                              key={country.id}
                              onClick={() => {
                                handleSearchSelect(country.id, country.name);
                                setIsSearchExpanded(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/50 hover:text-indigo-650 transition-colors font-sans cursor-pointer text-slate-700"
                            >
                              <span className="flex items-center gap-2">
                                <span className="text-base select-none">{country.flag}</span>
                                <span className="font-semibold">{country.name}</span>
                              </span>
                              {count > 0 ? (
                                <span className="bg-indigo-50 text-indigo-655 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
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
                      <div className="pb-1.5">
                        <div className="px-3 py-1 bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-105 font-sans">
                          {getFriendLabel(filteredFriends.length)} ({filteredFriends.length})
                        </div>
                        {filteredFriends.map((friend) => {
                          const paddedId = friend.countryId.padStart(3, '0');
                          const country = COUNTRY_BY_ID[paddedId];
                          const countryFlag = country?.flag || '🗺️';
                          return (
                            <button
                              key={friend.id}
                              onClick={() => {
                                handleSearchSelect(paddedId, country?.name || `Country #${paddedId}`);
                                setIsSearchExpanded(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2.5 text-xs flex flex-col gap-0.5 hover:bg-indigo-50/35 transition-colors font-sans cursor-pointer text-slate-750"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-850">{friend.name}</span>
                                <span className="text-[10px] select-none flex items-center gap-1 bg-indigo-55 text-indigo-650 px-1.5 py-0.5 rounded font-bold font-sans">
                                  <span>{countryFlag}</span>
                                  <span>{country?.name || 'World'}</span>
                                </span>
                              </div>
                              {friend.city && (
                                <span className="text-[9px] text-slate-400 font-normal">📍 {friend.city}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {filteredCountries.length === 0 && filteredFriends.length === 0 && (
                      <div className="py-8 px-4 text-xs text-slate-400 text-center font-sans">
                        {t.noMatchesFound}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {/* Header section which expands/collapses the popup inline */}
          {!isSearchExpanded && (
            <>
              <div 
                onClick={() => setShowStatsDetail((prev) => !prev)}
                className="px-4 py-3.5 flex flex-col gap-1 cursor-pointer hover:bg-slate-50 transition-colors select-none"
                title={showStatsDetail ? t.hideList : t.clickToExpand}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-655 uppercase tracking-widest leading-none">
                    <span>📖</span> {t.friendsBook}
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium font-sans bg-slate-150 px-1.5 py-0.5 rounded">
                    {showStatsDetail ? t.hideList : t.clickToExpand}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-slate-800 leading-none">
                    {new Set(contacts.map((c) => c.countryId.padStart(3, '0'))).size}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{getCountriesLabel()}</span>
                  <span className="text-xs text-slate-400 mx-1">|</span>
                  <span className="text-base font-bold text-slate-800 leading-none">{contacts.length}</span>
                  <span className="text-[10px] text-slate-400 font-medium font-sans">{getFriendLabel(contacts.length)}</span>
                </div>
              </div>

              {/* Inline Expanded Friends Book: History of last 5 friends added with corresponding date */}
              {showStatsDetail && (
                <div className="border-t border-slate-100 flex flex-col w-full max-h-[290px] sm:max-h-[350px] bg-white animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>Last 5 Friends Added</span>
                    </span>
                    <span className="text-[8px] font-mono text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
                      History
                    </span>
                  </div>

                  <div className="overflow-y-auto flex-grow divide-y divide-slate-100/70 p-1">
                    {(() => {
                      const recentHistory = [...contacts]
                        .sort((a, b) => {
                          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                          return tB - tA; // newest first
                        })
                        .slice(0, 5);

                      if (recentHistory.length === 0) {
                        return (
                          <div className="py-8 px-4 text-center text-[11px] text-slate-400 font-sans">
                            {t.noFriendsRecorded}
                          </div>
                        );
                      }

                      return recentHistory.map((friend) => {
                        const paddedId = friend.countryId.padStart(3, '0');
                        const country = COUNTRY_BY_ID[paddedId];
                        const countryName = country?.name || friend.countryName || `Country #${paddedId}`;
                        const countryFlag = country?.flag || '🗺️';

                        let formattedDate = '';
                        if (friend.createdAt) {
                          try {
                            const d = new Date(friend.createdAt);
                            if (!isNaN(d.getTime())) {
                              formattedDate = d.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              });
                            }
                          } catch {
                            formattedDate = '';
                          }
                        }

                        return (
                          <button
                            key={friend.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCountry(paddedId, countryName);
                              setFocusedCountryId(paddedId);
                              if (geoData?.features) {
                                const feat = geoData.features.find(
                                  (f: any) => f?.id?.toString()?.padStart(3, '0') === paddedId
                                );
                                if (feat) centerOnCountry(feat);
                              }
                            }}
                            className="w-full text-left p-2 hover:bg-slate-50/80 rounded-xl transition-colors flex items-start gap-2.5 group cursor-pointer"
                          >
                            {/* Avatar or initial */}
                            <div className="shrink-0 mt-0.5">
                              {friend.photoUrl ? (
                                <img
                                  src={friend.photoUrl}
                                  alt={friend.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedPhoto({ url: friend.photoUrl!, name: friend.name });
                                  }}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xs"
                                  title="Click to view full photo"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                                  {friend.name ? friend.name.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-slate-800 truncate group-hover:text-indigo-650 transition-colors">
                                  {friend.name}
                                </span>
                                {formattedDate && (
                                  <span className="text-[9px] text-slate-400 font-medium shrink-0 font-sans bg-slate-100/70 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Calendar className="w-2.5 h-2.5 text-slate-400 inline" />
                                    <span>{formattedDate}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-slate-500 font-sans">
                                <span className="text-xs select-none leading-none">{countryFlag}</span>
                                <span className="font-medium text-slate-700 truncate">{countryName}</span>
                                {friend.city && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-400 truncate">📍 {friend.city}</span>
                                  </>
                                )}
                              </div>

                              {friend.contactInfo && (
                                <div className="text-[8.5px] text-slate-400 font-mono truncate mt-0.5">
                                  ✉️ {friend.contactInfo}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Map Control Actions */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute top-1/2 -translate-y-1/2 right-4 hidden sm:flex flex-col gap-1.5 z-40"
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
                setFocusedCountryId(null);
                setMobileHoveredId(null);
                setHoveredCountry(null);
              }}
            />

            {/* Dynamic Randomized Ocean Decorations & Labels (Optimized layout rendering dynamically on refresh) */}
            {/* Main Ocean Geographic Text Labels (Zoom-synchronized and beautifully formatted, rendered below continents to naturally truncate/hide overlaps) */}
            <g id="ocean-labels" className="pointer-events-none select-none" opacity="0.45">
              {computedOceanLabels.map((lbl) => {
                const translatedName = getTranslatedOcean(lbl.name, getAppLanguage());
                const words = translatedName.split(' ');
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

              const count = (isLiveMode ? (liveContactCounts[paddedId] || 0) : (contactCounts[paddedId] || 0));
              const isSelected = selectedCountryId === paddedId;
              const isMobileHovered = mobileHoveredId === paddedId;

              return (
                <g key={paddedId}>
                  {/* Crisp flat country base path */}
                  <path
                    d={pathData}
                    fill={getCountryColor(paddedId, count, isSelected, isLiveMode)}
                    stroke={isSelected ? (isLiveMode ? '#059669' : '#4f46e5') : '#b2a897'}
                    strokeWidth={isSelected ? 1.8 / zoom : (isMobileHovered ? 2.8 / zoom : 0.55 / zoom)}
                    className="map-country select-none outline-none"
                    style={{
                      fill: getCountryColor(paddedId, count, isSelected, isLiveMode),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCountryClick(e, feature);
                    }}
                    onMouseEnter={(e) => handleCountryMouseEnter(e, feature)}
                    onMouseMove={(e) => handleCountryMouseMove(e, feature)}
                    onMouseLeave={handleCountryMouseLeave}
                  />
                </g>
              );
            })}

          </g>
        </svg>
      )}

      {/* Top Right Corner: 'Live' Mode Icon Button with Red Signal Icon (no text) */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute top-4 sm:top-6 right-4 sm:right-6 z-40 pointer-events-auto"
      >
        <button
          onClick={handleToggleLiveMode}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-md border transition-all cursor-pointer active:scale-95 select-none ${
            isLiveMode
              ? 'bg-red-500 text-white border-red-600 shadow-red-500/30 ring-2 ring-red-400/40'
              : 'bg-white/95 text-slate-400 hover:text-red-500 hover:border-red-200 border-slate-200/90 shadow-slate-200/50'
          }`}
          title={isLiveMode ? 'Live Mode Enabled (Click to disable)' : 'Enable Live Mode'}
          aria-label="Toggle Live mode"
        >
          <Radio className={`w-5 h-5 transition-colors ${isLiveMode ? 'text-white' : 'text-red-500'}`} />
        </button>
      </div>

      {/* Combined Unified Bottom Pop-up Card with Country Info, Amount of Friends and Open button */}
      {focusedCountryId && !selectedCountryId && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-md text-slate-800 px-3.5 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl shadow-xl border border-slate-200/90 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none max-w-[calc(100vw-32px)]"
        >
          <span className="text-xl sm:text-2xl select-none leading-none flex-shrink-0">
            {getCountryInfo(focusedCountryId)?.flag || '🗺️'}
          </span>
          <div className="flex items-center gap-1.5 min-w-0 pr-1">
            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
              {getCountryInfo(focusedCountryId)?.name}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 shrink-0">
              ({isLiveMode ? (liveContactCounts[focusedCountryId] || 0) : (contactCounts[focusedCountryId] || 0)})
            </span>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 flex-shrink-0" />
          <button
            onClick={() => onSelectCountry(focusedCountryId, getCountryInfo(focusedCountryId)?.name || '')}
            className="text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            Open
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFocusedCountryId(null);
              setMobileHoveredId(null);
              setHoveredCountry(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Interactive Tooltip (Desktop hover only when no country is clicked/focused) */}
      {hoveredCountry && !focusedCountryId && !selectedCountryId && (
        <div
          className="absolute rounded-xl px-2.5 py-1.5 bg-slate-900/95 text-white shadow-md text-xs flex flex-col gap-1 pointer-events-none z-30 font-sans border border-slate-800 animate-in fade-in duration-100"
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
              {isLiveMode ? (
                `${liveContactCounts[hoveredCountry.id] || 0} ${getFriendLabel(liveContactCounts[hoveredCountry.id] || 0)} live`
              ) : (
                `${hoveredCountry.count} ${getFriendLabel(hoveredCountry.count)}`
              )}
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

      {/* Photo viewer modal for expanded friend pictures */}
      <PhotoModal
        isOpen={!!expandedPhoto}
        photoUrl={expandedPhoto?.url || null}
        friendName={expandedPhoto?.name}
        onClose={() => setExpandedPhoto(null)}
      />
    </div>
  );
});

export default WorldMap;
