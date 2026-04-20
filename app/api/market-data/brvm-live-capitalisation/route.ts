import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { fetchWithResilience, fetchBrvmPage } from '@/shared/utils/resilient-scraper';

/**
 * [TENOR 2026] SCRAPER CAPITALISATION LIVE BRVM
 * Rôle : Récupérer les données réelles de capitalisation avec protection Redis SWR.
 * [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention in Serverless.
 */
async function getBrvmCapHTML() {
  return fetchWithResilience(
    'live_capitalisations',
    () => fetchBrvmPage('https://www.brvm.org/fr/capitalisations/0', 38000),
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
    const { data: html, status } = await getBrvmCapHTML();
    const $ = cheerio.load(html);
    
    // [TENOR 2026 FIX] Explicit cast to any[] to satisfy TS strict mode
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = $('table tr').toArray() as any[];

    // [TENOR 2026] BATCH MODE
    if (ticker === 'ALL') {
      const results: Record<string, unknown> = {};
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows.forEach((row: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cells = $(row).find('td').toArray() as any[];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = rows.find((r: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cells = $(r).find('td').toArray() as any[];
      if (cells.length < 1) return false;
      const firstCell = $(cells[0]).text().trim().toUpperCase();
      // Match exact ou match "TICKERC" (suffixe C commun pour les actions à la BRVM)
      return firstCell === ticker || firstCell === `${ticker}C` || firstCell.replace(/C$/, '') === ticker;
    });

    if (!row) {
      // Tentative de recherche plus large si pas trouvé
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const looseMatch = rows.find((r: any) => $(r).text().toUpperCase().includes(ticker));
      if (!looseMatch) {
        const resp = NextResponse.json({ error: `Ticker ${ticker} not found in capitalization table` }, { status: 404 });
        resp.headers.set('X-Cache-Status', status);
        return resp;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cells = $(looseMatch).find('td').toArray() as any[];
      return processRow(cells, ticker, status, $);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cells = $(row).find('td').toArray() as any[];
    return processRow(cells, ticker, status, $);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to scrape BRVM Capitalization', details: message }, { status: 503 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processRow(cells: any[], ticker: string, status: string, $: cheerio.CheerioAPI) {
  const result = processRowData(cells, ticker, status, $);
  const finalResp = NextResponse.json(result);
  finalResp.headers.set('X-Cache-Status', status);
  return finalResp;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processRowData(cells: any[], ticker: string, status: string, $: cheerio.CheerioAPI) {
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