# WORKFLOW — Migration CSS Module → SCSS Global (Algowebsite)

> **Statut** : Battle-tested ✅ — Validé sur `technical-analysis` (Mai 2026)
> **Durée estimée** : 30–90 min selon la taille du composant
> **Auteur** : TENOR 2026 (session 3dc2b55c)

---

## Pourquoi ce workflow existe

La migration de `style.module.css` (ou `.scss`) vers un fichier SCSS global
(`styles/pages/_<composant>.scss`) est **piégeuse** sur ce projet car :

1. Turbopack cache agressivement la liste des fichiers SCSS — un nouveau fichier
   n'est pas détecté sans `rm -rf .next`
2. La syntaxe `:global()` des CSS Modules est invalide en SCSS standard
3. La variable `s` (le module CSS) est souvent **prop-drillée** aux composants enfants
4. `sed` ne capte pas la notation pointée (`s.flipped`) ni les template literals
   (`s[\`cursor-mode-${x}\`]`)
5. Le fichier SCSS doit être créé **AVANT** de l'importer dans `globals.scss`

---

## PHASE 0 — Pré-requis et checkpoint de sécurité

```bash
# 1. Vérifier l'état du dépôt
git status

# 2. Créer un checkpoint Git AVANT toute modification
git add -A && git commit -m "chore(<composant>): [CHECKPOINT] état stable avant migration CSS Module → SCSS Global"

# 3. Mémoriser le hash pour rollback
git log --oneline -1
```

> ⚠️ **RÈGLE ABSOLUE** : Ne jamais commencer la migration sans checkpoint Git.
> Rollback si besoin : `git revert HEAD`

---

## PHASE 1 — Inventaire complet du composant

### 1.1 Localiser tous les fichiers TSX qui importent le CSS Module

```bash
grep -r "import s from" components/<mon-composant>/ --include="*.tsx" -l
```

Exemple de sortie attendue :
```
components/technical-analysis/TechnicalAnalysis.tsx
components/technical-analysis/components/common/BaseModal.tsx
... (17 fichiers dans notre cas)
```

### 1.2 Lister TOUS les cas `s` dans le code TSX

```bash
# Notation bracket : s["class"] ou s['class']
grep -rn "s\[\"" components/<mon-composant>/ --include="*.tsx"
grep -rn "s\['" components/<mon-composant>/ --include="*.tsx"

# Notation pointée : s.className
grep -rn "\bs\." components/<mon-composant>/ --include="*.tsx"

# Template literal : s[`cursor-mode-${x}`]
grep -rn 's\[`' components/<mon-composant>/ --include="*.tsx"

# Prop drilling : s={s}
grep -rn "s=\{s\}" components/<mon-composant>/ --include="*.tsx"

# Prop interface : s: Record<string, string>
grep -rn "s: Record<string" components/<mon-composant>/ --include="*.tsx"

# Prop interface optionnelle
grep -rn "s\?: {" components/<mon-composant>/ --include="*.tsx"

# classList avec s[]
grep -rn "classList.*s\[" components/<mon-composant>/ --include="*.tsx"
```

> 📋 **Documenter** tous ces cas AVANT de commencer. C'est le plan de bataille.

### 1.3 Vérifier la taille du fichier SCSS source

```bash
wc -l components/<mon-composant>/style.module.css
wc -l components/<mon-composant>/style.module.scss
```

---

## PHASE 2 — Création du fichier SCSS global

### 2.1 Créer le répertoire si nécessaire

```bash
ls styles/pages/  # Vérifier que le dossier existe
```

### 2.2 DÉPLACER le fichier SCSS vers l'architecture globale

```bash
# ⚠️ ORDRE CRITIQUE : DÉPLACER D'ABORD, importer ensuite
mv components/<mon-composant>/style.module.scss \
   styles/pages/_<mon-composant>.scss

# Vérifier que le fichier est bien là
ls -la styles/pages/_<mon-composant>.scss
```

> ❌ **PIÈGE N°1** : Ne jamais exécuter le sed de nettoyage AVANT le mv.
> Le sed sur un chemin inexistant échoue silencieusement.

### 2.3 Nettoyer les `:global()` — invalides en SCSS standard

```bash
# En CSS Modules, :global(.class) cible globalement.
# En SCSS global, tout est déjà global → supprimer le wrapper.
sed -i 's/:global(\([^)]*\))/\1/g' styles/pages/_<mon-composant>.scss

# Vérifier que 0 occurrences restent
grep -c ":global(" styles/pages/_<mon-composant>.scss
# Doit retourner : 0
```

### 2.4 Enregistrer dans globals.scss

```bash
# Ouvrir styles/globals.scss et ajouter DANS la section Pages :
# @import 'pages/<mon-composant>';
```

```scss
// styles/globals.scss — section Pages
@import 'pages/<mon-composant>';  // ← Ajouter ici
```

> ⚠️ **RÈGLE** : Vérifier que les autres imports de la section Pages fonctionnent
> avant d'ajouter le nouveau.

---

## PHASE 3 — Refactoring des fichiers TSX

### 3.1 Supprimer les imports CSS Module

```bash
find components/<mon-composant> -name "*.tsx" -exec sed -i \
  '/import s from ".*style\.module\.\(css\|scss\)"/d' {} \;

# Vérifier qu'aucun import ne reste
grep -r "import s from" components/<mon-composant>/ --include="*.tsx"
# Doit retourner vide
```

### 3.2 Convertir `s["class"]` → `"class"` (notation bracket, double guillemets)

```bash
find components/<mon-composant> -name "*.tsx" -exec sed -i \
  's/s\["\([^"]*\)"\]/"\1"/g' {} \;
```

### 3.3 Convertir `s['class']` → `"class"` (notation bracket, guillemets simples)

```bash
find components/<mon-composant> -name "*.tsx" -exec sed -i \
  "s/s\['\([^']*\)'\]/\"\1\"/g" {} \;
```

### 3.4 ⚠️ CAS NON GÉRÉS PAR SED — À faire manuellement

Ces cas nécessitent une intervention **manuelle dans l'éditeur** :

#### a) Notation pointée

```tsx
// AVANT
sidebarToggle.classList.toggle(s.flipped, isClosed);
// APRÈS
sidebarToggle.classList.toggle("flipped", isClosed);
```

#### b) Template literals

```tsx
// AVANT
className={clsx("chart", s[`cursor-mode-${value.split("-")[0]}`])}
// APRÈS
className={clsx("chart", `cursor-mode-${value.split("-")[0]}`)}
```

#### c) classList direct

```tsx
// AVANT
sidebar.classList.add(s["sidebar-closed"]);
sidebar.classList.remove(s["sidebar-closed"]);
sidebar.classList.contains(s["sidebar-closed"]);
// APRÈS (x3)
sidebar.classList.add("sidebar-closed");
sidebar.classList.remove("sidebar-closed");
sidebar.classList.contains("sidebar-closed");
```

### 3.5 Gérer le prop-drilling de `s`

Si `s` est passé comme prop à des composants enfants :

```bash
# 1. Localiser les occurrences dans le parent
grep -n "s={s}" components/<mon-composant>/TechnicalAnalysis.tsx

# 2. Supprimer s={s} des appels JSX dans le parent
# (manuellement dans l'éditeur)

# 3. Supprimer s de l'interface dans chaque enfant concerné
grep -rn "s: Record<string" components/<mon-composant>/ --include="*.tsx"
grep -rn "s\?: {" components/<mon-composant>/ --include="*.tsx"
# → Supprimer ces lignes dans les interfaces des composants enfants
# → Supprimer aussi la destructuration : s, dans le corps du composant
```

---

## PHASE 4 — Vérification complète

### 4.1 Scan final — zéro résidu `s`

```bash
# Aucune de ces commandes ne doit retourner de résultat
grep -rn "import s from" components/<mon-composant>/ --include="*.tsx"
grep -rn 's\["' components/<mon-composant>/ --include="*.tsx"
grep -rn "s\.flipped\|s\.flipped" components/<mon-composant>/ --include="*.tsx"
grep -rn 's\[`' components/<mon-composant>/ --include="*.tsx"
grep -rn "s={s}" components/<mon-composant>/ --include="*.tsx"
grep -rn "s: Record<string" components/<mon-composant>/ --include="*.tsx"
```

### 4.2 Vérifier le SCSS

```bash
# Aucun :global() ne doit rester
grep -c ":global(" styles/pages/_<mon-composant>.scss
# Doit retourner : 0
```

### 4.3 ⚠️ TURBOPACK — Purge obligatoire du cache

```bash
# OBLIGATOIRE : Turbopack ne détecte PAS les nouveaux fichiers SCSS
# sans purge du cache, même après redémarrage normal.
rm -rf .next

# Relancer le serveur
npm run dev
```

> 💀 **PIÈGE N°2 (le plus vicieux)** : L'erreur
> `Can't find stylesheet to import` persiste après `Ctrl+C` + `npm run dev`
> si `.next` n'est pas supprimé. Turbopack cache la liste des fichiers SCSS
> au premier démarrage et ne la réindexe jamais en cours de session.
>
> **Seul `rm -rf .next` résout ce problème.**

---

## PHASE 5 — Validation visuelle

1. Naviguer vers la page du composant migré
2. Vérifier visuellement que le rendu est **pixel-perfect** identique
3. Tester les interactions (hover, click, animations)
4. Vérifier le panneau TypeScript de VS Code → 0 erreurs liées à `s`

---

## PHASE 6 — Commit de finalisation

```bash
git add -A && git commit -m "feat(<composant>): [MIGRATION COMPLÈTE] CSS Module → SCSS Global

- style.module.scss → styles/pages/_<composant>.scss
- globals.scss : @import 'pages/<composant>' enregistré
- :global() x<N> supprimés
- import s supprimé dans <N> fichiers TSX
- s[\"...\"] → \"...\" dans tous les composants
- Props s retirés des interfaces : <liste>
- Build : propre après rm -rf .next
- ROLLBACK : git revert HEAD"
```

---

## Tableau récapitulatif des pièges

| # | Piège | Symptôme | Solution |
|---|-------|----------|----------|
| 1 | `sed` sur fichier inexistant | `:global()` toujours présents après sed | Toujours `mv` AVANT `sed` |
| 2 | Cache Turbopack | `Can't find stylesheet` après redémarrage | `rm -rf .next` obligatoire |
| 3 | Notation pointée `s.class` | TS 2304 "Cannot find name 's'" | Fix manuel dans l'éditeur |
| 4 | Template literals `s[\`...\`]` | TS 2304 "Cannot find name 's'" | Fix manuel dans l'éditeur |
| 5 | Prop-drilling `s={s}` | TS 2741 "Property 's' is missing" | Retirer `s` des interfaces enfants |
| 6 | `classList` avec `s[]` | TS 2304 "Cannot find name 's'" | Convertir en strings directes |

---

## Checklist rapide (copier-coller avant migration)

```
[ ] Checkpoint Git créé (hash noté)
[ ] Inventaire complet des cas s (bracket, dot, template, prop)
[ ] mv style.module.scss → styles/pages/_<composant>.scss
[ ] sed :global() → vérification grep -c = 0
[ ] @import ajouté dans globals.scss
[ ] find/sed imports supprimés
[ ] find/sed s["..."] → "..."
[ ] Cas manuels : s.dot, s[`template`], classList, s={s}
[ ] Interfaces enfants nettoyées
[ ] Scan final : 0 résidu s
[ ] rm -rf .next
[ ] npm run dev → page s'affiche
[ ] Commit de finalisation
```

---

*Généré par TENOR 2026 — Session 3dc2b55c — Mai 2026*
*Basé sur la migration réelle de `technical-analysis` (4661 lignes SCSS, 18 fichiers TSX)*
