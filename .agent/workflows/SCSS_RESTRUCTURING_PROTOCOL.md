# 🧬 PROTOCOLE DE RESTRUCTURATION SCSS (TENOR 2026)

> **Objectif :** Transformer un fichier CSS plat, verbeux et dupliqué (souvent issu d'une migration brute de CSS Modules) en un fichier SCSS idiomatique, performant et maintenable, en utilisant le "Nesting" et la syntaxe `&`.

---

## 1. PHASE DE PRÉPARATION (SÉCURITÉ)

- **BACKUP SYSTÉMATIQUE :** Ne jamais commencer sans une copie conforme.
  - Commande : `cp styles/pages/file.scss styles/pages/file.scss.BACKUP`
- **SCAN DES DOUBLONS :** Utiliser `grep` ou une lecture attentive pour identifier les sélecteurs racines dupliqués (ex: `.root-class` défini 3 fois à 2000 lignes d'intervalle).
- **IDENTIFICATION DES "GOD-NODES" :** Repérer la classe parente principale qui doit encapsuler le reste du fichier.

---

## 2. STRATÉGIE DE PARTITIONNEMENT (CHUNKING)

Pour les fichiers > 1000 lignes, le passage en une seule fois (One-Shot) échoue souvent par saturation de contexte ou limites de tokens.
- **DÉCOUPAGE LOGIQUE :** Diviser le contenu en sections thématiques (ex: §1 Root, §2 Toolbars, §3 Modals, etc.).
- **PLACEHOLDERS DE CHUNK :** Écrire la structure globale du fichier avec des commentaires-placeholders :
  ```scss
  .root-selector {
    /* ===CHUNK_1_PLACEHOLDER=== */
    /* ===CHUNK_2_PLACEHOLDER=== */
  }
  ```
- **INJECTION SÉQUENTIELLE :** Remplacer chaque placeholder par le code restructuré section par section.

---

## 3. RÈGLES D'ÉCRITURE IDIOMATIQUES (LA CULTURE SCSS)

### A. Le Nesting avec `&` (Priorité Absolue)
- **Pseudo-classes :** `&:hover`, `&:active`, `&:focus`.
- **Pseudo-éléments :** `&::before`, `&::after`.
- **Modificateurs de State :** `&.active`, `&.is-open`, `&.disabled`.
- **Contexte Parent :** `.dark-mode & { ... }` si nécessaire.

### B. Structure des Sous-Éléments
- Ne pas répéter le préfixe du parent.
  - ❌ `.parent-btn-icon` (plat)
  - ✅ `.parent-btn { .icon { ... } }` (nesté)
- **Limite de Profondeur :** Ne pas dépasser 3 ou 4 niveaux de nesting pour garder la spécificité CSS sous contrôle.

### C. Consolidation des Media Queries
- Regrouper les media queries en fin de fichier ou les nester directement dans les sélecteurs concernés si elles sont spécifiques.
- Préférer la consolidation en fin de fichier pour une vision globale de la réactivité.

---

## 4. CHECKLIST DE VALIDATION (ANTI-RÉGRESSION)

- [ ] **Fusion des Roots :** Est-ce qu'il n'y a plus qu'un seul bloc pour la classe principale ?
- [ ] **Suppression des Duplicats :** Les classes globales (`.wrapper`, `.container`) sont-elles dédupliquées ?
- [ ] **Nettoyage des Commentaires :** Supprimer les commentaires de debug ou de chemins de fichiers obsolètes.
- [ ] **Vérification du Build :** Lancer `npm run dev` ou `next build` pour s'assurer que le compilateur Sass ne lève aucune erreur de syntaxe.

---

## 5. EXEMPLE DE TRANSFORMATION (PATERN)

**AVANT (CSS Plat) :**
```css
.btn-gold { background: gold; }
.btn-gold:hover { background: yellow; }
.btn-gold.active { border: 2px solid black; }
.btn-gold span { font-weight: bold; }
```

**APRÈS (SCSS Idiomatique) :**
```scss
.btn-gold {
  background: gold;
  
  &:hover { background: yellow; }
  &.active { border: 2px solid black; }
  
  span { font-weight: bold; }
}
```

---

> **Mantra du SRE SCSS :** "Le code n'est pas seulement fait pour être exécuté par la machine, il est fait pour être lu par l'humain et maintenu par l'IA suivante."
