"use client";

import { useCallback, useState } from "react";

export type GeolocationState = {
  status: "idle" | "requesting" | "granted" | "denied" | "unavailable";
  lat: number | null;
  lng: number | null;
  error: string | null;
};

const initial: GeolocationState = {
  status: "idle",
  lat: null,
  lng: null,
  error: null,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>(initial);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: "unavailable",
        lat: null,
        lng: null,
        error: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setState((s) => ({ ...s, status: "requesting", error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
        });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Please enable location in your browser settings."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Your location could not be determined."
              : "Location request timed out. Please try again.";

        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
          lat: null,
          lng: null,
          error: message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  }, []);

  return { ...state, request };
}
