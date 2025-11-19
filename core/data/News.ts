// ============================================
// QUANTUM LEDGER - News Interface & Data
// ============================================

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'market' | 'tech' | 'economy' | 'company';
}

// ============================================
// Données Factices - Actualités
// ============================================

export const DUMMY_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Les marchés américains atteignent de nouveaux sommets',
    summary: 'Le S&P 500 et le Nasdaq établissent de nouveaux records historiques portés par le secteur technologique et des résultats d\'entreprises meilleurs que prévu.',
    date: '2024-11-05',
    category: 'market',
  },
  {
    id: 'news-2',
    title: 'NVIDIA annonce une nouvelle génération de puces IA',
    summary: 'Le géant des semi-conducteurs dévoile sa nouvelle architecture qui promet des performances 40% supérieures pour l\'intelligence artificielle.',
    date: '2024-11-04',
    category: 'tech',
  },
  {
    id: 'news-3',
    title: 'La BCE maintient ses taux directeurs inchangés',
    summary: 'La Banque Centrale Européenne décide de maintenir sa politique monétaire actuelle face à une inflation en baisse progressive.',
    date: '2024-11-03',
    category: 'economy',
  },
  {
    id: 'news-4',
    title: 'Apple présente de solides résultats trimestriels',
    summary: 'Les revenus d\'Apple dépassent les attentes des analystes grâce à des ventes record d\'iPhone et à la croissance des services.',
    date: '2024-11-02',
    category: 'company',
  },
  {
    id: 'news-5',
    title: 'Transition énergétique : les investissements atteignent $500 milliards',
    summary: 'Les investissements mondiaux dans les énergies renouvelables continuent leur progression exponentielle, attirant les grands fonds d\'investissement.',
    date: '2024-11-01',
    category: 'economy',
  },
  {
    id: 'news-6',
    title: 'Tesla révise ses objectifs de production à la hausse',
    summary: 'Le constructeur automobile annonce une augmentation de 30% de ses capacités de production pour répondre à la demande croissante.',
    date: '2024-10-31',
    category: 'company',
  },
];
