// ================================================================================
// FICHIER : src/app/api/market-data/brvm-bonds/route.ts
// ROLE: Scrape la page des cours d'obligations de brvm.org
// SOURCE: https://www.brvm.org/fr/cours-obligations/0
// [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention.
// [TENOR 2026 FIX] SCAR-122: Strict TypeScript Compliance.
// ================================================================================

import { type NextRequest, NextResponse } from 'next/server';
import {
  BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
  BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
  fetchBrvmPage,
  fetchWithResilience,
} from '@/shared/utils/resilient-scraper';
import * as cheerio from 'cheerio';

interface BRVMBond {
  name: string;
  maturityDate: string;
  ytm: number;
}

const BONDS_PAGE_URL = 'https://www.brvm.org/fr/cours-obligations/0';
const CACHE_KEY = 'brvm_bonds_top_ytm_premium_v2';
const CACHE_TTL = 3600 * 6;
const FALLBACK_CACHE_SECONDS = 60;

function parseMaturityDate(raw: string, contextName: string = ''): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rangeMatch = contextName.match(/20\d{2}-20(\d{2})/);
  if (rangeMatch) {
    return `Dec 31, 20${rangeMatch[1]}`;
  }

  if (!raw) return '';
  const cleaned = raw.replace(/\u00a0/g, ' ').trim();
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{2})\/(20\d{2})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[2], 10) - 1;
    return `${months[month % 12]} ${slashMatch[1]}, ${slashMatch[3]}`;
  }

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
  const value = parseFloat(raw.replace(/\s/g, '').replace(',', '.'));
  return Number.isNaN(value) ? null : value;
}

export async function GET(request: NextRequest) {
  try {
    const { data: html, status } = await fetchWithResilience(
      CACHE_KEY,
      () => fetchBrvmPage(
        BONDS_PAGE_URL,
        BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
        BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
        request.signal,
      ),
      { cacheTtl: CACHE_TTL },
    );

    const $ = cheerio.load(html);
    const bonds: BRVMBond[] = [];
    const currentYear = new Date().getUTCFullYear();

    $('table').each((_tableIndex, table) => {
      $(table).find('tr').each((_rowIndex, row) => {
        const cells = $(row).find('td, th').toArray();
        if (cells.length < 5) return;

        const cellTexts = cells.map((cell) => $(cell).text().trim() || '');
        if (cellTexts[0].toLowerCase().includes('code')) return;

        const ticker = cellTexts[0];
        const fullName = cellTexts[1];
        if (!ticker || ticker.length > 10 || ticker === 'Code') return;

        const ytm = parsePercent(fullName) || parsePercent(cellTexts.find((text) => text.includes('%')) || '0');
        const maturityRaw = cellTexts[3] || fullName;
        const maturityDate = parseMaturityDate(maturityRaw, fullName);
        const yearMatch = maturityDate.match(/20(\d{2})/);
        const year = yearMatch ? parseInt(`20${yearMatch[1]}`, 10) : 0;

        if (ytm !== null && fullName.length > 2 && year >= currentYear) {
          bonds.push({
            name: fullName.split(/\d+[.,]\d+%/)[0].replace(/GSS|FCTC|BOND/g, '').trim() || fullName,
            maturityDate,
            ytm,
          });
        }
      });
    });

    const seen = new Set<string>();
    const topBonds = bonds
      .filter((bond) => {
        const key = `${bond.name}-${bond.ytm}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.ytm - a.ytm)
      .slice(0, 5);

    const response = NextResponse.json({ bonds: topBonds, sourceStatus: 'ready' });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache-Status', status);
    return response;
  } catch (error) {
    return buildUnavailableBondsResponse(error);
  }
}

function buildUnavailableBondsResponse(error: unknown) {
  console.warn('[brvm-bonds] Source unavailable, returning empty bonds payload:', error);
  const response = NextResponse.json({
    bonds: [],
    error: 'BRVM bonds source temporarily unavailable',
    sourceStatus: 'unavailable',
  });
  response.headers.set('Cache-Control', `public, s-maxage=${FALLBACK_CACHE_SECONDS}, stale-while-revalidate=300`);
  response.headers.set('X-Cache-Status', 'UNAVAILABLE');
  return response;
}
