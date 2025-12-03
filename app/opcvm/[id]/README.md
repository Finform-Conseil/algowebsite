# Page Détail OPCVM

## Installation des dépendances

Pour que la carte Leaflet fonctionne, vous devez installer les packages suivants :

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

## Ajout du CSS Leaflet

Ajoutez le CSS de Leaflet dans votre fichier `app/layout.tsx` ou `app/globals.css` :

```tsx
// Dans app/layout.tsx, ajoutez dans le head :
import 'leaflet/dist/leaflet.css';
```

Ou dans `globals.css` :

```css
@import 'leaflet/dist/leaflet.css';
```

## Fix des icônes Leaflet

Les icônes par défaut de Leaflet peuvent ne pas s'afficher correctement avec Next.js. Ajoutez ce code dans votre composant :

```tsx
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});
```

Et copiez les images dans `public/leaflet/`.

## Structure de la page

La page est organisée en 100vh avec :

### Header
- Badges (Bourse, Catégorie)
- Nom du fonds
- Métadonnées (ISIN, Société de gestion)
- VL actuelle avec variation
- Notation étoiles

### Contenu Principal (Grid 2 colonnes)

#### Colonne Gauche
1. **Graphique VL** : IndependentChartView avec sélecteur de période
2. **Performances** : Grid 3x2 avec performances sur différentes périodes

#### Colonne Droite
1. **Informations Clés** : VL, Catégorie, Nature juridique, Société de gestion, Actif net, Affectation des résultats, Date de création, ISIN
2. **Indicateurs de Risque** : Volatilité (avec barre), Ratio de Sharpe
3. **Localisation** : Carte Leaflet avec marqueur

## Responsive

- **Desktop (>1024px)** : Layout 2 colonnes
- **Tablet (768-1024px)** : Layout 1 colonne, performances en 2 colonnes
- **Mobile (<768px)** : Layout 1 colonne, performances en 1 colonne

## Données Mock

Les données sont actuellement en mock. Pour connecter à une API :

```tsx
// Remplacer le mock par :
const { data: opcvmData, isLoading } = useQuery({
  queryKey: ['opcvm', id],
  queryFn: () => fetchOPCVMById(id)
});
```
