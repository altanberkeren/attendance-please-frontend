"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

interface LocationMapStaticProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number | null;
}

/**
 * Read-only map display for viewing a session's GPS verification location.
 */
export function LocationMapStatic({
  latitude,
  longitude,
  radiusMeters,
}: LocationMapStaticProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: L.Map | null = null;
    let cancelled = false;

    // Dynamically import leaflet to avoid SSR
    import("leaflet").then((L) => {
      if (cancelled) return;

      // Fix default marker icon
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;

      map = L.map(containerRef.current!).setView([latitude, longitude], 16);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([latitude, longitude]).addTo(map);

      // Draw radius circle if provided
      if (radiusMeters && radiusMeters > 0) {
        L.circle([latitude, longitude], {
          radius: radiusMeters,
          color: "#3b82f6",
          fillColor: "#3b82f680",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      if (map) {
        (map as { remove: () => void }).remove();
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="rounded-xl border overflow-hidden" style={{ height: 220 }}>
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
        {radiusMeters ? (
          <span>
            Radius: {radiusMeters}m
          </span>
        ) : null}
      </div>
    </div>
  );
}
