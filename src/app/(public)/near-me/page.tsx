"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { NearMeExplorer } from "@/components/near-me/near-me-explorer";
import type { Venue } from "@/lib/data/public";

type NearbyVenueWithCity = Venue & {
  city_slug: string;
  city_name: string;
  city_country: string;
};

export default function NearMePage() {
  const { status, lat, lng, request } = useGeolocation();
  const [venues, setVenues] = useState<NearbyVenueWithCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Auto-request location on mount
  useEffect(() => {
    request();
  }, [request]);

  // Fetch nearby venues when location is available
  useEffect(() => {
    if (status !== "granted" || lat == null || lng == null) return;

    setLoading(true);
    setFetchError(null);

    fetch(`/api/venues/nearby?lat=${lat}&lng=${lng}&radius=20&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setVenues(data.venues ?? []);
      })
      .catch(() => {
        setFetchError("Failed to load nearby places. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [status, lat, lng]);

  return (
    <div>
      {/* Page header */}
      <div className="pt-8 pb-6">
        <h1
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
            fontSize: "clamp(36px, 9vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.96px",
            fontWeight: 400,
          }}
          className="text-[var(--foreground)]"
        >
          Places near you...
        </h1>
      </div>

      {/* Requesting state */}
      {status === "requesting" && (
        <div className="py-20 flex flex-col items-center gap-4">
          <Image
            src="/rainbow-logo.svg"
            alt=""
            width={32}
            height={32}
            className="animate-spin"
          />
          <p className="text-[15px] text-[var(--muted-foreground)] text-center">
            Requesting your location…
          </p>
        </div>
      )}

      {/* Denied / unavailable state */}
      {(status === "denied" || status === "unavailable") && (
        <div className="py-20 flex flex-col items-center gap-4">
          <p className="text-[17px] font-medium text-[var(--foreground)] text-center">
            Want to see what&rsquo;s nearby?
          </p>
          <p className="text-[15px] text-[var(--muted-foreground)] text-center max-w-[320px]">
            Turn on location in your browser settings.
          </p>
          <button
            type="button"
            onClick={request}
            className="btn-sm btn-sm-primary"
          >
            Request location
          </button>
        </div>
      )}

      {/* Loading venues */}
      {status === "granted" && loading && (
        <div className="py-20 flex flex-col items-center gap-4">
          <Image
            src="/rainbow-logo.svg"
            alt=""
            width={32}
            height={32}
            className="animate-spin"
          />
          <p className="text-[15px] text-[var(--muted-foreground)] text-center">
            Finding places near you…
          </p>
        </div>
      )}

      {/* Error fetching venues */}
      {fetchError && (
        <div className="py-20 flex flex-col items-center gap-4">
          <p className="text-[15px] text-[var(--muted-foreground)] text-center">
            {fetchError}
          </p>
          <button
            type="button"
            onClick={request}
            className="btn-sm btn-sm-primary"
          >
            Request location
          </button>
        </div>
      )}

      {/* Results */}
      {status === "granted" && !loading && !fetchError && lat != null && lng != null && (
        <>
          {venues.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <p className="text-[15px] text-[var(--muted-foreground)] text-center max-w-[320px]">
                No places found near your location yet. We&rsquo;re adding new cities all the time.
              </p>
            </div>
          ) : (
            <NearMeExplorer venues={venues} userLat={lat} userLng={lng} />
          )}
        </>
      )}
    </div>
  );
}
