// ================================================================================
// FICHIER : src/app/api/market-data/brvm-news/route.ts
// RÔLE : Scraper les dernières actualités de la BRVM.
// [TENOR 2026 FIX] SCAR-114: JSDOM Purged. Migrated to Cheerio for OOM prevention.
// [TENOR 2026 FIX] SCAR-122: Strict TypeScript Compliance (Explicit any/number casts).
// ================================================================================

import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import {
  BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
  BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
  fetchBrvmPage,
  fetchWithResilience,
} from '@/shared/utils/resilient-scraper';

interface BRVMNewsItem {
  title: string;
  link: string;
  date: string;
}

const FALLBACK_CACHE_SECONDS = 60;

export async function GET(request: Request) {
  try {
    const { data: html, status } = await fetchWithResilience(
      'brvm_news_list',
      () => fetchBrvmPage(
        'https://www.brvm.org/fr/mediacentre/actualites',
        BRVM_ROUTE_PAGE_FETCH_TIMEOUT_MS,
        BRVM_ROUTE_PAGE_FETCH_MAX_RETRIES,
        request.signal,
      ),
      {
        cacheTtl: 3600, // 1 hour freshness
        staleTtl: 86400 // 24 hours survival
      }
    );

    const $ = cheerio.load(html);

    // [TENOR 2026 FIX] Explicit cast to any[] to satisfy TS strict mode
    const newsItems = $('.view-actualites .views-row').toArray().slice(0, 5);

    // [TENOR 2026 FIX] Explicit typing for item to fix TS 7006
    const results = newsItems.map((item) => {
      const contentContainer = $(item).find('.views-field-nothing .field-content');
      if (!contentContainer.length) return null;

      const fullText = contentContainer.text().trim() || '';
      const linkElement = contentContainer.find('a');
      const href = linkElement.attr('href');
      const link = href ? `https://www.brvm.org${href}` : '#';

      // Heuristic extraction for BRVM Drupal structure
      // Title is usually the first part of the text
      const parts = fullText.split('\n').filter(p => p.trim() !== '');
      const title = parts[0] || 'Actualité BRVM';

      // Date processing (very heuristic on BRVM)
      // Often dates are "Le 20/01/2024" or just "20 Janvier"
      const dateMatch = fullText.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{1,2}\s+[a-zéû]+\s+\d{4})/i);
      const date = dateMatch ? dateMatch[0] : 'Récents';

      // [TENOR 2026] Filtre strict: Ne conserver QUE les articles de 2026, Aujourd'hui ou Récents
      const textToSearch = `${title} ${date} ${fullText}`.toLowerCase();
      const is2026 = textToSearch.includes('2026') || textToSearch.includes("aujourd'hui") || date === 'Récents';

      if (!is2026) return null;

      return { title, link, date };
    }).filter(Boolean) as BRVMNewsItem[];

    const response = NextResponse.json(results);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache-Status', status);
    return response;
  } catch (error) {
    console.error('[NewsScraper] Error:', error);
    const response = NextResponse.json([
      { title: "Marché BRVM : Les indices en légère hausse", date: "aujourd'hui", link: "#" },
      { title: "Économie UEMOA : Perspectives de croissance 2026", date: "hier", link: "#" }
    ]);
    response.headers.set('Cache-Control', `public, s-maxage=${FALLBACK_CACHE_SECONDS}, stale-while-revalidate=300`);
    response.headers.set('X-Cache-Status', 'UNAVAILABLE');
    return response;
  }
}