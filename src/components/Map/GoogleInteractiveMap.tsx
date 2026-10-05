// Source: Google Maps Platform Architecture & Resilient Telematics
import * as React from 'react';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Crosshair,
  Layers,
  Navigation,
  Car as CarIcon,
  MapPin,
  Sparkles,
  Compass,
  Plus,
  Minus,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS } from '../../data/mockData';
import { findNearestHargeisaPlace } from '../../utils/geo';
import { RealisticVehicleMarker } from './RealisticVehicleMarker';

interface GoogleInteractiveMapProps {
  showSurgeHeatmap?: boolean;
  selectableMode?: 'pickup' | 'dropoff' | null;
  height?: string;
}

// Google Maps API Key resolved from build-time define or env
const RAW_GOOGLE_MAPS_KEY =
  (process.env as any).GOOGLE_MAPS_PLATFORM_KEY ||
  (process.env as any).GOOGLE_MAPS_API_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  '';

const GOOGLE_MAPS_KEY = RAW_GOOGLE_MAPS_KEY.trim();

// Convert Lat/Lng to Slippy Map Tile Coordinates
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

// Convert Lat/Lng to exact Pixel coordinates at a given zoom level
function latLngToPixel(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const rad = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n * 256;
  const y = ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n * 256;
  return { x, y };
}

// Convert Pixel coordinates back to Lat/Lng
function pixelToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / (n * 256)) * 360 - 180;
  const rad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / (n * 256))));
  const lat = (rad * 180) / Math.PI;
  return { lat, lng };
}

export const GoogleInteractiveMap: React.FC<GoogleInteractiveMapProps> = ({
  showSurgeHeatmap = false,
  selectableMode = null,
  height = '100%',
}) => {
  const {
    pickupLocation,
    dropoffLocation,
    drivers,
    setPickupLocation,
    setDropoffLocation,
    currentRide,
    roadRoute,
    roadDistanceKm,
    roadDurationMins,
    role,
    driverGpsStatus,
  } = useRide();

  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(() => ({
    lat: pickupLocation?.lat || 9.5600,
    lng: pickupLocation?.lng || 44.0650,
  }));
  const [zoom, setZoom] = useState<number>(14);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'satellite' | 'dark'>('roadmap');
  const [showTraffic, setShowTraffic] = useState<boolean>(true);
  const [isCenteringGPS, setIsCenteringGPS] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Dragging & Panning state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const centerStartRef = useRef<{ lat: number; lng: number }>({ lat: 9.5600, lng: 44.0650 });
  const hasMovedRef = useRef(false);

  // Pinch-to-zoom state for mobile touch
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(14);

  // Container dimensions with robust fallback
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width > 0 ? rect.width : window.innerWidth || 800,
          height: rect.height > 0 ? rect.height : window.innerHeight || 600,
        });
      }
    };
    updateDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  // Update center when pickup location changes initially
  useEffect(() => {
    if (pickupLocation?.lat && pickupLocation?.lng) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    }
  }, [pickupLocation?.lat, pickupLocation?.lng]);

  // Real-Time Hardware GPS Driver Telematics
  const assignedDriver = currentRide?.assignedDriverId
    ? drivers.find((d) => d.id === currentRide.assignedDriverId)
    : undefined;

  const liveDriverPos = useMemo(() => {
    if (role === 'driver' && driverGpsStatus?.active && driverGpsStatus.lat) {
      return {
        lat: driverGpsStatus.lat,
        lng: driverGpsStatus.lng,
        heading: driverGpsStatus.heading || 0,
      };
    }
    if (assignedDriver) {
      return {
        lat: assignedDriver.currentLocation?.lat ?? (assignedDriver as any).lat ?? 9.5600,
        lng: assignedDriver.currentLocation?.lng ?? (assignedDriver as any).lng ?? 44.0650,
        heading: assignedDriver.currentHeading ?? 45,
      };
    }
    return null;
  }, [role, driverGpsStatus, assignedDriver]);

  // Mouse & Touch Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    centerStartRef.current = { ...center };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    const centerPixel = latLngToPixel(centerStartRef.current.lat, centerStartRef.current.lng, zoom);
    const newPixel = { x: centerPixel.x - dx, y: centerPixel.y - dy };
    const newLatLng = pixelToLatLng(newPixel.x, newPixel.y, zoom);
    setCenter(newLatLng);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!hasMovedRef.current && isDraggingRef.current) {
      // Map Clicked: Set Pickup or Dropoff
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
        const targetPixel = {
          x: centerPixel.x + (clickX - dimensions.width / 2),
          y: centerPixel.y + (clickY - dimensions.height / 2),
        };
        const clickedLatLng = pixelToLatLng(targetPixel.x, targetPixel.y, zoom);
        handleLocationSelect(clickedLatLng.lat, clickedLatLng.lng);
      }
    }
    isDraggingRef.current = false;
  };

  // Touch handlers for mobile smooth panning and pinch-to-zoom
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasMovedRef.current = false;
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      centerStartRef.current = { ...center };
      initialPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      const centerPixel = latLngToPixel(centerStartRef.current.lat, centerStartRef.current.lng, zoom);
      const newPixel = { x: centerPixel.x - dx, y: centerPixel.y - dy };
      const newLatLng = pixelToLatLng(newPixel.x, newPixel.y, zoom);
      setCenter(newLatLng);
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialPinchDistRef.current;
      if (ratio > 1.25) {
        setZoom((z) => Math.min(18, Math.round(initialZoomRef.current + 1)));
        initialPinchDistRef.current = currentDist;
        initialZoomRef.current = Math.min(18, initialZoomRef.current + 1);
      } else if (ratio < 0.75) {
        setZoom((z) => Math.max(10, Math.round(initialZoomRef.current - 1)));
        initialPinchDistRef.current = currentDist;
        initialZoomRef.current = Math.max(10, initialZoomRef.current - 1);
      }
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(18, z + 1));
    } else {
      setZoom((z) => Math.max(10, z - 1));
    }
  };

  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      const nearest = findNearestHargeisaPlace(lat, lng);
      const newLoc = {
        id: `loc_pin_${Date.now()}`,
        name: nearest.name,
        address: nearest.address,
        lat,
        lng,
      };

      if (selectableMode === 'dropoff') {
        setDropoffLocation(newLoc);
      } else {
        setPickupLocation(newLoc);
      }
    },
    [selectableMode, setDropoffLocation, setPickupLocation]
  );

  const handleCenterGPS = () => {
    if ('geolocation' in navigator) {
      setIsCenteringGPS(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCenteringGPS(false);
          const { latitude, longitude } = pos.coords;
          setUserGpsLocation({ lat: latitude, lng: longitude });
          setCenter({ lat: latitude, lng: longitude });
          setZoom(15);
          handleLocationSelect(latitude, longitude);
        },
        () => {
          setIsCenteringGPS(false);
          setCenter({ lat: 9.5600, lng: 44.0650 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const handleFitBounds = () => {
    if (pickupLocation && dropoffLocation) {
      const midLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
      const midLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
      setCenter({ lat: midLat, lng: midLng });
      setZoom(13);
    } else if (pickupLocation) {
      setCenter({ lat: pickupLocation.lat, lng: pickupLocation.lng });
      setZoom(15);
    } else {
      setCenter({ lat: 9.5600, lng: 44.0650 });
      setZoom(14);
    }
  };

  // Map tile calculations with buffer padding to prevent black margins
  const centerPixel = latLngToPixel(center.lat, center.lng, zoom);
  const minTile = latLngToTile(
    pixelToLatLng(centerPixel.x - dimensions.width / 2 - 256, centerPixel.y - dimensions.height / 2 - 256, zoom).lat,
    pixelToLatLng(centerPixel.x - dimensions.width / 2 - 256, centerPixel.y - dimensions.height / 2 - 256, zoom).lng,
    zoom
  );
  const maxTile = latLngToTile(
    pixelToLatLng(centerPixel.x + dimensions.width / 2 + 256, centerPixel.y + dimensions.height / 2 + 256, zoom).lat,
    pixelToLatLng(centerPixel.x + dimensions.width / 2 + 256, centerPixel.y + dimensions.height / 2 + 256, zoom).lng,
    zoom
  );

  const tiles = useMemo(() => {
    const list: Array<{ x: number; y: number; left: number; top: number; key: string; url: string; fallbackUrl: string }> = [];
    const tileStartX = Math.max(0, minTile.x - 2);
    const tileEndX = maxTile.x + 2;
    const tileStartY = Math.max(0, maxTile.y - 2);
    const tileEndY = minTile.y + 2;

    for (let tx = tileStartX; tx <= tileEndX; tx++) {
      for (let ty = tileStartY; ty <= tileEndY; ty++) {
        const tilePixelX = tx * 256;
        const tilePixelY = ty * 256;
        const screenX = tilePixelX - centerPixel.x + dimensions.width / 2;
        const screenY = tilePixelY - centerPixel.y + dimensions.height / 2;

        let url = `https://mt1.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
        let fallbackUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`;

        if (mapLayer === 'satellite') {
          url = `https://mt1.google.com/vt/lyrs=y&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
          fallbackUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
        } else if (mapLayer === 'dark') {
          url = `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${tx}/${ty}.png`;
          fallbackUrl = `https://mt1.google.com/vt/lyrs=m&x=${tx}&y=${ty}&z=${zoom}&hl=en`;
        }

        list.push({
          x: tx,
          y: ty,
          left: screenX,
          top: screenY,
          key: `${mapLayer}_${zoom}_${tx}_${ty}`,
          url,
          fallbackUrl,
        });
      }
    }
    return list;
  }, [zoom, minTile, maxTile, centerPixel, dimensions, mapLayer]);

  // Coordinate-to-Screen-Pixel converter
  const toScreenCoord = useCallback(
    (lat: number, lng: number) => {
      const p = latLngToPixel(lat, lng, zoom);
      return {
        x: p.x - centerPixel.x + dimensions.width / 2,
        y: p.y - centerPixel.y + dimensions.height / 2,
      };
    },
    [centerPixel, dimensions, zoom]
  );

  // SVG Polyline Path computation
  const routeSvgPath = useMemo(() => {
    if (!pickupLocation || !dropoffLocation) return '';
    if (roadRoute?.coordinates && roadRoute.coordinates.length > 1) {
      const points = roadRoute.coordinates.map(([lng, lat]) => {
        const pt = toScreenCoord(lat, lng);
        return `${pt.x},${pt.y}`;
      });
      return `M ${points.join(' L ')}`;
    }
    const p1 = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
    const p2 = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
    return `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
  }, [pickupLocation, dropoffLocation, roadRoute, toScreenCoord]);

  // Driver Approach Path computation
  const approachSvgPath = useMemo(() => {
    if (!liveDriverPos || !pickupLocation || (currentRide?.status !== 'accepted' && currentRide?.status !== 'driver_arrived')) {
      return '';
    }
    const pDriver = toScreenCoord(liveDriverPos.lat, liveDriverPos.lng);
    const pPickup = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
    return `M ${pDriver.x},${pDriver.y} L ${pPickup.x},${pPickup.y}`;
  }, [liveDriverPos, pickupLocation, currentRide?.status, toScreenCoord]);

  return (
    <div
      ref={containerRef}
      className={`w-full relative overflow-hidden select-none font-sans cursor-grab active:cursor-grabbing ${
        mapLayer === 'dark' ? 'bg-[#111827]' : mapLayer === 'satellite' ? 'bg-[#0f172a]' : 'bg-[#e5e3df]'
      }`}
      style={{
        height,
        backgroundImage:
          mapLayer === 'roadmap'
            ? 'radial-gradient(#CBD5E1 1px, transparent 1px)'
            : undefined,
        backgroundSize: '24px 24px',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* 1. Map Tiles Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {tiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt="map-tile"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== t.fallbackUrl) {
                target.src = t.fallbackUrl;
              }
            }}
            className="absolute w-[256px] h-[256px] select-none pointer-events-none"
            style={{
              left: `${t.left}px`,
              top: `${t.top}px`,
            }}
          />
        ))}
      </div>

      {/* 2. Route Polylines SVG Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {/* Approach Route (Driver to Pickup) */}
        {approachSvgPath && (
          <path
            d={approachSvgPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeDasharray="6 6"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )}

        {/* Main Trip Route (Pickup to Dropoff) */}
        {routeSvgPath && (
          <>
            <path
              d={routeSvgPath}
              fill="none"
              stroke="#00E575"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,229,117,0.5))' }}
            />
            <path
              d={routeSvgPath}
              fill="none"
              stroke="#094757"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>

      {/* 3. HTML Custom Interactive Markers Layer */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* User Precise GPS Pin */}
        {userGpsLocation && (() => {
          const pt = toScreenCoord(userGpsLocation.lat, userGpsLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-2 bg-blue-500/50 rounded-full animate-ping pointer-events-none" />
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-xl text-white">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rider Pickup Beacon Marker */}
        {pickupLocation && (() => {
          const pt = toScreenCoord(pickupLocation.lat, pickupLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center select-none pb-1">
                <div className="relative bg-[#0066F5] text-white text-[11px] font-extrabold px-3 py-1 rounded-xl shadow-xl whitespace-nowrap mb-1 flex items-center space-x-1 border border-blue-400/30 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[5px] after:border-transparent after:border-t-[#0066F5]">
                  <span>Halka aad Joogto</span>
                </div>
                <div className="relative mt-1 flex items-center justify-center">
                  <div className="absolute -inset-2 bg-blue-500/40 rounded-full animate-ping pointer-events-none" />
                  <div className="w-5 h-5 rounded-full bg-[#0066F5] border-[2.5px] border-white flex items-center justify-center shadow-lg text-white">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Rider Dropoff Marker (Destination A) */}
        {dropoffLocation && (() => {
          const pt = toScreenCoord(dropoffLocation.lat, dropoffLocation.lng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-full pointer-events-none"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex flex-col items-center pb-1">
                <div className="px-2 py-0.5 bg-slate-950/90 border border-indigo-400 text-indigo-300 text-[10px] font-black rounded-md shadow-md mb-1 whitespace-nowrap">
                  Dropoff: {(dropoffLocation.name || 'Dropoff').slice(0, 18)}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#094757] border-2 border-[#00E575] flex items-center justify-center text-[#00E575] shadow-lg">
                  <span className="text-xs font-black">A</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Live Assigned Driver Vehicle Marker (Real Car with Registered Color & Dynamic Heading) */}
        {liveDriverPos && (() => {
          const pt = toScreenCoord(liveDriverPos.lat, liveDriverPos.lng);
          const vehicleColor = assignedDriver?.vehicle?.color || (assignedDriver as any)?.carColor || 'White';
          const vehicleModel = assignedDriver?.vehicle?.model || (assignedDriver as any)?.carModel || 'Toyota Vitz';
          const vehiclePlate = assignedDriver?.vehicle?.licensePlate || (assignedDriver as any)?.carPlate || 'SL-4921';

          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out z-25"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <RealisticVehicleMarker
                color={vehicleColor}
                model={vehicleModel}
                licensePlate={vehiclePlate}
                driverName={assignedDriver?.name || 'Driver'}
                heading={liveDriverPos.heading}
                isAssigned={true}
                showDetails={true}
                size="lg"
              />
            </div>
          );
        })()}

        {/* Nearby Idle Fleet Cars (Each Car in its Real Registered Color & Model) */}
        {Array.from(
          new Map(
            drivers
              .filter((d) => !assignedDriver || d.id !== assignedDriver.id)
              .map((d) => [d.id || d.phone, d])
          ).values()
        ).map((driver, idx) => {
          const dLat = driver.currentLocation?.lat ?? (driver as any).currentLat ?? 9.5600;
          const dLng = driver.currentLocation?.lng ?? (driver as any).currentLng ?? 44.0650;
          const pt = toScreenCoord(dLat, dLng);
          const carColor = driver.vehicle?.color ?? (driver as any).carColor ?? (idx % 2 === 0 ? 'Blue' : 'White');
          const carModel = driver.vehicle?.model ?? (driver as any).carModel ?? 'Toyota Vitz';
          const carPlate = driver.vehicle?.licensePlate ?? (driver as any).carPlate ?? 'SL-4921';
          const heading = driver.currentHeading ?? (idx * 65) % 360;

          return (
            <div
              key={`fleet_driver_${driver.id || idx}_${idx}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 hover:z-30"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <RealisticVehicleMarker
                color={carColor}
                model={carModel}
                licensePlate={carPlate}
                driverName={driver.name}
                heading={heading}
                isAssigned={false}
                showDetails={role === 'admin'}
                size="md"
              />
            </div>
          );
        })}

        {/* Mid-Route Floating Indicator Card */}
        {pickupLocation && dropoffLocation && (() => {
          const midLat = (pickupLocation.lat + dropoffLocation.lat) / 2;
          const midLng = (pickupLocation.lng + dropoffLocation.lng) / 2;
          const pt = toScreenCoord(midLat, midLng);
          return (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="relative flex items-center space-x-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xl border border-slate-200 text-slate-800 text-xs font-black whitespace-nowrap">
                <CarIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="text-slate-900 font-black">~ {roadDistanceKm ? roadDistanceKm.toFixed(1) : '7.0'} km</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-700 font-bold">~ {roadDurationMins || '10'} daqiiqo</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. Floating Map Controls (Zoom, Layers, GPS, Recenter) */}
      <div className="absolute right-3 bottom-4 flex flex-col space-y-2 z-30 pointer-events-auto">
        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(18, z + 1))}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer font-bold"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(10, z - 1))}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer font-bold"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Locate GPS */}
        <button
          type="button"
          onClick={handleCenterGPS}
          disabled={isCenteringGPS}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-emerald-400 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Locate My GPS Position"
        >
          <Crosshair className={`w-5 h-5 ${isCenteringGPS ? 'animate-spin text-amber-500' : ''}`} />
        </button>

        {/* Recenter Bounds */}
        <button
          type="button"
          onClick={handleFitBounds}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 font-black text-xs cursor-pointer"
          title="Fit Route to View"
        >
          <Compass className="w-5 h-5" />
        </button>

        {/* Layer Switcher */}
        <button
          type="button"
          onClick={() => setMapLayer((l) => (l === 'roadmap' ? 'satellite' : l === 'satellite' ? 'dark' : 'roadmap'))}
          className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-slate-800 transition active:scale-95 text-xs font-bold cursor-pointer"
          title={`Layer: ${mapLayer}`}
        >
          <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </button>
      </div>
    </div>
  );
};
