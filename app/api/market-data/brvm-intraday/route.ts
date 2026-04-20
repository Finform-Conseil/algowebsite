/**
 * ============================================================
 * ALGOWAY — BRVM INTRADAY READER ENGINE (SRE/HDR GRADE)
 * Route : /api/market-data/brvm-intraday
 * ============================================================
 *
 * Architecture : Lecture et Agrégation à la volée (On-the-fly)
 * Source       : Upstash Redis (Snapshots générés par le CRON)
 *
 * Rôle :
 * Lit les snapshots de 5 minutes stockés dans Redis pour un ticker donné,
 * les trie chronologiquement, et les agrège en bougies OHLCV selon
 * le timeframe demandé (5m, 15m, 30m, 1H, 4H).
 *
 * Protections SRE :
 * - Fallback gracieux si Redis est vide ou indisponible (retourne []).
 * - Typage strict (Number casting) pour éviter la corruption de données.
 * - Déterminisme temporel absolu (Date.UTC) pour éviter les décalages Vercel.
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────
// REDIS KEY SCHEMA (Dupliqué intentionnellement pour isolation micro-service)
// ─────────────────────────────────────────────
const KEYS = {
  snapshot: (ticker: string, date: string, hhmm: string) => `brvm:snapshot:${ticker}:${date}:${hhmm}`,
  candles: (ticker: string, date: string, tf: string) => `brvm:candles:${ticker}:${date}:${tf}`,
};

// ─────────────────────────────────────────────
// TIMEFRAME MAPPING
// ─────────────────────────────────────────────
const TF_MINUTES: Record<string, number> = {
  "1m": 5, // Fallback de sécurité : 1m n'existe plus, on renvoie 5m
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1H": 60,
  "4H": 240,
};

export async function GET(request: NextRequest) {
  request.signal.addEventListener('abort', () => {
    console.warn("[brvm-intraday] Client disconnected during aggregation");
  });

  const { searchParams } = new URL(request.url);

  // 1. Input Sanitization
  const rawTicker = searchParams.get("ticker") || "SMBC";
  const ticker = rawTicker.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  
  // [TENOR 2026] UI uses "1H", "4H", external LLM used "1h", "4h". We map both.
  let timeframe = searchParams.get("timeframe") || "5m";
  if (timeframe === "1h") timeframe = "1H";
  if (timeframe === "4h") timeframe = "4H";

  const windowSize = TF_MINUTES[timeframe];
  if (!windowSize) {
    return NextResponse.json({ error: `Invalid timeframe: ${timeframe}` }, { status: 400 });
  }

  // 2. Date Resolution (Always UTC to match CRON)
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

  // 3. Redis Connection
  const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
    ? Redis.fromEnv() 
    : null;

  if (!redis) {
    console.warn("[brvm-intraday] Redis not configured. Returning empty array.");
    return NextResponse.json([]);
  }

  try {
    // 4. Check Cache (Fast Path)
    const cacheKey = KEYS.candles(ticker, dateKey, timeframe);
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      return NextResponse.json(typeof cached === 'string' ? JSON.parse(cached) : cached, {
        headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
      });
    }

    // 5. Fetch Snapshots (Slow Path)
    const pattern = KEYS.snapshot(ticker, dateKey, "*");
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all hashes in parallel
    const rawSnapshots = await Promise.all(
      keys.map(async (k) => {
        const data = await redis.hgetall(k);
        if (!data) return null;
        
        // Extract HHmm from key (e.g., "brvm:snapshot:SMBC:20260413:1005" -> "1005")
        const hhmm = k.split(":").pop() ?? "0000";
        const h = parseInt(hhmm.slice(0, 2), 10);
        const m = parseInt(hhmm.slice(2, 4), 10);
        
        return { 
          ...data, 
          minuteOfDay: h * 60 + m, 
          hhmm 
        };
      })
    );

    // 6. Filter and Sort Chronologically
    const validSnapshots = rawSnapshots
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => !isNaN(Number(s.open))) // Protection against corrupted data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.minuteOfDay - b.minuteOfDay);

    if (validSnapshots.length === 0) {
      return NextResponse.json([]);
    }

    // 7. Bucketing (Aggregation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buckets = new Map<number, any[]>();
    for (const s of validSnapshots) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bucket = Math.floor((s as any).minuteOfDay / windowSize) * windowSize;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket)!.push(s);
    }

    // 8. Build OHLCV Candles
    const candles = [];
    const year = parseInt(dateKey.slice(0, 4), 10);
    const month = parseInt(dateKey.slice(4, 6), 10) - 1; // JS months are 0-indexed
    const day = parseInt(dateKey.slice(6, 8), 10);

    for (const [bucketMinute, snaps] of buckets.entries()) {
      const h = Math.floor(bucketMinute / 60);
      const m = bucketMinute % 60;
      
      // [TENOR 2026 FIX] Strict UTC Timezone Enforcement
      const timeIso = new Date(Date.UTC(year, month, day, h, m, 0)).toISOString();

      const open = Number(snaps[0].open);
      const close = Number(snaps[snaps.length - 1].close);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const high = Math.max(...snaps.map((s: any) => Number(s.high)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const low = Math.min(...snaps.map((s: any) => Number(s.low)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const volume = snaps.reduce((acc: number, s: any) => acc + Number(s.volumeDelta || 0), 0);

      candles.push({
        time: timeIso,
        open,
        high,
        low,
        close,
        volume,
        synthetic: true // Flag for the frontend to know these are generated
      });
    }

    // 9. Cache the result (TTL 5 minutes)
    await redis.set(cacheKey, JSON.stringify(candles), { ex: 300 });

    return NextResponse.json(candles, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
    });

  } catch (error) {
    console.error("[brvm-intraday] Aggregation error:", error);
    // Fail gracefully
    return NextResponse.json([]);
  }
}
// --- EOF ---