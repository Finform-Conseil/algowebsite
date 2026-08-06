# Architecture & Workflow d'implémentation d'une route de données

> **Statut :** SOURCE CANONIQUE. Ce document fait autorité pour tout agent/LLM
> qui ajoute une nouvelle route de données (une entité backend consommée par une
> page). Il décrit le flux réel, vérifié dans le code, du `domain` jusqu'au
> `page.tsx`, et impose les règles à respecter à chaque couche.
>
> **Périmètre :** couche `core/` (Clean/Hexagonal) + consommation en page.
> Pour le proxy réseau lui-même, voir `app/api/proxy/` et son manifeste interne.

---

## 0. TL;DR — La checklist des 7 fichiers

Pour ajouter une entité `widget` consommée par une page, tu crées/édites **exactement** ceci, dans cet ordre :

| # | Fichier | Couche | Rôle |
| --- | --------- | -------- | ------ |
| 1 | `core/domain/schemas/widget.schema.ts` | domain | Schéma Zod (source de vérité de la forme + validation) |
| 2 | `core/domain/types/widget.type.ts` | domain | Types dérivés via `z.infer` (jamais réécrits à la main) |
| 3 | `core/domain/entities/widget.entity.ts` | domain | Interface(s) de la forme renvoyée par le backend |
| 4 | `core/domain/repositories/widget.repository.ts` | domain | **Le PORT** : interface `IWidgetRepository` |
| 5 | `core/infra/store/api/widget.api.ts` | infra | Endpoints RTK Query (`injectEndpoints`) |
| 6 | `core/infra/store/api/index.ts` | infra | **Éditer** le barrel : ré-exporter les hooks générés |
| 7 | `core/infra/repositories/widget.repository.impl.ts` | infra | **L'ADAPTATEUR** : hook `useWidgetRepository` |

Puis, dans la page : `const { allWidgetsData, getAllWidgets } = useWidgetRepository();`

> **Recette la plus rapide :** copier la tranche `country` (la plus générique)
> ou `sector`, remplacer `Country`/`country`/`Countries` par tes noms, adapter les
> champs. Ne pas inventer de nouveau pattern.

---

## 1. La carte mentale : 3 couches + 1 consommation

```
┌──────────────────────────────────────────────────────────────────────┐
│  DOMAIN  (core/domain)   — Le CONTRAT. Pur. Zéro import de framework.  │
│  Ne connaît NI React, NI RTK, NI le réseau. Ne dépend de rien d'infra. │
│                                                                        │
│   schemas/*.schema.ts  ──(z.infer)──▶  types/*.type.ts                 │
│   entities/*.entity.ts   (forme backend, interfaces)                   │
│   repositories/*.repository.ts   ◀── INTERFACE (le "port" hexagonal)   │
└───────────────────────────────▲────────────────────────────────────---┘
                                 │ implémente le port
┌───────────────────────────────┴────────────────────────────────────---┐
│  INFRA  (core/infra)     — L'IMPLÉMENTATION. React + RTK Query.        │
│                                                                        │
│   store/api/*.api.ts       (endpoints RTK, injectEndpoints)            │
│   store/api/index.ts       (barrel : expose les hooks générés)         │
│   repositories/*.impl.ts   (hook use*Repository = ADAPTATEUR du port)  │
└───────────────────────────────▲────────────────────────────────────---┘
                                 │ consommé via le hook
┌───────────────────────────────┴────────────────────────────────────---┐
│  PAGE  (app/[locale]/.../page.tsx)  — La CONSOMMATION.                 │
│   const { allXData, getAllX } = useXRepository();                      │
│   useEffect(() => { getAllX(params); }, []);   // déclenche le fetch   │
│   // transforme allXData vers le modèle de présentation, puis render.  │
└──────────────────────────────────────────────────────────────────────┘
```

**Règle d'or (dépendance) :** les flèches ne pointent QUE vers le domain.
`domain` n'importe jamais `infra`. `page` n'importe jamais un `.api.ts`
directement — elle passe **toujours** par le hook `use*Repository`.

---

## 2. Le flux réseau réel (ce qui se passe à l'exécution)

```
page.tsx
  └─ useWidgetRepository()                 (core/infra/repositories/*.impl.ts)
       └─ useLazyGetAllWidgetsQuery()      (hook généré par RTK, via le barrel)
            └─ widgetApi endpoint          (core/infra/store/api/widget.api.ts)
                 └─ base.api.ts            baseUrl = NEXT_PUBLIC_CLIENT_API_BASE + "/api/v1"
                      └─ fetch → /api/proxy/<N>/api/v1/widgets/   (proxy Next.js)
                           └─ path-normalizer (Django APPEND_SLASH) → backend Django
```

**Points vérifiés à connaître impérativement :**

- `NEXT_PUBLIC_CLIENT_API_BASE` vaut par ex. `"/api/proxy/10"`. **L'identifiant
  numérique du backend (`10`) vit dans l'env, PAS dans le code `.api.ts`.**
  Le `baseUrl` RTK final est donc `/api/proxy/10/api/v1`. Un endpoint
  `url: "widgets"` produit `/api/proxy/10/api/v1/widgets`.
- Le proxy applique le contrat `APPEND_SLASH` de Django de manière centralisée
  (`app/api/proxy/path-normalizer`). **Mais ne te repose pas dessus pour être
  paresseux** — voir la règle du trailing-slash ci-dessous.
- L'authentification (Bearer token) est injectée automatiquement dans
  `base.api.ts` via `prepareHeaders` (session next-auth). Tu n'as **jamais** à
  gérer le token dans un `.api.ts`.

---

## 3. Règles par couche (PRESCRIPTIF)

### 3.1 `domain/schemas/*.schema.ts` — Zod, source de vérité

- Le schéma Zod est **la** source de vérité de la forme et de la validation.
- Exporte au minimum : le schéma principal, `create*Schema` (souvent
  `schema.omit({ id, ... })`) et `update*Schema` (souvent `schema.partial()`).
- **Ne réécris jamais** un type TypeScript en double du schéma : dérive-le.

### 3.2 `domain/types/*.type.ts` — types dérivés (DRY)

```ts
import { z } from "zod";
import { createWidgetSchema, widgetSchema, updateWidgetSchema } from "../schemas/widget.schema";

export type WidgetType       = z.infer<typeof widgetSchema>;
export type CreateWidgetType = z.infer<typeof createWidgetSchema>;
export type UpdateWidgetType = z.infer<typeof updateWidgetSchema>;
```

### 3.3 `domain/entities/*.entity.ts` — forme backend

- Interfaces décrivant la donnée **telle que le backend la renvoie** (peut être
  plus riche/différente que le schéma de validation, ex. `SectorWithStats`).
- C'est le `T` de `PaginatedResponse<T>`.

### 3.4 `domain/repositories/*.repository.ts` — LE PORT

- Interface `I{X}Repository`. C'est le **contrat** que la page consomme.
- Convention observée (respecte-la pour l'homogénéité) : expose **à la fois**
  les actions ET les états, en champs plats :
  - actions : `getAll{X}`, `get{X}ById`, `create{X}`, `update{X}`, `delete{X}`, `upload{X}s`
  - données : `all{X}sData?`, `current{X}Data?`
  - états lecture : `isLoadingAll{X}`, `isFetchingAll{X}`, `all{X}sError?`, idem `...ById`
  - états mutation agrégés : `isMutationLoading`, `isMutationSuccess`, `isMutationError`, `mutationError?`
- Utilise `PaginatedResponse<{X}Entity>` et `QueryParams` de
  `domain/types/pagination.type.ts` pour les listes.

### 3.5 `infra/store/api/*.api.ts` — endpoints RTK Query

- Toujours `import api from "./base.api"` puis `api.injectEndpoints({...})`.
- Toujours `overrideExisting: true` en fin (HMR-safe, comme le reste du repo).
- Pattern CRUD standard (queries + mutations + tags d'invalidation).
- **`providesTags` / `invalidatesTags` : respecte le schéma existant** —
  `{ type: "Widgets", id }` par item, `{ type: "Widgets", id: "LIST" }`, et
  `{ type: "Widgets", id: \`PAGE-\${result.current_page}\` }` pour la pagination.
  Une mutation `invalidatesTags` le tag correspondant pour re-fetch auto.

> ### ⚠️ RÈGLE CRITIQUE — TRAILING SLASH (cause de bug réelle et corrigée)
>
> Le backend Django est en `APPEND_SLASH=True`. Une URL SANS slash final
> déclenche une redirection **301** dont le corps est vide/HTML, que le client
> interprète comme *"empty or malformed response (HTTP 200)"*.
>
> **Écris TOUJOURS tes `url` avec un slash final :** `url: "/widgets/"`,
> `url: \`widgets/\${id}/\``. **N'imite PAS** l'incohérence historique où
> `getAll*` utilise `url: "sectors"` (sans slash) — c'était précisément le bug.
> Le proxy normalise en dernier recours, mais la règle reste : slash final,
> partout, tout le temps.

### 3.6 `infra/store/api/index.ts` — le barrel

- Importe ton `widgetApi`, puis **destructure et ré-exporte** ses hooks :

```ts
import { widgetApi } from "./widget.api";
// ...
export const {
  useCreateWidgetMutation,
  useUploadWidgetsMutation,
  useDeleteWidgetMutation,
  useGetAllWidgetsQuery,
  useLazyGetAllWidgetsQuery,     // ← indispensable pour le pattern "getAll lazy"
  useGetWidgetByIdMutation,      // (ou Query selon ton endpoint)
  useUpdateWidgetMutation,
  endpoints: { createWidget, uploadWidgets, deleteWidget, getAllWidgets, getWidgetById, updateWidget },
} = widgetApi;
```

- **N'oublie pas** d'ajouter le `tagType` correspondant dans le tableau
  `tagTypes` de `base.api.ts` (ex. `'Widgets'`), sinon RTK lèvera une erreur.

### 3.7 `infra/repositories/*.repository.impl.ts` — L'ADAPTATEUR

- C'est un **hook React** `use{X}Repository(): I{X}Repository`.
- Il agrège tous les hooks RTK et retourne l'objet plat conforme au port.
- Conventions observées à reproduire :
  - **`getAll{X}` est LAZY** : `useLazyGetAll{X}sQuery()` → wrappé dans un
    `useCallback` qui fait `trigger(params).unwrap()`. La page déclenche le
    fetch explicitement dans un `useEffect`.
  - **`get{X}ById` est piloté par `skipToken`** : `useState<string | typeof
    skipToken>(skipToken)`, l'appel `getXById(id)` fait `setIdArg(id)`, et la
    query n'est active que quand l'arg n'est pas `skipToken`.
  - **Mutations** : chaque mutation appelle `reset*()` avant, puis
    `mutation(arg).unwrap()`. Les états sont agrégés en `isMutation*`.

---

## 4. La consommation en page (`app/[locale]/.../page.tsx`)

```tsx
'use client';
import { useEffect, useMemo } from 'react';
import { useWidgetRepository } from '@/core/infra/repositories/widget.repository.impl';

export default function WidgetsPage() {
  const { allWidgetsData, getAllWidgets } = useWidgetRepository();

  // 1) Déclenche le fetch (getAll est LAZY → il faut l'appeler)
  useEffect(() => {
    getAllWidgets({ view_type: 'screener' });
  }, []);

  // 2) Transforme la donnée backend → modèle de présentation
  const widgets = useMemo(() => {
    if (!allWidgetsData?.data) return [];
    return transformWidgets(allWidgetsData.data);
  }, [allWidgetsData]);

  // 3) Render à partir de `widgets`
}
```

**Règles page :**

- La page est `'use client'` (les hooks RTK/repository sont client-side).
- **Jamais** importer un `.api.ts` ni un hook `use*Query` directement en page :
  toujours passer par `use{X}Repository`.
- La **transformation** backend → UI vit dans `lib/utils/*` (ex.
  `sectorTransform.ts`), pas dans le repository ni le domain.
- `getAll*` étant lazy, **si tu oublies le `useEffect`, rien ne se charge**.

---

## 5. État du store — À SAVOIR (piège d'ambiguïté)

Le repo contient **deux arborescences store qui se ressemblent** :

| Dossier | Statut | Détail |
|---------|--------|--------|
| `core/infra/store` | ✅ **CANONIQUE / VIVANT** | Contient `api` (reducerPath `'api'`), **réellement peuplé par les ~26 entités**. C'est ici que tu ajoutes tout. |
| `core/infrastructure/store` | ⚙️ Embryonnaire | Contient `baseApi` (vide, point d'injection futur) + `makeStore()` qui monte **les deux** apis. Ne PAS y ajouter d'entités pour l'instant. |

- Le provider actif est `core/presentation/components/providers/StoreProvider.tsx`
  → appelle `makeStore()` de `infrastructure/store`, qui monte **aussi** le
  `api` legacy de `infra/store`. Les deux mondes coexistent volontairement.
- **Pour une nouvelle route de données : travaille exclusivement dans
  `core/infra/`.** Ne migre rien vers `infrastructure/` sans décision explicite.
- Note de vigilance : `infra/store/hooks.ts` importe `RootState`/`AppDispatch`
  depuis `@/core/infrastructure/store` — les *types* du store agrégé viennent de
  `infrastructure/`, mais l'*api des entités* vit dans `infra/`.

> Si un jour une consolidation `infra/` ↔ `infrastructure/` est décidée, elle
> doit faire l'objet d'un document dédié dans `Docs/` — ne pas l'improviser.

---

## 6. Anti-patterns interdits (récapitulatif)

- ❌ URL d'endpoint sans slash final (`url: "widgets"`). → **301 / réponse vide.**
- ❌ Importer un `.api.ts` ou un `use*Query` directement dans une page.
- ❌ Réécrire à la main un type déjà dérivable du schéma Zod (`z.infer`).
- ❌ Mettre la logique de transformation UI dans le domain ou le repository.
- ❌ Gérer le token / l'auth dans un `.api.ts` (c'est le rôle de `base.api.ts`).
- ❌ Coder l'identifiant numérique du backend en dur dans un `.api.ts` (il vient
  de `NEXT_PUBLIC_CLIENT_API_BASE`).
- ❌ Ajouter une entité dans `core/infrastructure/store` au lieu de `core/infra`.
- ❌ Oublier d'enregistrer le `tagType` dans `base.api.ts` ou d'appeler le
  `useEffect` de déclenchement en page.

---

## 7. Definition of Done pour une nouvelle route

- [ ] 7 fichiers créés/édités (section 0), homogènes avec la tranche `country`/`sector`.
- [ ] Types dérivés du schéma Zod (aucune duplication).
- [ ] `tagType` ajouté dans `base.api.ts`.
- [ ] Toutes les `url` d'endpoint ont un slash final.
- [ ] Hooks (dont `useLazyGetAll*Query`) exportés dans le barrel `index.ts`.
- [ ] `use{X}Repository` retourne un objet conforme au port `I{X}Repository`.
- [ ] La page passe par le hook repository, déclenche le fetch via `useEffect`,
      et transforme la donnée via `lib/utils`.
- [ ] `pnpm exec tsc --noEmit` ne signale aucune erreur nouvelle.

---

## 8. Déduplication des requêtes concurrentes au repository

Quand plusieurs consommateurs déclenchent simultanément la même lecture lazy,
le repository doit partager la promesse déjà en vol pour une clé de paramètres
stable. Cette protection se situe dans l'adaptateur `core/infra/repositories/`,
au-dessus du trigger RTK Query : elle couvre ainsi les appels provenant de hooks
ou de composants distincts sans introduire un cache métier parallèle.

Règles d'implémentation :

- Construire une clé déterministe à partir de l'opération et des paramètres
  normalisés (ordre des propriétés stable, ticker trimé et en majuscules).
- Retourner la promesse existante tant qu'elle est en attente.
- Supprimer l'entrée après résolution ou rejet afin de ne pas conserver de
  données obsolètes : le cache séquentiel reste la responsabilité de RTK Query.
- Partager la chaîne complète pour `getActionByTicker`, y compris le fallback
  ticker → ISIN ; un seul appel concurrent doit donc exécuter cette chaîne.
- Ne pas promettre la suppression des appels séquentiels, des paramètres
  différents, des redirections de slash ou des appels d'autres domaines.

Preuve de validation technique : un rechargement propre de la page
`/en/equity/technical-analysis` avec BOAB a produit un seul appel effectif
`actions?isin=BJ0000000048&page_size=1` et un seul appel effectif
`cours?instrument=792ff1a9-a067-4302-a3cb-8662fd23fb94&page_size=5000` ; la
capture Chrome montre les bougies et les volumes rendus. Les appels 308 de
normalisation du slash sont suivis de réponses 200 du proxy, et les 404 du
fallback ticker ainsi que les 401 du module results/refresh ne bloquent pas le
graphique.
