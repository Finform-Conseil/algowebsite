// ================================================================================
// FICHIER : src/app/api/market-data/indices/route.ts
// RÔLE : Récupérer les performances réelles des indices (BRVMC, BRVM30, BRVMPR).
// [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention.
// [TENOR 2026 FIX] SCAR-122: Strict TypeScript Compliance (Explicit any/number casts).
// ================================================================================

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchWithResilience, fetchBrvmPage } from '@/shared/utils/resilient-scraper';

/**
 * [TENOR 2026] SCRAPER INDICES LIVE BRVM
 * Rôle : Récupérer les performances réelles des indices (BRVMC, BRVM30, BRVMPR).
 */
async function getBrvmIndicesHTML() {
  return fetchWithResilience(
    'live_indices',
    () => fetchBrvmPage('https://www.brvm.org/fr/indices', 38000),
    { cacheTtl: 900, staleTtl: 86400 } // 15 minutes / 24 heures
  );
}

export async function GET() {
  try {
    const { data: html, status } = await getBrvmIndicesHTML();
    const $ = cheerio.load(html);
    
    // [TENOR 2026 FIX] Explicit cast to any[] to satisfy TS strict mode
    const rows = $('table tr').toArray() as any[];
    
    const results: Record<string, { symbol: string; name: string; price: number; variation: string; timestamp: string }> = {};

    // [TENOR 2026 FIX] Explicit typing for row to fix TS 7006
    rows.forEach((row: any) => {
      // [TENOR 2026 FIX] Explicit cast to any[]
      const cells = $(row).find('td').toArray() as any[];
      if (cells.length < 3) return;

      const fullName = $(cells[0]).text().trim().toUpperCase() || '';
      const priceStr = $(cells[2]).text().trim() || '0';
      const varStr = $(cells[3]).text().trim() || '0,00';

      const cleanValue = (val: string) => {
        const sanitized = val.replace(/\u00a0/g, '').replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
        return parseFloat(sanitized) || 0;
      };

      // Mapping Robuste [TENOR 2026]
      let ticker = '';
      if (fullName === 'BRVM-30' || fullName.includes('BRVM 30')) ticker = 'BRVM30';
      else if (fullName.includes('COMPOSITE')) ticker = 'BRVMC';
      else if (fullName.includes('PRESTIGE')) ticker = 'BRVMPR';
      else if (fullName === 'BRVM-10') ticker = 'BRVM10';

      if (ticker) {
        results[ticker] = {
          symbol: ticker,
          name: fullName,
          price: cleanValue(priceStr),
          variation: varStr.includes('%') ? varStr : `${varStr.replace(/\s/g, '').replace(',', '.')}%`,
          timestamp: new Date().toISOString()
        };
      }
    });

    const resp = NextResponse.json(results);
    resp.headers.set('X-Cache-Status', status);
    return resp;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to scrape BRVM Indices', details: message }, { status: 503 });
  }
}