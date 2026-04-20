import { NextRequest, NextResponse } from 'next/server';
import { fetchWithResilience, fetchBrvmPage } from '@/shared/utils/resilient-scraper';

/**
 * [TENOR 2026] PROXY LIVE BRVM (Architecture de Guerre - OOM Shield)
 * Rôle : Scraping direct du site officiel avec protection Redis SWR.
 * [FIX] Éradication de JSDOM pour prévenir les crashs Out-Of-Memory (OOM) en Serverless.
 * Utilisation d'un parseur natif ultra-léger.
 */

async function getBrvmLiveHTML() {
    return fetchWithResilience(
        'live_cours_actions',
        () => fetchBrvmPage('https://www.brvm.org/fr/cours-actions/0', 38000),
        {
            cacheTtl: 900, // 15 minutes de fraîcheur (FinOps)
            staleTtl: 86400 // 24 heures de survie si panne source
        }
    );
}

// --- NATIVE HTML PARSER UTILS (Zero Dependency, Low Memory) ---

function extractRows(html: string): string[] {
    // Extrait le contenu de la balise <tbody> pour éviter les headers si possible
    const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(html);
    const searchArea = tbodyMatch ? tbodyMatch[1] : html;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows: string[] = [];
    let match;
    while ((match = rowRegex.exec(searchArea)) !== null) {
        rows.push(match[1]);
    }
    return rows;
}

function extractCells(rowHtml: string): string[] {
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let match;
    while ((match = cellRegex.exec(rowHtml)) !== null) {
        // Strip HTML tags and decode basic entities
        let text = match[1].replace(/<[^>]+>/g, '').trim();
        text = text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&');
        cells.push(text);
    }
    return cells;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const rawTicker = searchParams.get('ticker');

    if (!rawTicker) {
        return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // [TENOR 2026] Input Sanitization: Prévention stricte contre l'injection
    const ticker = rawTicker.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    try {
        const { data: html, status } = await getBrvmLiveHTML();
        
        const rowsHtml = extractRows(html);

        // [TENOR 2026] ALL TICKERS MODE (with Max Volume Deduplication)
        if (ticker === 'ALL') {
            const resultsMap = new Map<string, Record<string, unknown>>();

            rowsHtml.forEach((rowHtml) => {
                const cells = extractCells(rowHtml);
                if (cells.length < 7) return;

                const sym = cells[0].trim().toUpperCase();
                const name = cells[1].trim().toUpperCase();

                // Skip summary rows
                const summaryKeywords = ['MOYENNE', 'RÉSUMÉ', 'RESUME', 'TOTAL', 'CALCUL'];
                if (summaryKeywords.some(kw => name.includes(kw))) return;

                // Validate ticker format
                if (sym.length < 3 || sym.length > 10) return;

                const processed = processBrvmRow(cells, sym, status, true);
                
                if (processed.price > 0 || processed.volume > 0) {
                    const existing = resultsMap.get(sym) as { volume: number } | undefined;
                    if (!existing || processed.volume >= existing.volume) {
                        resultsMap.set(sym, processed as unknown as Record<string, unknown>);
                    }
                }
            });

            const resp = NextResponse.json(Array.from(resultsMap.values()));
            resp.headers.set('X-Cache-Status', status);
            return resp;
        }

        // SPECIFIC TICKER MODE
        const matchingRowsHtml = rowsHtml.filter((rowHtml) => {
            const cells = extractCells(rowHtml);
            if (cells.length < 1) return false;
            const firstCell = cells[0].trim().toUpperCase();
            return firstCell === ticker || firstCell === `${ticker}C` || firstCell.replace(/C$/, '') === ticker;
        });

        if (matchingRowsHtml.length === 0) {
            // Loose match fallback
            const relaxedMatchHtml = rowsHtml.find((rowHtml) => {
                const cells = extractCells(rowHtml);
                return cells[0]?.trim().toUpperCase().includes(ticker);
            });

            if (!relaxedMatchHtml) {
                const resp = NextResponse.json({ error: `Ticker ${ticker} not found` }, { status: 404 });
                resp.headers.set('X-Cache-Status', status);
                return resp;
            }
            return NextResponse.json(processBrvmRow(extractCells(relaxedMatchHtml), ticker, status));
        }

        // [TENOR 2026] ROBUST ROW SELECTION
        // If multiple rows match, pick the one with the HIGHEST VOLUME.
        const processedMatches = matchingRowsHtml.map(rowHtml => processBrvmRow(extractCells(rowHtml), ticker, status, true));
        const bestRow = processedMatches.reduce((prev, current) => {
            return (current.volume > prev.volume) ? current : prev;
        }, processedMatches[0]);

        const finalResp = NextResponse.json(bestRow);
        finalResp.headers.set('X-Cache-Status', status);
        return finalResp;

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to scrape BRVM (No cache available)', details: message }, { status: 503 });
    }
}

function processBrvmRow(cells: string[], ticker: string, status: string, rawMode: boolean = false) {
    const rawPrice = cells[5] || '0';
    const rawVar = cells[6] || '0.00%';
    const rawOpen = cells[4] || '0';
    const rawPrevClose = cells[3] || '0';
    const rawVolume = cells[2] || '0';

    const clean = (val: string) => {
        // Remove non-breaking spaces, regular spaces, and keep only digits, dots, commas, and minus signs
        const sanitized = val.replace(/[\u00a0\s]/g, '').replace(/[^\d.,-]/g, '');
        return parseFloat(sanitized.replace(',', '.')) || 0;
    };

    const cleanPrice = clean(rawPrice);
    const cleanVar = rawVar.replace(/[\u00a0\s]/g, '').replace(',', '.');
    const cleanOpen = clean(rawOpen);
    const cleanPrevClose = clean(rawPrevClose);
    const cleanVolume = Math.round(clean(rawVolume));

    const result = {
        symbol: ticker,
        price: cleanPrice,
        variation: cleanVar.includes('%') ? cleanVar : `${cleanVar}%`,
        prevClose: cleanPrevClose,
        open: cleanOpen,
        high: cleanPrice,
        low: cleanPrice,
        volume: cleanVolume,
        source: 'BRVM_DIRECT',
        timestamp: new Date().toISOString()
    };

    // @ts-expect-error cacheStatus is added dynamically
    if (!rawMode) result.cacheStatus = status;
    
    return result;
}