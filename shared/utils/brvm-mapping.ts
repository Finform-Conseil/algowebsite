/**
 * [TENOR 2026] BRVM NAME MAPPING
 * Used to bridge the gap between scraper text and application tickers.
 * Sources: brvm.org/fr/esv/paiement-de-dividendes (5 pages scraped 2026-03-12)
 */
const BRVM_NAME_TO_TICKER: Record<string, string> = {
    // === BOA GROUP ===
    "BANK OF AFRICA BN": "BOAB",
    "BANK OF AFRICA BENIN": "BOAB",
    "BOA BENIN": "BOAB",
    "BANK OF AFRICA BF": "BOABF",
    "BANK OF AFRICA BURKINA": "BOABF",
    "BOA BURKINA": "BOABF",
    "BANK OF AFRICA CI": "BOAC",
    "BANK OF AFRICA COTE D'IVOIRE": "BOAC",
    "BOA COTE D'IVOIRE": "BOAC",
    "BANK OF AFRICA ML": "BOAM",
    "BANK OF AFRICA MALI": "BOAM",
    "BOA MALI": "BOAM",
    "BANK OF AFRICA NG": "BOAN",
    "BANK OF AFRICA NIGER": "BOAN",
    "BOA NIGER": "BOAN",
    "BANK OF AFRICA SN": "BOAS",
    "BANK OF AFRICA SENEGAL": "BOAS",
    "BOA SENEGAL": "BOAS",
    // === BANQUES ===
    "CORIS BANK INTL BF": "CBIBF",
    "CORIS BANK INTERNATIONAL": "CBIBF",
    "CORIS BANK INTL": "CBIBF",
    "CORIS BANK": "CBIBF",
    "ECOBANK CI": "ECOC",
    "ECOBANK COTE D'IVOIRE": "ECOC",
    "ECOBANK CÔTE D'IVOIRE": "ECOC",
    "ECOBANK": "ECOC",             // [TENOR 2026] after / suffix normalization
    "ECOBANK TRANS. INC. TG": "ETIT",
    "ECOBANK TRANS. INC.": "ETIT", // [TENOR 2026] after TG suffix strip
    "ECOBANK TRANSNATIONAL": "ETIT",
    "ECOBANK ETI": "ETIT",
    "ETI": "ETIT",
    "NSIA BANQUE CI": "NSBC",
    "NSIA BANQUE": "NSBC",
    "ORAGROUP TG": "ORGT",
    "ORAGROUP": "ORGT",
    "SOCIETE GENERALE CI": "SGBC",
    "SOCIETE GENERALE": "SGBC",
    "SGB CI": "SGBC",
    "SOCIETE IVOIRIENNE DE BANQUE": "SIBC",
    "SIB": "SIBC",
    "BICI CI": "BICC",       // Banque Internationale de Côte d'Ivoire
    "BIIC": "BICC",
    "BICC": "BICC",
    "NSBC": "NSBC",          // Direct ticker match
    "LNB": "LNBB",           // La Nationale des Banques (Bénin) — fallback
    // === TELECOMS ===
    "SONATEL SN": "SNTS",
    "SONATEL": "SNTS",
    "ONATEL BF": "ONTBF",
    "ONATEL": "ONTBF",
    "ORANGE CI": "ORAC",
    "ORANGE": "ORAC",
    // === ÉNERGIE / OIL ===
    "TOTAL CI": "TTLC",
    "TOTAL": "TTLC",
    "TOTAL SENEGAL S.A.": "TTLS",
    "TOTAL SENEGAL": "TTLS",
    "TOTAL SN": "TTLS",
    "VIVO ENERGY CI": "SHEC",
    "VIVO ENERGY": "SHEC",
    "VIVO": "SHEC",
    // === SERVICES PUBLICS ===
    "CIE CI": "CIEC",
    "CIE": "CIEC",
    "SODECI": "SDCC",
    // === INDUSTRIE / AGRO ===
    "UNIWAX CI": "UNXC",
    "UNIWAX": "UNXC",
    "PALM CI": "PALC",
    "PALM": "PALC",
    "FILTISAC CI": "FTSC",
    "FILTISAC": "FTSC",
    "SAPH CI": "SPHC",
    "SAPHC": "SPHC",
    "SUCRIVOIRE CI": "SCRC",
    "SOGB CI": "SOGC",
    "SOGB": "SOGC",
    "NESTLE CI": "NTLC",
    "SICOR CI": "SICC",
    "UNILEVER CI": "UNLC",
    // === COMMERCE / TRANSPORT ===
    "TRACTAFRIC MOTORS CI": "PRSC",
    "TRACTAFRIC CI": "PRSC",
    "TRACTAFRIC": "PRSC",
    "CFAO MOTORS CI": "CFAC",
    "CFAO MOTORS": "CFAC",
    "CFAO CI": "CFAC",
    "BERNABE CI": "BNBC",
    "SERVAIR ABIDJAN CI": "ABJC",
    "SERVAIR ABIDJAN": "ABJC",
    "BOLLORE TRANSPORT & LOGISTICS": "SDSC",    // AGL (ex Bolloré)
    "BOLLORE TRANSPORT &AMP; LOGISTICS": "SDSC",
    "AGL CI": "SDSC",
    // === BOISSONS ===
    "SOLIBRA CI": "SLBC",
    "SOLIBRA": "SLBC",
    // === CÂBLES / INDUSTRIE ===
    "SICABLE CI": "CABC",
    "SICABLE": "CABC",
    // === MATÉRIAUX ===
    "SMB CI": "SMBC",
    "SMB": "SMBC",
    // === TABAC ===
    "SITAB CI": "STBC",
    "SITAB": "STBC",
    // === GESTION ===
    "SIEM CI": "SEMC",
    "NEI-CEDA CI": "NEIC",
    "AIR LIQUIDE CI": "SIVC",
};

export { BRVM_NAME_TO_TICKER };

