# Page OPCVM - S'instruire

## Vue d'ensemble
Page éducative interactive pour comprendre les fonds d'investissement (OPCVM et FIA).

## Structure de la page

### 1. **Header**
- Titre principal : "Comprendre les Fonds : Guide Essentiel pour Investisseurs"
- Badges informatifs (durée, niveau, nombre d'apprenants)
- Illustrations animées des différents types de fonds

### 2. **Navigation par sections**
Navigation sticky avec 5 sections principales :
- **Introduction** : Définition des fonds d'investissement
- **OPC** : Organismes de Placement Collectif
- **OPCVM** : OPCVM en détail (types, gestion, stratégies, risques)
- **FIA** : Fonds d'Investissement Alternatifs
- **Quiz** : Quiz interactif pour tester les connaissances

### 3. **Sections de contenu**

#### Introduction
- Définition d'un fonds d'investissement
- Distinction marché coté vs non coté
- 4 avantages clés (diversification, gestion pro, accessibilité, liquidité)

#### OPC
- Définition et fonctionnement
- Workflow en 3 étapes
- Classification AMF : OPCVM vs FIA

#### OPCVM (Section la plus détaillée)
Avec 5 onglets :
1. **Types d'OPCVM** : 5 types de fonds (Monétaires, Obligataires, Actions, Mixtes, Immobiliers)
2. **Styles de gestion** : Passive vs Active
3. **Stratégies** : Allocation d'actifs, DCA, stratégies thématiques
4. **Risques** : 9 types de risques détaillés
5. **Comment choisir** : Guide en 5 étapes + analyse des frais

#### FIA
- Définition et différences avec OPCVM
- Comparaison visuelle OPCVM vs FIA
- 3 caractéristiques distinctives
- 3 types principaux (Immobilier, Hedge Funds, Private Equity)

#### Quiz
- 6 questions à choix multiples
- Feedback immédiat avec explications
- Score final avec message personnalisé
- Possibilité de recommencer

### 4. **Éléments interactifs**

#### Barre de progression
- Indicateur circulaire flottant (bottom-right)
- Affiche le pourcentage de complétion

#### Points clés flottants
- Widget flottant (bottom-left)
- Résumé des points essentiels de chaque section
- Extensible/rétractable

#### Animations
- Fade-in sur les sections
- Float animation sur les cartes d'illustration
- Hover effects sur tous les éléments interactifs
- Transitions fluides entre les onglets

## Composants créés

### Pages
- `/app/opcvm/learn/page.tsx` - Page principale

### Composants
- `LearnHeader.tsx` - En-tête avec stats et illustrations
- `IntroductionSection.tsx` - Section d'introduction
- `OPCSection.tsx` - Section OPC
- `OPCVMSection.tsx` - Section OPCVM détaillée avec onglets
- `FIASection.tsx` - Section FIA
- `InteractiveQuiz.tsx` - Quiz interactif
- `KeyTakeaways.tsx` - Points clés flottants

### Styles
- `_opcvm-learn.scss` - Styles principaux de la page
- `_opcvm-learn-components.scss` - Styles des sections OPC et OPCVM
- `_opcvm-learn-quiz.scss` - Styles FIA, Quiz et KeyTakeaways

## Design et UX

### Palette de couleurs
- **Primary** : Bleu (#3b82f6) - OPCVM, éléments principaux
- **Purple** : Violet (#8b5cf6) - FIA, éléments alternatifs
- **Green** : Vert (#10b981) - Success, validation
- **Orange** : Orange (#f59e0b) - Warnings, alertes
- **Gradients** : Utilisés pour les headers et boutons

### Typographie
- Titres : Bold, hiérarchie claire
- Corps de texte : Line-height 1.6-1.8 pour lisibilité
- Badges et tags : Font-weight 600

### Espacement
- Sections : 2-3rem de marge
- Cards : Padding 2rem
- Grids : Gap 1.5-2rem

### Responsive
- Desktop : Grids multi-colonnes
- Tablet : Grids 2 colonnes
- Mobile : Grids 1 colonne, navigation adaptée

## Fonctionnalités clés

1. **Navigation progressive** : L'utilisateur avance section par section
2. **Tracking de progression** : Indicateur visuel du parcours
3. **Contenu structuré** : Information hiérarchisée et digestible
4. **Interactivité** : Quiz, hover effects, animations
5. **Accessibilité** : Contraste, tailles de police, navigation au clavier

## Prochaines améliorations possibles

- [ ] Ajouter des vidéos explicatives
- [ ] Intégrer des graphiques interactifs
- [ ] Sauvegarder la progression de l'utilisateur
- [ ] Ajouter un certificat de complétion
- [ ] Créer des exercices pratiques
- [ ] Ajouter des études de cas réels
