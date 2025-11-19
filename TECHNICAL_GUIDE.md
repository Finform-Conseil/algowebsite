# Guide Technique - Quantum Ledger Phase 1

## 🎨 Architecture des Styles

### Système de Thématisation

L'application utilise des **CSS Variables** pour la thématisation dynamique. Les variables sont définies dans `styles/abstracts/_variables.scss` :

```scss
:root {
  --background-color: #F8F9FA;
  --text-color: #212529;
  --primary-color: #00BFFF;
  // ...
}

[data-theme='dark'] {
  --background-color: #102A43;
  --text-color: #E0E0E0;
  --primary-color: #00BFFF;
  // ...
}
```

**Avantages :**
- Changement de thème instantané sans rechargement
- Persistance dans `localStorage`
- Transitions fluides entre thèmes

### Structure SCSS Modulaire

```
styles/
├── abstracts/          # Variables, mixins (pas de CSS généré)
│   └── _variables.scss
├── base/              # Reset, typographie de base
│   └── _reset.scss
├── layout/            # Grille, conteneurs
│   └── _container.scss
├── components/        # Styles des composants
│   ├── _button.scss
│   ├── _card.scss
│   ├── _grid.scss
│   ├── _table.scss
│   └── _theme-switcher.scss
└── globals.scss       # Point d'entrée principal
```

**Convention de nommage BEM (Block Element Modifier) :**
```scss
.card                      // Block
.card__header             // Element
.card--stat               // Modifier
.card__title--large       // Element + Modifier
```

## 📊 Modèle de Données

### Hiérarchie des Entités

```
Portfolio
  ├── id: string
  ├── name: string
  ├── totalValue: number
  ├── performance: number
  └── transactions: PortfolioTransaction[]
         ├── id: string
         ├── assetId: string (référence à Asset)
         ├── type: 'BUY' | 'SELL'
         ├── date: string
         ├── quantity: number
         └── price: number

Asset
  ├── id: string
  ├── ticker: string
  ├── name: string
  ├── type: 'Equity' | 'Fixed Income' | 'OPCVM'
  ├── currentPrice: number
  ├── dailyChange: number
  └── dailyChangePercent: number
```

### Calcul des Holdings

La fonction `calculatePortfolioHoldings()` dans `Portfolio.ts` agrège les transactions pour calculer :
- **Quantité détenue** : Somme des BUY - Somme des SELL
- **PRU (Prix de Revient Unitaire)** : Coût total / Quantité
- **Valeur actuelle** : Quantité × Prix actuel
- **Plus/Moins-value** : Valeur actuelle - Coût total

**Algorithme :**
```typescript
// Pour chaque transaction du portefeuille
transactions.forEach(tx => {
  if (tx.type === 'BUY') {
    quantity += tx.quantity
    totalCost += tx.quantity * tx.price
  } else {
    // Pour SELL, on déduit au PRU moyen
    avgPrice = totalCost / quantity
    quantity -= tx.quantity
    totalCost -= tx.quantity * avgPrice
  }
})
```

## 🧩 Composants React

### ThemeSwitcher (Client Component)

**Fonctionnalités :**
- Toggle entre thèmes clair/sombre
- Persistance avec `localStorage`
- Animation de rotation au survol (180°)
- Icônes SVG inline (soleil/lune)

**Hooks utilisés :**
- `useState` : État du thème
- `useEffect` : Initialisation et hydratation

**Hydratation SSR :**
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true); // Évite le mismatch SSR/Client
}, []);

if (!mounted) return null;
```

### StatCard

**Props :**
```typescript
{
  label: string;
  value: string | number;
  change?: number;          // Changement en €
  changePercent?: number;   // Changement en %
  icon?: React.ReactNode;
}
```

**Variantes :**
- `.card--stat` : Carte centrée pour statistiques
- `.stat-value--positive` : Valeur positive (vert)
- `.stat-value--negative` : Valeur négative (rouge)

### PerformanceTable

**Tri et filtrage :**
```typescript
// Top performers
const topPerformers = [...assets].sort((a, b) => 
  b.dailyChangePercent - a.dailyChangePercent
).slice(0, 5);

// Flop performers
const flopPerformers = sortedByPerformance.slice(-5).reverse();
```

### NewsCard

**Catégories et couleurs :**
| Catégorie | Badge Color | Couleur |
|-----------|-------------|---------|
| market    | Cyan        | `#00BFFF` |
| tech      | Violet      | `#8A2BE2` |
| economy   | Orange      | `#FFA000` |
| company   | Vert        | `var(--positive-color)` |

## 🛣️ Routing Next.js

### App Router (Next.js 13+)

```
app/
├── layout.tsx                # Layout racine
├── page.tsx                  # Dashboard (/)
└── portfolio/
    └── [id]/
        └── page.tsx          # Détails (/portfolio/[id])
```

**Dynamic Routes :**
```typescript
// Dans portfolio/[id]/page.tsx
const params = useParams();
const portfolioId = params.id as string;
```

**Navigation :**
```typescript
import Link from 'next/link';

<Link href={`/portfolio/${portfolio.id}`}>
  {/* Contenu cliquable */}
</Link>
```

## 🎭 Animations CSS

### Keyframes Définies

**fadeIn :** Apparition en fondu
```scss
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**slideUp :** Glissement vers le haut
```scss
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Usage :**
```tsx
<div className="card fade-in">...</div>
<div className="card slide-up">...</div>
```

### Transitions

Toutes les transitions utilisent les variables SCSS :
```scss
$transition-fast: 0.2s ease-in-out;
$transition-medium: 0.3s ease-in-out;
$transition-slow: 0.5s ease-in-out;
```

## 📱 Responsive Design

### Breakpoints

| Variable | Valeur | Usage |
|----------|--------|-------|
| `$breakpoint-xs` | 480px | Très petits écrans |
| `$breakpoint-sm` | 576px | Téléphones paysage |
| `$breakpoint-md` | 768px | Tablettes |
| `$breakpoint-lg` | 992px | Desktops |
| `$breakpoint-xl` | 1200px | Grands écrans |

### Grid System Bootstrap 5

**Classes disponibles :**
- `.col-{n}` : Colonnes fixes (1-12)
- `.col-{breakpoint}-{n}` : Colonnes responsives
- `.g-{n}` : Gutter spacing (0-5)

**Exemple :**
```tsx
<div className="row g-4">
  <div className="col-12 col-md-6 col-lg-4">
    {/* Contenu */}
  </div>
</div>
```

## 🔧 Configuration TypeScript

### Strict Mode Activé

```json
{
  "compilerOptions": {
    "strict": true,
    // ...
  }
}
```

**Implications :**
- Tous les types doivent être explicites
- `null` et `undefined` sont distincts
- Les paramètres optionnels sont typés `| undefined`

### Path Aliases

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**Usage :**
```typescript

```

## 🚀 Optimisations Next.js

### Client Components

Marqués avec `'use client'` en haut du fichier :
- `ThemeSwitcher` : Utilise `localStorage`
- `page.tsx` (Dashboard) : Calculs côté client
- `[id]/page.tsx` : Récupération de paramètres dynamiques

### Server Components (par défaut)

- Layout
- Composants stateless (StatCard, NewsCard, etc.)

## 📦 Scripts NPM

```bash
# Développement (hot reload)
npm run dev

# Build de production
npm run build

# Serveur de production
npm start

# Linting ESLint
npm run lint
```

## 🎯 Prochaines Étapes (Phase 2)

### 1. Redux Toolkit
```typescript
// store/slices/portfolioSlice.ts
const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    addTransaction: (state, action) => { /* ... */ },
    deleteTransaction: (state, action) => { /* ... */ },
  },
});
```

### 2. Architecture Hexagonale

```
src/
├── domain/              # Logique métier pure
│   ├── entities/
│   └── use-cases/
├── application/         # Orchestration
│   └── services/
├── infrastructure/      # Implémentations techniques
│   ├── api/
│   └── storage/
└── presentation/        # UI (composants React)
```

### 3. API Backend

- Authentification JWT
- Endpoints RESTful
- WebSocket pour prix temps réel
- Base de données (PostgreSQL)

### 4. Graphiques Interactifs

```typescript
import { Line, Pie } from 'react-chartjs-2';

// Courbe de performance dans le temps
<Line data={performanceData} />

// Répartition des actifs
<Pie data={allocationData} />
```

---

**Dernière mise à jour :** Phase 1 - L'Aube Visuelle ✨
