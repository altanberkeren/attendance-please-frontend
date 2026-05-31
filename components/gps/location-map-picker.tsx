"use client";

import { Locate, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onRadiusChange: (radius: number) => void;
}

/**
 * A Leaflet-based map picker that lets the teacher pick a GPS location.
 * The map itself is loaded dynamically to avoid SSR issues.
 */
export function LocationMapPicker({
  latitude,
  longitude,
  radiusMeters,
  onLocationChange,
  onRadiusChange,
}: LocationMapPickerProps) {
  const [gettingLocation, setGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Dynamically loaded map component
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    lat: number;
    lng: number;
    onClick: (lat: number, lng: number) => void;
  }> | null>(null);

  // Lazy-load the Leaflet map to avoid SSR issues
  useEffect(() => {
    let cancelled = false;
    import("./leaflet-map-inner").then((mod) => {
      if (!cancelled) setMapComponent(() => mod.LeafletMapInner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGettingLocation(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange(position.coords.latitude, position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        let msg = "Failed to get current location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out.";
        }
        setGeoError(msg);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onLocationChange]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      onLocationChange(lat, lng);
    },
    [onLocationChange],
  );

  return (
    <div className="space-y-3">
      {/* Map display */}
      <div className="rounded-xl border overflow-hidden" style={{ height: 280 }}>
        {latitude != null && longitude != null && MapComponent ? (
          <MapComponent lat={latitude} lng={longitude} onClick={handleMapClick} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-muted-foreground gap-2">
            <MapPin className="h-8 w-8" />
            <p className="text-sm">Click &quot;Use My Location&quot; or select on map</p>
          </div>
        )}
      </div>

      {/* Coordinates display */}
      {latitude != null && longitude != null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Radius (meters)
          </label>
          <Input
            type="number"
            min={10}
            max={5000}
            value={radiusMeters}
            onChange={(e) => onRadiusChange(Number(e.target.value) || 100)}
            className="h-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 h-9"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation}
        >
          <Locate className="h-3.5 w-3.5" />
          {gettingLocation ? "Locating..." : "Use My Location"}
        </Button>
      </div>

      {geoError && (
        <p className="text-xs text-destructive">{geoError}</p>
      )}
    </div>
  );
}
