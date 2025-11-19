# Design System - Quantum Ledger

## 🎨 Palette de Couleurs

### Thème Sombre (par défaut)
```
Fond principal      : #102A43  (Bleu nuit profond)
Fond carte          : #1A3E5C  (Bleu nuit moyen)
Bordures            : #345A7D  (Bleu-gris)
Texte principal     : #E0E0E0  (Gris très clair)
Texte secondaire    : #ADB5BD  (Gris moyen)
Hover background    : #234663  (Bleu nuit clair)
```

### Thème Clair
```
Fond principal      : #F8F9FA  (Blanc cassé)
Fond carte          : #FFFFFF  (Blanc pur)
Bordures            : #DEE2E6  (Gris très clair)
Texte principal     : #212529  (Gris très foncé)
Texte secondaire    : #6C757D  (Gris moyen)
Hover background    : #E9ECEF  (Gris ultra-clair)
```

### Couleurs d'Accentuation (identiques pour les deux thèmes)
```
Primaire (Cyan)     : #00BFFF  ⚡ Couleur signature
Positif             : #20C997  (Dark) / #28A745 (Light)
Négatif             : #F86C6B  (Dark) / #DC3545 (Light)
```

### Couleurs Sémantiques

**Badges de Type d'Actif :**
```scss
Equity              : rgba(0, 191, 255, 0.15) bg + #00BFFF text
Fixed Income        : rgba(40, 167, 69, 0.15) bg + var(--positive-color) text
OPCVM               : rgba(255, 193, 7, 0.15) bg + #FFA000 text
```

**Badges de Catégorie (Actualités) :**
```scss
Market              : rgba(0, 191, 255, 0.15) bg + #00BFFF text
Tech                : rgba(138, 43, 226, 0.15) bg + #8A2BE2 text (Violet)
Economy             : rgba(255, 193, 7, 0.15) bg + #FFA000 text (Orange)
Company             : rgba(40, 167, 69, 0.15) bg + var(--positive-color) text
```

## 📏 Typographie

### Police de Caractères
```scss
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Rationale :** System fonts pour des performances optimales et une apparence native.

### Hiérarchie des Titres

```
H1 : 2.5rem (40px) - Poids 700 - Titres de pages
H2 : 2rem (32px)   - Poids 600 - Titres de sections
H3 : 1.5rem (24px) - Poids 600 - Sous-titres
H4 : 1.25rem (20px)- Poids 600 - Titres de cartes
```

**Mobile (< 768px) :**
```
H1 : 2rem (32px)
H2 : 1.75rem (28px)
```

### Tailles de Police par Contexte

| Élément | Taille | Usage |
|---------|--------|-------|
| Body    | 1rem (16px) | Texte standard |
| Small   | 0.875rem (14px) | Métadonnées, labels |
| Tiny    | 0.75rem (12px) | Badges, timestamps |
| Large   | 1.125rem (18px) | Sous-titres importants |
| Stat Value | 2.5rem (40px) | Valeurs statistiques |

### Font Weights

```
Regular : 400
Medium  : 500 - Boutons, labels importants
Semibold: 600 - Titres, sous-titres
Bold    : 700 - Titres principaux, valeurs clés
```

## 🔲 Espacements

### Échelle d'Espacement
```scss
$spacing-xs  : 0.5rem  (8px)
$spacing-sm  : 1rem    (16px)
$spacing-md  : 1.5rem  (24px)
$spacing-lg  : 2rem    (32px)
$spacing-xl  : 3rem    (48px)
$spacing-xxl : 4rem    (64px)
```

### Classes Utilitaires

**Marges :**
```scss
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }
.mt-5 { margin-top: 3rem; }
```

**Padding :**
```scss
.p-1 { padding: 0.5rem; }
.p-2 { padding: 1rem; }
// etc.
```

## 🎭 Border Radius

```scss
$border-radius-sm : 0.375rem (6px)  - Badges, petits éléments
$border-radius-md : 0.5rem (8px)    - Boutons standard
$border-radius-lg : 0.75rem (12px)  - Cartes
$border-radius-xl : 1rem (16px)     - Conteneurs larges
```

## 🌊 Ombres

### Profondeurs

**Niveau 1 (Cartes) :**
```scss
box-shadow: 0 2px 8px var(--shadow);
// shadow = rgba(0, 0, 0, 0.1) en mode clair
// shadow = rgba(0, 0, 0, 0.3) en mode sombre
```

**Niveau 2 (Hover) :**
```scss
box-shadow: 0 4px 16px var(--shadow);
```

**Niveau 3 (Modales, éléments flottants) :**
```scss
box-shadow: 0 8px 32px var(--shadow);
```

**Bouton Primaire (hover) :**
```scss
box-shadow: 0 4px 12px rgba(0, 191, 255, 0.3);
```

## ⚡ Animations & Transitions

### Durées Standard

```scss
$transition-fast   : 0.2s ease-in-out  // Hover simple
$transition-medium : 0.3s ease-in-out  // Changements d'état
$transition-slow   : 0.5s ease-in-out  // Animations complexes
```

### Courbes de Bézier

```scss
ease-in-out : Accélération et décélération (par défaut)
ease-out    : Apparitions (slideUp, fadeIn)
cubic-bezier(0.4, 0, 0.2, 1) : Material Design standard
```

### Animations Clés

**fadeIn :**
- Durée : `$transition-medium`
- Usage : Chargement de contenu
- Classes : `.fade-in`

**slideUp :**
- Durée : `$transition-medium`
- Distance : 20px
- Usage : Apparition de cartes
- Classes : `.slide-up`

**Hover Card :**
```scss
transform: translateY(-2px);
transition: all 0.3s ease-in-out;
```

## 🔘 Composants

### Boutons

#### Tailles
```scss
.btn         : padding: 1rem 2rem (standard)
.btn--sm     : padding: 0.5rem 1rem
.btn--lg     : padding: 1.5rem 3rem
.btn--icon   : 40×40px (circulaire)
```

#### Variantes
| Classe | Usage |
|--------|-------|
| `.btn--primary` | Action principale (Cyan) |
| `.btn--secondary` | Action secondaire (Bordure) |
| `.btn--outline` | Action tertiaire (Outline cyan) |
| `.btn--danger` | Actions destructives (Rouge) |
| `.btn--success` | Confirmations (Vert) |

### Cartes

#### Structure
```tsx
<div className="card">
  <div className="card__header">
    <h3 className="card__title">Titre</h3>
    <p className="card__subtitle">Sous-titre</p>
  </div>
  <div className="card__body">
    {/* Contenu */}
  </div>
  <div className="card__footer">
    {/* Actions */}
  </div>
</div>
```

#### Variantes
| Classe | Description |
|--------|-------------|
| `.card--stat` | Carte de statistique centrée |
| `.card--news` | Carte d'actualité avec hover |

### Tableaux

**Anatomie :**
```
Header      : Fond gris, texte uppercase, 0.875rem
Body        : Alternance de lignes avec hover
Cell        : Padding 1rem 0.5rem
```

**États spéciaux :**
- `.positive` : Valeurs positives (vert)
- `.negative` : Valeurs négatives (rouge)
- `.ticker` : Police monospace pour symboles

## 📱 Responsive Breakpoints

```scss
Extra Small (xs) : < 480px  - Téléphones portrait
Small (sm)       : ≥ 576px  - Téléphones paysage
Medium (md)      : ≥ 768px  - Tablettes
Large (lg)       : ≥ 992px  - Desktops
Extra Large (xl) : ≥ 1200px - Grands écrans
```

### Stratégie Mobile-First

```scss
// Par défaut (mobile)
.element {
  font-size: 1rem;
}

// Tablettes et plus
@media (min-width: $breakpoint-md) {
  .element {
    font-size: 1.125rem;
  }
}
```

## 🎯 Principes de Design

### 1. Clarté Radicale
- Espaces blancs généreux
- Hiérarchie visuelle claire
- Une action principale par écran

### 2. Cohérence
- Utiliser les composants existants
- Respecter la palette de couleurs
- Uniformité des espacements

### 3. Accessibilité
- Contraste minimum WCAG AA
- Taille de police lisible (≥ 16px)
- États de focus visibles

### 4. Performance
- System fonts (pas de web fonts)
- Animations optimisées (transform, opacity)
- Images optimisées

### 5. Feedback Visuel
- Hover states sur tous les éléments interactifs
- Loading states
- Success/Error feedback

## 🎨 Couleurs d'Icônes

| Contexte | Couleur |
|----------|---------|
| Par défaut | `var(--primary-color)` |
| Positif | `var(--positive-color)` |
| Négatif | `var(--negative-color)` |
| Neutre | `var(--text-secondary)` |

## 📐 Grille & Layout

### Container
```scss
max-width: 1400px
padding: 0 2rem (desktop)
padding: 0 1rem (mobile)
```

### Grid System (12 colonnes)
```scss
Gutter: 1.5rem (défaut)
Classes: .col-{1-12}, .col-{breakpoint}-{1-12}
Spacing: .g-{0-5}
```

---

**Version :** Phase 1 - L'Aube Visuelle  
**Dernière mise à jour :** Novembre 2024
