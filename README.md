# Quantum Ledger - Phase 1

Application de gestion de portefeuille d'investissement moderne et élégante.

## 🎨 Caractéristiques

- **Design Moderne** : Interface épurée avec thématisation claire/sombre
- **Next.js 15** : Framework React avec App Router
- **TypeScript Strict** : Typage fort pour une meilleure maintenabilité
- **Architecture SCSS** : Styles modulaires avec variables CSS pour la thématisation
- **Données Simulées** : Jeu complet de données factices pour la démonstration

## 🚀 Démarrage Rapide

### Installation des dépendances

```bash
npm install
```

### Lancement du serveur de développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📂 Structure du Projet

```
├── app/                      # Pages Next.js (App Router)
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Dashboard (L'Observatoire)
│   └── portfolio/[id]/      # Détails d'un portefeuille (Le Creuset)
├── components/              # Composants React réutilisables
│   ├── ThemeSwitcher.tsx   # Switcher de thème clair/sombre
│   ├── StatCard.tsx        # Carte de statistique
│   ├── NewsCard.tsx        # Carte d'actualité
│   └── PerformanceTable.tsx # Tableau de performance
├── core/data/              # Interfaces TypeScript & données factices
│   ├── Asset.ts            # Interface et données des actifs
│   ├── Portfolio.ts        # Interface et données des portefeuilles
│   ├── PortfolioTransaction.ts # Interface et données des transactions
│   └── News.ts             # Interface et données des actualités
├── styles/                 # Styles SCSS modulaires
│   ├── abstracts/          # Variables, mixins, fonctions
│   ├── base/               # Reset, typographie
│   ├── components/         # Styles des composants
│   ├── layout/             # Conteneurs, grilles
│   └── globals.scss        # Point d'entrée des styles
└── package.json

```

## 🎨 Thématisation

L'application supporte deux thèmes :

- **Thème Sombre (par défaut)** : Fond `#102A43` (bleu nuit), accent cyan `#00BFFF`
- **Thème Clair** : Fond blanc cassé, texte gris foncé, même accent cyan

Le thème est persisté dans le `localStorage` et peut être changé via le bouton en haut à droite.

## 📊 Pages

### L'Observatoire (Dashboard)
- Vue d'ensemble de tous les portefeuilles
- Valeur totale du patrimoine
- Top 5 et Flop 5 performers du jour
- Répartition des actifs par type
- Actualités financières

### Le Creuset (Portfolio Detail)
- Détail d'un portefeuille spécifique
- Tableau des positions avec PRU et plus/moins-values
- Historique complet des transactions
- Statistiques du portefeuille

## 🛠️ Technologies

- **Next.js 15** - Framework React
- **TypeScript** - Typage statique
- **SCSS** - Préprocesseur CSS
- **CSS Variables** - Thématisation dynamique

## 📝 Prochaines Étapes (Phase 2)

- Intégration de Redux Toolkit pour la gestion d'état
- Architecture hexagonale/Clean Architecture
- Backend API
- Authentification utilisateur
- Graphiques interactifs avec Chart.js
- Export de données (PDF, CSV)

## 👨‍💻 Développement

```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start

# Lint
npm run lint
```

---

**Quantum Ledger** - Phase 1 : L'Aube Visuelle ✨
