const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cheerio = require("cheerio");
const FILE = path.join(process.cwd(), "app/api/market-data/exchange-news/route.ts");
const source = fs.readFileSync(FILE, "utf8");
function makeRoute(fetchMock) {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const fakeResponse = { json: (body, options = {}) => ({ body, status: options.status || 200, headers: options.headers || {} }) };
  // Freeze the RSS age-check clock so regression fixtures remain valid in future years.
  let clock = Date.parse("2026-10-08T12:00:00Z");
  class TestDate extends Date { static now() { return clock; } }
  const context = { exports, require: (name) => {
    if (name === "cheerio") return cheerio;
    if (name === "next/server") return { NextResponse: fakeResponse };
    throw Error("Unexpected module " + name);
  }, fetch: fetchMock, URL, Date: TestDate, Intl, AbortSignal, console: { warn: () => {} } };
  vm.runInNewContext(compiled, context, { filename: FILE });
  const run = async (market) => exports.GET({ nextUrl: new URL("http://localhost/api/market-data/exchange-news?exchange=" + market) });
  run.advanceClock = (ms) => { clock += ms; };
  return run;
}
const fakeHtml = `<main><article><h2><a href="/pressrelease/good-story/">Market index jumps after close</a></h2>
<time datetime="2026-10-07T19:10:17+00:00"></time></article>
<article><h2><a href="/pressrelease/good-story/?utm_source=test">Market index jumps after close</a></h2></article>
<article><h2><a href="/pressrelease/second-story/">Market regulator approves new bond</a></h2></article></main>`;
const fakeRss = `<?xml version="1.0"?><rss><channel>
<item><title>Johannesburg Stock Exchange welcomes new listings</title><link>https://news.google.com/rss/articles/AAA?oc=5</link><pubDate>Wed, 07 Oct 2026 17:28:24 GMT</pubDate><source url="https://www.reuters.com">Reuters</source></item>
<item><title>Johannesburg Stock Exchange welcomes new listings</title><link>https://news.google.com/rss/articles/BBB?oc=5</link><pubDate>Wed, 07 Oct 2026 17:28:24 GMT</pubDate></item>
<item><title>Future announcement rejected by validation</title><link>https://news.google.com/rss/articles/CCC?oc=5</link><pubDate>Wed, 07 Oct 2099 17:28:24 GMT</pubDate></item>
<item><title>Unsafe RSS article URL must not pass</title><link>javascript:alert(1)</link><pubDate>Wed, 07 Oct 2026 17:28:24 GMT</pubDate></item>
</channel></rss>`;
test("official feed: validates URLs, deduplicates titles, formats ISO dates", async () => {
  const route = makeRoute(async () => ({ ok: true, text: async () => fakeHtml }));
  const result = await route("GSE");
  assert.equal(result.body.length, 2);
  assert.equal(result.body[0].date, "7 oct. 2026");
  assert.equal(result.body[0].link, "https://gse.com.gh/pressrelease/good-story/");
});
test("RSS fallback: validates publishers, dates and duplicates", async () => {
  const route = makeRoute(async (input) => {
    if (String(input).includes("jse.co.za")) return { ok: false, status: 403 };
    return { ok: true, text: async () => fakeRss };
  });
  const result = await route("JSE");
  assert.equal(result.body.length, 1);
  assert.equal(result.body[0].sourceDomain, "reuters.com");
  assert.equal(result.body[0].date, "7 oct. 2026");
});
for (const [market, html, expectedLink] of [
  ["CSE", '<a class="comm-card" href="/en/apropos/communiques-officiels/new-listing"><h3 class="comm-card__title">New listing on Casablanca Stock Exchange</h3><div class="comm-card__date">18 September 2026</div></a>', "https://www.casablanca-bourse.com/en/apropos/communiques-officiels/new-listing"],
  ["JSE", '<main><article><h2><a href="/news/news/new-listing">Johannesburg Stock Exchange announces new listing</a></h2></article></main>', "https://www.jse.co.za/news/news/new-listing"],
  ["NGX", '<h3 class="entry-title"><a href="/ngx-issues-market-notice/">Nigerian Exchange issues important market notice</a></h3>', "https://ngxgroup.com/ngx-issues-market-notice/"],
  ["NSE", '<div class="nectar-fancy-box"><h3>Nairobi Securities Exchange announces new listings</h3><a class="box-link" href="https://www.nse.co.ke/wp-content/uploads/market-announcement.pdf"></a></div>', "https://www.nse.co.ke/wp-content/uploads/market-announcement.pdf"],
]) {
  test(market + " official markup: verified source links", async () => {
    const route = makeRoute(async () => ({ ok: true, text: async () => html }));
    const response = await route(market);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].link, expectedLink);
  });
}
test("per-exchange stale cache: retains verified items for 24h but not indefinitely", async () => {
  let online = true;
  const route = makeRoute(async () => {
    if (!online) throw Error("offline");
    return { ok: true, text: async () => fakeHtml };
  });
  const fresh = await route("GSE");
  assert.equal(fresh.body.length, 2);
  assert.equal(fresh.headers["X-News-Status"], "FRESH");
  online = false;
  route.advanceClock(31 * 60_000);
  const stale = await route("GSE");
  assert.equal(stale.body.length, 2);
  assert.equal(stale.headers["X-News-Status"], "STALE");
  route.advanceClock(25 * 60 * 60_000);
  const expired = await route("GSE");
  assert.equal(expired.body.length, 0);
  assert.equal(expired.headers["X-News-Status"], "UNAVAILABLE");
});
test("simultaneous same-market requests use a single upstream fetch", async () => {
  let requests = 0;
  const route = makeRoute(async () => {
    requests += 1;
    await new Promise((resolve) => setImmediate(resolve));
    return { ok: true, text: async () => fakeHtml };
  });
  const results = await Promise.all([route("GSE"), route("GSE"), route("GSE")]);
  assert.equal(requests, 1);
  assert.ok(results.every((result) => result.body.length === 2));
});
test("market cache isolation survives upstream outage and refresh", async () => {
  let offline = false;
  const route = makeRoute(async (input) => {
    if (offline) throw Error("upstream disconnected");
    if (String(input).includes("gse.com.gh")) return { ok: true, text: async () => fakeHtml };
    if (String(input).includes("jse.co.za")) return { ok: false, status: 403 };
    return { ok: true, text: async () => fakeRss };
  });
  const ghana = await route("GSE");
  const johannesburg = await route("JSE");
  assert.equal(ghana.body[0].link.startsWith("https://gse.com.gh/"), true);
  assert.equal(johannesburg.body[0].sourceDomain, "reuters.com");
  offline = true;
  route.advanceClock(31 * 60_000);
  const [ghanaStale, johannesburgStale] = await Promise.all([route("GSE"), route("JSE")]);
  assert.equal(ghanaStale.headers["X-News-Status"], "STALE");
  assert.equal(johannesburgStale.headers["X-News-Status"], "STALE");
  assert.equal(ghanaStale.body[0].link.startsWith("https://gse.com.gh/"), true);
  assert.equal(johannesburgStale.body[0].link.startsWith("https://news.google.com/"), true);
});
test("complete upstream failure: no invented news", async () => {
  const route = makeRoute(async () => { throw Error("network offline"); });
  const result = await route("CSE");
  assert.equal(result.body.length, 0);
  assert.equal(result.headers["X-News-Status"], "UNAVAILABLE");
});
test("unsupported market: rejected without upstream fetch", async () => {
  const route = makeRoute(async () => { throw Error("should not fetch"); });
  const result = await route("INVALID");
  assert.equal(result.status, 400);
});
