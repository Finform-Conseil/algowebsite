import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
type Exchange = "CSE"|"GSE"|"JSE"|"NGX"|"NSE";
type News = { title: string; date: string; link: string; sourceDomain?: string };
const SOURCES:Record<Exchange,[string,string]>={
 CSE:["https://www.casablanca-bourse.com/en/apropos/communiques-officiels","a.comm-card[href]"],
 GSE:["https://gse.com.gh/press-release/","article h2 a[href], article h3 a[href], .entry-title a[href]"],
 JSE:["https://www.jse.co.za/newsroom",".view-content h2 a[href], .view-content h3 a[href], main article a[href], .views-row h3 a[href]"],
 NGX:["https://ngxgroup.com/media-center/news/","h3.entry-title a[href]"],
 NSE:["https://www.nse.co.ke/press-releases/",".nectar-fancy-box:has(h3)"]
};
const cache=new Map<Exchange,{time:number;items:News[]}>();
const MAX_RSS_AGE_MS = 93 * 86400_000;
const MAX_ARTICLES = 12;
const normalizeTitle = (value: string) => value.replace(/\s+/g," ").trim().normalize("NFKC").toLowerCase();
const inflight=new Map<Exchange,Promise<News[]>>();
function parse(html:string,exchange:Exchange):News[]{
 const [origin,selector]=SOURCES[exchange],$=cheerio.load(html),seen=new Set<string>(),titles=new Set<string>(),items:News[]=[];
 $(selector).each((_,el)=>{
  const a=$(el),title=(exchange==="CSE"?a.find(".comm-card__title").first().text():exchange==="NSE"?a.find("h3").first().text():a.text()).replace(/\s+/g," ").trim(),href=exchange==="NSE"?a.find("a.box-link[href]").attr("href"):a.attr("href");
  if(!href||title.length<12||title.length>240||/^(read more|learn more|voir plus)$/i.test(title))return;
  let url:URL;try{url=new URL(href,origin);}catch{return;}
  if(!["https:","http:"].includes(url.protocol)||url.hostname.replace(/^www\./,"")!==new URL(origin).hostname.replace(/^www\./,"")||url.pathname===new URL(origin).pathname||seen.has(url.href))return;
  const context=exchange==="CSE"?a:exchange==="NSE"?a:a.closest("article, .views-row, .elementor-post, .card, li, .views-row");
  const time=context.find("time, .date, .entry-date, .post-date, .elementor-post-date, .comm-card__date").first();
  const date=time.attr("datetime")?.trim()||time.text().replace(/\s+/g," ").trim()||"Récents";
  const iso=/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/.exec(date);
   const parsed=iso?new Date(Date.UTC(Number(iso[1]),Number(iso[2])-1,Number(iso[3]))):null;
   const displayDate=parsed&&!Number.isNaN(parsed.getTime())
     ?new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(parsed)
     :date.slice(0,80);
   if (titles.has(normalizeTitle(title))) return;
   seen.add(url.href);titles.add(normalizeTitle(title));items.push({title,date:displayDate,link:url.href});
 });
 return items.slice(0,MAX_ARTICLES);
}
const AGGREGATED_QUERIES: Record<Exchange, { query: string; locale: string; region: string }> = {
  CSE: { query: '"Bourse de Casablanca" OR "Casablanca Stock Exchange" when:90d', locale: "fr", region: "MA" },
  GSE: { query: '"Ghana Stock Exchange" when:90d', locale: "en", region: "GH" },
  JSE: { query: '"Johannesburg Stock Exchange" when:90d', locale: "en", region: "ZA" },
  NGX: { query: '"Nigerian Exchange" when:90d', locale: "en", region: "NG" },
  NSE: { query: '"Nairobi Securities Exchange" when:90d', locale: "en", region: "KE" },
};

async function fetchAggregatedNews(exchange: Exchange): Promise<News[]> {
  // Public Google News RSS fallback: publisher is taken from RSS source metadata,
  // while the click-through URL remains the genuine Google News article link.
  const { query, locale, region } = AGGREGATED_QUERIES[exchange];
  const feed = new URL("https://news.google.com/rss/search");
  feed.searchParams.set("q", query);
  feed.searchParams.set("hl", `${locale}-${region}`);
  feed.searchParams.set("gl", region);
  feed.searchParams.set("ceid", `${region}:${locale}`);
  const response = await fetch(feed, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(8_000),
    headers: { Accept: "application/rss+xml,application/xml,text/xml" },
  });
  if (!response.ok) throw new Error(`News RSS HTTP ${response.status}`);
  const xml = await response.text();
  if (xml.length > 2_000_000) throw new Error("RSS response too large");
  const $ = cheerio.load(xml, { xmlMode: true });
  const seen = new Set<string>();
  const titles = new Set<string>();
  const items: News[] = [];
  $("item").each((_, item) => {
    const node = $(item);
    const title = node.find("title").first().text().replace(/\s+/g, " ").trim();
    const link = node.find("link").first().text().trim();
    const date = node.find("pubDate").first().text().trim();
    const publishedAt = Date.parse(date);
    if (title.length < 12 || title.length > 240 || !Number.isFinite(publishedAt)
        || publishedAt < Date.now() - MAX_RSS_AGE_MS || publishedAt > Date.now() + 86400_000) return;
    let article: URL;
    try { article = new URL(link); } catch { return; }
    if (article.protocol !== "https:" || article.hostname !== "news.google.com" || seen.has(article.href) || titles.has(normalizeTitle(title))) return;
    const publisherUrl = node.find("source").first().attr("url");
    let sourceDomain = "news.google.com";
    try {
      if (publisherUrl) {
        const publisher = new URL(publisherUrl);
        if (publisher.protocol === "https:" || publisher.protocol === "http:") {
          sourceDomain = publisher.hostname.replace(/^www\./, "").toLowerCase();
        }
      }
    } catch { /* Invalid publisher metadata: use the Google News domain. */ }
    seen.add(article.href);
    titles.add(normalizeTitle(title));
    const displayDate = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).format(new Date(publishedAt));
    items.push({ title, date: displayDate, link: article.href, sourceDomain });
  });
  return items.slice(0, MAX_ARTICLES);
}

async function load(exchange: Exchange): Promise<News[]> {
  const existing = inflight.get(exchange);
  if (existing) return existing;
  const request = (async () => {
    let items: News[] = [];
    try {
      const response = await fetch(SOURCES[exchange][0], {
        next: { revalidate: 1800 },
        signal: AbortSignal.timeout(8_000),
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) throw new Error(`Origin HTTP ${response.status}`);
      const html = await response.text();
      if (html.length > 2_000_000) throw new Error("Origin HTML exceeds limit");
      items = parse(html, exchange);
      if (!items.length) throw new Error("No official article links found");
    } catch (error) {
      console.warn("[ExchangeNews] Official source unavailable:", exchange, error instanceof Error ? error.message : error);
      items = await fetchAggregatedNews(exchange);
    }
    if (!items.length) throw new Error("No verified articles from either source");
    cache.set(exchange, { time: Date.now(), items });
    return items;
  })();
  inflight.set(exchange, request);
  try { return await request; } finally { inflight.delete(exchange); }
}
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get("exchange")?.toUpperCase()??"";
 if(!Object.prototype.hasOwnProperty.call(SOURCES,code))return NextResponse.json({error:"Unsupported exchange"},{status:400});
 const exchange=code as Exchange,saved=cache.get(exchange);
 if(saved&&Date.now()-saved.time<1800000)return NextResponse.json(saved.items,{headers:{"X-News-Status":"FRESH"}});
 try{return NextResponse.json(await load(exchange),{headers:{"X-News-Status":"FRESH"}});}
 catch(error){
  console.warn("[ExchangeNews]",exchange,error instanceof Error?error.message:error);
  if(saved&&Date.now()-saved.time<86400000)return NextResponse.json(saved.items,{headers:{"X-News-Status":"STALE"}});
  return NextResponse.json([],{headers:{"X-News-Status":"UNAVAILABLE","Cache-Control":"no-store"}});
 }
}
