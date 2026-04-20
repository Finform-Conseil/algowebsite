# 🚀 Guide d'Intégration du Module TechnicalAnalysis (TENOR HDR 2026)

Ce document répertorie **l'intégralité des dépendances, composants partagés et configurations** nécessaires pour exporter et faire fonctionner le module `TechnicalAnalysis` (actuellement dans Algoway Front) dans un projet Next.js totalement vierge ou externe.

---

## 1. 📦 Dépendances NPM Obligatoires (package.json)
Le module repose sur une stack hautement spécialisée pour le rendu financier et l'UI dynamique. Assurez-vous d'installer ces librairies :

```bash
npm install echarts echarts-for-react
npm install framer-motion # Pour les Modals et Sidebars (remplacement de GSAP)
npm install @reduxjs/toolkit react-redux
npm install bootstrap bootstrap-icons
npm install clsx classnames # Manipulation de style modulaire
npm install lucide-react # Quelques icônes additionnelles
npm install uuid # Génération d'ID pour les tracés géométriques
```

---

## 2. 📂 Fichiers et Dossiers à Copier
Outre le dossier racine complet du module, ce composant dépend d'un certain nombre d'utilitaires et de composants UI "partagés" dans l'architecture Clean d'Algoway.

### Le Coeur du Module (À copier tel quel)
- `src/core/presentation/components/pages/Widget/TechnicalAnalysis/` **(En entier)**

### Composants Partagés & Externes (Dépendances physiques)
Vous devrez copier ou recâbler ces fichiers depuis Algoway vers le nouveau projet :
- **Design System** :
  - `src/core/presentation/components/design-system/commons/CommonPageHeader`
  - `src/core/presentation/components/design-system/commons/CommonTickerPanel` (Absolument vital pour l'en-tête de cotation)
- **Données et Utils Partagés** :
  - `src/shared/data/brvm-securities.ts` (Liste des actifs pour la barre de recherche / SearchModal)
  - `src/shared/utils/volatility-engine.ts` (Fonctions mathématiques utilisées dans le Sidebar)
  - `src/shared/utils/fetchWithRetry.ts` (Résilence réseau, le cas échéant)
- **Contextes** :
  - `src/core/presentation/components/design-system/layouts/Home/HeaderHome/context/GlobalNotificationContext.tsx`
  - *Note : Si vous ne voulez pas copier ce contexte global, commentez simplement `useGlobalNotification` dans `TechnicalAnalysis.tsx`.*

---

## 3. 🧠 Configuration du Redux Store
Le coeur névralgique de ce widget est géré par Redux (dessins, indicateurs, mode zen, alertes). 
Il est **obligatoire** de déclarer son Slice dans le `store.ts` du nouveau projet.

**Dans le `store.ts` du nouveau projet :**
```typescript
import { configureStore } from '@reduxjs/toolkit';
// Importer le slice depuis le dossier copié
import technicalAnalysisReducer from './TechnicalAnalysis/store/technicalAnalysisSlice';

export const store = configureStore({
  reducer: {
    // La clé technique doit correspondre !
    technicalAnalysis: technicalAnalysisReducer, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 4. 🎨 Variables CSS et Thème Zéro-Régression
Le module s'attend à trouver des variables CSS globales (Premium Dark Algoway) rootées dans votre fichier `globals.css` ou `layout.tsx`. Sans cela, la toolbar et le canvas seront brisés ou invisibles.

**À injecter dans vos styles globaux :**
```css
:root {
  /* Arrière-plans globaux */
  --gp-bg-toolbar: rgba(16, 42, 67, 0.95); /* Bleu nuit FINFORM */
  --gp-bg-panel: #0B111D;
  --gp-border-color: rgba(255, 255, 255, 0.1);
  
  /* Typographie & HUD */
  --gp-text-primary: #ffffff;
  --gp-text-secondary: #8c9bad;
  --gp-text-muted: #5e6d82;

  /* Formes ECharts (Hover & Draw) */
  --gp-primary-accent: #2962ff;
  --bs-border-radius: 0.375rem;
}

/* Nécessaire pour la grille responsive HDR 2026 */
body {
  background-color: var(--gp-bg-panel);
  color: var(--gp-text-primary);
}
```

---

## 5. 🔌 Injection des Données (Le Pipeline ECharts)
C'est la partie la plus importante. Dans `algoway-front`, le module récupère ses données (Candles) via un flux temps réel. 
Dans le nouveau projet, si vous n'avez pas de backend "BRVM-Intraday", vous devrez modifier le Hook `useEChartsRenderer.ts` (ou le composant parent) pour **injecter manuellement des données statiques/mocks**.

*Où chercher :*
Regardez le fichier `src/.../hooks/useEChartsRenderer.ts`. C'est lui qui alimente le `option.series[0].data` (le graphique K-Line / Bougies japonaises). Vous devez vous assurer que le format attendu est respecté :
```typescript
// Format ECharts requis pour chaque bougie
[
  date,   // Timestamp Unix ou String ISO
  open,   // Ouverture
  close,  // Fermeture
  low,    // Plus bas
  high    // Plus haut
]
```

---

## ✅ Checklist Finale d'Intégration
- [ ] Les packages NPM sont installés.
- [ ] Le dossier `TechnicalAnalysis` entier est copié dans le nouveau composant.
- [ ] Les dépendances transverses (TickerPanel, Données Brvm) sont recopiées et les imports mis à jour (e.g. `@/shared/data/...`).
- [ ] Le Reducer `technicalAnalysisSlice` est branché au Store global.
- [ ] Le Provider de notification global est soit enveloppé au dessus du widget, soit supprimé de l'arbre.
- [ ] Les Variables CSS de thème sombre sont posées.
- [ ] Les icônes Bootstrap (`import 'bootstrap-icons/font/bootstrap-icons.css'`) sont bien chargées dans `layout.tsx`.

> **Protocole TENOR 2026** : Ce module a été bâti avec des media queries ultra-rigoureuses. Veillez à ne jamais envelopper globalement le Ticker ou la Toolbar dans un `<div className="container-fluid">` rigide avec un `display: grid !important` qui forcerait une largeur native. Respectez la hiérarchie CSS locale du module.
