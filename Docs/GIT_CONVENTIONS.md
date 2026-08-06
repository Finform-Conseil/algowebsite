# 📝 Conventions de Commit Git (Standard FINFORM)

Pour assurer une traçabilité totale et la clarté dans notre filet de sécurité SRE, nous utilisons la convention **FINFORM / Conventional Commits** de manière restrictive et détaillée.

## 🧬 Structure Obligatoire

```text
type(nom_du_fichier_principal): description courte et descriptive en anglais

Accomplishments:
- Action isolée et à forte valeur ajoutée (mentionner le PAT-XXX ou SCAR-XXX si lié).
- Explication du "Pourquoi" pour les décisions complexes ou les refactors.
- Impact UI/UX ou correctif lié aux performances abordé.
- Liste de la couverture de test ou méthode de vérification (ex: Verified all 41 tools).
```

## 🏷️ Types Valides (Les 10 Commandements FINFORM)

1. **feat** : Commits ajoutant ou supprimant une nouvelle fonctionnalité (si un initial commit contient du code utile, c'est un `feat`).
2. **fix** : Commits corrigeant un bug.
3. **refactor** : Commits réécrivant ou restructurant le code, sans modifier le comportement de l'API/Système.
4. **perf** : Commits de refactoring spéciaux, améliorant expressément les performances.
5. **style** : Commits n'affectant pas le sens du code (espaces, formatage, points-virgules manquants, linting).
6. **test** : Commits ajoutant des tests manquants ou corrigeant des tests existants.
7. **docs** : Commits affectant uniquement la documentation.
8. **build** : Commits affectant les composants de construction (outil de build, pipeline CI, dépendances, version).
9. **ops** : Commits affectant les composants opérationnels (infra, déploiement, sauvegarde, etc.).
10. **chore** : Commits divers (ex: gitignore, tâches annexes non liées à des comportements).

> Note : un "Initial commit" posant juste le dépôt sans feature est un `chore`.

## 🌟 Exemple de Commit de Production

```text
feat(TechnicalAnalysis): complete architectural migration and 41-tool drawing fidelity restoration

Accomplishments:
- Migrated legacy DrawingRendererOld to a modular, strategy-based architecture (PAT-031).
- Restored 100% visual parity for 41 tools, including complex Fibonacci donut fills.
- Overhauled hit-testing logic: centralized delegation to strategies, fixing handle index corruption.
- Centralized geometric math into TechnicalAnalysisUtils and math/geometry.ts for robust reuse.
- Verified all 41 tools across 8 categories.
```
