"use client";

import { useCallback, useState } from "react";

/** Extracts lat/lng from common Google Maps URL formats. */
function extractLatLngFromMapsUrl(url: string): { lat: string; lng: string } | null {
  // Standard: @lat,lng,zoom or @lat,lng,zoomz
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };

  // Legacy: ?ll=lat,lng
  const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return { lat: llMatch[1], lng: llMatch[2] };

  // Query string: ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: qMatch[1], lng: qMatch[2] };

  return null;
}

function validateLat(val: string): string | null {
  if (!val) return null;
  const n = Number(val);
  if (isNaN(n)) return "Must be a number";
  if (n < -90 || n > 90) return "Latitude must be between -90 and 90";
  return null;
}

function validateLng(val: string): string | null {
  if (!val) return null;
  const n = Number(val);
  if (isNaN(n)) return "Must be a number";
  if (n < -180 || n > 180) return "Longitude must be between -180 and 180";
  return null;
}

interface Props {
  /** Current Google Maps URL value */
  mapsUrl: string;
  onMapsUrlChange: (url: string) => void;
  lat: string;
  lng: string;
  onLatChange: (lat: string) => void;
  onLngChange: (lng: string) => void;
  disabled?: boolean;
  inputClassName?: string;
}

export function LatLngPicker({
  mapsUrl,
  onMapsUrlChange,
  lat,
  lng,
  onLatChange,
  onLngChange,
  disabled,
  inputClassName = "",
}: Props) {
  const [extractError, setExtractError] = useState<string | null>(null);

  const latError = validateLat(lat);
  const lngError = validateLng(lng);

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const hasValidCoords =
    !isNaN(latNum) && !isNaN(lngNum) &&
    latNum >= -90 && latNum <= 90 &&
    lngNum >= -180 && lngNum <= 180;

  const handleExtract = useCallback(() => {
    setExtractError(null);
    const result = extractLatLngFromMapsUrl(mapsUrl);
    if (!result) {
      setExtractError("Could not find @lat,lng in URL");
      return;
    }
    onLatChange(result.lat);
    onLngChange(result.lng);
  }, [mapsUrl, onLatChange, onLngChange]);

  // OSM embed URL — updates whenever valid coordinates are available
  const mapSrc = hasValidCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.01},${latNum - 0.01},${lngNum + 0.01},${latNum + 0.01}&layer=mapnik&marker=${latNum},${lngNum}`
    : null;

  return (
    <div className="contents">
      {/* Google Maps URL + Extract button */}
      <div className="sm:col-span-2 flex gap-2">
        <input
          name="google_maps_url"
          value={mapsUrl}
          onChange={(e) => {
            onMapsUrlChange(e.target.value);
            setExtractError(null);
          }}
          placeholder="Google Maps URL"
          disabled={disabled}
          className={`flex-1 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={handleExtract}
          disabled={disabled || !mapsUrl.trim()}
          title="Extract lat/lng from this Google Maps URL"
          className="shrink-0 h-11 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground transition-opacity hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Extract latitude and longitude from Google Maps URL"
        >
          Extract ↗
        </button>
      </div>

      {extractError && (
        <p className="sm:col-span-2 -mt-1 text-xs text-red-600" role="alert">
          {extractError}
        </p>
      )}

      {/* Lat input */}
      <div className="flex flex-col gap-1">
        <input
          name="lat"
          value={lat}
          onChange={(e) => onLatChange(e.target.value)}
          placeholder="Latitude"
          disabled={disabled}
          className={inputClassName}
          aria-label="Latitude"
          aria-invalid={!!latError}
        />
        {latError && (
          <p className="text-xs text-red-600" role="alert">{latError}</p>
        )}
      </div>

      {/* Lng input */}
      <div className="flex flex-col gap-1">
        <input
          name="lng"
          value={lng}
          onChange={(e) => onLngChange(e.target.value)}
          placeholder="Longitude"
          disabled={disabled}
          className={inputClassName}
          aria-label="Longitude"
          aria-invalid={!!lngError}
        />
        {lngError && (
          <p className="text-xs text-red-600" role="alert">{lngError}</p>
        )}
      </div>

      {/* Mini map preview */}
      {mapSrc && (
        <div className="sm:col-span-2">
          <iframe
            src={mapSrc}
            title="Location preview"
            className="h-[140px] w-full rounded-xl border border-border"
            loading="lazy"
            aria-label={`Map preview for coordinates ${latNum}, ${lngNum}`}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {latNum.toFixed(6)}, {lngNum.toFixed(6)} —{" "}
            <a
              href={`https://www.openstreetmap.org/?mlat=${latNum}&mlon=${lngNum}#map=15/${latNum}/${lngNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Open in OSM ↗
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
