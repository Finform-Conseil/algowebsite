import { NextRequest, NextResponse } from 'next/server';
import {
    BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
    BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
    fetchBrvmPage,
    fetchWithResilience,
} from '@/shared/utils/resilient-scraper';

const FALLBACK_CACHE_SECONDS = 30;

/**
 * [TENOR 2026] PROXY LIVE BRVM (Architecture de Guerre - OOM Shield)
 * Rôle : Scraping direct du site officiel avec protection Redis SWR.
 * [FIX] Éradication de JSDOM pour prévenir les crashs Out-Of-Memory (OOM) en Serverless.
 * Utilisation d'un parseur natif ultra-léger.
 */

async function getBrvmLiveHTML(signal?: AbortSignal) {
    return fetchWithResilience(
        'live_cours_actions',
        () => fetchBrvmPage(
            'https://www.brvm.org/fr/cours-actions/0',
            BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
            BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
            signal,
        ),
        {
            cacheTtl: 900, // 15 minutes de fraîcheur (FinOps)
            staleTtl: 86400 // 24 heures de survie si panne source
        }
    );
}

// --- NATIVE HTML PARSER UTILS (Zero Dependency, Low Memory) ---

function decodeHtmlText(value: string): string {
    return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, String.fromCharCode(34))
        .replace(/&#039;/g, String.fromCharCode(39))
        .replace(/&apos;/gi, String.fromCharCode(39))
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeTableText(value: string): string {
    return decodeHtmlText(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}

function extractTables(html: string): string[] {
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    const tables: string[] = [];
    let match;
    while ((match = tableRegex.exec(html)) !== null) {
        tables.push(match[0]);
    }
    return tables;
}

function selectCoursActionsTableHtml(html: string): string {
    let bestTable = '';
    let bestScore = 0;

    for (const table of extractTables(html)) {
        const normalized = normalizeTableText(table);
        let score = 0;
        if (normalized.includes('SYMBOLE')) score += 3;
        if (normalized.includes('COURS CLOTURE')) score += 4;
        if (normalized.includes('COURS VEILLE')) score += 2;
        if (normalized.includes('COURS OUVERTURE')) score += 2;
        if (normalized.includes('VOLUME')) score += 1;
        if (normalized.includes('VARIATION')) score += 1;
        if (normalized.includes('BOAB')) score += 1;

        if (score > bestScore) {
            bestScore = score;
            bestTable = table;
        }
    }

    return bestScore >= 7 ? bestTable : html;
}

function extractRows(html: string): string[] {
    const tableHtml = selectCoursActionsTableHtml(html);
    const tbodyMatch = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(tableHtml);
    const searchArea = tbodyMatch ? tbodyMatch[1] : tableHtml;

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
        cells.push(decodeHtmlText(match[1]));
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
        const { data: html, status } = await getBrvmLiveHTML(request.signal);
        
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
                const resp = NextResponse.json({ error: "Ticker " + ticker + " not found", found: false, symbol: ticker, source: "BRVM_DIRECT", timestamp: new Date().toISOString() });
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
        if (isBrvmSourceUnavailable(error)) {
            return buildUnavailableLiveResponse(ticker, error);
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'Failed to scrape BRVM', details: message }, { status: 500 });
    }
}

function buildUnavailableLiveResponse(ticker: string, error: unknown) {
    console.warn("[brvm-live] Source unavailable for " + ticker + ", returning degraded payload:", error);
    const response = NextResponse.json(ticker === "ALL"
        ? { rows: [], sourceStatus: "unavailable", error: "BRVM live source temporarily unavailable" }
        : {
            error: "BRVM live source temporarily unavailable",
            found: false,
            source: "BRVM_DIRECT",
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