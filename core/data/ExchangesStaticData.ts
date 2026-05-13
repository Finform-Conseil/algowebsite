export interface ExchangeStaticInfo {
  logo: string;
  website: string;
  country: string;
  region: string;
  currency: string;
  timezone: string;
  description: string;
  foundedYear: number;
}

export const EXCHANGE_STATIC_INFO: Record<string, ExchangeStaticInfo> = {
  BRVM: {
    logo: '/exchanges/brvm-logo.png',
    website: 'www.brvm.org',
    country: "Côte d'Ivoire",
    region: 'West Africa',
    currency: 'XOF',
    timezone: 'UTC',
    description: 'BRVM serves 8 WAEMU countries and represents the main stock exchange in the West African sub-region.',
    foundedYear: 1998
  },
  JSE: {
    logo: '/exchanges/jse-logo.png',
    website: 'www.jse.co.za',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    timezone: 'UTC+2',
    description: 'Africa\'s largest stock exchange by capitalization, JSE is a mature and diversified market.',
    foundedYear: 1887
  },
  NGX: {
    logo: '/exchanges/ngx-logo.jpg',
    website: 'www.ngxgroup.com',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    timezone: 'UTC+1',
    description: 'The Nigerian Exchange Group is one of the largest stock exchanges in Africa by market capitalization.',
    foundedYear: 1960
  },
  CSE: {
    logo: '/exchanges/cse-logo.jpeg',
    website: 'www.casablanca-bourse.com',
    country: 'Morocco',
    region: 'North Africa',
    currency: 'MAD',
    timezone: 'UTC',
    description: 'Casablanca Stock Exchange is the main stock exchange in Morocco and a key financial hub in North Africa.',
    foundedYear: 1929
  },
  GSE: {
    logo: '/exchanges/gse-logo.jpg',
    website: 'www.gse.com.gh',
    country: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    timezone: 'UTC',
    description: 'Ghana Stock Exchange is the principal stock exchange of Ghana.',
    foundedYear: 1990
  },
  NSE: {
    logo: '/exchanges/nse-logo.png',
    website: 'www.nse.co.ke',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    timezone: 'UTC+3',
    description: 'Nairobi Securities Exchange is the principal stock exchange in Kenya and East Africa.',
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
