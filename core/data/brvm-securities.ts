// ================================================================================
// FICHIER : src/shared/data/brvm-securities.ts
// RÔLE : Source unique de vérité pour les données des titres BRVM
// ARCHITECTURE : DRY - Réutilisé par EquityScreening, TickerSelectorModal, etc.
// ================================================================================
/**
 * 📊 Interface représentant un titre coté sur la BRVM
 * (Bourse Régionale des Valeurs Mobilières)
 */
export interface BRVMSecurity {
  /** Nom complet de l'entreprise */
  name: string;
  /** Symbole boursier (ex: BOABF, SNTS) */
  ticker: string;
  /** Secteur d'activité */
  sector: 'Banking' | 'Telecom' | 'Energy' | 'Industry' | 'Distribution' | 'Market Indices' | 'Delisted' | 'Other';
  /** Capitalisation boursière en millions FCFA */
  marketCap: number;
  /** Variation du prix D-1 en pourcentage */
  priceChangeD1: number;
  /** Ratio Price/Earnings */
  peRatio: number;
  /** Rendement YTD en pourcentage */
  returnYTD: number;
  /** Revenue trailing 12 months en pourcentage */
  revenueT12M: number;
  /** EPS trailing 12 months en pourcentage */
  epsT12M: number;
  /** Pays d'origine */
  country: string;
  /** Logo/Icône URL (optionnel) */
  logoUrl?: string;
  /** Code ISIN (International Securities Identification Number) */
  isin?: string;
  /** Code FIGI (Financial Instrument Global Identifier) */
  figi?: string;
  /** Place boursière */
  exchange?: string;
  /** Devise de cotation */
  currency: 'XOF' | 'XAF';
  /** Secteur boursier (pour les indices) */
  indexSector?: string;
  /** Statut de cotation (ex: actif ou retiré) */
  status?: 'active' | 'delisted';
}





/**
 *  Liste complète des titres BRVM
 * 30 titres représentant les principales entreprises de la zone UEMOA
 */
export const BRVM_SECURITIES: BRVMSecurity[] = [
  // --- BANKING SECTOR ---
  { name: 'Bank Of Africa Bénin', ticker: 'BOAB', sector: 'Banking', country: 'Bénin', marketCap: 8500.0, priceChangeD1: 1.25, peRatio: 8.45, returnYTD: 15.67, revenueT12M: 12.34, epsT12M: 13.89, logoUrl: '/img/logos/BOAB.svg', isin: 'BJ0000000048', figi: 'BBG000BOAB01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Bank Of Africa Burkina Faso', ticker: 'BOABF', sector: 'Banking', country: 'Burkina Faso', marketCap: 256.48, priceChangeD1: 4.87, peRatio: 7.56, returnYTD: 12.98, revenueT12M: 48.36, epsT12M: 14.87, logoUrl: '/img/logos/BOAB.svg', isin: 'BF0000000133', figi: 'BBG000BOABF1', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Bank Of Africa Côte d\'Ivoire', ticker: 'BOAC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 9234.0, priceChangeD1: 2.78, peRatio: 9.12, returnYTD: 17.89, revenueT12M: 13.45, epsT12M: 15.23, logoUrl: '/img/logos/BOAB.svg', isin: 'CI0000000956', figi: 'BBG000BOAC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Bank Of Africa Mali', ticker: 'BOAM', sector: 'Banking', country: 'Mali', marketCap: 120.0, priceChangeD1: 0.5, peRatio: 7.2, returnYTD: 5.4, revenueT12M: 8.2, epsT12M: 6.5, logoUrl: '/img/logos/BOAB.svg', isin: 'ML0000000520', figi: 'BBG000BOAM01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Bank Of Africa Niger', ticker: 'BOAN', sector: 'Banking', country: 'Niger', marketCap: 90.0, priceChangeD1: -0.2, peRatio: 6.8, returnYTD: 3.1, revenueT12M: 5.4, epsT12M: 4.2, logoUrl: '/img/logos/BOAB.svg', isin: 'NE0000000015', figi: 'BBG000BOAN01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Bank Of Africa Sénégal', ticker: 'BOAS', sector: 'Banking', country: 'Sénégal', marketCap: 450.0, priceChangeD1: 1.1, peRatio: 8.1, returnYTD: 9.2, revenueT12M: 10.5, epsT12M: 8.7, logoUrl: '/img/logos/BOAB.svg', isin: 'SN0000000332', figi: 'BBG000BOAS01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Banque Internationale pour l\'Industrie et le Commerce du Bénin (BIIC)', ticker: 'BICB', sector: 'Banking', country: 'Bénin', marketCap: 300.0, priceChangeD1: 0, peRatio: 8.5, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/GENERIC_BANK.svg', isin: 'BJ0000002457', figi: 'BBG000BICB01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'BICI Côte d\'Ivoire', ticker: 'BICC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 150.0, priceChangeD1: 0, peRatio: 9.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/GENERIC_BANK.svg', isin: 'CI0000000014', figi: 'BBG000BICC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Coris Bank International', ticker: 'CBIBF', sector: 'Banking', country: 'Burkina Faso', marketCap: 290.62, priceChangeD1: 5.29, peRatio: 6.54, returnYTD: 14.80, revenueT12M: 4.67, epsT12M: 4.13, logoUrl: '/img/logos/CORIS.svg', isin: 'BF0000000141', figi: 'BBG000CBIBF1', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Ecobank Côte d\'Ivoire', ticker: 'ECOC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 5400.0, priceChangeD1: 1.5, peRatio: 9.2, returnYTD: 15.0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/ECOBANK.jpeg', isin: 'CI0000002424', figi: 'BBG000ECOC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Ecobank Transnational Incorporated (ETI)', ticker: 'ETIT', sector: 'Banking', country: 'Togo', marketCap: 10000.0, priceChangeD1: 1.87, peRatio: 9.45, returnYTD: 8.92, revenueT12M: 6.78, epsT12M: 7.34, logoUrl: '/img/logos/ECOBANK.jpeg', isin: 'TG0000000132', figi: 'BBG000ETIT01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'NSIA Banque CI', ticker: 'NSBC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 11000.0, priceChangeD1: 2.15, peRatio: 8.92, returnYTD: 18.45, revenueT12M: 12.34, epsT12M: 9.21, logoUrl: '/img/logos/NSIA.jpeg', isin: 'CI0000001327', figi: 'BBG000NSBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Oragroup Togo', ticker: 'ORGT', sector: 'Banking', country: 'Togo', marketCap: 4500.0, priceChangeD1: 0, peRatio: 10.5, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/ORAGROUP.jpg', isin: 'TG0000001239', figi: 'BBG000ORGT01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Société Générale Côte d\'Ivoire', ticker: 'SGBC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 8700.0, priceChangeD1: 1.2, peRatio: 9.5, returnYTD: 12.4, revenueT12M: 15.6, epsT12M: 14.2, logoUrl: '/img/logos/SGBC.jpeg', isin: 'CI0000000030', figi: 'BBG000SGBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'Société Ivoirienne de Banque', ticker: 'SIBC', sector: 'Banking', country: 'Côte d\'Ivoire', marketCap: 6780.0, priceChangeD1: 1.45, peRatio: 7.89, returnYTD: 11.34, revenueT12M: 8.92, epsT12M: 9.45, logoUrl: '/img/logos/SIBC.jpeg', isin: 'CI0000001871', figi: 'BBG000SIBC01', exchange: 'BRVM', currency: 'XOF' },
  // --- TELECOM SECTOR ---
  { name: 'SONATEL SÉNÉGAL', ticker: 'SNTS', sector: 'Telecom', country: 'Sénégal', marketCap: 2600.0, priceChangeD1: 3.42, peRatio: 12.34, returnYTD: 22.67, revenueT12M: 15.89, epsT12M: 18.23, logoUrl: '/img/logos/SONATEL.jpeg', isin: 'SN0000000019', figi: 'BBG000SNTS01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'ONATEL BURKINA FASO', ticker: 'ONTBF', sector: 'Telecom', country: 'Burkina Faso', marketCap: 515.00, priceChangeD1: -0.56, peRatio: 11.23, returnYTD: 4.56, revenueT12M: 3.21, epsT12M: 2.89, logoUrl: '/img/logos/ONATEL.png', isin: 'BF0000000117', figi: 'BBG000ONTBF1', exchange: 'BRVM', currency: 'XOF' },
  { name: 'ORANGE CÔTE D\'IVOIRE', ticker: 'ORAC', sector: 'Telecom', country: 'Côte d\'Ivoire', marketCap: 15400.0, priceChangeD1: 2.4, peRatio: 11.5, returnYTD: 18.2, revenueT12M: 25.4, epsT12M: 14.8, logoUrl: '/img/logos/ORANGE.png', isin: 'CI0000005864', figi: 'BBG000ORAC01', exchange: 'BRVM', currency: 'XOF' },
  // --- ENERGY SECTOR ---
  { name: 'TOTALENERGIES MARKETING CI', ticker: 'TTLC', sector: 'Energy', country: 'Côte d\'Ivoire', marketCap: 8450.0, priceChangeD1: 2.34, peRatio: 10.78, returnYTD: 16.23, revenueT12M: 11.45, epsT12M: 13.67, logoUrl: '/img/logos/TOTAL.svg', isin: 'CI0000000659', figi: 'BBG000TTLC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'TOTALENERGIES MARKETING SÉNÉGAL', ticker: 'TTLS', sector: 'Energy', country: 'Sénégal', marketCap: 2450.0, priceChangeD1: 1.2, peRatio: 9.8, returnYTD: 8.4, revenueT12M: 6.5, epsT12M: 7.2, logoUrl: '/img/logos/TOTAL.svg', isin: 'SN0000000357', figi: 'BBG000TTLS01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'VIVO ENERGY CÔTE D\'IVOIRE (VIVO)', ticker: 'SHEC', sector: 'Energy', country: 'Côte d\'Ivoire', marketCap: 7890.0, priceChangeD1: 3.12, peRatio: 8.45, returnYTD: 20.34, revenueT12M: 16.78, epsT12M: 18.92, logoUrl: '/img/logos/VIVO.png', isin: 'CI0000000063', figi: 'BBG000VIVO01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'COMPAGNIE IVOIRIENNE D\'ELECTRICITÉ (CIE)', ticker: 'CIEC', sector: 'Energy', country: 'Côte d\'Ivoire', marketCap: 12345.0, priceChangeD1: 1.67, peRatio: 11.89, returnYTD: 10.45, revenueT12M: 8.23, epsT12M: 9.12, logoUrl: '/img/logos/CIEC.jpeg', isin: 'CI0000000212', figi: 'BBG000CIEC01', exchange: 'BRVM', currency: 'XOF' },
  // --- INDUSTRY SECTOR ---
  { name: 'UNIWAX CI', ticker: 'UNXC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 3000.0, priceChangeD1: -1.23, peRatio: 15.67, returnYTD: -5.34, revenueT12M: 2.11, epsT12M: -3.45, logoUrl: '/img/logos/UNIWAX.jpeg', isin: 'CI0000000134', figi: 'BBG000UNXC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'PALM CI', ticker: 'PALC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 4567.0, priceChangeD1: 3.21, peRatio: 9.87, returnYTD: 19.45, revenueT12M: 14.56, epsT12M: 16.78, logoUrl: '/img/logos/PALM.jpeg', isin: 'CI0000000145', figi: 'BBG000PALC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'FILTISAC CI', ticker: 'FTSC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 890.50, priceChangeD1: 0.78, peRatio: 14.23, returnYTD: 2.34, revenueT12M: 1.89, epsT12M: 2.12, logoUrl: '/img/logos/FILTISAC.png', isin: 'CI0000000156', figi: 'BBG000FTSC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SAPH CI', ticker: 'SPHC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 6123.0, priceChangeD1: 0.89, peRatio: 13.45, returnYTD: 5.67, revenueT12M: 4.23, epsT12M: 4.89, logoUrl: '/img/logos/SAPH.png', isin: 'CI0000000196', figi: 'BBG000SPHC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SUCRIVOIRE CI', ticker: 'SCRC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 1789.0, priceChangeD1: 1.34, peRatio: 14.56, returnYTD: 6.78, revenueT12M: 5.12, epsT12M: 5.89, logoUrl: '/img/logos/SUCRIVOIRE.png', isin: 'CI0000002028', figi: 'BBG000SCCI01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SOGB CI', ticker: 'SOGC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 1456.0, priceChangeD1: -0.67, peRatio: 15.23, returnYTD: -2.34, revenueT12M: 1.12, epsT12M: -0.89, logoUrl: '/img/logos/SOGB.png', isin: 'CI0000000189', figi: 'BBG000SOGC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'NESTLE CI', ticker: 'NTLC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 45000.0, priceChangeD1: 0, peRatio: 12.5, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/NESTLE.png', isin: 'CI0000000295', figi: 'BBG000NTLC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SICOR CI', ticker: 'SICC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 1200.0, priceChangeD1: 0, peRatio: 11.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/SICOR.png', isin: 'CI0000000113', figi: 'BBG000SICC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'UNILEVER CI', ticker: 'UNLC', sector: 'Industry', country: 'Côte d\'Ivoire', marketCap: 25000.0, priceChangeD1: 0, peRatio: 13.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/UNILEVER.png', isin: 'CI0000000287', figi: 'BBG000UNLC01', exchange: 'BRVM', currency: 'XOF' },
  // --- DISTRIBUTION SECTOR ---
  { name: 'TRACTAFRIC MOTORS CI', ticker: 'PRSC', sector: 'Distribution', country: 'Côte d\'Ivoire', marketCap: 5678.0, priceChangeD1: 1.89, peRatio: 8.67, returnYTD: 15.67, revenueT12M: 12.34, epsT12M: 13.89, logoUrl: '/img/logos/TRACTAFRIC.jpeg', isin: 'CI0000000055', figi: 'BBG000PRSC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'CFAO MOTORS CI', ticker: 'CFAC', sector: 'Distribution', country: 'Côte d\'Ivoire', marketCap: 4890.0, priceChangeD1: 2.12, peRatio: 9.34, returnYTD: 12.89, revenueT12M: 10.23, epsT12M: 11.56, logoUrl: '/img/logos/CFAO.jpg', isin: 'CI0000000220', figi: 'BBG000CFAC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'BERNABE CI', ticker: 'BNBC', sector: 'Distribution', country: 'Côte d\'Ivoire', marketCap: 678.90, priceChangeD1: -0.89, peRatio: 19.45, returnYTD: -6.78, revenueT12M: -3.45, epsT12M: -5.12, logoUrl: '/img/logos/BERNABE.jpg', isin: 'CI0000000048', figi: 'BBG000BNBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SERVAIR ABIDJAN CI', ticker: 'ABJC', sector: 'Distribution', country: 'Côte d\'Ivoire', marketCap: 2123.0, priceChangeD1: 1.56, peRatio: 12.45, returnYTD: 9.23, revenueT12M: 7.89, epsT12M: 8.45, logoUrl: '/img/logos/SERVAIR.jpg', isin: 'CI0000000600', figi: 'BBG000ABJC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SODECI CI', ticker: 'SDCC', sector: 'Distribution', country: 'Côte d\'Ivoire', marketCap: 65000.0, priceChangeD1: 0, peRatio: 10.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/SODECI.png', isin: 'CI0000000204', figi: 'BBG000SDCC01', exchange: 'BRVM', currency: 'XOF' },
  // --- OTHER SECTOR ---
  { name: 'AFRICA GLOBAL LOGISTICS CI', ticker: 'SDSC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 123000.0, priceChangeD1: 0, peRatio: 14.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/AGL.png', isin: 'CI0000000261', figi: 'BBG000SDSC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SAFCA CI', ticker: 'SAFC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 1234.0, priceChangeD1: -2.15, peRatio: 18.45, returnYTD: -8.76, revenueT12M: -4.32, epsT12M: -6.54, logoUrl: '/img/logos/SAFCA.jpeg', isin: 'CI0000000022', figi: 'BBG000SAFC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SETAO CI', ticker: 'STAC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 2345.0, priceChangeD1: -1.56, peRatio: 16.34, returnYTD: -3.21, revenueT12M: 0.45, epsT12M: -1.23, logoUrl: '/img/logos/SETAO.jpeg', isin: 'CI0000000105', figi: 'BBG000STAC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SICABLE CI', ticker: 'CABC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 1890.0, priceChangeD1: 1.23, peRatio: 11.56, returnYTD: 7.89, revenueT12M: 5.67, epsT12M: 6.34, logoUrl: '/img/logos/SICABLE.png', isin: 'CI0000000154', figi: 'BBG000CABC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SOLIBRA CI', ticker: 'SLBC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 3456.0, priceChangeD1: 2.67, peRatio: 10.23, returnYTD: 13.45, revenueT12M: 9.78, epsT12M: 11.23, logoUrl: '/img/logos/SOLIBRA.png', isin: 'CI0000000124', figi: 'BBG000SLBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'EVIOSYS PACKAGING SIEM CI', ticker: 'SEMC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 1567.0, priceChangeD1: 0.45, peRatio: 13.78, returnYTD: 3.45, revenueT12M: 2.34, epsT12M: 2.89, logoUrl: '/img/logos/SEMC.png', isin: 'CI0000000345', figi: 'BBG000SEMC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'NEI-CEDA CI', ticker: 'NEIC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 890.00, priceChangeD1: -1.78, peRatio: 17.89, returnYTD: -9.34, revenueT12M: -5.67, epsT12M: -7.23, logoUrl: '/img/logos/NEI-CEDA.png', isin: 'CI0000001954', figi: 'BBG000NEIC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SMB CI', ticker: 'SMBC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 3789.0, priceChangeD1: 2.34, peRatio: 10.12, returnYTD: 14.56, revenueT12M: 11.23, epsT12M: 12.67, logoUrl: '/img/logos/SMB.jpeg', isin: 'CI0000000311', figi: 'BBG000SMBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'SITAB CI', ticker: 'STBC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 2567.0, priceChangeD1: -1.23, peRatio: 16.78, returnYTD: -4.56, revenueT12M: -1.89, epsT12M: -3.12, logoUrl: '/img/logos/SITAB.png', isin: 'CI0000000097', figi: 'BBG000STBC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'AIR LIQUIDE CI', ticker: 'SIVC', sector: 'Other', country: 'Côte d\'Ivoire', marketCap: 1500.0, priceChangeD1: 0, peRatio: 14.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/AIRLIQUIDE.png', isin: 'CI0000000550', figi: 'BBG000SIVC01', exchange: 'BRVM', currency: 'XOF' },
  { name: 'LOTERIE NATIONALE DU BENIN', ticker: 'LNBB', sector: 'Other', country: 'Bénin', marketCap: 25000.0, priceChangeD1: 0, peRatio: 12.0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/LNBB.png', isin: 'BJ0000002275', figi: 'BBG01V2CZW02', exchange: 'BRVM', currency: 'XOF' },
  { name: 'MOVIS CI', ticker: 'SVOC', sector: 'Delisted', country: 'Côte d\'Ivoire', marketCap: 1200.0, priceChangeD1: 0, peRatio: 0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, logoUrl: '/img/logos/MOVIS.png', isin: 'CI0000000550', figi: 'BBG000SVOC01', exchange: 'BRVM', currency: 'XOF', status: 'delisted' },
  // --- MARKET INDICES ---
  { name: 'BRVM Composite', ticker: 'BRVMC', sector: 'Market Indices', country: 'UEMOA', marketCap: 0, priceChangeD1: 0, peRatio: 0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, isin: 'BRVMC0000000', figi: 'BBG000BRVMC0', exchange: 'BRVM', currency: 'XOF' },
  { name: 'BRVM 30', ticker: 'BRVM30', sector: 'Market Indices', country: 'UEMOA', marketCap: 0, priceChangeD1: 0, peRatio: 0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, isin: 'BRVM30000000', figi: 'BBG000BRVM30', exchange: 'BRVM', currency: 'XOF' },
  { name: 'BRVM Prestige', ticker: 'BRVMPR', sector: 'Market Indices', country: 'UEMOA', marketCap: 0, priceChangeD1: 0, peRatio: 0, returnYTD: 0, revenueT12M: 0, epsT12M: 0, isin: 'BRVM00000017', figi: 'BBG000BRVMP0', exchange: 'BRVM', currency: 'XOF' },
  {
    name: 'BRVM Agriculture',
    ticker: 'BRVMAG',
    sector: 'Delisted',
    marketCap: 0,
    priceChangeD1: 0,
    peRatio: 0,
    returnYTD: 0,
    revenueT12M: 0,
    epsT12M: 0,
    country: 'UEMOA',
    currency: 'XOF',
    indexSector: 'Secteurs',
    status: 'delisted'
  },
  {
    name: 'BRVM Services Publics',
    ticker: 'BRVMSP',
    sector: 'Delisted',
    marketCap: 0,
    priceChangeD1: 0,
    peRatio: 0,
    returnYTD: 0,
    revenueT12M: 0,
    epsT12M: 0,
    country: 'UEMOA',
    currency: 'XOF',
    indexSector: 'Secteurs',
    status: 'delisted'
  },
];
/**
 * 📊 Obtenir les titres groupés par secteur
 */
export const getBRVMSecuritiesBySector = (): Record<BRVMSecurity['sector'], BRVMSecurity[]> => {
  return BRVM_SECURITIES.reduce((acc, security) => {
    if (!acc[security.sector]) {
      acc[security.sector] = [];
    }
    acc[security.sector].push(security);
    return acc;
  }, {} as Record<BRVMSecurity['sector'], BRVMSecurity[]>);
};
/**
 * 🔍 Recherche fuzzy dans les titres BRVM
 */
export const searchBRVMSecurities = (query: string): BRVMSecurity[] => {
  if (!query.trim()) return BRVM_SECURITIES;
  const lowerQuery = query.toLowerCase().trim();
  return BRVM_SECURITIES.filter(security =>
    security.name.toLowerCase().includes(lowerQuery) ||
    security.ticker.toLowerCase().includes(lowerQuery) ||
    security.sector.toLowerCase().includes(lowerQuery) ||
    security.country.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => {
    // Priorité aux correspondances exactes du ticker
    const aTickerMatch = a.ticker.toLowerCase() === lowerQuery;
    const bTickerMatch = b.ticker.toLowerCase() === lowerQuery;
    if (aTickerMatch && !bTickerMatch) return -1;
    if (!aTickerMatch && bTickerMatch) return 1;
    // Puis priorité aux correspondances de début de ticker
    const aTickerStartsWith = a.ticker.toLowerCase().startsWith(lowerQuery);
    const bTickerStartsWith = b.ticker.toLowerCase().startsWith(lowerQuery);
    if (aTickerStartsWith && !bTickerStartsWith) return -1;
    if (!aTickerStartsWith && bTickerStartsWith) return 1;
    return 0;
  });
};
/**
 * 🎯 Obtenir un titre par son ticker
 */
export const getBRVMSecurityByTicker = (ticker: string): BRVMSecurity | undefined => {
  return BRVM_SECURITIES.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
};
/**
 * 📈 Obtenir les top performers (pour affichage rapide)
 */
export const getTopPerformers = (count: number = 5): BRVMSecurity[] => {
  return [...BRVM_SECURITIES]
    .sort((a, b) => b.returnYTD - a.returnYTD)
    .slice(0, count);
};
/**
 * 📉 Obtenir les titres les plus volatils
 */
export const getMostVolatile = (count: number = 5): BRVMSecurity[] => {
  return [...BRVM_SECURITIES]
    .sort((a, b) => Math.abs(b.priceChangeD1) - Math.abs(a.priceChangeD1))
    .slice(0, count);
};
/**
 * 🏢 Liste des secteurs uniques
 */
export const BRVM_SECTORS: BRVMSecurity['sector'][] = [
  'Market Indices', 'Banking', 'Telecom', 'Energy', 'Industry', 'Distribution', 'Other', 'Delisted'
];
/**
 * 🎨 Couleurs par secteur (pour UI)
 */
export const SECTOR_COLORS: Record<BRVMSecurity['sector'], string> = {
  'Market Indices': '#a29bfe',
  Banking: '#00B894',
  Telecom: '#6C5CE7',
  Energy: '#FDCB6E',
  Industry: '#00CEC9',
  Distribution: '#E17055',
  Other: '#B2BEC3',
  Delisted: '#ff4757'
};
