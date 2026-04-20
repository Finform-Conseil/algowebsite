// ================================================================================
// FICHIER : src/app/api/market-data/brvm-bonds/route.ts
// RÔLE: Scrape la page des cours d'obligations de brvm.org
// SOURCE: https://www.brvm.org/fr/cours-obligations/0
// [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention.
// [TENOR 2026 FIX] SCAR-122: Strict TypeScript Compliance (Explicit any/number casts).
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithResilience, fetchBrvmPage } from '@/shared/utils/resilient-scraper';
import * as cheerio from 'cheerio';

interface BRVMBond {
  name: string;
  maturityDate: string;
  ytm: number;
}

const BONDS_PAGE_URL = 'https://www.brvm.org/fr/cours-obligations/0';
const CACHE_KEY = 'brvm_bonds_top_ytm_premium_v2'; // Rotated key for new logic
const CACHE_TTL = 3600 * 6;

/**
 * [TENOR 2026] Refined Maturity Parser
 * Handles DD/MM/YYYY, simple years, and ranges like "2025-2030"
 */
function parseMaturityDate(raw: string, contextName: string = ''): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // 1. Try to find a range in the context name (e.g. "2024-2031")
  // We want the LATEST year as the maturity year
  const rangeMatch = contextName.match(/20\d{2}-20(\d{2})/);
  if (rangeMatch) {
    return `Dec 31, 20${rangeMatch[1]}`;
  }

  if (!raw) return '';
  const cleaned = raw.replace(/\u00a0/g, ' ').trim();

  // 2. Try DD/MM/YYYY
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{2})\/(20\d{2})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[2]) - 1;
    return `${months[month % 12]} ${slashMatch[1]}, ${slashMatch[3]}`;
  }

  // 3. Simple year match
  const yearMatch = cleaned.match(/20\d{2}$/);
  if (yearMatch) {
    return `Dec 31, ${yearMatch[0]}`;
  }

  return cleaned;
}

function parsePercent(raw: string): number | null {
  const match = raw.match(/(\d+[.,]\d+)\s*%/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  const val = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
  return isNaN(val) ? null : val;
}

export async function GET(_req: NextRequest) {
  try {
    const { data: html } = await fetchWithResilience(
      CACHE_KEY,
      () => fetchBrvmPage(BONDS_PAGE_URL, 38000),
      { cacheTtl: CACHE_TTL }
    );

    const $ = cheerio.load(html);
    const bonds: BRVMBond[] = [];
    const currentYear = 2026;

    // [TENOR 2026 FIX] Explicit cast to any[] to satisfy TS strict mode
    const tables = $('table').toArray() as any[];

    tables.forEach((table: any) => {
      // [TENOR 2026 FIX] Explicit cast to any[]
      const rows = $(table).find('tr').toArray() as any[];
      
      rows.forEach((row: any) => {
        // [TENOR 2026 FIX] Explicit cast to any[]
        const cells = $(row).find('td, th').toArray() as any[];
        if (cells.length < 5) return;

        // [TENOR 2026 FIX] Explicit typing for c to fix TS 7006
        const cellTexts = cells.map((c: any) => $(c).text().trim() || '');

        if (cellTexts[0].toLowerCase().includes('code')) return;

        const ticker = cellTexts[0];
        const fullName = cellTexts[1];

        if (!ticker || ticker.length > 10 || ticker === 'Code') return;

        // Use Coupon Rate as YTM proxy
        const ytm = parsePercent(fullName) || parsePercent(cellTexts.find(t => t.includes('%')) || '0');

        // [TENOR 2026] MATURITY LOGIC:
        // Column 4 (index 3) is "Date maturité"
        // If empty, extract from name range or other columns
        const maturityRaw = cellTexts[3] || fullName;
        const maturityDate = parseMaturityDate(maturityRaw, fullName);

        // Filter: year must be >= 2026
        const yearMatch = maturityDate.match(/20(\d{2})/);
        const year = yearMatch ? parseInt(`20${yearMatch[1]}`) : 0;

        if (ytm !== null && fullName.length > 2 && year >= currentYear) {
          bonds.push({
            name: fullName.split(/\d+[.,]\d+%/)[0].replace(/GSS|FCTC|BOND/g, '').trim() || fullName,
            maturityDate: maturityDate,
            ytm: ytm
          });
        }
      });
    });

    const seen = new Set<string>();
    const topBonds = bonds
      .filter(b => {
        const key = `${b.name}-${b.ytm}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.ytm - a.ytm)
      .slice(0, 5);

    const response = NextResponse.json({ bonds: topBonds });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;

  } catch (error) {
    console.error('[brvm-bonds] Scraper failure:', error);
    return NextResponse.json({ error: 'Failed to fetch bond data', bonds: [] }, { status: 500 });
  }
}