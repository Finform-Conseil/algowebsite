export interface ExchangeStaticInfo {
  logo: string;
  website: string;
  country: string;
  region: string;
  currency: string;
  timezone: string;
  description: string;
  foundedYear: number;
  tradingHours?: {
    openMinute: number;
    closeMinute: number;
    sourceUrl: string;
    closedDates?: readonly string[];
  };
}

export const EXCHANGE_STATIC_INFO: Record<string, ExchangeStaticInfo> = {
  BRVM: {
    logo: '/exchanges/brvm-logo.webp',
    website: 'www.brvm.org',
    country: "Côte d'Ivoire",
    region: 'West Africa',
    currency: 'XOF',
    timezone: 'UTC',
    description: 'BRVM serves 8 WAEMU countries and represents the main stock exchange in the West African sub-region.',
    tradingHours: { openMinute: 540, closeMinute: 900, sourceUrl: 'https://www.brvm.org/fr/horaires-de-cotation', closedDates: ['2026-01-01', '2026-03-17', '2026-03-20', '2026-04-06', '2026-05-01', '2026-05-14', '2026-05-25', '2026-05-27', '2026-08-07', '2026-08-26', '2026-12-25'] },
    foundedYear: 1998
  },
  JSE: {
    logo: '/exchanges/jse-logo.webp',
    website: 'www.jse.co.za',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    description: 'Africa\'s largest stock exchange by capitalization, JSE is a mature and diversified market.',
    tradingHours: { openMinute: 540, closeMinute: 1020, sourceUrl: 'https://clientportal.jse.co.za/reports/trading-calendars' },
    foundedYear: 1887
  },
  NGX: {
    logo: '/exchanges/ngx-logo.webp',
    website: 'www.ngxgroup.com',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    description: 'The Nigerian Exchange Group is one of the largest stock exchanges in Africa by market capitalization.',
    tradingHours: { openMinute: 570, closeMinute: 870, sourceUrl: 'https://doclib.ngxgroup.com/Listings-site/corporate-disclosure-site/Documents/NGX%20Proposed%20Amendments%20to%20Trading%20License%20Holders%27%20Rules%20%28Part%20XI%29%20%28Trading%20Hours%29%20-%20October%202025.pdf' },
    foundedYear: 1960
  },
  CSE: {
    logo: '/exchanges/cse-logo.webp',
    website: 'www.casablanca-bourse.com',
    country: 'Morocco',
    region: 'North Africa',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    description: 'Casablanca Stock Exchange is the main stock exchange in Morocco and a key financial hub in North Africa.',
    tradingHours: { openMinute: 540, closeMinute: 930, sourceUrl: 'https://www.casablanca-bourse.com/fr/les-horaires-de-cotation', closedDates: ['2026-01-01', '2026-01-11', '2026-01-14', '2026-03-20', '2026-03-23', '2026-05-01', '2026-05-27', '2026-05-28', '2026-05-29', '2026-06-16', '2026-07-30', '2026-08-14', '2026-08-20', '2026-08-21', '2026-08-25', '2026-08-26', '2026-10-31', '2026-11-06', '2026-11-18'] },
    foundedYear: 1929
  },
  GSE: {
    logo: '/exchanges/gse-logo.webp',
    website: 'www.gse.com.gh',
    country: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    description: 'Ghana Stock Exchange is the principal stock exchange of Ghana.',
    tradingHours: { openMinute: 600, closeMinute: 900, sourceUrl: 'https://gse.com.gh/frequently-asked-questions/', closedDates: ['2026-01-01', '2026-01-07', '2026-03-06', '2026-04-03', '2026-04-06', '2026-05-01', '2026-09-21', '2026-12-04', '2026-12-25', '2026-12-28'] },
    foundedYear: 1990
  },
  NSE: {
    logo: '/exchanges/nse-logo.webp',
    website: 'www.nse.co.ke',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    description: 'Nairobi Securities Exchange is the principal stock exchange in Kenya and East Africa.',
    tradingHours: { openMinute: 540, closeMinute: 900, sourceUrl: 'https://www.nse.co.ke/' },
    foundedYear: 1954
  },
  EGX: {
    logo: '/exchanges/egx-logo.png',
    website: 'www.egx.com.eg',
    country: 'Egypt',
    region: 'North Africa',
    currency: 'EGP',
    timezone: 'UTC+2',
    description: 'Egyptian Exchange is one of the oldest stock exchanges in the Middle East and Africa.',
    foundedYear: 1883
  }
};

export interface ExchangeSessionStatus {
  isOpen: boolean;
  label: "OPEN" | "FERMÉ" | "N/D";
  title: string;
}

const EXCHANGE_WEEKDAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

function getExchangeLocalTime(nowMs: number, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", timeZone: timezone, weekday: "long" }).formatToParts(new Date(nowMs));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return { weekday: values.weekday, date: `${values.year}-${values.month}-${values.day}`, minute: Number(values.hour) * 60 + Number(values.minute) };
  } catch {
    return null;
  }
}

function formatTradingMinute(minute: number) {
  const hour = Math.floor(minute / 60).toString().padStart(2, "0");
  const value = (minute % 60).toString().padStart(2, "0");
  return `${hour}:${value}`;
}

export function getExchangeMarketStatus(exchangeCode: string | undefined, nowMs = Date.now()): ExchangeSessionStatus {
  const normalizedCode = exchangeCode?.trim().toUpperCase();
  const exchange = normalizedCode ? EXCHANGE_STATIC_INFO[normalizedCode] : undefined;
  if (!exchange?.tradingHours) return { isOpen: false, label: "N/D", title: "Horaires de séance indisponibles pour cette bourse" };
  const localTime = getExchangeLocalTime(nowMs, exchange.timezone);
  if (!localTime || !EXCHANGE_WEEKDAYS.has(localTime.weekday ?? "")) return { isOpen: false, label: "FERMÉ", title: `${normalizedCode} fermée selon ses horaires réguliers` };
  if (exchange.tradingHours.closedDates?.includes(localTime.date ?? "")) return { isOpen: false, label: "FERMÉ", title: `${normalizedCode} fermée selon le calendrier officiel 2026` };
  const { openMinute, closeMinute } = exchange.tradingHours;
  const isOpen = localTime.minute >= openMinute && localTime.minute < closeMinute;
  return { isOpen, label: isOpen ? "OPEN" : "FERMÉ", title: `${normalizedCode} ${isOpen ? "ouverte" : "fermée"} (${formatTradingMinute(openMinute)}–${formatTradingMinute(closeMinute)} ${exchange.timezone})` };
}
