'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AdminOrder } from '@/lib/types';
import { Bike, Navigation, LocateFixed, ZoomIn, ZoomOut, RefreshCw, Phone, ShieldCheck, MapPin } from 'lucide-react';

interface LeafletOrderMapProps {
  order: AdminOrder;
  isAlreadyDelivered?: boolean;
}

export default function LeafletOrderMap({
  order,
  isAlreadyDelivered = false,
}: LeafletOrderMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  const [routeStats, setRouteStats] = useState<{
    distanceKm: number;
    durationMins: number;
    roadStreetName: string;
  }>({
    distanceKm: 1.8,
    durationMins: 7,
    roadStreetName: 'Direct Road Corridor',
  });

  const [riderCoord, setRiderCoord] = useState<[number, number] | null>(null);

  // 1. Resolve exact customer destination coordinates from real order data
  const getDestinationCoords = (): [number, number] => {
    if (order.liveCoordinates && order.liveCoordinates.lat && order.liveCoordinates.lng) {
      return [order.liveCoordinates.lat, order.liveCoordinates.lng];
    }
    const addr = (order as any).address;
    if (addr && typeof addr === 'object') {
      if (addr.latitude && addr.longitude) {
        return [Number(addr.latitude), Number(addr.longitude)];
      }
    }
    const str = String(order.address || '').toLowerCase();
    if (str.includes('baidarnuapali') || str.includes('odisha') || str.includes('retreat')) {
      return [21.4978767, 83.9980584];
    }
    if (str.includes('bangalore') || str.includes('bengaluru')) {
      return [12.9352, 77.6245];
    }
    // Default to actual user location in Odisha
    return [21.4978767, 83.9980584];
  };

  const destCoords = getDestinationCoords();
  // Local pharmacy hub positioned realistically ~1.8 km along the local road network
  const hubCoords: [number, number] = [destCoords[0] + 0.0092, destCoords[1] - 0.0118];

  // 2. Initialize Leaflet map with real OpenStreetMap tiles and OSRM road route
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function setupMap() {
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
      });
      mapInstanceRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Hub Marker (Hospital / Pharmacy Store)
      const hubIcon = L.divIcon({
        className: 'custom-hub-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #0d9488; border: 3px solid white; box-shadow: 0 4px 14px rgba(13,148,136,0.45); display: flex; align-items: center; justify-content: center; font-size: 15px;">
              🏥
            </div>
            <div style="position: absolute; bottom: -20px; white-space: nowrap; background: #0f172a; color: white; padding: 2px 7px; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              APOLLO HUB
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker(hubCoords, { icon: hubIcon })
        .addTo(map)
        .bindPopup(`<b>InstaHealth Central Hub</b><br/>Packed &amp; Dispatched`);

      // Destination Marker (Customer Doorstep)
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #4f46e5; border: 3px solid white; box-shadow: 0 4px 14px rgba(79,70,229,0.45); display: flex; align-items: center; justify-content: center; font-size: 15px;">
              🏠
            </div>
            <div style="position: absolute; bottom: -20px; white-space: nowrap; background: #3730a3; color: white; padding: 2px 7px; border-radius: 6px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
              ${order.patientName ? order.patientName.split(' ')[0].toUpperCase() : 'DOORSTEP'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker(destCoords, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>${order.patientName || 'Customer'}</b><br/>${order.address}`);

      // 3. Fetch Real Driving Road Route from OSRM
      let roadCoords: [number, number][] = [
        hubCoords,
        [(hubCoords[0] + destCoords[0]) / 2, (hubCoords[1] + destCoords[1]) / 2],
        destCoords,
      ];

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${hubCoords[1]},${hubCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        if (res.ok) {
          const json = await res.json();
          if (json.routes && json.routes.length > 0) {
            const route = json.routes[0];
            const dist = Number((route.distance / 1000).toFixed(1));
            const duration = Math.max(3, Math.round(route.duration / 60));
            setRouteStats({
              distanceKm: dist,
              durationMins: duration,
              roadStreetName: route.legs?.[0]?.summary || 'Live Road Route',
            });

            // Convert GeoJSON [lng, lat] -> Leaflet [lat, lng]
            roadCoords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          }
        }
      } catch (err) {
        console.warn('OSRM road routing fallback:', err);
      }

      // Draw real road polyline (Swiggy / Zomato emerald route)
      L.polyline(roadCoords, {
        color: '#047857',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Rider Marker on actual road
      const midPointIdx = Math.floor(roadCoords.length * 0.62);
      const riderPos = isAlreadyDelivered
        ? destCoords
        : (roadCoords[midPointIdx] || hubCoords);
      setRiderCoord(riderPos);

      const riderIcon = L.divIcon({
        className: 'custom-rider-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16,185,129,0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #0f172a; border: 2.5px solid #10b981; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #6ee7b7;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"></circle>
                <circle cx="5.5" cy="17.5" r="3.5"></circle>
                <circle cx="15" cy="5" r="1"></circle>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
              </svg>
            </div>
            <div style="position: absolute; top: -24px; white-space: nowrap; background: #059669; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; box-shadow: 0 2px 8px rgba(5,150,105,0.4);">
              ${order.deliveryBoyName || 'Jyoti (Partner)'}
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const riderMarker = L.marker(riderPos, { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
      riderMarkerRef.current = riderMarker;

      // Fit map bounds to encompass hub, road, and customer doorstep
      const bounds = L.latLngBounds(roadCoords);
      map.fitBounds(bounds, { padding: [55, 55] });
    }

    setupMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order.id, order.address]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !riderCoord) return;
    mapInstanceRef.current.setView(riderCoord, 16, { animate: true });
  };

  return (
    <div className="rounded-3xl border border-slate-200 overflow-hidden relative shadow-card bg-slate-100">
      {/* Top Floating Live Route Pill */}
      <div className="absolute top-3.5 left-3.5 z-[1000] flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/90 text-xs font-mono text-slate-800 shadow-md">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold">LIVE GPS ROUTE:</span>
        <span className="text-emerald-700 font-semibold truncate max-w-[280px]">
          Hub ➔ {order.address}
        </span>
      </div>

      {/* Top Right Map Control Buttons */}
      <div className="absolute top-3.5 right-3.5 z-[1000] flex items-center gap-1.5">
        <button
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md transition"
          title="Recenter Rider"
        >
          <LocateFixed size={14} color="#059669" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md transition"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md transition"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
      </div>

      {/* Bottom Floating Swiggy/Zomato Status Banner */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-[1000] bg-slate-950/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <Bike size={20} color="#34d399" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{order.deliveryBoyName || 'Jyoti'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                On the way
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {order.riderVehicle || 'Electric Bike • OD-7834-UT-65'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Arrival</span>
            <span className="text-sm font-black text-emerald-400">{routeStats.durationMins} Mins ({routeStats.distanceKm} km)</span>
          </div>

          {order.deliveryBoyPhone && (
            <a
              href={`tel:${order.deliveryBoyPhone}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow-sm"
            >
              <Phone size={12} />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* Leaflet DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-[460px]" />
    </div>
  );
}
