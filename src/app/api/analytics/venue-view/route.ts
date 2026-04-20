import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Simple in-memory rate limiter (instance-local; provides meaningful protection
// against per-IP abuse on a given serverless instance, but does not aggregate
// across concurrent instances in a multi-instance deployment).
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // max view increments per IP per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now >= entry.resetAt) {
    // Prune expired entries when the map grows large to prevent memory leaks.
    if (rateLimit.size > 10_000) {
      const toDelete: string[] = [];
      for (const [key, e] of rateLimit) {
        if (now >= e.resetAt) toDelete.push(key);
      }
      for (const key of toDelete) rateLimit.delete(key);
    }
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { venue_id?: string }
    | null;
  const venue_id = String(body?.venue_id ?? "").trim();
  if (!venue_id) return NextResponse.json({ error: "venue_id required" }, { status: 400 });

  if (!UUID_RE.test(venue_id)) {
    return NextResponse.json({ error: "venue_id must be a valid UUID" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = createSupabaseAdminClient();
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Single atomic upsert via a SQL function — replaces the previous read-then-write
  // pattern that had a race condition under concurrent requests and used 2 round-trips.
  const { error } = await supabase.rpc("increment_venue_view", {
    p_venue_id: venue_id,
    p_date: date,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

