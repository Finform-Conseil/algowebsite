import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import {
  BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
  BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
  fetchBrvmPage,
  fetchWithResilience,
} from '@/shared/utils/resilient-scraper';

const FALLBACK_CACHE_SECONDS = 60;

/**
 * [TENOR 2026] SCRAPER CAPITALISATION LIVE BRVM
 * Rôle : Récupérer les données réelles de capitalisation avec protection Redis SWR.
 * [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention in Serverless.
 */
async function getBrvmCapHTML(signal?: AbortSignal) {
  return fetchWithResilience(
    'live_capitalisations',
    () => fetchBrvmPage(
      'https://www.brvm.org/fr/capitalisations/0',
      BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
      BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
      signal,
    ),
    {
      cacheTtl: 1800, // 30 minutes de fraîcheur (FinOps)
      staleTtl: 86400 // 24 heures de survie
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const { data: html, status } = await getBrvmCapHTML(request.signal);
    const $ = cheerio.load(html);
    
    // [TENOR 2026 FIX] Explicit cast to any[] to satisfy TS strict mode
    const rows = $('table tr').toArray();

    // [TENOR 2026] BATCH MODE
    if (ticker === 'ALL') {
      const results: Record<string, unknown> = {};
      
      rows.forEach((row) => {
        const cells = $(row).find('td').toArray();
        if (cells.length < 7) return;
        
        const sym = $(cells[0]).text().trim().toUpperCase();
        if (sym.length < 3) return;

        // [TENOR 2026 FIX] SCAR-103: Ne JAMAIS supprimer le suffixe 'C'.
        // La suppression cassait les jointures pour ECOC, SGBC, SMBC, etc.
        // On utilise la clé primaire brute telle que fournie par la BRVM.
        results[sym] = processRowData(cells, sym, status, $);
      });

      const resp = NextResponse.json(results);
      resp.headers.set('X-Cache-Status', status);
      return resp;
    }

    // [TENOR 2026] SMART TICKER MATCHING
    // La BRVM utilise parfois "SMBC" pour "SMB". On nettoie et on compare.
    const row = rows.find((r) => {
      const cells = $(r).find('td').toArray();
      if (cells.length < 1) return false;
      const firstCell = $(cells[0]).text().trim().toUpperCase();
      // Match exact ou match "TICKERC" (suffixe C commun pour les actions à la BRVM)
      return firstCell === ticker || firstCell === `${ticker}C` || firstCell.replace(/C$/, '') === ticker;
    });

    if (!row) {
      // Tentative de recherche plus large si pas trouvé
      const looseMatch = rows.find((r) => $(r).text().toUpperCase().includes(ticker));
      if (!looseMatch) {
        const resp = NextResponse.json({ error: "Ticker " + ticker + " not found in capitalization table", found: false, symbol: ticker, source: "BRVM_CAPITALIZATION", timestamp: new Date().toISOString() });
        resp.headers.set('X-Cache-Status', status);
        return resp;
      }
      const cells = $(looseMatch).find('td').toArray();
      return processRow(cells, ticker, status, $);
    }

    const cells = $(row).find('td').toArray();
    return processRow(cells, ticker, status, $);

  } catch (error) {
    if (isBrvmSourceUnavailable(error)) {
      return buildUnavailableCapitalizationResponse(ticker, error);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to scrape BRVM Capitalization', details: message }, { status: 500 });
  }
}

function buildUnavailableCapitalizationResponse(ticker: string, error: unknown) {
  console.warn("[brvm-live-capitalisation] Source unavailable for " + ticker + ", returning degraded payload:", error);
  const response = NextResponse.json(ticker === "ALL"
    ? {}
    : {
      error: "BRVM capitalization source temporarily unavailable",
      found: false,
      source: "BRVM_CAPITALIZATION",
      sourceStatus: "unavailable",
      symbol: ticker,
      timestamp: new Date().toISOString()
    });
  response.headers.set("Cache-Control", "public, s-maxage=" + FALLBACK_CACHE_SECONDS + ", stale-while-revalidate=300");
  response.headers.set("X-Cache-Status", "UNAVAILABLE");
  return response;
}

function isBrvmSourceUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /BRVM|fetch failed|timeout|UND_ERR|ECONN|ABORT_SAFETY_NET|circuit/i.test(message);
}

function processRow(cells: Element[], ticker: string, status: string, $: cheerio.CheerioAPI) {
  const result = processRowData(cells, ticker, status, $);
  const finalResp = NextResponse.json(result);
  finalResp.headers.set('X-Cache-Status', status);
  return finalResp;
}

function processRowData(cells: Element[], ticker: string, status: string, $: cheerio.CheerioAPI) {
  // [0] Code, [1] Nom, [2] Nb Titres, [3] Cours, [4] Cap Flottante, [5] Cap Globale, [6] %
  const rawShares = $(cells[2]).text().trim() || '0';
  const rawPrice = $(cells[3]).text().trim() || '0';
  const rawFloatCap = $(cells[4]).text().trim() || '0';
  const rawGlobalCap = $(cells[5]).text().trim() || '0';

  const clean = (val: string) => {
    // [TENOR 2026] Nettoyage ultra-robuste des formats BRVM
    const cleaned = val.replace(/\u00a0/g, '').replace(/\s/g, '').replace(',', '.').replace(/%/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '0' || cleaned === '0.00') return undefined;
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  };

  return {
    symbol: ticker,
    name: $(cells[1]).text().trim() || '',
    sharesCount: clean(rawShares),
    lastPrice: clean(rawPrice),
    floatingMarketCap: clean(rawFloatCap) ? (clean(rawFloatCap)! / 1000000) : undefined,
    globalMarketCap: clean(rawGlobalCap) ? (clean(rawGlobalCap)! / 1000000) : undefined,
    source: 'BRVM_CAPITALIZATION',
    cacheStatus: status,
    timestamp: new Date().toISOString()
  };
}
