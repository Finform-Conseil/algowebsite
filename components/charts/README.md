# Charts Components

Collection de composants de graphiques réutilisables basés sur ECharts.

## TreemapChart

Composant de carte arborescente (treemap) avec gradient mapping pour visualiser des données hiérarchiques avec des variations de performance.

### Props

```typescript
interface TreemapChartProps {
  data: TreemapNode[];              // Données hiérarchiques
  title?: string;                   // Titre du graphique
  subtitle?: string;                // Sous-titre
  height?: string;                  // Hauteur (défaut: '400px')
  visualMin?: number;               // Valeur min pour le gradient (défaut: -100)
  visualMax?: number;               // Valeur max pour le gradient (défaut: 100)
  visualMinBound?: number;          // Borne min pour le mapping (défaut: -40)
  visualMaxBound?: number;          // Borne max pour le mapping (défaut: 40)
  positiveColor?: string;           // Couleur pour valeurs positives (défaut: '#10b981')
  negativeColor?: string;           // Couleur pour valeurs négatives (défaut: '#ef4444')
  neutralColor?: string;            // Couleur pour valeurs neutres (défaut: '#6b7280')
  tooltipFormatter?: (info: any) => string; // Formateur personnalisé pour tooltip
}

interface TreemapNode {
  name: string;                     // Nom du nœud
  value: number[];                  // [valeur actuelle, valeur précédente, changement %]
  children?: TreemapNode[];         // Nœuds enfants (optionnel)
}
```

### Structure des données

Les données doivent suivre cette structure :

```typescript
const data: TreemapNode[] = [
  {
    name: 'Secteur Parent',
    value: [125000000, 120000000, 4.2], // [current, previous, change%]
    children: [
      { name: 'Entreprise 1', value: [45000000, 42000000, 7.1] },
      { name: 'Entreprise 2', value: [38000000, 36000000, 5.6] },
      { name: 'Entreprise 3', value: [25000000, 26000000, -3.8] },
    ],
  },
  // ... autres secteurs
];
```

### Exemple d'utilisation

```tsx
import TreemapChart, { TreemapNode } from '@/components/charts/TreemapChart';

function MyComponent() {
  const sectorData: TreemapNode[] = [
    {
      name: 'Banking & Finance',
      value: [125000000, 120000000, 4.2],
      children: [
        { name: 'Ecobank', value: [45000000, 42000000, 7.1] },
        { name: 'Standard Bank', value: [38000000, 36000000, 5.6] },
      ],
    },
    {
      name: 'Telecommunications',
      value: [89000000, 85000000, 4.7],
      children: [
        { name: 'MTN Group', value: [42000000, 40000000, 5.0] },
        { name: 'Safaricom', value: [32000000, 30000000, 6.7] },
      ],
    },
  ];

  return (
    <TreemapChart
      data={sectorData}
      title="Market Sectors Performance"
      subtitle="Green: Positive | Red: Negative | Grey: Neutral"
      height="500px"
    />
  );
}
```

### Personnalisation du tooltip

```tsx
const customTooltip = (info: any) => {
  const value = info.value;
  return `
    <div style="font-weight: 600;">${info.name}</div>
    <div>Market Cap: ${value[0].toLocaleString()}</div>
    <div>Change: ${value[2].toFixed(2)}%</div>
  `;
};

<TreemapChart
  data={sectorData}
  tooltipFormatter={customTooltip}
/>
```

### Couleurs personnalisées

```tsx
<TreemapChart
  data={sectorData}
  positiveColor="#00ff00"
  negativeColor="#ff0000"
  neutralColor="#808080"
/>
```

### Fonctionnalités

- **Gradient Mapping** : Les couleurs sont automatiquement mappées selon les valeurs de changement
  - Vert : Croissance positive
  - Rouge : Croissance négative
  - Gris : Pas de changement (0%)

- **Hiérarchie** : Support de plusieurs niveaux de données (secteurs → entreprises)

- **Responsive** : S'adapte automatiquement à la taille du conteneur

- **Interactif** : Hover effects et tooltips informatifs

- **Thème adaptatif** : Utilise les variables CSS pour s'adapter au thème light/dark

### Notes techniques

- Le composant utilise `echarts.number.linearMap` pour mapper les valeurs de changement sur l'échelle de gradient
- Les valeurs sont normalisées entre `visualMin` et `visualMax` pour un rendu optimal
- Le composant mémorise les données traitées avec `useMemo` pour optimiser les performances
