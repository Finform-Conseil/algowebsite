export interface AvisFees {
  tauxComSgi?: number;
  tauxIrvm?: number;
  tauxTaf?: number;
  tauxFraisChange?: number;
  montantFraisChange?: number;
}

export interface AvisOperation {
  id: string;
  client: string;
  titre: string;
  sens: string;
  qte: number;
  prix: number;
  marche: string;
  devise: string;
  date: string;
  frais: AvisFees;
}

export interface AvisCalculation {
  montantBrut: number;
  comSgi: number;
  irvm: number;
  taf: number;
  fraisChange: number;
  totalFrais: number;
  montantDebite: number;
  montantCredite: number;
}

export const AVIS_OPERATIONS: AvisOperation[] = [
  { id: 'AV-9001', client: 'Fonds Prévoyance CI', titre: 'SONATEL', sens: 'Achat', qte: 500, prix: 14200, marche: 'BRVM', devise: 'XOF', date: '22/07/2026', frais: { tauxComSgi: 0.008, tauxIrvm: 0, tauxTaf: 0.18, tauxFraisChange: 0 } },
  { id: 'AV-9002', client: 'Aïcha Koné', titre: 'ECOBANK CI', sens: 'Vente', qte: 1200, prix: 6650, marche: 'BRVM', devise: 'XOF', date: '22/07/2026', frais: { tauxComSgi: 0.008, tauxIrvm: 0, tauxTaf: 0.18, tauxFraisChange: 0 } },
  { id: 'AV-9003', client: 'Ama Boateng', titre: 'GCB BANK', sens: 'Vente', qte: 800, prix: 5.4, marche: 'GSE', devise: 'GHS', date: '21/07/2026', frais: { tauxComSgi: 0.007, tauxIrvm: 0, tauxTaf: 0.15, tauxFraisChange: 0.004 } },
  { id: 'AV-9004', client: 'Groupe Assurance Sahel', titre: 'Obligation Trésor CI 6.5% 2029', sens: 'Achat', qte: 200, prix: 10050, marche: 'BRVM', devise: 'XOF', date: '20/07/2026', frais: { tauxComSgi: 0.005, tauxIrvm: 0, tauxTaf: 0.18, tauxFraisChange: 0 } },
];

export const parseAvisDate = (value: string): Date => {
  const [day, month, year] = String(value).split('/').map(Number);
  return new Date(year, month - 1, day);
};

export const arrondirMontantAvis = (montant: number, devise: string): number =>
  devise === 'XOF' ? Math.round(montant) : Math.round((montant + Number.EPSILON) * 100) / 100;

export const calculerAvis = (avis: AvisOperation): AvisCalculation => {
  const montantBrut = arrondirMontantAvis(avis.qte * avis.prix, avis.devise);
  const comSgi = arrondirMontantAvis(montantBrut * (avis.frais?.tauxComSgi || 0), avis.devise);
  const irvm = arrondirMontantAvis(montantBrut * (avis.frais?.tauxIrvm || 0), avis.devise);
  const taf = arrondirMontantAvis(comSgi * (avis.frais?.tauxTaf || 0), avis.devise);
  const fraisChange = arrondirMontantAvis(
    avis.frais?.montantFraisChange ?? montantBrut * (avis.frais?.tauxFraisChange || 0),
    avis.devise
  );
  const totalFrais = arrondirMontantAvis(comSgi + irvm + taf + fraisChange, avis.devise);
  return {
    montantBrut, comSgi, irvm, taf, fraisChange, totalFrais,
    montantDebite: avis.sens === 'Achat' ? arrondirMontantAvis(montantBrut + totalFrais, avis.devise) : 0,
    montantCredite: avis.sens === 'Vente' ? arrondirMontantAvis(Math.max(0, montantBrut - totalFrais), avis.devise) : 0,
  };
};
