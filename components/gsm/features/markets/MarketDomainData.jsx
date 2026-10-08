const MARKETS_DATA = [
  {
    nom: 'SONATEL',
    type: 'Action',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 14200,
    variation: 1.8,
    volumeJour: 128_450,
    coursMin: 13950,
    coursMax: 14350,
  },
  {
    nom: 'ECOBANK CI',
    type: 'Action',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 6650,
    variation: -0.9,
    volumeJour: 84_620,
    coursMin: 6600,
    coursMax: 6750,
  },
  {
    nom: 'PALMCI',
    type: 'Action',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 8100,
    variation: 0.3,
    volumeJour: 23_410,
    coursMin: 8030,
    coursMax: 8160,
  },
  {
    nom: 'MTN NIGERIA',
    type: 'Action',
    marche: 'NGX',
    devise: 'NGN',
    cours: 218.5,
    variation: 2.4,
    volumeJour: 2_845_000,
    coursMin: 212.4,
    coursMax: 221.8,
  },
  {
    nom: 'ZENITH BANK',
    type: 'Action',
    marche: 'NGX',
    devise: 'NGN',
    cours: 41.2,
    variation: -1.1,
    volumeJour: 7_420_000,
    coursMin: 40.8,
    coursMax: 42.1,
  },
  {
    nom: 'GCB BANK',
    type: 'Action',
    marche: 'GSE',
    devise: 'GHS',
    cours: 5.4,
    variation: 3.2,
    volumeJour: 318_500,
    coursMin: 5.18,
    coursMax: 5.48,
  },
  {
    nom: 'Obligation Trésor CI 6.5% 2029',
    type: 'Obligation',
    marche: 'BRVM',
    devise: 'XOF',
    cours: 10050,
    variation: 0.1,
    volumeJour: 1_250,
    coursMin: 10020,
    coursMax: 10080,
  },
  {
    nom: 'Obligation Trésor NGN 2028',
    type: 'Obligation',
    marche: 'NGX',
    devise: 'NGN',
    cours: 98.7,
    variation: -0.2,
    volumeJour: 3_600,
    coursMin: 98.4,
    coursMax: 99.1,
  },
  {
    nom: 'Obligation Corporate GSE 2027',
    type: 'Obligation',
    marche: 'GSE',
    devise: 'GHS',
    cours: 101.4,
    variation: 0.4,
    volumeJour: 920,
    coursMin: 101.0,
    coursMax: 101.8,
  },
];

/* -------------------------- VUE BOURSIÈRE SIMULÉE -------------------------- */
/*
 * Données entièrement générées pour donner vie à la maquette.
 * Elles ne représentent pas des cotations officielles ni des données temps réel.
 * La simulation ajoute de petites micro-variations toutes les 2,5 secondes,
 * tout en conservant des amplitudes cohérentes avec chaque place.
 */
const BOURSES_ACTIVE_CONFIG = {
  BRVM: {
    code: 'BRVM',
    nom: 'Bourse Régionale des Valeurs Mobilières',
    indice: 'BRVM Composite',
    devise: 'XOF',
    baseIndice: 302.84,
    ouvertureIndice: 300.92,
    plusHautIndice: 304.15,
    plusBasIndice: 299.86,
    capitalisationBase: 20_850_000_000_000,
    session: '09:45 — 14:00',
    instruments: [
      {
        nom: 'SONATEL',
        secteur: 'Télécoms',
        cours: 14_200,
        variation: 1.8,
        volume: 128_450,
        transactions: 186,
      },
      {
        nom: 'ECOBANK CI',
        secteur: 'Banques',
        cours: 6_650,
        variation: -0.9,
        volume: 84_620,
        transactions: 132,
      },
      {
        nom: 'PALMCI',
        secteur: 'Agro-industrie',
        cours: 8_100,
        variation: 0.3,
        volume: 23_410,
        transactions: 61,
      },
      {
        nom: 'BICI',
        secteur: 'Banques',
        cours: 11_900,
        variation: 2.1,
        volume: 39_280,
        transactions: 89,
      },
      {
        nom: 'BOA CI',
        secteur: 'Banques',
        cours: 7_800,
        variation: -1.4,
        volume: 44_560,
        transactions: 104,
      },
      {
        nom: 'TOTALENERGIES CI',
        secteur: 'Énergie',
        cours: 2_350,
        variation: 0.8,
        volume: 65_740,
        transactions: 118,
      },
      {
        nom: 'SODECI',
        secteur: 'Services publics',
        cours: 5_400,
        variation: -0.4,
        volume: 17_850,
        transactions: 47,
      },
      {
        nom: 'ORANGE CI',        secteur: 'Télécoms',
        cours: 16_500,
        variation: 1.2,
        volume: 92_100,
        transactions: 156,
      },
    ],
  },
  NGX: {
    code: 'NGX',
    nom: 'Nigerian Exchange',
    indice: 'NGX All Share Index',
    devise: 'NGN',
    baseIndice: 126_840.6,
    ouvertureIndice: 125_970.4,
    plusHautIndice: 127_410.2,
    plusBasIndice: 125_680.9,
    capitalisationBase: 79_600_000_000_000,
    session: '09:30 — 14:30',
    instruments: [
      {
        nom: 'MTN NIGERIA',
        secteur: 'Télécoms',
        cours: 218.5,
        variation: 2.4,
        volume: 2_845_000,
        transactions: 1_248,
      },
      {
        nom: 'ZENITH BANK',
        secteur: 'Banques',
        cours: 41.2,
        variation: -1.1,
        volume: 7_420_000,
        transactions: 2_460,
      },
      {
        nom: 'DANGOTE CEMENT',
        secteur: 'Matériaux',
        cours: 590,
        variation: 1.5,
        volume: 1_180_000,
        transactions: 730,
      },
      {
        nom: 'GTCO',
        secteur: 'Banques',
        cours: 92.5,
        variation: 0.7,
        volume: 5_920_000,
        transactions: 2_030,
      },
      {
        nom: 'ACCESSCORP',
        secteur: 'Banques',
        cours: 24.3,
        variation: -0.8,
        volume: 9_640_000,
        transactions: 2_910,
      },
      {
        nom: 'AIRTEL AFRICA',
        secteur: 'Télécoms',
        cours: 2_250,
        variation: 1.1,
        volume: 820_000,
        transactions: 504,
      },
      {
        nom: 'UBA',
        secteur: 'Banques',
        cours: 47.8,
        variation: -0.3,
        volume: 6_770_000,
        transactions: 2_220,
      },
      {
        nom: 'NESTLE NIGERIA',
        secteur: 'Consommation',
        cours: 1_790,
        variation: 2.0,
        volume: 310_000,
        transactions: 284,
      },
    ],
  },
  GSE: {
    code: 'GSE',
    nom: 'Ghana Stock Exchange',
    indice: 'GSE Composite Index',
    devise: 'GHS',
    baseIndice: 6_942.3,
    ouvertureIndice: 6_886.8,
    plusHautIndice: 6_978.4,
    plusBasIndice: 6_862.1,
    capitalisationBase: 192_500_000_000,
    session: '10:00 — 15:00',
    instruments: [
      {
        nom: 'GCB BANK',
        secteur: 'Banques',
        cours: 5.4,
        variation: 3.2,
        volume: 318_500,
        transactions: 142,
      },
      {
        nom: 'MTN GHANA',
        secteur: 'Télécoms',
        cours: 3.85,
        variation: 1.6,
        volume: 1_460_000,
        transactions: 430,
      },
      {
        nom: 'CALBANK',
        secteur: 'Banques',
        cours: 0.42,
        variation: -1.2,
        volume: 480_000,
        transactions: 176,
      },
      {
        nom: 'SCB GHANA',
        secteur: 'Banques',
        cours: 29.8,
        variation: 0.4,
        volume: 54_600,
        transactions: 68,
      },
      {
        nom: 'ECOBANK GHANA',
        secteur: 'Banques',
        cours: 11.4,
        variation: -0.7,
        volume: 96_700,
        transactions: 91,
      },
      {
        nom: 'TOTALENERGIES GH',
        secteur: 'Énergie',
        cours: 21.5,
        variation: 1.3,
        volume: 42_300,
        transactions: 55,
      },
      {
        nom: 'GOIL',
        secteur: 'Énergie',
        cours: 1.95,
        variation: -0.5,
        volume: 211_000,
        transactions: 110,
      },
      {
        nom: 'BOPP',
        secteur: 'Agro-industrie',
        cours: 7.8,
        variation: 2.2,
        volume: 35_800,
        transactions: 46,
      },
    ],
  },
};

const marketActiveSeed = (value) =>
  String(value)
    .split('')
    .reduce(
      (total, char, index) => total + char.charCodeAt(0) * (index + 1),
      0
    );

const buildBourseActiveSnapshot = (code, pulse = 0) => {
  const config = BOURSES_ACTIVE_CONFIG[code] || BOURSES_ACTIVE_CONFIG.BRVM;
  const pulseNormalise = pulse % 1200;

  const instruments = config.instruments.map((instrument, index) => {
    const seed = marketActiveSeed(`${code}-${instrument.nom}`);    const micro =
      Math.sin((pulseNormalise + seed) * 0.42) * 0.1 +
      Math.sin((pulseNormalise + seed * 0.7) * 0.17) * 0.05;
    const variation = Number((instrument.variation + micro).toFixed(2));
    const variationPrix =
      Math.sin((pulseNormalise + seed) * 0.33) * 0.0012 +
      Math.cos((pulseNormalise + index * 13) * 0.21) * 0.0005;
    const precisionCours = code === 'BRVM' ? 0 : 2;
    const cours = Number(
      Math.max(0.01, instrument.cours * (1 + variationPrix)).toFixed(
        precisionCours
      )
    );
    const progressionVolume =
      1 +
      (pulseNormalise % 180) * (0.0008 + (seed % 7) * 0.00005) +
      Math.abs(Math.sin((pulseNormalise + seed) * 0.09)) * 0.035;
    const volume = Math.round(instrument.volume * progressionVolume);
    const transactions =
      instrument.transactions +
      Math.floor((pulseNormalise % 90) * (1 + (seed % 3) * 0.25));
    const spreadPct =
      code === 'NGX' ? 0.0018 : code === 'GSE' ? 0.0024 : 0.0015;
    const bid = Number((cours * (1 - spreadPct / 2)).toFixed(precisionCours));
    const ask = Number((cours * (1 + spreadPct / 2)).toFixed(precisionCours));
    const intradayAmplitude =
      0.006 + Math.min(0.018, Math.abs(variation) / 220);
    const coursMin = Number(
      (cours * (1 - intradayAmplitude)).toFixed(precisionCours)
    );
    const coursMax = Number(
      (cours * (1 + intradayAmplitude * 1.15)).toFixed(precisionCours)
    );

    return {
      ...instrument,
      cours,
      variation,
      volume,
      transactions,
      bid,
      ask,
      coursMin,
      coursMax,
      valeurEchangee: volume * cours,
    };
  });

  const totalVolume = instruments.reduce(
    (somme, instrument) => somme + instrument.volume,
    0
  );
  const totalTransactions = instruments.reduce(
    (somme, instrument) => somme + instrument.transactions,
    0
  );
  const valeurEchangee = instruments.reduce(
    (somme, instrument) => somme + instrument.valeurEchangee,
    0
  );
  const hausses = instruments.filter(
    (instrument) => instrument.variation > 0.12
  ).length;
  const baisses = instruments.filter(
    (instrument) => instrument.variation < -0.12
  ).length;
  const stables = instruments.length - hausses - baisses;

  const moyenneVariation =
    instruments.reduce(
      (somme, instrument, index) =>
        somme + instrument.variation * (1 + index * 0.08),
      0
    ) / instruments.reduce((somme, _, index) => somme + (1 + index * 0.08), 0);

  const microIndice =
    Math.sin((pulseNormalise + marketActiveSeed(code)) * 0.19) * 0.08;
  const variationIndice = Number(
    (moyenneVariation * 0.62 + microIndice).toFixed(2)
  );
  const niveauIndice = Number(
    (config.ouvertureIndice * (1 + variationIndice / 100)).toFixed(
      code === 'BRVM' ? 2 : 1
    )
  );

  const heures = [
    '09:30',
    '09:50',
    '10:10',
    '10:30',
    '10:50',
    '11:10',
    '11:30',
    '11:50',
    '12:10',
    '12:30',
    '12:50',
    '13:10',
    '13:30',
    '13:50',
  ];
  const intraday = heures.map((heure, index) => {
    const progression = index / (heures.length - 1);
    const chemin =
      Math.sin(index * 0.78 + marketActiveSeed(code) * 0.01) * 0.18 +
      Math.sin(index * 0.29 + 1.2) * 0.12;
    const variationPoint =
      variationIndice * progression + chemin * (1 - progression * 0.45);
    return {
      heure,
      indice: Number(
        (config.ouvertureIndice * (1 + variationPoint / 100)).toFixed(
          code === 'BRVM' ? 2 : 1
        )
      ),
      volumeCumule: Math.round(totalVolume * Math.pow(progression, 1.35)),
    };
  });
  intraday[intraday.length - 1].indice = niveauIndice;
  intraday[intraday.length - 1].volumeCumule = totalVolume;

  const breadth = [
    {
      name: 'Hausse',
      value: Number(((hausses / instruments.length) * 100).toFixed(1)),
    },
    {
      name: 'Baisse',
      value: Number(((baisses / instruments.length) * 100).toFixed(1)),
    },
    {
      name: 'Stable',
      value: Number(((stables / instruments.length) * 100).toFixed(1)),
    },
  ];

  return {
    ...config,
    instruments,
    totalVolume,
    totalTransactions,
    valeurEchangee,
    hausses,
    baisses,
    stables,
    breadth,
    variationIndice,
    niveauIndice,
    capitalisation: config.capitalisationBase * (1 + variationIndice / 100),
    intraday,
  };
};

const BOND_MARKET_META = {
  'Obligation Trésor CI 6.5% 2029': {
    emetteur: "Côte d'Ivoire",
    coupon: 6.5,
    rendement: 6.82,
    echeance: '2029',
    duration: 2.7,
  },
  'Obligation Trésor NGN 2028': {
    emetteur: 'Nigeria',
    coupon: 14.5,
    rendement: 15.35,
    echeance: '2028',
    duration: 1.8,
  },
  'Obligation Corporate GSE 2027': {
    emetteur: 'Corporate Ghana',
    coupon: 18.0,
    rendement: 17.65,
    echeance: '2027',
    duration: 1.2,
  },
};

const resolveMarketInstrument = (instrument, marcheHint) => {
  const direct = MARKETS_DATA.find(    (item) =>
      item.nom === instrument && (!marcheHint || item.marche === marcheHint)
  );
  if (direct) return direct;

  for (const [code, config] of Object.entries(BOURSES_ACTIVE_CONFIG)) {
    if (marcheHint && code !== marcheHint) continue;
    const action = config.instruments.find((item) => item.nom === instrument);
    if (!action) continue;

    const amplitude = Math.max(
      0.004,
      Math.min(0.03, Math.abs(Number(action.variation || 0)) / 180)
    );

    return {
      nom: action.nom,
      type: 'Action',
      marche: code,
      devise: config.devise,
      secteur: action.secteur,
      cours: Number(action.cours),
      variation: Number(action.variation || 0),
      volumeJour: Number(action.volume || 0),
      coursMin: Number(
        (action.cours * (1 - amplitude)).toFixed(code === 'BRVM' ? 0 : 2)
      ),
      coursMax: Number(
        (action.cours * (1 + amplitude * 1.15)).toFixed(code === 'BRVM' ? 0 : 2)
      ),
    };
  }

  return null;
};

const CLIENT_TRADABLE_MARKETS = (() => {
  const univers = [...MARKETS_DATA];

  Object.entries(BOURSES_ACTIVE_CONFIG).forEach(([code, config]) => {
    config.instruments.forEach((instrument) => {
      const normalise = resolveMarketInstrument(instrument.nom, code);
      if (normalise) univers.push(normalise);
    });
  });

  return Array.from(
    new Map(univers.map((instrument) => [instrument.nom, instrument])).values()
  );
})();


export {
  MARKETS_DATA,
  BOURSES_ACTIVE_CONFIG,
  marketActiveSeed,
  buildBourseActiveSnapshot,
  BOND_MARKET_META,
  resolveMarketInstrument,
  CLIENT_TRADABLE_MARKETS,
};
