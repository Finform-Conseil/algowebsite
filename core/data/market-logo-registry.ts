import cseCasablancaManifest from "@/public/logos-cse-casablanca/source-manifest.json";
import gseManifest from "@/public/logos-gse/normalization-manifest.json";
import jseManifest from "@/public/logos-jse/normalization-manifest.json";
import jseSourceManifest from "@/public/logos-jse/manifest.json";
import jseApiManifest from "@/public/logos-jse/api-source-manifest.json";
import jseDeduplicationManifest from "@/public/logos-jse/deduplication-manifest.json";
import ngxManifest from "@/public/logos-ngx/normalization-manifest.json";
import nseManifest from "@/public/logos-nse/normalization-manifest.json";
import logoAliases from "@/public/logo-aliases.json";
import { getBrvmLogoUrl, getBrvmLogoUrlByIssuerName } from "./brvm-logo-registry";

type NormalizedLogoManifest = {
  records?: Array<{ file?: string }>;
};

type CseCasablancaLogoManifest = {
  records?: Array<{ ticker?: string; sourceUrl?: string; file?: string }>;
};

type JseSourceManifest = { records?: Array<{ symbol?: string; name?: string; file?: string }> };
type LogoAliasManifest = { aliases?: Record<string, Record<string, string>> };

const normalizeMarketTicker = (value: string): string => value.trim().toUpperCase();

const normalizeCseTicker = (value: string): string => value
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const normalizeJseTicker = (value: string): string => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const normalizeNgxTicker = (value: string): string => value
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, "");

const getManifestFileNames = (manifest: NormalizedLogoManifest): ReadonlySet<string> => {
  const fileNames = (manifest.records ?? [])
    .map((record) => record.file?.split("/").pop())
    .filter((fileName): fileName is string => Boolean(fileName));
  return new Set(fileNames);
};

const CSE_CASABLANCA_LOGO_URLS: ReadonlyMap<string, string> = new Map(
  (cseCasablancaManifest as CseCasablancaLogoManifest).records?.flatMap((record) => {
    const ticker = normalizeCseTicker(record.ticker ?? "");
    const fileName = record.file?.split("/").pop();
    const sourceUrl = fileName ? `/logos-cse-casablanca/${fileName}` : undefined;
    return ticker && sourceUrl ? [[ticker, sourceUrl] as const] : [];
  }) ?? [],
);
const JSE_LOGO_FILES = getManifestFileNames(jseManifest as NormalizedLogoManifest);
type JseApiManifest = { records?: Array<{ ticker?: string; name?: string; file?: string }> };
type JseDeduplicationManifest = { canonical?: Record<string, { aliases?: string[] }> };
const JSE_FILE_ALIASES: ReadonlyMap<string, string> = new Map(
  Object.entries((jseDeduplicationManifest as JseDeduplicationManifest).canonical ?? {}).flatMap(([canonical, value]) =>
    (value.aliases ?? []).map((alias) => [alias, canonical] as const),
  ),
);
const JSE_LOGO_LOOKUP: ReadonlyMap<string, string> = new Map([
  ...(((jseSourceManifest as JseSourceManifest).records ?? []).flatMap((record) => {
    const sourceFileName = `${normalizeJseTicker(record.symbol ?? "")}.webp`;
    const fileName = JSE_FILE_ALIASES.get(sourceFileName) ?? sourceFileName;
    if (!JSE_LOGO_FILES.has(fileName)) return [];
    return [[normalizeJseTicker(record.symbol ?? ""), fileName] as const, [normalizeJseTicker(record.name ?? ""), fileName] as const];
  })),
  ...(((jseApiManifest as JseApiManifest).records ?? []).flatMap((record) => {
    const fileName = record.file?.split("/").pop();
    if (!fileName || !JSE_LOGO_FILES.has(fileName)) return [];
    return [[normalizeJseTicker(record.ticker ?? ""), fileName] as const, [normalizeJseTicker(record.name ?? ""), fileName] as const];
  })),
  ...Object.entries((jseDeduplicationManifest as JseDeduplicationManifest).canonical ?? {}).flatMap(([canonical, value]) => {
    if (!JSE_LOGO_FILES.has(canonical)) return [];
    return (value.aliases ?? []).map((alias) => [normalizeJseTicker(alias.replace(/\.webp$/, "")), canonical] as const);
  }),
]);
const NGX_LOGO_FILES = getManifestFileNames(ngxManifest as NormalizedLogoManifest);
const GSE_LOGO_FILES = getManifestFileNames(gseManifest as NormalizedLogoManifest);
const NSE_LOGO_FILES = getManifestFileNames(nseManifest as NormalizedLogoManifest);
const ALIASES = (logoAliases as LogoAliasManifest).aliases ?? {};

const getNormalizedAlias = (market: string, ticker: string): string | undefined => {
  const normalizedTicker = normalizeNgxTicker(ticker);
  return Object.entries(ALIASES[market] ?? {})
    .find(([key]) => normalizeNgxTicker(key) === normalizedTicker)?.[1];
};

const NGX_LOGO_ALIASES: Readonly<Record<string, string>> = {
  SEPLATENERGY: "SEPLAT",
  CWGPLC: "CWG",
  NCRNIGERIA: "NCR",
  TANTALIZERS: "TANTALIZER",
  AVAINFRASTRUCTURE: "AVAIF",
  CONSOLIDATEDHALLMARK: "CONHALLPLC",
  OMATEKVENTURES: "OMATEK",
  NASCON: "NASCON",
  LIVESTOCK: "LIVESTOCK",
  PRESTIGEASSURANCE: "PRESTIGE",
  SUNUASSURANCES: "SUNUASSUR",
  VITAFOAMNIG: "VITAFOAM",
  TOTALENERGIES: "TOTAL",
  ABBEYMORTGAGE: "ABBEYBDS",
  ACADEMYPRESS: "ACADEMY",
  ACCESSHOLDINGS: "ACCESSCORP",
  AFRICAPRUDENTIAL: "AFRIPRUD",
  AFRICANALLIANCEINSURANCE: "AFRINSURE",
  AIICOINSURANCE: "AIICO",
  AIRTELAFRICA: "AIRTELAFRI",
  ARADELHOLDINGS: "ARADEL",
  BERGERPAINTS: "BERGER",
  BETAGLASS: "BETAGLAS",
  BUACEMENT: "BUACEMENT",
  BUAFOODS: "BUAFOODS",
  CILEASING: "CILEASING",
  CAPPLC: "CAP",
  CAVERTONOFFSHORE: "CAVERTON",
  CHAMSHOLDING: "CHAMS",
  CHELLARAMS: "CHELLARAM",
  CORNERSTONEINSURANCE: "CORNERST",
  CUTIXPLC: "CUTIX",
  DAARCOMMUNICATIONS: "DAARCOMM",
  DANGOTECEMENT: "DANGCEM",
  DANGOTESUGAR: "DANGSUGAR",
  DEAPCAPITAL: "DEAPCAP",
  DNTYRE: "DUNLOP",
  EKOCORPPLC: "EKOCORP",
  ELLAH: "ELLAHLAKES",
  ETRANZACTINTERNATIONAL: "ETRANZACT",
  EUNISELLINTERLINKED: "EUNISELL",
  FBNHOLDINGS: "FIRSTHOLDCO",
  FCMBGROUP: "FCMB",
  FIDELITYBANK: "FIDELITYBK",
  FIDSONHEALTHCARE: "FIDSON",
  FORTIS: "FTGINSURE",
  FTNCOCOA: "FTNCOCOA",
  GEREGUPOWER: "GEREGU",
  GOLDENGUINEA: "GOLDBREW",
  GREIFNIGERIA: "GREIF",
  GUARANTYTRUST: "GTCO",
  GUINEAINSURANCE: "GUINEAINS",
  HALDANE: "HMCALL",
  HONEYWELL: "HONYFLOUR",
  INDUSTRIALMEDICAL: "IMG",
  INFINITYTRUSTMORTGAGE: "INFINITY",
  INTERNATIONALBREWERIES: "INTBREW",
  INTERNATIONALENERGYINSURANCE: "INTENEGINS",
  JAIZBANK: "JAIZBANK",
  JAPAULGOLD: "JAPAULGOLD",
  JULIUSBERGER: "JBERGER",
  LAFARGEAFRICA: "WAPCO",
  LASACOASSURANCE: "LASACO",
  LEARNAFRICA: "LEARNAFRCA",
  LINKAGEASSURANCE: "LINKASSURE",
  LIVINGTRUSTMORTGAGEBANK: "LIVINGTRUST",
  MAYANDBAKER: "MAYBAKER",
  MCNICHOLSPLC: "MCNICHOLS",
  MECUREINDUSTRIES: "MECURE",
  MEYERPLC: "MEYER",
  MORISONINDUSTRIES: "MORISON",
  MTNNIGERIA: "MTNN",
  MULTITREX: "MULTITREX",
  MULTIVERSEMINING: "MULTIVERSE",
  MUTUALBENEFITSASSURANCE: "MBENEFIT",
  NEIMETHINTERNATIONAL: "NEIMETH",
  NEMINSURANCE: "NEM",
  NIGERIAREAL: "NIDF",
  NIGERIANAVIATION: "NAHCO",
  NIGERIANBREW: "NB",
  NIGERIANENAMELWARE: "ENAMELWA",
  NIGERIANEXCHANGE: "NGXGROUP",
  NORTHERNNIG: "NNFM",
  NPFMICROFINANCEBANK: "NPFMCRFBK",
  OKOMU: "OKOMUOIL",
  PHARMADEKO: "PHARMDEKO",
  PREMIERPAINTS: "PREMPAINTS",
  PZCUSSONS: "PZ",
  REDSTAR: "REDSTAREX",
  REGENCYASSURANCE: "REGALINS",
  ROYALEXCHANGE: "ROYALEX",
  RTBRISCOE: "RTBRISCOE",
  SECUREELECTRONIC: "TIP",
  SFSREAL: "SFSREIT",
  SKYWAYAVIATION: "SKYAVN",
  SOVEREIGNTRUST: "SOVRENINS",
  STACOINSURANCE: "STACO",
  STANBICIBTCHOLDINGS: "STANBIC",
  THOMASWYATT: "THOMASWY",
  TRANSCORPHOTELS: "TRANSCOHOT",
  TRANSNATIONWIDE: "TRANSEXPR",
  TRIPPLEGEE: "TRIPPLEG",
  UHREAL: "UHOMREIT",
  UNILEVERNIGERIA: "UNILEVER",
  UNITEDBANKFORAFRICA: "UBA",
  UNITEDCAPITALPLC: "UCAP",
  UNITYBANK: "UNITYBNK",
  UNIVERSALINSURANCE: "UNIVINSURE",
  UNIVERSITYPRESS: "UPL",
  UPDCPLC: "UPDC",
  UPDCREAL: "UPDC",
  VERITASKAPITALASSURANCE: "VERITASKAP",
  WEMABANK: "WEMABANK",
  ZENITHBANK: "ZENITHBANK",
};

const getManifestLogoUrl = (
  folder: string,
  fileName: string,
  availableFiles: ReadonlySet<string>,
): string | undefined => availableFiles.has(fileName) ? `/${folder}/${fileName}` : undefined;

const getCseLogoUrl = (ticker: string): string | undefined =>
  CSE_CASABLANCA_LOGO_URLS.get(normalizeCseTicker(ticker));

const getJseLogoUrl = (ticker: string, issuerName?: string): string | undefined => {
  const normalizedTicker = normalizeJseTicker(ticker);
  const normalizedIssuerName = normalizeJseTicker(issuerName ?? "");
  const aliasedTicker = getNormalizedAlias("JSE", ticker);
  const aliasedIssuerName = issuerName ? getNormalizedAlias("JSE", issuerName) : undefined;
  const fileName = JSE_LOGO_LOOKUP.get(normalizedTicker)
    ?? JSE_LOGO_LOOKUP.get(normalizedIssuerName)
    ?? (aliasedTicker ? `${aliasedTicker}.webp` : undefined)
    ?? (aliasedIssuerName ? `${aliasedIssuerName}.webp` : undefined)
    ?? `${normalizedTicker}.webp`;
  return getManifestLogoUrl("logos-jse", fileName, JSE_LOGO_FILES);
};

const getNgxLogoUrl = (ticker: string): string | undefined => {
  const normalizedTicker = normalizeNgxTicker(ticker);
  const fileStem = getNormalizedAlias("NGX", ticker) ?? NGX_LOGO_ALIASES[normalizedTicker] ?? normalizedTicker;
  return getManifestLogoUrl("logos-ngx", `${fileStem}.webp`, NGX_LOGO_FILES);
};

const getGseLogoUrl = (ticker: string): string | undefined => {
  const normalizedTicker = normalizeNgxTicker(ticker);
  const fileStem = getNormalizedAlias("GSE", ticker) ?? normalizedTicker;
  return getManifestLogoUrl("logos-gse", `${fileStem}.webp`, GSE_LOGO_FILES);
};

const getNseLogoUrl = (ticker: string): string | undefined => {
  const normalizedTicker = normalizeNgxTicker(ticker);
  const alias = getNormalizedAlias("NSE", ticker);
  const fileStem = alias ?? normalizedTicker;
  return getManifestLogoUrl("logos-nse", `${fileStem}.webp`, NSE_LOGO_FILES);
};

export const getMarketLogoUrl = (
  marketTicker: string | null | undefined,
  securityTicker: string,
  securityName?: string,
): string | undefined => {
  const market = normalizeMarketTicker(marketTicker ?? "");
  if (market === "BRVM") {
    return getBrvmLogoUrl(securityTicker)
      ?? (securityName ? getBrvmLogoUrlByIssuerName(securityName) : undefined);
  }
  if (market === "CSE") return getCseLogoUrl(securityTicker);
  if (market === "JSE") return getJseLogoUrl(securityTicker, securityName);
  if (market === "NGX") return getNgxLogoUrl(securityTicker);
  if (market === "GSE") return getGseLogoUrl(securityTicker);
  if (market === "NSE") return getNseLogoUrl(securityTicker);
  return undefined;
};
