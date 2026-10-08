import { parseIsoLocalDate } from '../../shared/lib/dateUtils';

const LIQUIDITY_HISTORY_MIN_DATE = '2025-09-01';

const liquidityHistorySeed = (value) =>
  String(value || '')
    .split('')
    .reduce(
      (total, char, index) => total + char.charCodeAt(0) * (index + 1),
      0
    );

const liquidityHistoryFactor = (key, dateSituation, dateReference) => {
  const situation =
    dateSituation instanceof Date
      ? dateSituation
      : parseIsoLocalDate(dateSituation);
  const reference =
    dateReference instanceof Date
      ? dateReference
      : parseIsoLocalDate(dateReference);
  const daysBack = Math.max(0, (reference - situation) / 86_400_000);
  if (daysBack < 0.5) return 1;

  const monthsBack = daysBack / 30.4375;
  const seed = liquidityHistorySeed(key);
  const monthIndex = (date) => date.getFullYear() * 12 + date.getMonth();
  const seasonal = (date) => {
    const index = monthIndex(date);
    return (
      Math.sin((index + (seed % 17)) * 0.83) * 0.026 +
      Math.cos((index + (seed % 11)) * 0.47) * 0.014 +
      Math.sin((date.getDate() + (seed % 9)) * 0.22) * 0.006
    );
  };
  const driftMonthly = 0.0045 + (seed % 6) * 0.0007;
  const factor = Math.exp(
    -driftMonthly * monthsBack + seasonal(situation) - seasonal(reference)
  );
  return Math.max(0.72, Math.min(1.18, factor));
};

const liquidityHistoricalAmount = (
  amount,
  key,
  dateSituation,
  dateReference,
  sensitivity = 1
) => {
  const factor = liquidityHistoryFactor(key, dateSituation, dateReference);
  const adjustedFactor = 1 + (factor - 1) * sensitivity;
  return Math.max(0, Number(amount || 0) * adjustedFactor);
};

/* --------------------------- EXPORTS LIQUIDITÉ --------------------------- */
/*
 * Exports autonomes, sans dépendance externe :
 * - PDF : rapport texte structuré réellement généré en .pdf côté navigateur.
 * - Excel : classeur SpreadsheetML 2003 (.xls) avec 2 feuilles
 *   "Synthèse" et "Rubriques 1-26", lisible nativement par Excel.
 */
const exportSafeFileName = (value) =>
  String(value || 'export')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'export';

const exportDownloadBlob = (blob, fileName) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

const exportXmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const exportFormatNumber = (value, digits = 2) =>
  new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: digits,
  }).format(Number(value || 0));

const buildAnatomieExportPayload = ({
  espace,
  titulaire,
  compte,
  sgi,
  pays,
  marche,
  profil,
  statut,
  devise,
  liquiditeActuelle,
  liquiditePrevisionnelle,
  liquiditeBloquee,
  autreLiquiditeAInvestir,
  liquiditeDisponibleNette,
  dateSituation,
  dateDernierDepot,
  montantDernierDepot,
  origines = [],
  affectations = [],
  totalOrigines,
  ecartActions,
  ecartObligations,
  montantCorrectionActions,
  montantCorrectionObligations,
  rendement,
  ratioCible,
  ratioPrevisionnel,
}) => {
  const totalOriginesCalcule =
    Number(totalOrigines) ||
    origines.reduce((somme, item) => somme + Number(item.montant || 0), 0);
  const liquiditeActuelleNumerique = Number(liquiditeActuelle || 0);

  const rowsOrigines = origines.map((item) => ({
    numero: Number(item.numero),
    section: 'Origines des fonds',
    libelle: item.libelle,
    detail: item.description || '',
    responsable: item.responsable || '',
    montant: Number(item.montant || 0),
    devise,
    indicateur:
      totalOriginesCalcule > 0
        ? `${((Number(item.montant || 0) / totalOriginesCalcule) * 100).toFixed(
            1
          )}%`
        : '0,0%',
  }));

  const rowTotalOrigines = {
    numero: 10,
    section: 'Origines des fonds',
    libelle: 'Total des origines de liquidité',
    detail: 'Contrôle de cohérence des rubriques 1 à 9.',
    responsable: 'Système',
    montant: totalOriginesCalcule,
    devise,
    indicateur: totalOriginesCalcule > 0 ? '100,0%' : '0,0%',
  };

  const rowsAffectations = affectations.map((item) => ({
    numero: Number(item.numero),
    section: 'Affectations / blocages',
    libelle: item.libelle,
    detail: item.groupe || '',
    responsable: item.responsable || '',
    montant: Number(item.montant || 0),
    devise,
    indicateur:
      liquiditeActuelleNumerique > 0
        ? `${(
            (Number(item.montant || 0) / liquiditeActuelleNumerique) *
            100
          ).toFixed(1)}%`
        : '0,0%',
  }));

  const rowsProfil = [
    {
      numero: 22,
      section: 'Écart allocation & rendement',
      libelle: "Écart d'allocation — Actions",
      detail:
        Number(ecartActions || 0) > 0
          ? 'Renforcement indicatif'
          : Number(ecartActions || 0) < 0
          ? 'Réduction indicative'
          : 'Allocation alignée',
      responsable: 'Système',
      montant: null,
      devise,
      indicateur: `${Number(ecartActions || 0) > 0 ? '+' : ''}${Number(
        ecartActions || 0
      ).toFixed(1)} pts`,
    },
    {
      numero: 23,
      section: 'Écart allocation & rendement',
      libelle: "Écart d'allocation — Obligations",
      detail:
        Number(ecartObligations || 0) > 0
          ? 'Renforcement indicatif'
          : Number(ecartObligations || 0) < 0
          ? 'Réduction indicative'
          : 'Allocation alignée',
      responsable: 'Système',      montant: null,
      devise,
      indicateur: `${Number(ecartObligations || 0) > 0 ? '+' : ''}${Number(
        ecartObligations || 0
      ).toFixed(1)} pts`,
    },
    {
      numero: 24,
      section: 'Écart allocation & rendement',
      libelle: 'Valeur de correction — Actions',
      detail: "Montant correspondant à l'écart d'allocation Actions.",
      responsable: 'Système',
      montant: Number(montantCorrectionActions || 0),
      devise,
      indicateur: '',
    },
    {
      numero: 25,
      section: 'Écart allocation & rendement',
      libelle: 'Valeur de correction — Obligations',
      detail: "Montant correspondant à l'écart d'allocation Obligations.",
      responsable: 'Système',
      montant: Number(montantCorrectionObligations || 0),
      devise,
      indicateur: '',
    },
    {
      numero: 26,
      section: 'Écart allocation & rendement',
      libelle: 'Rendement du portefeuille',
      detail: 'Rendement associé au portefeuille dans la maquette.',
      responsable: 'Système',
      montant: null,
      devise,
      indicateur: `${Number(rendement || 0) >= 0 ? '+' : ''}${Number(
        rendement || 0
      ).toFixed(2)}%`,
    },
  ];

  const metadata = [
    ['Espace', espace],
    ['Titulaire / Client', titulaire],
    ['Compte / Portefeuille', compte || titulaire],
    ...(sgi ? [['SGI', sgi]] : []),
    ...(pays ? [['Pays', pays]] : []),
    ['Marché', marche || '—'],
    ...(profil ? [['Profil de risque', profil]] : []),
    ...(statut ? [['Statut de liquidité', statut]] : []),
    ['Devise native', devise],
    ['Date de situation', dateSituation || '—'],
    [
      'Liquidité actuelle',
      `${exportFormatNumber(liquiditeActuelleNumerique)} ${devise}`,
    ],
    [
      'Liquidité prévisionnelle 30 j',
      `${exportFormatNumber(Number(liquiditePrevisionnelle || 0))} ${devise}`,
    ],
    [
      'Liquidité bloquée / réservée',
      `${exportFormatNumber(Number(liquiditeBloquee || 0))} ${devise}`,
    ],
    [
      'Autre liquidité à investir',
      `${exportFormatNumber(Number(autreLiquiditeAInvestir || 0))} ${devise}`,
    ],
    [
      'Liquidité disponible',
      `${exportFormatNumber(Number(liquiditeDisponibleNette || 0))} ${devise}`,
    ],
    ['Date du dernier dépôt', dateDernierDepot || '—'],
    [
      'Montant du dernier dépôt',
      `${exportFormatNumber(Number(montantDernierDepot || 0))} ${devise}`,
    ],
    ...(Number.isFinite(Number(ratioCible))
      ? [['Liquidité cible', `${Number(ratioCible).toFixed(2)}%`]]
      : []),
    ...(Number.isFinite(Number(ratioPrevisionnel))
      ? [
          [
            'Liquidité prévisionnelle / encours',
            `${Number(ratioPrevisionnel).toFixed(2)}%`,
          ],
        ]
      : []),
  ];

  return {
    title: 'Anatomie de la liquidité',
    subtitle: `${espace} · ${titulaire}${
      dateSituation ? ` · Situation au ${dateSituation}` : ''
    }`,
    slug: exportSafeFileName(`${titulaire}-${compte || sgi || marche}`),
    metadata,
    rows: [
      ...rowsOrigines,
      rowTotalOrigines,
      ...rowsAffectations,
      ...rowsProfil,
    ]
      .filter((row) => Number.isFinite(row.numero))
      .sort((a, b) => a.numero - b.numero),
  };
};

const exportXlsxColumnName = (index) => {
  let n = index;
  let name = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
};

const exportXlsxInlineCell = (row, col, value, style = 0) => {
  const ref = `${exportXlsxColumnName(col)}${row}`;
  return `<c r="${ref}" t="inlineStr"${
    style ? ` s="${style}"` : ''
  }><is><t xml:space="preserve">${exportXmlEscape(value)}</t></is></c>`;
};

const exportXlsxNumberCell = (row, col, value, style = 0) => {
  const ref = `${exportXlsxColumnName(col)}${row}`;
  return `<c r="${ref}"${style ? ` s="${style}"` : ''}><v>${Number(
    value || 0
  )}</v></c>`;
};

const exportZipCrc32 = (bytes) => {
  const table = [];
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const exportZipPush16 = (target, value) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const exportZipPush32 = (target, value) => {
  target.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  );
};

const exportZipStore = (entries) => {
  const encoder = new TextEncoder();
  const output = [];
  const centralDirectory = [];
  const now = new Date();
  const dosTime =
    (now.getHours() << 11) |
    (now.getMinutes() << 5) |
    Math.floor(now.getSeconds() / 2);
  const dosDate =
    ((Math.max(1980, now.getFullYear()) - 1980) << 9) |
    ((now.getMonth() + 1) << 5) |
    now.getDate();
  const utf8Flag = 0x0800;

  entries.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const dataBytes =
      content instanceof Uint8Array ? content : encoder.encode(String(content));
    const crc = exportZipCrc32(dataBytes);
    const localOffset = output.length;

    exportZipPush32(output, 0x04034b50);
    exportZipPush16(output, 20);
    exportZipPush16(output, utf8Flag);
    exportZipPush16(output, 0);
    exportZipPush16(output, dosTime);
    exportZipPush16(output, dosDate);
    exportZipPush32(output, crc);
    exportZipPush32(output, dataBytes.length);
    exportZipPush32(output, dataBytes.length);
    exportZipPush16(output, nameBytes.length);
    exportZipPush16(output, 0);
    output.push(...nameBytes, ...dataBytes);

    centralDirectory.push({
      nameBytes,
      crc,      size: dataBytes.length,
      localOffset,
      dosTime,
      dosDate,
    });
  });

  const centralOffset = output.length;

  centralDirectory.forEach((entry) => {
    exportZipPush32(output, 0x02014b50);
    exportZipPush16(output, 20);
    exportZipPush16(output, 20);
    exportZipPush16(output, utf8Flag);
    exportZipPush16(output, 0);
    exportZipPush16(output, entry.dosTime);
    exportZipPush16(output, entry.dosDate);
    exportZipPush32(output, entry.crc);
    exportZipPush32(output, entry.size);
    exportZipPush32(output, entry.size);
    exportZipPush16(output, entry.nameBytes.length);
    exportZipPush16(output, 0);
    exportZipPush16(output, 0);
    exportZipPush16(output, 0);
    exportZipPush16(output, 0);
    exportZipPush32(output, 0);
    exportZipPush32(output, entry.localOffset);
    output.push(...entry.nameBytes);
  });

  const centralSize = output.length - centralOffset;
  exportZipPush32(output, 0x06054b50);
  exportZipPush16(output, 0);
  exportZipPush16(output, 0);
  exportZipPush16(output, centralDirectory.length);
  exportZipPush16(output, centralDirectory.length);
  exportZipPush32(output, centralSize);
  exportZipPush32(output, centralOffset);
  exportZipPush16(output, 0);

  return new Uint8Array(output);
};

const exportAnatomieExcel = (payload) => {
  if (!payload) return;

  const metaRows = [
    `<row r="1" ht="24" customHeight="1">${exportXlsxInlineCell(
      1,
      1,
      payload.title,
      1
    )}</row>`,
    `<row r="2">${exportXlsxInlineCell(2, 1, payload.subtitle)}</row>`,
    '<row r="3"></row>',
    ...payload.metadata.map(
      ([label, value], index) =>
        `<row r="${index + 4}">${exportXlsxInlineCell(
          index + 4,
          1,
          label,
          3
        )}${exportXlsxInlineCell(index + 4, 2, value)}</row>`
    ),
  ].join('');

  const sheet1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetViews><sheetView workbookViewId="0"/></sheetViews>
 <cols><col min="1" max="1" width="30" customWidth="1"/><col min="2" max="2" width="44" customWidth="1"/></cols>
 <sheetData>${metaRows}</sheetData>
 <mergeCells count="2"><mergeCell ref="A1:B1"/><mergeCell ref="A2:B2"/></mergeCells>
</worksheet>`;

  const headers = [
    'N°',
    'Section',
    'Libellé',
    'Détail / Groupe',
    'Responsable',
    'Montant',
    'Devise',
    'Indicateur',
  ];
  const headerCells = headers
    .map((header, index) => exportXlsxInlineCell(1, index + 1, header, 2))
    .join('');

  const detailRows = payload.rows
    .map((row, index) => {
      const rowIndex = index + 2;
      const cells = [
        exportXlsxNumberCell(rowIndex, 1, row.numero, 5),
        exportXlsxInlineCell(rowIndex, 2, row.section),
        exportXlsxInlineCell(rowIndex, 3, row.libelle),
        exportXlsxInlineCell(rowIndex, 4, row.detail),
        exportXlsxInlineCell(rowIndex, 5, row.responsable),
        row.montant == null
          ? exportXlsxInlineCell(rowIndex, 6, '')
          : exportXlsxNumberCell(rowIndex, 6, row.montant, 4),
        exportXlsxInlineCell(rowIndex, 7, row.devise),
        exportXlsxInlineCell(rowIndex, 8, row.indicateur),
      ].join('');
      return `<row r="${rowIndex}">${cells}</row>`;
    })
    .join('');

  const sheet2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetViews>
  <sheetView workbookViewId="0">
   <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
  </sheetView>
 </sheetViews>
 <cols>
  <col min="1" max="1" width="7" customWidth="1"/>
  <col min="2" max="2" width="25" customWidth="1"/>
  <col min="3" max="3" width="36" customWidth="1"/>
  <col min="4" max="4" width="52" customWidth="1"/>
  <col min="5" max="5" width="28" customWidth="1"/>
  <col min="6" max="6" width="18" customWidth="1"/>
  <col min="7" max="7" width="12" customWidth="1"/>
  <col min="8" max="8" width="18" customWidth="1"/>
 </cols>
 <sheetData>
  <row r="1" ht="22" customHeight="1">${headerCells}</row>
  ${detailRows}
 </sheetData>
 <autoFilter ref="A1:H${payload.rows.length + 1}"/>
</worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
 <fonts count="4">
  <font><sz val="10"/><name val="Arial"/></font>
  <font><b/><sz val="16"/><color rgb="FF0F1B33"/><name val="Arial"/></font>
  <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
  <font><b/><sz val="10"/><color rgb="FF5B6474"/><name val="Arial"/></font>
 </fonts>
 <fills count="4">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF0F1B33"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFF5F6F9"/><bgColor indexed="64"/></patternFill></fill>
 </fills>
 <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
 <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
 <cellXfs count="6">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
  <xf numFmtId="0" fontId="3" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf>
 </cellXfs>
 <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <bookViews><workbookView/></bookViews>
 <sheets>
  <sheet name="Synthèse" sheetId="1" r:id="rId1"/>
  <sheet name="Rubriques 1-26" sheetId="2" r:id="rId2"/>
 </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
 <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
 <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
 <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
 <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
 <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const zipBytes = exportZipStore([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rootRels },
    { name: 'xl/workbook.xml', content: workbook },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { name: 'xl/styles.xml', content: styles },
    { name: 'xl/worksheets/sheet1.xml', content: sheet1 },
    { name: 'xl/worksheets/sheet2.xml', content: sheet2 },
  ]);
  const date = new Date().toISOString().slice(0, 10);
  exportDownloadBlob(
    new Blob([zipBytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `anatomie-liquidite-${payload.slug}-${date}.xlsx`
  );
};

const exportPdfAscii = (value) =>
  String(value ?? '')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\u00a0|\u202f/g, ' ')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

const exportPdfEscape = (value) =>
  exportPdfAscii(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const exportPdfWrap = (value, maxChars = 92) => {
  const words = exportPdfAscii(value).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
};

const exportAnatomiePdf = (payload) => {
  if (!payload) return;

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 42;
  const topY = 800;
  const bottomY = 48;
  const pages = [];
  let commands = [];
  let y = topY;

  const addPage = () => {
    if (commands.length > 0) pages.push(commands);
    commands = [];
    y = topY;
  };

  const addText = (
    text,
    { size = 9, bold = false, x = marginX, leading } = {}
  ) => {
    const lineHeight = leading || size + 4;
    if (y - lineHeight < bottomY) addPage();
    commands.push(
      `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y.toFixed(
        1
      )} Tm (${exportPdfEscape(text)}) Tj ET`
    );
    y -= lineHeight;
  };

  const addWrapped = (
    text,
    { size = 9, bold = false, x = marginX, maxChars = 92, leading } = {}
  ) => {
    exportPdfWrap(text, maxChars).forEach((line) =>
      addText(line, { size, bold, x, leading })
    );
  };

  const addRule = () => {
    if (y < bottomY + 12) addPage();
    commands.push(
      `0.87 G 0.7 w ${marginX} ${y.toFixed(1)} m ${
        pageWidth - marginX
      } ${y.toFixed(1)} l S`
    );
    y -= 10;
  };

  addText(payload.title.toUpperCase(), { size: 16, bold: true, leading: 22 });
  addWrapped(payload.subtitle, { size: 10, bold: true, leading: 15 });
  addText(
    `Document genere le ${new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())}`,
    { size: 8, leading: 14 }
  );
  addRule();

  addText('SYNTHESE DU COMPTE', { size: 11, bold: true, leading: 18 });
  payload.metadata.forEach(([label, value]) => {
    addWrapped(`${label} : ${value}`, {
      size: 8.5,
      maxChars: 98,
      leading: 12,
    });
  });
  y -= 5;
  addRule();

  addText('RUBRIQUES 1 A 26', { size: 11, bold: true, leading: 18 });
  payload.rows.forEach((row) => {
    const montant =
      row.montant == null
        ? ''
        : ` | Montant: ${exportFormatNumber(row.montant)} ${row.devise}`;
    const indicateur = row.indicateur ? ` | ${row.indicateur}` : '';

    addWrapped(
      `${String(row.numero).padStart(2, '0')}. ${
        row.libelle
      }${montant}${indicateur}`,
      { size: 8.7, bold: true, maxChars: 92, leading: 12 }
    );
    addWrapped(
      `${row.section}${
        row.responsable ? ` | Responsable: ${row.responsable}` : ''
      }${row.detail ? ` | ${row.detail}` : ''}`,
      { size: 7.7, x: marginX + 12, maxChars: 104, leading: 10.5 }
    );
    y -= 3;
  });

  if (commands.length > 0) pages.push(commands);

  pages.forEach((pageCommands, index) => {
    pageCommands.push(
      `BT /F1 7 Tf 1 0 0 1 ${marginX} 24 Tm (Anatomie de la liquidite - page ${
        index + 1
      } / ${pages.length}) Tj ET`
    );
  });

  const objects = {};
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const kids = [];
  pages.forEach((pageCommands, index) => {
    const contentNumber = 5 + index * 2;
    const pageNumber = contentNumber + 1;
    const stream = pageCommands.join('\n');
    objects[
      contentNumber
    ] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[
      pageNumber
    ] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`;
    kids.push(`${pageNumber} 0 R`);
  });
  objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${
    pages.length
  } >>`;

  const maxObjectNumber = Math.max(...Object.keys(objects).map(Number));
  let pdf = '%PDF-1.4\n';
  const offsets = new Array(maxObjectNumber + 1).fill(0);

  for (let i = 1; i <= maxObjectNumber; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= maxObjectNumber; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${
    maxObjectNumber + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const date = new Date().toISOString().slice(0, 10);
  exportDownloadBlob(
    new Blob([pdf], { type: 'application/pdf' }),
    `anatomie-liquidite-${payload.slug}-${date}.pdf`  );
};

/* ---------------- EXPORT CONSOLIDÉ — LIQUIDITÉ DES COMPTES GÉRÉS ---------------- */
/*
 * Format inspiré du tableau papier fourni :
 * - tableau 1 : origines de la liquidité, rubriques 1 à 10 ;
 * - tableau 2 : affectations / blocages / correction d'écart, rubriques 11 à 26.
 * - Excel : un tableau par feuille (Origines 1-10 / Blocages 11-26).
 *
 * L'export Gestion sous mandat porte sur TOUS les comptes gérés à la date de
 * situation sélectionnée dans Money Management. Les exports individuels
 * existants restent utilisés dans l'espace Client.
 */
const buildMoneyManagementConsolidatedExportPayload = (details = []) => {
  const getNumeroCompte = (client, index) =>
    client?.numeroCompte ||
    client?.compte ||
    `GSM-${String(index + 1).padStart(5, '0')}`;

  const montantRubrique = (liste, numero) =>
    Number(
      (liste || []).find((item) => Number(item?.numero) === Number(numero))
        ?.montant || 0
    );

  const rows = details.map((detail, index) => {
    const client = detail.client;
    const encours = Number(client?.encours || 0);
    const liquiditeGlobale = Number(detail.liquiditeActuelle || 0);
    const valorisationTitres = Math.max(0, encours - liquiditeGlobale);
    const correctionActionsSignee = Math.round(
      (encours * Number(detail.ecartActions || 0)) / 100
    );
    const correctionObligationsSignee = Math.round(
      (encours * Number(detail.ecartObligations || 0)) / 100
    );

    // Le modèle papier ventile la poche ESV en deux sous-ensembles :
    // - les amortissements / intérêts numérotés (3) et (4) ;
    // - OAT-TG % 26-29 avec deux colonnes non numérotées.
    // La maquette ne stockant pas encore ces deux poches séparément, on ventile
    // le montant ESV existant sans modifier le total de liquidité (10).
    const amortissementsEsvTotal = montantRubrique(detail.origines, 3);
    const interetsEsvTotal = montantRubrique(detail.origines, 4);
    const partOatTg = 0.35;
    const oatTgAmortissement = Math.round(amortissementsEsvTotal * partOatTg);
    const oatTgInteret = Math.round(interetsEsvTotal * partOatTg);

    return {
      numeroCompte: getNumeroCompte(client, index),
      nom: client?.nom || '—',
      valorisationTitres,
      profil: client?.profilRisque || client?.risque || '—',
      dernierDepotDate: detail.dateDernierDepot || '—',
      devise: client?.devise || 'XOF',

      r1: montantRubrique(detail.origines, 1),
      r2: montantRubrique(detail.origines, 2),
      r3: Math.max(0, amortissementsEsvTotal - oatTgAmortissement),
      r4: Math.max(0, interetsEsvTotal - oatTgInteret),
      oatTgAmortissement,
      oatTgInteret,
      r5: montantRubrique(detail.origines, 5),
      r6: montantRubrique(detail.origines, 6),
      r7: montantRubrique(detail.origines, 7),
      r8: montantRubrique(detail.origines, 8),
      r9: montantRubrique(detail.origines, 9),
      r10: Number(detail.totalOrigines || liquiditeGlobale),

      r11: montantRubrique(detail.affectations, 11),
      r12: montantRubrique(detail.affectations, 12),
      r13: montantRubrique(detail.affectations, 13),
      r14: montantRubrique(detail.affectations, 14),
      r15: montantRubrique(detail.affectations, 15),
      r16: montantRubrique(detail.affectations, 16),
      r17: montantRubrique(detail.affectations, 17),
      r18: montantRubrique(detail.affectations, 18),
      r19: montantRubrique(detail.affectations, 19),
      r20: montantRubrique(detail.affectations, 20),
      r21: montantRubrique(detail.affectations, 21),

      r22: Number(detail.ecartActions || 0),
      r23: Number(detail.ecartObligations || 0),
      r24: correctionActionsSignee,
      r25: correctionObligationsSignee,
      r26: Number(detail.rendement || 0),
    };
  });

  return {
    title: 'LIQUIDITÉ DES COMPTES GÉRÉS',
    subtitle: `Gestion sous mandat · ${rows.length} compte(s)`,
    dateSituation: details[0]?.dateSituation || '—',
    slug: exportSafeFileName(
      `liquidite-comptes-geres-${details[0]?.dateSituation || 'situation'}`
    ),
    rows,
  };
};

const exportMoneyManagementExcel = (payload) => {
  if (!payload?.rows?.length) return;

  const topColumns = [
    { key: 'numeroCompte', label: 'N° Compte', type: 'text' },
    { key: 'nom', label: 'Prénom & Nom', type: 'text' },
    { key: 'valorisationTitres', label: 'Valorisation Titres', type: 'money' },
    { key: 'profil', label: 'Profil', type: 'text' },
    { key: 'dernierDepotDate', label: 'Dernier Dépôt', type: 'text' },
    { key: 'r1', label: 'Ouverture (1)', type: 'money' },
    { key: 'r2', label: 'Dernier dépôt (2)', type: 'money' },
    { key: 'r3', label: 'Amortissements (3)', type: 'money' },
    { key: 'r4', label: 'Intérêts (4)', type: 'money' },
    {
      key: 'oatTgAmortissement',
      label: 'Amortissement',
      type: 'money',
    },
    { key: 'oatTgInteret', label: 'Intérêt', type: 'money' },
    { key: 'r5', label: 'Dividendes (5)', type: 'money' },
    { key: 'r6', label: 'Retrait (6)', type: 'money' },
    { key: 'r7', label: 'Réinvestissement (7)', type: 'money' },
    { key: 'r8', label: 'Part à ne pas réinvestir (8)', type: 'money' },
    { key: 'r9', label: 'Dépôt opération primaire (9)', type: 'money' },
    { key: 'r10', label: 'Total (10)', type: 'money' },
  ];

  const bottomColumns = [
    { key: 'numeroCompte', label: 'N° Compte', type: 'text' },
    { key: 'nom', label: 'Prénom & Nom', type: 'text' },
    { key: 'valorisationTitres', label: 'Valorisation Titres', type: 'money' },
    { key: 'profil', label: 'Profil', type: 'text' },
    { key: 'dernierDepotDate', label: 'Dernier Dépôt', type: 'text' },
    { key: 'r11', label: 'Retrait en cours (11)', type: 'money' },
    { key: 'r12', label: 'Autre liquidité à investir (12)', type: 'money' },
    { key: 'r13', label: 'OAT (13)', type: 'money' },
    { key: 'r14', label: 'BAT (14)', type: 'money' },
    { key: 'r15', label: 'OPV / APE (15)', type: 'money' },
    { key: 'r16', label: 'Actions (16)', type: 'money' },
    { key: 'r17', label: 'Amortissements (17)', type: 'money' },
    { key: 'r18', label: 'Intérêts (18)', type: 'money' },
    { key: 'r19', label: 'Dividendes (19)', type: 'money' },
    { key: 'r20', label: 'Ne pas réinvestir (20)', type: 'money' },
    { key: 'r21', label: 'Liquidité disponible (21)', type: 'money' },
    { key: 'r22', label: 'Actions % (22)', type: 'pct' },
    { key: 'r23', label: 'Obligations % (23)', type: 'pct' },
    { key: 'r24', label: 'Action valeur (24)', type: 'money' },
    { key: 'r25', label: 'Obligation valeur (25)', type: 'money' },
    { key: 'r26', label: 'Rendement (26)', type: 'pct' },
  ];

  const cell = (rowIndex, colIndex, value, type = 'text', styleOverride) => {
    const style =
      styleOverride ??
      (type === 'money' ? 6 : type === 'pct' ? 7 : type === 'center' ? 5 : 4);
    if (type === 'money' || type === 'pct') {
      return exportXlsxNumberCell(
        rowIndex,
        colIndex,
        Number(value || 0),
        style
      );
    }
    return exportXlsxInlineCell(rowIndex, colIndex, value, style);
  };

  // Les deux feuilles sont distinctes. La vue 1-10 dispose d'un niveau
  // d'en-tête supplémentaire pour les deux sous-poches ESV.
  const headerStart = 4;
  const topDataStart = 8;
  const bottomDataStart = 7;

  const buildDataRows = (columns, dataStart) =>
    payload.rows
      .map((row, rowOffset) => {
        const rowIndex = dataStart + rowOffset;
        const cells = columns
          .map((column, columnIndex) => {
            const value = row[column.key];
            const style =
              column.type === 'money'
                ? rowOffset % 2
                  ? 10
                  : 6
                : column.type === 'pct'
                ? rowOffset % 2
                  ? 11
                  : 7
                : rowOffset % 2
                ? 9
                : 4;
            return cell(rowIndex, columnIndex + 1, value, column.type, style);
          })
          .join('');
        return `<row r="${rowIndex}" ht="18" customHeight="1">${cells}</row>`;
      })
      .join('');

  const topRows = buildDataRows(topColumns, topDataStart);  const bottomRows = buildDataRows(bottomColumns, bottomDataStart);

  const topHeaderRows = `
    <row r="${headerStart}" ht="22" customHeight="1">
      ${exportXlsxInlineCell(headerStart, 1, 'N° Compte', 3)}
      ${exportXlsxInlineCell(headerStart, 2, 'Prénom & Nom', 3)}
      ${exportXlsxInlineCell(headerStart, 3, 'Valorisation Titres', 3)}
      ${exportXlsxInlineCell(headerStart, 4, 'Profil', 3)}
      ${exportXlsxInlineCell(headerStart, 5, 'Dernier Dépôt', 3)}
      ${exportXlsxInlineCell(
        headerStart,
        6,
        'Liquidité Globale (origine des fonds)',
        2
      )}
    </row>
    <row r="${headerStart + 1}" ht="22" customHeight="1">
      ${exportXlsxInlineCell(headerStart + 1, 6, 'Dépôt', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 8, 'ESV', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 12, 'Dividendes (5)', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 13, 'Cession de titre', 3)}
      ${exportXlsxInlineCell(
        headerStart + 1,
        15,
        '% portefeuille à ne pas réinvestir (8)',
        3
      )}
      ${exportXlsxInlineCell(
        headerStart + 1,
        16,
        'Dépôt pour opération primaire (9)',
        3
      )}
      ${exportXlsxInlineCell(headerStart + 1, 17, 'Total (10)', 3)}
    </row>
    <row r="${headerStart + 2}" ht="22" customHeight="1">
      ${exportXlsxInlineCell(headerStart + 2, 8, 'TPBJ 6,5% 2020-2028', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 10, 'OAT-TG % 26-29', 3)}
    </row>
    <row r="${headerStart + 3}" ht="34" customHeight="1">
      ${exportXlsxInlineCell(headerStart + 3, 6, 'Ouverture (1)', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 7, 'Dernier dépôt (2)', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 8, 'Amortissements (3)', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 9, 'Intérêts (4)', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 10, 'Amortissement', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 11, 'Intérêt', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 13, 'Retrait (6)', 3)}
      ${exportXlsxInlineCell(headerStart + 3, 14, 'Réinvestissement (7)', 3)}
    </row>`;

  const bottomHeaderRows = `
    <row r="${headerStart}" ht="22" customHeight="1">
      ${exportXlsxInlineCell(headerStart, 1, 'N° Compte', 3)}
      ${exportXlsxInlineCell(headerStart, 2, 'Prénom & Nom', 3)}
      ${exportXlsxInlineCell(headerStart, 3, 'Valorisation Titres', 3)}
      ${exportXlsxInlineCell(headerStart, 4, 'Profil', 3)}
      ${exportXlsxInlineCell(headerStart, 5, 'Dernier Dépôt', 3)}
      ${exportXlsxInlineCell(headerStart, 6, 'Retrait en cours (11)', 3)}
      ${exportXlsxInlineCell(
        headerStart,
        7,
        'Autre liquidité à investir (12)',
        3
      )}
      ${exportXlsxInlineCell(headerStart, 8, 'Liquidité Bloquée', 2)}
      ${exportXlsxInlineCell(headerStart, 16, 'Liquidité disponible (21)', 3)}
      ${exportXlsxInlineCell(headerStart, 17, 'Correction écart sur profil', 2)}
      ${exportXlsxInlineCell(headerStart, 21, 'Rendement (26)', 3)}
    </row>
    <row r="${headerStart + 1}" ht="22" customHeight="1">
      ${exportXlsxInlineCell(headerStart + 1, 8, 'Achat Marché Monétaire', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 10, 'Achat Marché financier', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 12, 'ESV', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 15, 'Ne pas réinvestir (20)', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 17, '%', 3)}
      ${exportXlsxInlineCell(headerStart + 1, 19, 'Valeur', 3)}
    </row>
    <row r="${headerStart + 2}" ht="34" customHeight="1">
      ${exportXlsxInlineCell(headerStart + 2, 8, 'OAT (13)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 9, 'BAT (14)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 10, 'OPV / APE (15)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 11, 'Actions (16)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 12, 'Amortissements (17)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 13, 'Intérêts (18)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 14, 'Dividendes (19)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 17, 'Actions (22)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 18, 'Obligations (23)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 19, 'Action (24)', 3)}
      ${exportXlsxInlineCell(headerStart + 2, 20, 'Obligation (25)', 3)}
    </row>`;

  const topSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
 <sheetViews>
  <sheetView workbookViewId="0">
   <pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/>
  </sheetView>
 </sheetViews>
 <cols>
  <col min="1" max="1" width="14" customWidth="1"/>
  <col min="2" max="2" width="28" customWidth="1"/>
  <col min="3" max="3" width="18" customWidth="1"/>
  <col min="4" max="4" width="16" customWidth="1"/>
  <col min="5" max="5" width="15" customWidth="1"/>
  <col min="6" max="17" width="16" customWidth="1"/>
 </cols>
 <sheetData>
  <row r="1" ht="28" customHeight="1">${exportXlsxInlineCell(
    1,
    1,
    'LIQUIDITÉ GLOBALE — ORIGINE DES FONDS (RUBRIQUES 1 À 10)',
    1
  )}</row>
  <row r="2" ht="18" customHeight="1">${exportXlsxInlineCell(
    2,
    1,
    `${payload.subtitle} · Situation au ${payload.dateSituation}`,
    8
  )}</row>
  <row r="3"></row>
  ${topHeaderRows}
  ${topRows}
 </sheetData>
 <mergeCells count="19">
  <mergeCell ref="A1:Q1"/>
  <mergeCell ref="A2:Q2"/>
  <mergeCell ref="A4:A7"/><mergeCell ref="B4:B7"/><mergeCell ref="C4:C7"/>
  <mergeCell ref="D4:D7"/><mergeCell ref="E4:E7"/>
  <mergeCell ref="F4:Q4"/>
  <mergeCell ref="F5:G5"/><mergeCell ref="H5:K5"/>
  <mergeCell ref="L5:L7"/><mergeCell ref="M5:N5"/>
  <mergeCell ref="O5:O7"/><mergeCell ref="P5:P7"/><mergeCell ref="Q5:Q7"/>
  <mergeCell ref="F6:G6"/><mergeCell ref="H6:I6"/><mergeCell ref="J6:K6"/>
  <mergeCell ref="M6:N6"/>
 </mergeCells>
 <pageMargins left="0.2" right="0.2" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
 <pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

  const bottomSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
 <sheetViews>
  <sheetView workbookViewId="0">
   <pane ySplit="6" topLeftCell="A7" activePane="bottomLeft" state="frozen"/>
  </sheetView>
 </sheetViews>
 <cols>
  <col min="1" max="1" width="14" customWidth="1"/>
  <col min="2" max="2" width="28" customWidth="1"/>
  <col min="3" max="3" width="18" customWidth="1"/>
  <col min="4" max="4" width="16" customWidth="1"/>
  <col min="5" max="5" width="15" customWidth="1"/>
  <col min="6" max="21" width="16" customWidth="1"/>
 </cols>
 <sheetData>
  <row r="1" ht="28" customHeight="1">${exportXlsxInlineCell(
    1,
    1,
    'LIQUIDITÉ BLOQUÉE, DISPONIBLE ET CORRECTION DES ÉCARTS (RUBRIQUES 11 À 26)',
    1
  )}</row>
  <row r="2" ht="18" customHeight="1">${exportXlsxInlineCell(
    2,
    1,
    `${payload.subtitle} · Situation au ${payload.dateSituation}`,
    8
  )}</row>
  <row r="3"></row>
  ${bottomHeaderRows}
  ${bottomRows}
 </sheetData>
 <mergeCells count="19">
  <mergeCell ref="A1:U1"/>
  <mergeCell ref="A2:U2"/>
  <mergeCell ref="A4:A6"/><mergeCell ref="B4:B6"/><mergeCell ref="C4:C6"/>
  <mergeCell ref="D4:D6"/><mergeCell ref="E4:E6"/>
  <mergeCell ref="F4:F6"/><mergeCell ref="G4:G6"/>
  <mergeCell ref="H4:O4"/>
  <mergeCell ref="P4:P6"/>
  <mergeCell ref="Q4:T4"/>
  <mergeCell ref="U4:U6"/>
  <mergeCell ref="H5:I5"/>
  <mergeCell ref="J5:K5"/>
  <mergeCell ref="L5:N5"/>
  <mergeCell ref="O5:O6"/>
  <mergeCell ref="Q5:R5"/>
  <mergeCell ref="S5:T5"/>
 </mergeCells>
 <pageMargins left="0.2" right="0.2" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>
 <pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <numFmts count="2">
  <numFmt numFmtId="164" formatCode="#,##0"/>
  <numFmt numFmtId="165" formatCode="0.0\\%"/>
 </numFmts> <fonts count="4">
  <font><sz val="9"/><name val="Arial"/></font>
  <font><b/><sz val="15"/><color rgb="FF0F1B33"/><name val="Arial"/></font>
  <font><b/><sz val="8"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
  <font><b/><sz val="8"/><color rgb="FF101827"/><name val="Arial"/></font>
 </fonts>
 <fills count="6">
  <fill><patternFill patternType="none"/></fill>
  <fill><patternFill patternType="gray125"/></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FF0F1B33"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFE8ECF4"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>
  <fill><patternFill patternType="solid"><fgColor rgb="FFF7F8FA"/><bgColor indexed="64"/></patternFill></fill>
 </fills>
 <borders count="2">
  <border><left/><right/><top/><bottom/><diagonal/></border>
  <border>
   <left style="thin"><color rgb="FFB8BEC9"/></left>
   <right style="thin"><color rgb="FFB8BEC9"/></right>
   <top style="thin"><color rgb="FFB8BEC9"/></top>
   <bottom style="thin"><color rgb="FFB8BEC9"/></bottom>
   <diagonal/>
  </border>
 </borders>
 <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
 <cellXfs count="12">
  <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
  <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
  <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
  <xf numFmtId="164" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
  <xf numFmtId="165" fontId="0" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
  <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
  <xf numFmtId="164" fontId="0" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
  <xf numFmtId="165" fontId="0" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"><alignment horizontal="right" vertical="center"/></xf>
 </cellXfs>
 <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
 <bookViews><workbookView/></bookViews>
 <sheets>
  <sheet name="Origines 1-10" sheetId="1" r:id="rId1"/>
  <sheet name="Blocages 11-26" sheetId="2" r:id="rId2"/>
 </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
 <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
 <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="xml" ContentType="application/xml"/>
 <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
 <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
 <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
 <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const zipBytes = exportZipStore([
    { name: '[Content_Types].xml', content: contentTypes },
    { name: '_rels/.rels', content: rootRels },
    { name: 'xl/workbook.xml', content: workbook },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRels },
    { name: 'xl/styles.xml', content: styles },
    { name: 'xl/worksheets/sheet1.xml', content: topSheet },
    { name: 'xl/worksheets/sheet2.xml', content: bottomSheet },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  exportDownloadBlob(
    new Blob([zipBytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `liquidite-comptes-geres-${date}.xlsx`
  );
};

const exportMoneyManagementPdf = (payload) => {
  if (!payload?.rows?.length) return;

  const pageWidth = 1191;
  const pageHeight = 842;
  const margin = 17;
  const titleY = pageHeight - 28;
  const pages = [];

  const topColumns = [
    { key: 'numeroCompte', label: 'N° Compte', width: 58, align: 'center' },
    { key: 'nom', label: 'Prénom & Nom', width: 145 },
    {
      key: 'valorisationTitres',
      label: 'Valorisation Titres',
      width: 95,
      type: 'money',
    },
    { key: 'profil', label: 'Profil', width: 70, align: 'center' },
    {
      key: 'dernierDepotDate',
      label: 'Dernier Dépôt',
      width: 76,
      align: 'center',
    },
    { key: 'r1', label: 'Ouverture (1)', width: 70, type: 'money' },
    { key: 'r2', label: 'Dernier dépôt (2)', width: 74, type: 'money' },
    { key: 'r3', label: 'Amortissements (3)', width: 70, type: 'money' },
    { key: 'r4', label: 'Intérêts (4)', width: 70, type: 'money' },
    { key: 'r5', label: 'Dividendes (5)', width: 65, type: 'money' },
    { key: 'r6', label: 'Retrait (6)', width: 68, type: 'money' },
    { key: 'r7', label: 'Réinvest. (7)', width: 74, type: 'money' },
    { key: 'r8', label: 'Ne pas réinvestir (8)', width: 74, type: 'money' },
    { key: 'r9', label: 'Dépôt primaire (9)', width: 74, type: 'money' },
    { key: 'r10', label: 'Total (10)', width: 75, type: 'money' },
  ];

  const bottomColumns = [
    { key: 'numeroCompte', label: 'N° Compte', width: 44, align: 'center' },
    { key: 'nom', label: 'Prénom & Nom', width: 110 },
    {
      key: 'valorisationTitres',
      label: 'Valorisation',
      width: 70,
      type: 'money',
    },
    { key: 'profil', label: 'Profil', width: 54, align: 'center' },
    {
      key: 'dernierDepotDate',
      label: 'Dernier dépôt',
      width: 58,
      align: 'center',
    },
    { key: 'r11', label: 'Retrait (11)', width: 48, type: 'money' },
    { key: 'r12', label: 'À investir (12)', width: 56, type: 'money' },
    { key: 'r13', label: 'OAT (13)', width: 46, type: 'money' },
    { key: 'r14', label: 'BAT (14)', width: 46, type: 'money' },
    { key: 'r15', label: 'OPV/APE (15)', width: 50, type: 'money' },
    { key: 'r16', label: 'Actions (16)', width: 50, type: 'money' },
    { key: 'r17', label: 'Amort. (17)', width: 51, type: 'money' },
    { key: 'r18', label: 'Intérêts (18)', width: 46, type: 'money' },
    { key: 'r19', label: 'Divid. (19)', width: 51, type: 'money' },
    { key: 'r20', label: 'Ne pas réinv. (20)', width: 54, type: 'money' },
    { key: 'r21', label: 'Disponible (21)', width: 56, type: 'money' },
    { key: 'r22', label: 'Actions % (22)', width: 48, type: 'pct' },
    { key: 'r23', label: 'Oblig. % (23)', width: 54, type: 'pct' },
    { key: 'r24', label: 'Action val. (24)', width: 58, type: 'money' },
    { key: 'r25', label: 'Oblig. val. (25)', width: 58, type: 'money' },
    { key: 'r26', label: 'Rend. (26)', width: 48, type: 'pct' },
  ];

  const fitText = (value, width, size = 6.2) => {
    const text = exportPdfAscii(value);
    const maxChars = Math.max(3, Math.floor(width / (size * 0.53)));
    return text.length <= maxChars
      ? text
      : `${text.slice(0, Math.max(1, maxChars - 1))}.`;
  };

  const formatCell = (row, column) => {
    const value = row[column.key];
    if (column.type === 'money') {
      return `${exportFormatNumber(Number(value || 0), 0)} ${row.devise || ''}`;
    }
    if (column.type === 'pct') {
      const numeric = Number(value || 0);
      return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}%`;
    }
    return String(value ?? '');
  };

  const drawTablePage = ({
    sectionTitle,
    sectionSubtitle,
    columns,
    rows,
    groups = [],
  }) => {
    const commands = [];
    const tableX = margin;
    const tableTop = pageHeight - 78;
    const groupHeight = 18;
    const headerHeight = 34;
    const rowHeight = 18;
    const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);

    commands.push(      `BT /F2 14 Tf 1 0 0 1 ${margin} ${titleY} Tm (${exportPdfEscape(
        payload.title
      )}) Tj ET`
    );
    commands.push(
      `BT /F1 8 Tf 1 0 0 1 ${margin} ${titleY - 17} Tm (${exportPdfEscape(
        `${payload.subtitle} - Situation au ${payload.dateSituation}`
      )}) Tj ET`
    );
    commands.push(
      `BT /F2 9 Tf 1 0 0 1 ${margin} ${tableTop + 13} Tm (${exportPdfEscape(
        sectionTitle
      )}) Tj ET`
    );
    if (sectionSubtitle) {
      commands.push(
        `BT /F1 6.5 Tf 0.35 0.40 0.46 rg 1 0 0 1 ${margin} ${
          tableTop + 2
        } Tm (${exportPdfEscape(sectionSubtitle)}) Tj ET`
      );
    }

    let x = tableX;
    columns.forEach((column) => {
      commands.push(
        `0.92 g ${x} ${tableTop - groupHeight - headerHeight} ${column.width} ${
          groupHeight + headerHeight
        } re f`
      );
      commands.push(
        `0.65 G 0.45 w ${x} ${tableTop - groupHeight - headerHeight} ${
          column.width
        } ${groupHeight + headerHeight} re S`
      );
      x += column.width;
    });

    groups.forEach((group) => {
      const startX =
        tableX +
        columns
          .slice(0, group.start)
          .reduce((sum, column) => sum + column.width, 0);
      const width = columns
        .slice(group.start, group.end + 1)
        .reduce((sum, column) => sum + column.width, 0);
      commands.push(
        `0.08 0.14 0.25 rg ${startX} ${
          tableTop - groupHeight
        } ${width} ${groupHeight} re f`
      );
      commands.push(
        `0.65 G 0.45 w ${startX} ${
          tableTop - groupHeight
        } ${width} ${groupHeight} re S`
      );
      const label = fitText(group.label, width - 4, 6.2);
      commands.push(
        `BT /F2 6.2 Tf 1 1 1 rg 1 0 0 1 ${startX + 3} ${
          tableTop - groupHeight + 6
        } Tm (${exportPdfEscape(label)}) Tj ET`
      );
    });

    x = tableX;
    columns.forEach((column) => {
      const label = fitText(column.label, column.width - 4, 5.4);
      commands.push(
        `BT /F2 5.4 Tf 0.08 0.10 0.15 rg 1 0 0 1 ${x + 2} ${
          tableTop - groupHeight - 19
        } Tm (${exportPdfEscape(label)}) Tj ET`
      );
      x += column.width;
    });

    let y = tableTop - groupHeight - headerHeight;
    rows.forEach((row, rowIndex) => {
      y -= rowHeight;
      if (rowIndex % 2 === 1) {
        commands.push(`0.975 g ${tableX} ${y} ${totalWidth} ${rowHeight} re f`);
      }

      let cellX = tableX;
      columns.forEach((column) => {
        commands.push(
          `0.72 G 0.35 w ${cellX} ${y} ${column.width} ${rowHeight} re S`
        );
        const raw = formatCell(row, column);
        const cellText = fitText(raw, column.width - 4, 5.6);
        const size = column.key === 'nom' ? 5.8 : 5.4;
        const estimatedWidth = cellText.length * size * 0.5;
        const textX =
          column.align === 'center'
            ? cellX + Math.max(2, (column.width - estimatedWidth) / 2)
            : column.type === 'money' || column.type === 'pct'
            ? cellX + Math.max(2, column.width - estimatedWidth - 2)
            : cellX + 2;
        commands.push(
          `BT /F1 ${size} Tf 0.08 0.10 0.15 rg 1 0 0 1 ${textX.toFixed(1)} ${(
            y + 6.2
          ).toFixed(1)} Tm (${exportPdfEscape(cellText)}) Tj ET`
        );
        cellX += column.width;
      });
    });

    commands.push(
      `BT /F1 6 Tf 0.35 0.40 0.46 rg 1 0 0 1 ${margin} 18 Tm (${exportPdfEscape(
        `Tous les clients en gestion sous mandat - ${payload.dateSituation}`
      )}) Tj ET`
    );

    pages.push(commands);
  };

  drawTablePage({
    sectionTitle: 'ORIGINE DES FONDS - RUBRIQUES 1 À 10',
    sectionSubtitle: 'Liquidité globale',
    columns: topColumns,
    rows: payload.rows,
    groups: [
      { start: 5, end: 6, label: 'Dépôt' },
      { start: 7, end: 8, label: 'ESV' },
      { start: 10, end: 11, label: 'Cession de titre' },
    ],
  });

  drawTablePage({
    sectionTitle: 'AFFECTATIONS, BLOCAGES ET CORRECTION - RUBRIQUES 11 À 26',
    sectionSubtitle:
      'Liquidité bloquée / disponible et correction écart sur profil',
    columns: bottomColumns,
    rows: payload.rows,
    groups: [
      { start: 7, end: 14, label: 'Liquidité bloquée' },
      { start: 16, end: 19, label: 'Correction écart sur profil' },
    ],
  });

  const objects = {};
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  const kids = [];
  pages.forEach((pageCommands, index) => {
    pageCommands.push(
      `BT /F1 6 Tf 1 0 0 1 ${pageWidth - 96} 18 Tm (Page ${index + 1} / ${
        pages.length
      }) Tj ET`
    );
    const contentNumber = 5 + index * 2;
    const pageNumber = contentNumber + 1;
    const stream = pageCommands.join('\n');
    objects[
      contentNumber
    ] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[
      pageNumber
    ] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNumber} 0 R >>`;
    kids.push(`${pageNumber} 0 R`);
  });

  objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${
    pages.length
  } >>`;

  const maxObjectNumber = Math.max(...Object.keys(objects).map(Number));
  let pdf = '%PDF-1.4\n';
  const offsets = new Array(maxObjectNumber + 1).fill(0);

  for (let index = 1; index <= maxObjectNumber; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= maxObjectNumber; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${
    maxObjectNumber + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const date = new Date().toISOString().slice(0, 10);
  exportDownloadBlob(
    new Blob([pdf], { type: 'application/pdf' }),
    `liquidite-comptes-geres-${date}.pdf`
  );
};


export {
  LIQUIDITY_HISTORY_MIN_DATE,
  liquidityHistorySeed,
  liquidityHistoryFactor,
  liquidityHistoricalAmount,
  exportSafeFileName,
  exportDownloadBlob,
  exportXmlEscape,
  exportFormatNumber,
  buildAnatomieExportPayload,
  exportXlsxColumnName,
  exportXlsxInlineCell,
  exportXlsxNumberCell,
  exportZipCrc32,
  exportZipPush16,
  exportZipPush32,
  exportZipStore,
  exportAnatomieExcel,
  exportPdfAscii,
  exportPdfEscape,
  exportPdfWrap,
  exportAnatomiePdf,
  buildMoneyManagementConsolidatedExportPayload,
  exportMoneyManagementExcel,
  exportMoneyManagementPdf,
};
