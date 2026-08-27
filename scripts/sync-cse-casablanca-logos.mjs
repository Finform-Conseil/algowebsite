import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const logoDir = path.join(projectRoot, "public", "logos-cse-casablanca");
const sourceManifestPath = path.join(logoDir, "source-manifest.json");
const normalizationManifestPath = path.join(logoDir, "normalization-manifest.json");

const OFFICIAL_EXCHANGE_LOGO_BASE_URL = "https://www.casablancabourse.com/images/logos";
const CANVAS_SIZE = 256;
const CONTENT_SIZE = 220;

const missingApiTickerToOfficialSymbol = Object.freeze({
  AFMA: "AFM",
  AFRIQUIA_GAZ: "GAZ",
  AGMA: "AGM",
  ALLIANCES: "ADI",
  ALUMINIUM_DU_MAROC: "ALM",
  ARADEI_CAPITAL: "ARD",
  ATLANTASANAD: "ATL",
  ATW: "ATW",
  BALIMA: "BAL",
  BMCI: "BCI",
  CFG_BANK: "CFG",
  CIMENTS_DU_MAROC: "CMA",
  CMGP_GROUP: "CMG",
  COLORADO: "COL",
  CTM: "CTM",
  MINIERE_DE_TOUISSIT: "CMT",
  COSUMAR: "CSR",
  CDM: "CDM",
  CIH: "CIH",
  DELATTRE_LEVIVIER: "DLM",
  DELTA_HOLDING: "DHO",
  DIAC_SALAF: "DIS",
  DISTY_TECHNOLOGIES: "DYT",
  DISWAY: "DWY",
  DOUJA_PROMOTION: "ADH",
  EQDOM: "EQD",
  FENIE_BROSSETTE: "FBR",
  HPS: "HPS",
  "IB MAROC": "IBC",
  IMMORENTE_INVEST: "IMO",
  INVOLYS: "INV",
  "ITISSALAT_AL-MAGHRIB": "IAM",
  JET_CONTRACTORS: "JET",
  LABEL_VIE: "LBV",
  LHM: "LHM",
  LESIEUR_CRISTAL: "LES",
  M2M: "M2M",
  MAGHREB_OXYGENE: "MOX",
  MAGHREBAIL: "MAB",
  MANAGEM: "MNG",
  MAROC_LEASING: "MLE",
  MED_PAPER: "MDP",
  MICRODATA: "MIC",
  MUTANDIS_SCA: "MUT",
  REBAB_COMPANY: "REB",
});

const normalizeTicker = (value) => value
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const fetchImageBuffer = async (url) => {
  const response = await fetch(url, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "Mozilla/5.0 (compatible; AfriMarketLogoSync/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Logo source failed: ${response.status} ${response.statusText} ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected logo content-type '${contentType}' for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
};

const normalizeToCanonicalWebp = async (sourceBuffer) => {
  const { data: resized, info } = await sharp(sourceBuffer)
    .flatten({ background: "#ffffff" })
    .resize({
      width: CONTENT_SIZE,
      height: CONTENT_SIZE,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.max(0, Math.floor((CANVAS_SIZE - info.width) / 2));
  const top = Math.max(0, Math.floor((CANVAS_SIZE - info.height) / 2));

  return sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized, left, top }])
    .webp({ lossless: true, effort: 6 })
    .toBuffer();
};

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));

const buildNormalizationManifest = async (sourceManifest) => {
  const records = [];

  for (const record of sourceManifest.records) {
    const absoluteFile = path.join(projectRoot, record.file);
    const buffer = await fs.readFile(absoluteFile);
    const metadata = await sharp(buffer).metadata();

    if (metadata.format !== "webp" || metadata.width !== CANVAS_SIZE || metadata.height !== CANVAS_SIZE) {
      throw new Error(
        `${record.ticker}: canonical asset must be ${CANVAS_SIZE}x${CANVAS_SIZE} WebP, got `
        + `${metadata.width ?? "?"}x${metadata.height ?? "?"} ${metadata.format ?? "unknown"}`,
      );
    }

    records.push({
      ticker: record.ticker,
      file: record.file,
      sha256: sha256(buffer),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    });
  }

  return {
    contract: "logo-normalization-manifest-v1",
    exchange: "CSE",
    records: records.sort((a, b) => a.ticker.localeCompare(b.ticker)),
  };
};

const main = async () => {
  await fs.mkdir(logoDir, { recursive: true });
  const sourceManifest = await readJson(sourceManifestPath);
  const recordsByTicker = new Map(
    (sourceManifest.records ?? []).map((record) => [normalizeTicker(record.ticker), record]),
  );

  for (const [apiTicker, officialSymbol] of Object.entries(missingApiTickerToOfficialSymbol)) {
    const normalizedTicker = normalizeTicker(apiTicker);
    const fileName = `${normalizedTicker}.webp`;
    const relativeFile = `public/logos-cse-casablanca/${fileName}`;
    const targetFile = path.join(logoDir, fileName);
    const sourceUrl = `${OFFICIAL_EXCHANGE_LOGO_BASE_URL}/${encodeURIComponent(officialSymbol)}.png`;

    let assetExists = true;
    try {
      await fs.access(targetFile);
    } catch {
      assetExists = false;
    }

    if (!assetExists) {
      const sourceBuffer = await fetchImageBuffer(sourceUrl);
      const canonicalBuffer = await normalizeToCanonicalWebp(sourceBuffer);
      await fs.writeFile(targetFile, canonicalBuffer);
      process.stdout.write(`created ${fileName} <- ${officialSymbol}\n`);
    }

    if (!recordsByTicker.has(normalizedTicker)) {
      recordsByTicker.set(normalizedTicker, {
        ticker: apiTicker,
        officialSymbol,
        sourceType: "exchange",
        verified: true,
        sourceUrl,
        file: relativeFile,
      });
    }
  }

  const normalizedRecords = [...recordsByTicker.values()].sort((a, b) => (
    normalizeTicker(a.ticker).localeCompare(normalizeTicker(b.ticker))
  ));

  const normalizedTickerSet = new Set(normalizedRecords.map((record) => normalizeTicker(record.ticker)));
  if (normalizedTickerSet.size !== normalizedRecords.length) {
    throw new Error("CSE source manifest contains duplicate normalized tickers");
  }

  if (normalizedRecords.length !== 74) {
    throw new Error(`CSE source manifest must cover 74 API securities, got ${normalizedRecords.length}`);
  }

  const updatedSourceManifest = {
    ...sourceManifest,
    source: "official issuer sites, Bourse de Casablanca exchange logos, and verified public brand references; normalized locally",
    records: normalizedRecords,
  };

  const normalizationManifest = await buildNormalizationManifest(updatedSourceManifest);
  await fs.writeFile(sourceManifestPath, `${JSON.stringify(updatedSourceManifest, null, 2)}\n`, "utf8");
  await fs.writeFile(normalizationManifestPath, `${JSON.stringify(normalizationManifest, null, 2)}\n`, "utf8");

  process.stdout.write(
    `CSE Casablanca logos synchronized: ${updatedSourceManifest.records.length} source records, `
    + `${normalizationManifest.records.length} canonical WebP assets.\n`,
  );
};

await main();
