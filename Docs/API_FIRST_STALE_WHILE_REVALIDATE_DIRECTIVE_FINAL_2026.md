# API-First Data Freshness, Cache & Rendering — Directive Canonique Frontend 2026

> **Nom de fichier canonique conservé pour compatibilité :**
> `Docs/API_FIRST_STALE_WHILE_REVALIDATE_DIRECTIVE.md`

**Statut :** directive normative + cours d’ingénierie + runbook de diagnostic + Definition of Done  
**Version :** 2026.08.23  
**Périmètre :** toute interface frontend alimentée par l’API officielle : pages, modals, tables, listes, watchlists, selects/autocomplete, filtres, comparaisons, graphiques, panneaux d’analyse, pagination et flux live lorsque l’API les permet.  
**Architecture cible :** architecture existante du projet, sans refonte implicite.  
**Documents compagnons :**
- `API_FIRST_ABSOLUTE_RULE.md`
- `ARCHITECTURE_DATA_FLOW.md`

---

# 0. COMMENT UTILISER CE DOCUMENT

Ce fichier est le **manuel canonique de performance, de cache, de fraîcheur et de continuité UI** pour les interfaces API du frontend.

Il doit être suffisamment autonome pour qu’un développeur ou un LLM qui ne connaît pas l’historique du projet puisse recevoir une instruction telle que :

> **« Lis `API_FIRST_STALE_WHILE_REVALIDATE_DIRECTIVE.md` et mets cette interface en conformité avec la directive. »**

et savoir :

1. quoi lire avant de modifier le code ;
2. comment diagnostiquer la lenteur ;
3. comment classer la donnée ;
4. quelles primitives RTK Query sont réellement disponibles ;
5. quand le cache peut être affiché ;
6. quand le cache ne peut PAS être utilisé comme valeur courante ;
7. comment gérer `isLoading`, `isFetching`, erreurs et états dégradés ;
8. comment préserver focus, scroll, sélection et layout ;
9. comment traiter pagination, prefetch, streaming, mémoire et rendu React ;
10. comment prouver le correctif dans le navigateur ;
11. quelles optimisations sont interdites ;
12. quels critères doivent être satisfaits avant de déclarer la tâche terminée.

Cette directive **ne donne pas l’autorisation de refondre l’architecture**, de déplacer les repositories, de modifier le backend Django, de modifier Redis, de réinventer le store ou d’introduire une nouvelle librairie de cache.

---

# 1. LANGAGE NORMATIF

Les termes suivants ont un sens précis.

- **DOIT / DOIVENT** : exigence de conformité.
- **NE DOIT PAS / INTERDIT** : violation de la directive.
- **DEVRAIT** : règle recommandée ; un écart doit être justifié.
- **PEUT** : choix autorisé selon le contexte.
- **SOURCE-BACKED** : comportement établi par une source primaire officielle.
- **CONVENTION PROJET** : règle imposée par ce projet, non prétendue comme garantie du framework.
- **RECOMMANDATION À MESURER** : optimisation à appliquer seulement lorsqu’un signal ou une mesure la justifie.
- **EXPÉRIMENTAL** : mécanisme non utilisable comme critère universel de conformité.

La directive distingue impérativement :

```text
FAIT FRAMEWORK
≠
CONVENTION PROJET
≠
RECOMMANDATION DE PERFORMANCE
≠
HYPOTHÈSE À TESTER
```

---

# 2. DÉCISION FONDAMENTALE — PHILOSOPHIE API-FIRST

## API-001 — Autorité de la donnée

L’API Django externe est **l’autorité distante contractuelle** accessible au frontend.

Le frontend peut :

- interroger l’API ;
- valider la réponse qu’il reçoit ;
- mettre cette réponse en cache RTK Query ;
- conserver temporairement une ancienne réponse API lorsque la classe de donnée l’autorise ;
- invalider/revalider son cache ;
- afficher explicitement un état dégradé.

Le frontend ne peut pas :

- garantir comment Django produit sa réponse ;
- garantir la fraîcheur d’une source interne au backend ;
- piloter Redis ou son TTL s’il ne contrôle pas cette infrastructure ;
- fabriquer une donnée « plus fraîche » que l’API ;
- transformer un échec API en succès local.

Une revalidation frontend prouve :

> « le frontend a effectué/rejoint une nouvelle requête vers le contrat API ».

Elle ne prouve pas :

> « le backend a nécessairement recalculé la donnée depuis sa source primaire ».

---

## API-002 — Le cache n’est jamais une deuxième vérité métier

RTK Query est un **cache de données distantes et de transport client**.

Il n’est jamais une autorité métier indépendante.

```text
API officielle
    ↓
proxy réseau
    ↓
baseQuery / RTK Query
    ↓
cache Redux Toolkit
    ↓
repository / hook
    ↓
modèle de présentation
    ↓
UI
```

Une donnée peut être affichée depuis le cache uniquement parce qu’elle est une **ancienne réponse API admissible**, pas parce que « Redux contient quelque chose ».

---

## API-003 — Ne jamais inventer

Il est interdit d’utiliser comme remplacement métier d’une donnée API absente ou en erreur :

- mock ;
- faker ;
- fixture ;
- catalogue local ;
- valeur hardcodée ;
- prix synthétique ;
- volume synthétique ;
- bid/ask synthétique ;
- spread calculé pour masquer une absence API ;
- valeur calculée présentée comme réponse serveur ;
- liste locale utilisée parce que le réseau est lent.

Une réponse API vide valide reste vide.

Une erreur API reste une erreur observable.

Une donnée absente devient selon le contrat :

```text
null
N/A
état vide
état indisponible
```

et jamais une donnée inventée.

---

## API-004 — Philosophie de continuité UX

La philosophie d’origine de cette directive est conservée, mais corrigée pour ne plus appliquer SWR aveuglément à toute donnée :

```text
AFFICHER VITE
+
RÉUTILISER LA DERNIÈRE VÉRITÉ API LORSQUE SA CLASSE L’AUTORISE
+
REVALIDER SELON LA SÉMANTIQUE DE LA DONNÉE
+
NE JAMAIS INVENTER
+
NE JAMAIS BLOQUER INUTILEMENT
+
NE JAMAIS DÉTRUIRE UNE UI ENCORE UTILISABLE
+
NE JAMAIS MASQUER L’ANCIENNETÉ OU L’ÉCHEC
+
ADOPTER LA NOUVELLE RÉPONSE API VALIDÉE DÈS QU’ELLE EST DISPONIBLE
```

**SWR est un outil, pas une religion.**

RFC 5861 établit le principe stale-while-revalidate au niveau HTTP : servir une réponse stale pendant une revalidation peut masquer la latence. Cela ne signifie pas qu’une application financière doit autoriser les données stale dans tous les contextes.

---

# 3. ARCHITECTURE À RESPECTER — PAS DE REFONTE IMPLICITE

Cette directive gouverne **le comportement** du flux existant.

`ARCHITECTURE_DATA_FLOW.md` gouverne **où le code vit et comment les couches sont reliées**.

Le flux projet reste :

```text
page.tsx / composant
        ↓
useXRepository()
        ↓
RTK Query
        ↓
base.api.ts
        ↓
proxy Next.js
        ↓
API Django externe
```

## ARCH-001 — Aucun raccourci de couche

Une correction de performance NE DOIT PAS, sauf mission architecturale explicite :

- importer directement un `.api.ts` dans la page ;
- contourner `useXRepository()` ;
- créer un deuxième store ;
- migrer `core/infra` vers `core/infrastructure` ;
- remplacer le pattern repository ;
- déplacer les types/domain ;
- toucher au backend Django ;
- créer une solution Redis frontend imaginaire.

## ARCH-002 — Optimiser le flux existant avant de le remplacer

Une lenteur de modal ou de table n’est pas une justification suffisante pour une refonte.

Avant tout changement structurel, l’agent DOIT démontrer que le problème ne peut pas être corrigé par :

- réutilisation correcte du cache RTK Query ;
- distinction correcte des états UI ;
- stabilisation des query args ;
- déduplication native ;
- invalidation correcte ;
- prefetch ciblé ;
- pagination ;
- réduction du rendu ;
- bornage mémoire ;
- suppression d’effets/fetches redondants.

---

# 4. MODÈLE MENTAL — NE PAS CONFONDRE LES HORLOGES

Le mot « cache » masque plusieurs concepts indépendants. Ils DOIVENT être séparés.

| Concept | Question | Mécanisme principal |
|---|---|---|
| Identité du cache | « Est-ce la même query ? » | endpoint + arguments sérialisés → `queryCacheKey` |
| Déduplication in-flight | « Deux consommateurs demandent-ils exactement la même query maintenant ? » | RTK Query, même `queryCacheKey` |
| Rétention | « Combien de temps l’entrée reste-t-elle après le dernier unsubscribe ? » | `keepUnusedDataFor` |
| Fraîcheur au remount | « À partir de quel âge doit-on refetch au nouvel abonnement ? » | `refetchOnMountOrArgChange` |
| Revalidation focus/reconnect | « Refetch au retour focus/réseau ? » | `refetchOnFocus`, `refetchOnReconnect`, `setupListeners` |
| Visibilité stale métier | « L’utilisateur peut-il encore voir cette ancienne réponse API ? » | **CONVENTION PROJET** `maxVisibleStaleAge` / policy |
| Prefetch age | « Le prefetch est-il utile vu l’âge de la donnée ? » | `ifOlderThan` optionnel |
| Invalidation métier | « Une mutation a-t-elle invalidé cette donnée ? » | tags RTK Query |
| Source backend | « Le backend a-t-il lui-même une donnée fraîche ? » | non contrôlable depuis ce frontend |
| Temps réel | « La donnée change-t-elle continuellement ? » | streaming/polling si l’API le permet |

---

## CACHE-001 — `keepUnusedDataFor` n’est PAS la fraîcheur

**SOURCE-BACKED — RTK Query**

`keepUnusedDataFor` est exprimé en secondes et contrôle combien de temps une entrée reste dans le store RTK Query après que le dernier subscriber s’est désabonné.

Il ne signifie PAS :

- « la donnée est fraîche pendant X secondes » ;
- « V8 ne peut pas GC avant X secondes » ;
- « ne jamais refetch pendant X secondes ».

Rétention et fraîcheur sont deux décisions différentes.

---

## CACHE-002 — `refetchOnMountOrArgChange` n’est PAS `staleTime`

RTK Query ne possède pas une option native appelée `staleTime`.

`refetchOnMountOrArgChange` accepte :

- `false` : comportement cache normal ;
- `true` : refetch lorsqu’un nouveau subscriber est ajouté ;
- un `number` en **secondes** : comparaison de l’heure courante avec le dernier `fulfilled timestamp`, puis refetch si l’âge dépasse la valeur.

Le mot `staleTime` appartient à d’autres bibliothèques et NE DOIT PAS être documenté comme option RTK Query.

---

## CACHE-003 — `maxVisibleStaleAge` est une convention métier/frontend

Le projet PEUT définir une politique applicative telle que :

```ts
type DataFreshnessClass =
  | 'immutable'
  | 'reference'
  | 'user-mutable'
  | 'market'
  | 'transaction'
  | 'live';

type DataFreshnessPolicy = {
  class: DataFreshnessClass;
  allowStaleRender: boolean;
  maxVisibleStaleAgeMs: number | null;
  refetchOnOpen: boolean;
};
```

`maxVisibleStaleAgeMs` :

- n’est PAS une option RTK Query ;
- n’est PAS un header HTTP ;
- n’est PAS `keepUnusedDataFor` ;
- n’est PAS `refetchOnMountOrArgChange`.

C’est une règle de présentation/risque qui répond à :

> « Jusqu’à quel âge une ancienne réponse API peut-elle encore être montrée comme donnée dégradée pour CET usage ? »

Tout chiffre utilisé ici est **une CONVENTION PROJET à calibrer**, pas une constante universelle.

---

# 5. CLASSIFICATION SÉMANTIQUE DE LA DONNÉE

Avant toute optimisation, l’agent DOIT classer la ressource.

Il est interdit de choisir le comportement de cache uniquement à partir du type de composant (`modal`, `table`, `chart`). La **sémantique de la donnée** prime.

## 5.1 Classe A — IMMUTABLE / STATIC

Exemples :

- asset versionné ;
- document/version signé et immuable ;
- métadonnée dont l’identité change si son contenu change.

Politique :

- cache autorisé ;
- longue rétention possible ;
- stale render généralement admissible si l’objet est réellement immuable ;
- revalidation fréquente généralement inutile ;
- prefetch possible si intention probable.

Attention : « rarement modifié » n’est pas « immuable ».

---

## 5.2 Classe B — REFERENCE / READ-MOSTLY

Exemples :

- liste de pays ;
- secteurs ;
- instruments de sélection ;
- nomenclatures ;
- métadonnées d’entreprise ;
- catalogues officiels API qui changent peu.

Politique typique :

```text
affichage immédiat d’une ancienne réponse API admissible
+
revalidation selon ouverture/mount/focus/âge
+
invalidation après mutation connue
```

SWR est particulièrement adapté à cette classe lorsque `maxVisibleStaleAge` est respecté.

---

## 5.3 Classe C — USER-MUTABLE

Exemples :

- profil utilisateur ;
- préférences ;
- watchlist ;
- favoris ;
- paramètres ;
- notes utilisateur.

Politique :

- cache autorisé ;
- ancienne donnée API peut être affichée selon le risque ;
- après mutation réussie : tags/invalidation ou update manuelle justifiée ;
- read-your-own-writes doit être cohérent ;
- optimistic update seulement si le contrat et le rollback sont maîtrisés ;
- une mutation locale n’est jamais une preuve d’acceptation serveur avant confirmation.

---

## 5.4 Classe D — MARKET / VOLATILE

Exemples :

- dernier prix indicatif ;
- séries de marché régulièrement mises à jour ;
- indicateurs changeants ;
- données intraday non transactionnelles.

Politique :

- cache possible pour continuité visuelle si l’usage le permet ;
- durée stale visible courte et explicitement définie ;
- revalidation plus agressive ;
- focus/reconnect/polling/streaming à évaluer ;
- indicateur de dernier rafraîchissement pertinent ;
- ne jamais qualifier « temps réel » sans mécanisme qui le prouve.

Une ancienne valeur de marché peut être acceptable pour **continuité graphique**, mais pas nécessairement pour **décision transactionnelle**.

---

## 5.5 Classe E — TRANSACTION / ACTION-SENSITIVE

Exemples :

- solde utilisé pour confirmer une opération ;
- montant exécutable ;
- prix d’exécution ;
- disponibilité qui conditionne une action irréversible ;
- statut d’ordre ;
- donnée d’autorisation.

Politique :

- une valeur stale NE DOIT PAS être utilisée comme vérité courante pour autoriser/confirmer l’action ;
- revalidation fraîche obligatoire au moment approprié ;
- `refetchOnMountOrArgChange: true` peut forcer le refetch au nouvel abonnement, mais **ne désactive pas le cache** ;
- l’UI doit donc distinguer « valeur historique/cachée » de « valeur confirmée pour action » ;
- le bouton/action sensible doit rester gated tant que la condition de fraîcheur requise n’est pas satisfaite.

Si un backend envoie des directives HTTP telles que `must-revalidate`, `no-cache` ou `no-store`, le frontend ne doit pas prétendre les contourner.

RFC 9111 rappelle que les règles de cache doivent éviter la réutilisation inappropriée de réponses stale. L’idée générale est critique dans tout flux où une donnée ancienne peut produire une opération incorrecte.

---

## 5.6 Classe F — LIVE / STREAMING

Exemples :

- carnet d’ordres ;
- prix poussés en continu ;
- notifications live ;
- chat ;
- évènements serveur.

Politique :

- snapshot initial possible via query ;
- mises à jour via WebSocket/SSE/autre flux si l’API le fournit ;
- RTK Query peut gérer un lifecycle de streaming via `onCacheEntryAdded` ;
- `updateCachedData` met à jour l’entrée ;
- `cacheEntryRemoved` sert au cleanup ;
- un polling lourd du payload entier ne doit pas remplacer par défaut un flux disponible plus approprié ;
- après perte de connexion, l’UI doit afficher clairement le statut de synchronisation.

SWR seul n’est pas une architecture temps réel.

---

# 6. ALGORITHME DE DIAGNOSTIC OBLIGATOIRE — « OPTIMISER AVANT DE REFETCHER »

Lorsqu’un utilisateur dit :

- « ce modal est lent » ;
- « cette page charge lentement » ;
- « cette table clignote » ;
- « les données disparaissent » ;
- « ce dropdown rappelle l’API » ;
- « le graphique se vide » ;

l’agent NE DOIT PAS commencer par augmenter un TTL ou ajouter un cache.

Il DOIT répondre aux questions suivantes dans l’ordre.

## DIAG-001 — Le problème est-il réellement réseau ?

Inspecter :

- durée du request ;
- TTFB ;
- payload ;
- nombre de requests ;
- waterfall ;
- redirect ;
- erreur/retry ;
- throttling éventuel.

Si le réseau est rapide et l’UI lente, poursuivre côté rendering.

---

## DIAG-002 — Une donnée RTK Query existe-t-elle déjà ?

Vérifier :

- endpoint ;
- arguments ;
- `queryCacheKey` ;
- abonnement ;
- rétention ;
- remount ;
- state Redux/RTK Query.

Si la donnée existe mais l’UI affiche un skeleton, le problème peut être **l’UI**, pas le réseau.

---

## DIAG-003 — L’UI confond-elle `isLoading` et `isFetching` ?

**SOURCE-BACKED — RTK Query**

- `isLoading` : requête initiale en cours sans donnée disponible pour cette query.
- `isFetching` : une requête est en cours ; peut être vrai avec OU sans donnée antérieure.

Interdit :

```tsx
if (isFetching) {
  return <GlobalSkeleton />;
}
```

comme règle générique.

Règle projet :

```text
si donnée admissible présente
+
background fetch
→ garder la donnée visible
→ indicateur discret si utile
```

---

## DIAG-004 — L’UI détruit-elle elle-même les données ?

Chercher :

```ts
setRows([]);
setOptions([]);
setSeries([]);
reset();
```

déclenchés avant chaque fetch.

Chercher également :

```tsx
data ?? []
```

qui peut être légitime, mais devient problématique si `data` est artificiellement perdu à chaque changement.

Une revalidation ne doit pas vider l’UI par réflexe.

---

## DIAG-005 — Les query args sont-ils stables et complets ?

RTK Query sérialise les arguments pour créer `queryCacheKey`.

Doivent être vérifiés :

- `id: 1` vs `id: "1"` ;
- espaces ;
- casse ;
- ticker normalisé ;
- pagination ;
- filtres ;
- sort ;
- locale ;
- backend/client id ;
- paramètres optionnels ;
- objet reconstruit avec des valeurs réellement équivalentes.

Deux arguments qui ne se sérialisent pas vers la même clé ne partagent pas la même entrée.

---

## DIAG-006 — Y a-t-il des requêtes dupliquées ?

Vérifier Network.

Même `queryCacheKey` + subscriptions concurrentes :

- RTK Query partage l’entrée ;
- les requests identiques sont dédupliquées.

Mais :

```text
query A
≠
query B
```

même si les URLs « semblent proches ».

Une déduplication manuelle repository n’est justifiée que si elle couvre un **workflow composite** non équivalent à une simple query RTK.

---

## DIAG-007 — Le composant remount-il inutilement ?

Chercher :

- `key` instable ;
- conditional rendering qui démonte/remonte ;
- modal recréé ;
- changement de route/layout inutile ;
- parent qui change d’identité ;
- effet qui repart à chaque render.

Une politique de cache ne corrige pas un arbre React instable.

---

## DIAG-008 — Le problème est-il un re-render React ?

Mesurer :

- React DevTools Profiler ;
- `<Profiler>` si nécessaire ;
- durée de commits ;
- nombre de renders ;
- transformations coûteuses ;
- large arrays ;
- charts ;
- recalculs.

Ne pas ajouter `memo` ou `useMemo` à l’aveugle.

---

## DIAG-009 — Le problème est-il la taille du DOM ?

Pour de grandes listes/tables :

- nombre de rows réellement montées ;
- coût de layout ;
- paint ;
- scroll ;
- accessibilité.

Si des milliers d’éléments sont montés, le problème peut exiger pagination/virtualisation plutôt qu’un TTL.

---

## DIAG-010 — Le cache grossit-il sans borne ?

Inspecter :

- nombre d’entrées ;
- infinite query pages ;
- `keepUnusedDataFor` ;
- cycles de navigation ;
- heap ;
- detached DOM ;
- listeners ;
- sockets.

---

## DIAG-011 — Quelle est la classe sémantique ?

Avant d’afficher une ancienne donnée, classer la ressource A–F.

Le même comportement cache n’est pas appliqué :

```text
liste de secteurs
≠
watchlist
≠
prix indicatif
≠
prix d’exécution
≠
order status live
```

---

# 7. PRIMITIVES RTK QUERY — SÉMANTIQUE EXACTE

Cette section est volontairement stricte pour empêcher les mélanges TanStack/RTK Query.

## RTK-001 — `queryCacheKey`

**SOURCE-BACKED**

RTK Query crée une clé interne à partir de l’endpoint et des arguments sérialisés.

Même clé :

```text
cache partagé
+
updates partagées
+
déduplication des requests identiques
```

Règle projet :

> normaliser les arguments métier AVANT qu’ils ne deviennent des identités de cache contradictoires.

---

## RTK-002 — `keepUnusedDataFor`

**SOURCE-BACKED**

- unité : secondes ;
- valeur par défaut documentée : 60 s ;
- démarre après que le dernier subscriber s’est désabonné ;
- contrôle la rétention de l’entrée RTK Query.

NE PAS l’appeler :

- `gcTime` ;
- GC V8 ;
- fraîcheur ;
- TTL backend.

**CONVENTION PROJET :**
préférer des valeurs numériques explicites et révisables. Si le projet interdit `Infinity`, cette interdiction est une convention projet, pas une prétendue contrainte TypeScript universelle.

---

## RTK-003 — `refetchOnMountOrArgChange`

**SOURCE-BACKED**

```ts
false
true
number // secondes
```

- `true` : refetch lorsqu’un nouveau subscriber est ajouté ;
- `number` : refetch si ce nombre de secondes s’est écoulé depuis la dernière fulfillment.

`true` NE signifie PAS :

```text
cache désactivé
```

La donnée cache peut toujours exister pendant le refetch.

---

## RTK-004 — `refetchOnFocus` / `refetchOnReconnect`

**SOURCE-BACKED**

Disponibles dans RTK Query.

Le comportement global documenté nécessite :

```ts
setupListeners(store.dispatch);
```

Ils sont pertinents lorsqu’un retour de focus ou de réseau rend raisonnable une resynchronisation.

Ils NE DOIVENT PAS être activés aveuglément pour chaque endpoint sans considérer :

- volatilité ;
- coût ;
- payload ;
- fréquence de focus ;
- impact API.

---

## RTK-005 — `isLoading` / `isFetching`

**SOURCE-BACKED**

Règle correcte :

```text
isLoading
= chargement initial sans donnée

isFetching
= requête en cours
  avec ou sans donnée
```

**CONVENTION PROJET :**

```text
isLoading + aucune donnée utilisable
→ skeleton local / loading state possible

isFetching + donnée admissible
→ conserver la donnée
→ signaler la synchronisation sans blocage si utile
```

Le skeleton est un choix UI, pas une garantie framework.

---

## RTK-006 — `selectFromResult`

**SOURCE-BACKED**

`selectFromResult` permet de sélectionner une sous-partie du résultat de query et d’optimiser le rendering de cette vue.

Il est **optionnel**.

Il est recommandé quand :

- un composant consomme un seul item d’une grande collection ;
- une petite sous-partie change rarement ;
- le Profiler montre des re-renders inutiles.

Il ne doit pas être ajouté partout par dogme.

Attention : le résultat sélectionné est comparé de manière shallow. Retourner à chaque appel de nouveaux objets/arrays peut annuler le bénéfice.

---

## RTK-007 — Tags et invalidation

**SOURCE-BACKED**

Utiliser :

```ts
providesTags
invalidatesTags
```

pour relier les mutations aux queries dépendantes.

La documentation RTK Query privilégie généralement invalidation/refetch automatisé avant de multiplier les modifications manuelles complexes.

Pattern projet typique :

```ts
{ type: 'Widgets', id: 'LIST' }
{ type: 'Widgets', id }
```

et granularité adaptée à l’entité existante.

---

## RTK-008 — `updateQueryData` / `upsertQueryData`

**SOURCE-BACKED**

`updateQueryData` :

- met à jour une entrée existante ;
- utilise un recipe Immer ;
- ne doit pas être utilisé comme substitut automatique aux tags.

`upsertQueryData` :

- peut créer/remplacer une entrée ;
- n’est pas obligatoire après chaque mutation ;
- doit être utilisé seulement lorsque la stratégie manuelle est plus claire/utile que le refetch.

---

## RTK-009 — Prefetch

**SOURCE-BACKED**

`usePrefetch` prépare le cache sans créer l’abonnement persistant d’une query active.

Options importantes :

```ts
force: true
ifOlderThan: number
```

`ifOlderThan` :

- est optionnel ;
- est exprimé en secondes ;
- évite un prefetch si la donnée n’est pas assez ancienne.

`force: true` :

- force l’exécution ;
- mais une request identique déjà in-flight n’est pas dupliquée.

Le prefetch ne remplace pas un hook de query pour une donnée qui doit rester souscrite et réagir aux invalidations.

---

## RTK-010 — Infinite queries

**SOURCE-BACKED**

Dans une `infiniteQuery` :

- les pages sont stockées dans l’entrée ;
- par défaut, le nombre de pages peut croître sans limite spécifique ;
- `maxPages` borne le nombre de pages retenues dans CETTE entrée.

`maxPages` n’est pas une politique globale de mémoire de l’application.

---

## RTK-011 — Streaming

**SOURCE-BACKED**

Cycle type :

```text
onCacheEntryAdded
    ↓
ouvrir/attendre le canal
    ↓
updateCachedData(...)
    ↓
cacheEntryRemoved
    ↓
cleanup socket/listeners
```

Utiliser seulement si le backend fournit réellement le flux.

Ne jamais inventer un WebSocket absent du contrat.

---

# 8. RÈGLE SPÉCIALE — ARCHITECTURE LAZY EXISTANTE

Le projet utilise historiquement des repositories autour de `useLazyGet...Query`.

Cette directive NE FORCE PAS une migration vers `useQuery`.

## LAZY-001 — Comprendre le trigger

**SOURCE-BACKED**

Le trigger d’un `useLazyQuery` :

```ts
trigger(arg)
```

initie normalement une nouvelle request même si une donnée est déjà cachée.

Le deuxième argument :

```ts
trigger(arg, true)
```

correspond à `preferCacheValue: true` et peut retourner immédiatement la valeur cache au lieu de déclencher un nouveau fetch.

**Donc :**

- ne pas utiliser `preferCacheValue: true` partout ;
- si la policy exige une revalidation à l’ouverture, ne pas la supprimer accidentellement ;
- ne pas lancer deux triggers concurrents pour « cache puis réseau » sans besoin ;
- utiliser le comportement existant de la couche repository de manière cohérente.

## LAZY-002 — La page ne doit pas détruire l’ancien résultat pendant le trigger

Dans le pattern existant :

```text
page useEffect
→ getAllX()
→ lazy trigger
→ RTK Query
```

le composant doit continuer à rendre toute donnée admissible déjà exposée par le repository pendant le nouveau fetch.

---

# 9. MACHINE D’ÉTATS UI CANONIQUE

Les booléens RTK Query ne suffisent pas à décrire tout le contrat UX.

Le projet définit une machine de présentation dérivée.

| État UI | Donnée disponible | Request | Affichage |
|---|---:|---:|---|
| `initial-loading` | non | oui | skeleton/loading local |
| `ready` | oui | non | donnée |
| `revalidating` | oui | oui | donnée + indicateur discret |
| `empty` | réponse valide vide | non | état vide explicite |
| `error-no-cache` | non | échec | erreur explicite |
| `stale-degraded` | oui, stale autorisé | échec/ancien | donnée + avertissement |
| `expired` | oui mais trop ancienne | variable | ne pas l’utiliser comme courante |
| `transaction-verifying` | cache éventuellement présent | oui | action sensible gated |
| `stream-disconnected` | dernier snapshot possible | canal down | statut live dégradé |

---

## UI-001 — Premier chargement

Condition conceptuelle :

```text
pas de donnée utilisable
+
chargement en cours
```

Rendu :

- skeleton local ;
- placeholder dimensionnel stable ;
- message de chargement.

Interdit :

- fallback métier inventé ;
- skeleton qui change toute la page sans nécessité.

---

## UI-002 — Revalidation avec donnée admissible

Condition :

```text
ancienne réponse API encore admissible
+
request en cours
```

Rendu :

- conserver la donnée ;
- conserver interaction ;
- indicateur discret si utile ;
- ne pas reset selection/scroll/focus ;
- ne pas remplacer par `[]`.

---

## UI-003 — Réponse vide valide

Une réponse API vide est distincte d’une erreur.

Rendu :

```text
« Aucun résultat »
```

ou l’état vide métier attendu.

Interdit :

```text
API vide
→ fallback local
```

---

## UI-004 — Erreur sans cache

Rendu explicite :

- erreur ;
- retry si pertinent ;
- aucun faux « 0 résultat » ;
- aucune donnée inventée.

---

## UI-005 — Erreur avec cache stale autorisé

Si la classe autorise l’ancienne donnée et que son âge reste sous la limite projet :

- conserver la donnée ;
- signaler l’échec de synchronisation ;
- signaler l’ancienneté si le risque l’exige ;
- garder retry/refetch disponible.

---

## UI-006 — Cache expiré

Si âge > `maxVisibleStaleAge` :

- ne plus présenter la valeur comme courante ;
- afficher état de rechargement/indisponibilité ;
- une valeur historique peut éventuellement rester visible uniquement si le design la marque explicitement comme historique.

---

# 10. RECETTES PAR TYPE D’INTERFACE

## 10.1 MODAL

### MODAL-001 — ouverture sans cache

```text
open
→ contenu du modal monté
→ loading local
→ request
→ validation
→ data
```

Le modal ne doit pas fermer/réouvrir pour charger.

### MODAL-002 — ouverture avec cache admissible

```text
open
→ donnée visible immédiatement
→ UI interactive
→ revalidation selon policy
→ remplacement par nouvelle réponse
```

Doit préserver :

- focus ;
- scroll ;
- valeur sélectionnée ;
- identifiant sélectionné ;
- dimensions raisonnablement stables.

La sélection doit être liée à un identifiant stable, jamais à un index.

Si l’ID sélectionné disparaît dans la réponse fraîche :

- désélectionner proprement ;
- informer si nécessaire ;
- ne pas casser le modal.

### MODAL-003 — Pagination anticipée d’un catalogue API

Pour un catalogue de titres paginé, le modal doit dissocier le rendu initial, le préchargement et la demande déclenchée par le scroll.

```text
ouverture
→ requête API de la première page
→ affichage des lignes valides dès réception
→ préchargement borné des pages suivantes
→ fusion progressive dans l’ordre API
→ compteur exact après complétion du catalogue
```

Règles obligatoires :

- le préchargement est borné par une fenêtre configurable et ne doit pas lancer une pagination infinie ;
- chaque requête est identifiée au minimum par `marché + page + page_size + filtres + tri` ;
- un registre in-flight partagé doit permettre au préchargement et au scroll de rejoindre la même Promise ;
- atteindre le bas de la liste ne doit jamais relancer une requête déjà en cours ou déjà résolue ;
- les pages reçues peuvent être rendues progressivement, mais leur ordre API doit rester déterministe ;
- une page suivante lente ou en erreur ne doit pas effacer les pages déjà valides ;
- le compteur affiché comme exact ne doit pas augmenter artificiellement pendant l’arrivée des pages : avant complétion, afficher un état transitoire explicite tel que `… titres` ou `Mise à jour des titres…` ;
- le loader secondaire ne doit pas bloquer l’interaction lorsque la page est déjà préchargée ou en cours de résolution ;
- un changement de marché, de filtre ou de recherche doit isoler les requêtes de l’ancien intent et empêcher leurs réponses d’écraser le nouveau catalogue ;
- aucune donnée locale, mock ou liste de secours ne doit compléter un catalogue API incomplet ;
- la stratégie doit rester applicable à tous les marchés exposés par l’interface : BRVM, CSE, GSE, JSE, NGX et NSE.

### MODAL-004 — Preuve de pagination sans attente au scroll

La conformité doit être prouvée dans Chrome DevTools sur un marché possédant plusieurs pages :

1. ouvrir le modal avec un cache vide ou après changement de marché ;
2. vérifier que la première page apparaît sans fermeture/réouverture du modal ;
3. vérifier que les pages suivantes sont demandées en arrière-plan dans une fenêtre bornée ;
4. atteindre le bas de la liste pendant le préchargement ;
5. vérifier que le scroll rejoint les requêtes in-flight au lieu de créer des doublons ;
6. vérifier que les nouvelles lignes apparaissent dès leur réponse, sans attente d’un nouveau geste ;
7. vérifier que le compteur final est exact et stable ;
8. répéter le scénario sur les six marchés lorsque leur catalogue est disponible ;
9. inspecter le réseau, le DOM et la console : aucune boucle, aucune réponse d’ancien intent, aucun fallback local.

---

## 10.2 TABLE

### TABLE-001 — Ne jamais blanker une table pendant un background fetch

Interdit :

```tsx
if (isFetching) return <TableSkeleton />;
```

si une donnée admissible existe.

### TABLE-002 — Pagination

- page courante reste visible pendant chargement suivant ;
- page suivante en erreur ne détruit pas les pages valides ;
- params pagination font partie de l’identité de query lorsque le modèle de cache est par page ;
- avec infinite query, utiliser ses primitives natives ;
- ordre API conservé sauf règle métier explicite.

### TABLE-003 — Volume

Si le bottleneck est le DOM :

- pagination ;
- virtualisation ;
- réduction du nombre de rows montées ;
- mesure.

Ne pas essayer de résoudre 20 000 nœuds DOM en changeant `keepUnusedDataFor`.

---

## 10.3 SELECT / AUTOCOMPLETE

### SELECT-001 — Args stables

La queryKey doit inclure tout paramètre déterminant :

- recherche ;
- filtre ;
- pagination ;
- locale ;
- contexte métier.

### SELECT-002 — Keystrokes

Des requêtes :

```text
"a"
"ab"
"abc"
```

ont des clés différentes et ne sont pas « dédupliquées » comme une seule query.

Si le nombre de requests devient excessif :

- debounce réseau ;
- minimum de caractères ;
- annulation/ignore de résultats non pertinents ;
- `useDeferredValue` pour le rendu seulement si utile.

`useDeferredValue` ne réduit pas à lui seul le nombre de requests réseau.

### SELECT-003 — Ancien résultat

Une ancienne liste peut rester visible pendant la recherche suivante uniquement si le design indique clairement qu’elle correspond à l’ancien critère ou si la policy l’autorise.

Ne jamais présenter les résultats de `"a"` comme ceux de `"abc"` sans distinction.

---

## 10.4 WATCHLIST

### WATCH-001

Pendant revalidation :

- conserver les items admissibles ;
- conserver ordre/selection/scroll ;
- ne pas reconstruire toute la watchlist depuis zéro.

### WATCH-002

Après mutation :

- préférer tags/invalidation ciblée ;
- optimistic update seulement avec rollback correct ;
- confirmation serveur requise.

---

## 10.5 GRAPH / CHART

### CHART-001 — Continuité

Un graphique historique admissible ne doit pas nécessairement devenir vide pendant revalidation.

Peut conserver :

- ancienne série ;
- axes ;
- viewport ;
- zoom ;
- sélection ;
- overlays qui restent cohérents.

### CHART-002 — Changement de symbole

Ne pas mélanger visuellement :

```text
symbole A
+
titre/metadata du symbole B
```

Si l’ancienne série reste visible pendant chargement de B, elle doit être clairement associée à A ou visuellement marquée comme transition.

### CHART-003 — Temps réel

SWR ne remplace pas :

- WebSocket ;
- SSE ;
- subscription ;
- polling adapté.

---

## 10.6 FILTRES / COMPARAISON

Lors d’un changement de filtre :

- ne pas blanker toute la page si une transition contrôlée suffit ;
- garder layout stable ;
- éviter des effets en cascade qui déclenchent plusieurs GET ;
- utiliser `startTransition` uniquement pour le scheduling de rendu si le render est lourd ;
- ne pas prétendre que `startTransition` accélère l’API.

---

## 10.7 INFINITE LIST

- utiliser `infiniteQuery` si le modèle produit correspond ;
- définir `maxPages` si la croissance en mémoire doit être bornée ;
- tester navigation retour/scroll ;
- tester page suivante en erreur ;
- tester longue session ;
- virtualiser si le DOM devient le bottleneck.

---

# 11. RENDERING REACT — LE CACHE NE SUFFIT PAS

Une UI peut avoir un excellent cache et rester lente.

Les budgets suivants sont différents :

```text
network
cache
JavaScript
React render
DOM
layout
paint
memory
```

---

## RENDER-001 — `selectFromResult` avant memoisation généralisée

Si un composant consomme une petite sous-partie d’une grosse query :

1. profiler ;
2. examiner `selectFromResult` ;
3. stabiliser les valeurs retournées ;
4. seulement ensuite envisager d’autres memoizations.

---

## RENDER-002 — `memo` / `useMemo` sont des optimisations

**SOURCE-BACKED — React**

Ils ne doivent pas réparer une logique incorrecte.

Avant d’ajouter :

```ts
memo(...)
useMemo(...)
useCallback(...)
```

demander :

- ce calcul est-il réellement coûteux ?
- ce composant re-render-t-il réellement trop ?
- les dependencies sont-elles stables ?
- le Profiler montre-t-il un gain ?

`useMemo` n’améliore pas le premier rendu ; il peut éviter du travail sur des renders ultérieurs.

---

## RENDER-003 — `startTransition`

**SOURCE-BACKED — React**

`startTransition` marque des mises à jour d’état comme non bloquantes.

Il peut maintenir l’UI réactive pendant un rendu lourd.

Il NE :

- réduit pas le TTFB ;
- réduit pas le payload ;
- déduplique pas RTK Query ;
- n’accélère pas le serveur ;
- ne transforme pas une donnée stale en donnée fraîche.

---

## RENDER-004 — `useDeferredValue`

**SOURCE-BACKED — React**

`useDeferredValue` peut faire « lagger » une valeur de rendu et conserver temporairement l’ancienne représentation pendant le rendu de la nouvelle.

Important :

- il ne bloque pas les requests réseau ;
- il ne fait pas de debounce réseau ;
- il peut afficher volontairement un contenu stale ;
- l’UI devrait signaler cette divergence si elle peut tromper l’utilisateur.

---

## RENDER-005 — Virtualisation

**RECOMMANDATION À MESURER**

Pour de très grandes listes :

- rendre uniquement la fenêtre visible peut réduire le coût DOM ;
- préserver accessibilité clavier/ARIA ;
- tester scroll ;
- tester hauteur dynamique ;
- tester lecteurs d’écran si requis.

La virtualisation n’est pas obligatoire pour une liste petite ou simple.

---

## RENDER-006 — `content-visibility`

Peut être évalué pour des zones longues/offscreen.

Ne pas l’introduire sans test :

- accessibilité ;
- recherche navigateur ;
- layout ;
- compatibilité.

---

# 12. PREFETCH — ANTICIPER SANS GASPILLER

Les grandes interfaces performantes essaient souvent de charger **avant le clic** ce qui est hautement probable, pas tout ce qui existe.

## PREFETCH-001 — Signal d’intention

Déclencheurs possibles :

- hover ;
- focus ;
- pointerdown ;
- élément proche du viewport ;
- navigation hautement probable.

Les seuils de délai (`100 ms`, etc.) sont des **RECOMMANDATIONS À MESURER**, jamais une vérité universelle.

## PREFETCH-002 — Ne pas précharger tout

Le prefetch consomme :

- bande passante ;
- CPU parsing ;
- mémoire cache ;
- connexions ;
- budget serveur.

Il doit être :

- intention-aware ;
- borné ;
- utile ;
- mesuré.

## PREFETCH-003 — Données sensibles/volatiles

Ne pas précharger automatiquement des données action-sensitive simplement pour gagner quelques millisecondes si cela produit une fausse perception de fraîcheur.

Le prefetch peut préparer une ressource ; l’action transactionnelle doit toujours respecter sa propre policy de validation.

---

# 13. PAGINATION, VOLUME ET « FETCH LESS »

Principe de grande échelle :

> Le navigateur d’un utilisateur ne doit traiter que la partie du système nécessaire à cet utilisateur maintenant.

## DATA-001 — Ne pas demander 10 000 objets si 50 suffisent

Quand l’API le permet :

- pagination ;
- cursor ;
- filtrage serveur ;
- plage temporelle ;
- page size raisonnable.

Ne pas surcharger le frontend par défaut puis « optimiser le rendu ».

## DATA-002 — Delta/synchronisation partielle

Si l’API fournit officiellement :

- `updated_since` ;
- cursor ;
- version ;
- ETag ;
- history token ;
- delta endpoint ;

préférer un update différentiel lorsque cela réduit clairement le volume et la complexité.

Ne jamais inventer un contrat delta absent de Django.

---

# 14. STREAMING / LIVE

## STREAM-001 — Utiliser le mécanisme fourni par le backend

Si aucun WebSocket/SSE n’existe :

- ne pas le fabriquer côté frontend ;
- polling possible selon contraintes ;
- expliciter que ce n’est pas du true realtime.

## STREAM-002 — Cleanup obligatoire

Toute connexion persistante doit :

- être reliée à un lifecycle ;
- fermer listeners/sockets ;
- éviter les doubles subscriptions ;
- gérer reconnect/backoff si requis ;
- ne pas continuer à écrire dans une entrée qui n’est plus pertinente.

## STREAM-003 — État de connexion visible

Pour une donnée live :

```text
connected
reconnecting
disconnected
stale snapshot
```

doivent être distinguables si cela influence l’interprétation.

---

# 15. MÉMOIRE — « CACHE EVERYTHING FOREVER » EST INTERDIT

Une application longue durée peut devenir lente non parce qu’elle fetch trop, mais parce qu’elle ne libère rien.

## MEM-001 — Bornage

Examiner :

- `keepUnusedDataFor` ;
- nombre de cache entries ;
- infinite pages ;
- results de recherche multiples ;
- charts historiques ;
- blobs/images ;
- listeners ;
- WebSockets ;
- timers ;
- closures ;
- detached DOM.

## MEM-002 — RTK eviction ≠ GC V8

Quand RTK Query supprime une entrée du store, il retire une référence de cette couche.

Cela ne garantit pas que toute la mémoire associée est immédiatement libérée :

- d’autres références peuvent exister ;
- closures/listeners peuvent retenir des objets ;
- DOM détaché peut être retenu.

## MEM-003 — Mesurer les longues sessions

Pour les écrans utilisés pendant des heures :

- reproduire cycles ouverture/fermeture ;
- navigation aller/retour ;
- changement de symboles ;
- scroll long ;
- streaming ;
- mutations.

Comparer heap avant/après cycles équivalents.

Une croissance monotone sans retour vers un plateau raisonnable est un signal d’investigation.

---

# 16. ERREURS ET MODES DÉGRADÉS

## ERR-001 — Timeout

Le timeout est distinct de :

- HTTP 4xx ;
- HTTP 5xx ;
- parsing JSON ;
- validation schema ;
- offline.

Le message et le retry peuvent différer.

## ERR-002 — Retry borné

Retry seulement si le type d’erreur est transitoire et si cela ne crée pas :

- tempête de requêtes ;
- mutation dupliquée ;
- action financière répétée.

Aucun retry automatique illimité.

## ERR-003 — Validation

Une réponse ne doit être acceptée que si les validations déjà prévues par l’architecture sont satisfaites :

- HTTP ;
- parsing ;
- schema ;
- IDs ;
- pagination ;
- cohérence des paramètres.

## ERR-004 — Empty ≠ Error

```text
200 + [] valide
```

est un état vide, pas une panne.

## ERR-005 — Erreur de revalidation

Si cache stale autorisé :

```text
garder donnée
+
signaler sync failure
+
respecter maxVisibleStaleAge
```

Si stale interdit :

```text
ne pas utiliser cache comme vérité courante
+
bloquer/gater l’action qui exige confirmation
```

---

# 17. CONCURRENCE, DÉDUPLICATION ET ORDERING

## CONC-001 — Même clé

Même `queryCacheKey` :

- cache partagé ;
- updates partagées ;
- request identique dédupliquée.

## CONC-002 — Clés différentes

```text
search="a"
search="ab"
```

sont des opérations différentes.

La déduplication native ne garantit pas qu’une interface de recherche n’affichera jamais un ancien intent si le code de présentation mélange les résultats.

## CONC-003 — Réponse ancienne/lente

Cette directive NE prétend PAS qu’une garantie universelle anti-race de RTK Query est documentée pour tous les workflows.

Invariant projet :

> une réponse correspondant à un intent antérieur ne doit pas remplacer visuellement l’état accepté d’un intent plus récent.

Ce comportement DOIT être testé.

Si nécessaire dans un workflow composite :

- comparer arg courant ;
- utiliser l’identité de request/intention ;
- annuler ;
- ignorer résultat obsolète ;
- garder `currentData`/donnée correspondant au paramètre courant lorsque disponible et approprié.

## CONC-004 — Déduplication repository custom

Un registry de Promise au-dessus de RTK Query peut rester justifié pour un workflow tel que :

```text
ticker
→ tentative endpoint A
→ fallback ticker → ISIN
→ endpoint B
```

mais il ne doit PAS devenir un deuxième cache séquentiel.

Règles :

- seulement in-flight ;
- clé déterministe ;
- entrée supprimée après resolve/reject ;
- aucune donnée métier persistée dans ce registry.

---

# 18. MUTATIONS ET COHÉRENCE

## MUT-001 — Tags d’abord

Quand une mutation affecte des queries connues :

```text
mutation success
→ invalidatesTags
→ queries actives refetch
```

est le baseline.

## MUT-002 — Optimistic update

Autorisé seulement si :

- UX bénéficie réellement ;
- rollback correct ;
- conflit acceptable ;
- mutation idempotente/maîtrisée selon besoin.

En cas de concurrence complexe, préférer invalidation/refetch plutôt qu’un patch local fragile.

## MUT-003 — Read-your-own-writes

Après une modification utilisateur :

- ne pas réafficher durablement l’ancienne donnée comme si la mutation n’avait pas eu lieu ;
- utiliser invalidation ou update local correctement synchronisé ;
- gérer rejet serveur.

---

# 19. OBSERVABILITÉ ET MESURE

Une optimisation n’est pas « réussie » parce qu’elle semble plus rapide sur le laptop du développeur.

## OBS-001 — Network

Mesurer/inspecter :

- nombre de GET ;
- doublons ;
- durée ;
- payload bytes ;
- status ;
- retries ;
- redirect ;
- requests annulées ;
- waterfall.

## OBS-002 — Cache

Suivre lorsque pertinent :

- cache hit observable ;
- âge de dernière fulfillment ;
- revalidation count ;
- invalidations ;
- cache entries ;
- cache stale utilisé pendant panne ;
- cache expiré refusé.

## OBS-003 — UX

Mesures produit possibles :

- time-to-modal-content ;
- time-to-table-content ;
- time-to-interactive control ;
- stabilité selection/scroll/focus ;
- nombre de skeletons bloquants ;
- layout shifts.

Les seuils doivent être calibrés sur le produit.

## OBS-004 — Rendering

Utiliser :

- React DevTools Profiler ;
- `<Profiler>` pour mesures ciblées ;
- Performance panel ;
- long tasks ;
- CPU throttling lorsque pertinent.

## OBS-005 — Mémoire

Utiliser :

- Memory panel ;
- heap snapshots ;
- allocation sampling ;
- outils de détection de leaks lorsque disponibles.

## OBS-006 — RUM

Mesurer les utilisateurs réels si l’infrastructure existe.

Les APIs de « soft navigation » navigateur qui sont encore expérimentales ne doivent pas devenir un critère universel de conformité.

---

# 20. BROWSER PROOF OBLIGATOIRE POUR UNE CORRECTION UI

Une tâche de performance frontend n’est pas prouvée uniquement par :

```text
TypeScript compile
+
tests unitaires verts
```

Quand Chrome DevTools MCP/CDP est disponible, la validation doit couvrir le système observable.

## BROWSER-001 — Network

Prouver :

- nombre d’appels ;
- déduplication attendue ;
- background refetch ;
- status ;
- payload ;
- absence de loop.

## BROWSER-002 — DOM / UI

Prouver :

- donnée cache visible quand autorisée ;
- pas de blank inutile ;
- state empty/error correct ;
- sélection stable ;
- focus stable ;
- scroll stable ;
- modal reste ouvert.

## BROWSER-003 — Console

Prouver :

- pas de nouvelle erreur ;
- pas de warning critique ;
- pas de loop ;
- pas de unhandled rejection.

## BROWSER-004 — Performance

Si la mission concerne du jank :

- profiler interaction ;
- identifier long task ;
- mesurer avant/après.

## BROWSER-005 — Memory

Si la mission concerne longue session/cache/list/stream :

- cycles reproductibles ;
- snapshot ;
- comparer croissance.

---

# 21. MATRICE DE TESTS MINIMALE

Chaque correction choisit les lignes pertinentes, mais les scénarios critiques ne doivent pas être oubliés.

| ID | Scénario | Résultat attendu |
|---|---|---|
| T01 | first load, cache absent | loading local puis donnée |
| T02 | cache admissible présent | donnée immédiate |
| T03 | cache + refetch | donnée reste visible + sync discrète |
| T04 | réponse fraîche modifiée | UI adopte la nouvelle réponse |
| T05 | deux consumers même query | un seul fetch identique in-flight |
| T06 | args `1` vs `"1"` | identité vérifiée, pas de supposition |
| T07 | unmount/remount dans retention | cache réutilisé selon policy |
| T08 | stale autorisé + API down | donnée + état dégradé |
| T09 | stale expiré | donnée non présentée comme courante |
| T10 | transaction-sensitive + cache | action gated jusqu’à validation requise |
| T11 | HTTP 500 sans cache | erreur explicite |
| T12 | timeout | erreur/retry borné |
| T13 | malformed JSON/schema | réponse rejetée |
| T14 | réponse vide valide | empty state |
| T15 | page suivante erreur | pages valides conservées |
| T16 | mutation success | invalidation/update correct |
| T17 | mutation reject | rollback/erreur correct |
| T18 | réponse ancienne lente après nouvelle | intent récent reste affiché |
| T19 | modal close pendant request | aucun effet visuel fantôme |
| T20 | focus/reconnect | refetch seulement si policy/config |
| T21 | long scroll/infinite | mémoire bornée selon design |
| T22 | streaming unmount | socket/listener cleanup |
| T23 | streaming disconnect | état connexion explicite |
| T24 | autocomplete frappe rapide | résultats correspondent au critère courant |
| T25 | revalidation chart | viewport/series stables si policy l’autorise |

---

# 22. INTERDICTIONS ABSOLUES

## PROH-001 — Faux cache

Interdit :

- `Map()` local servant de cache métier permanent ;
- cache global artisanal sans preuve ;
- `useRef` comme cache de données serveur ;
- `localStorage` comme cache principal de données financières/volatiles ;
- `sessionStorage` comme vérité serveur ;
- dupliquer la même donnée dans plusieurs stores sans contrat.

Avant tout nouveau cache frontend :

> **prouver pourquoi RTK Query ne couvre pas le besoin.**

---

## PROH-002 — Fallback mensonger

Interdit :

- catalogue local sur erreur réseau ;
- prix fake ;
- liste seed « pour que l’UI ne soit pas vide » ;
- erreur transformée en `[]`.

---

## PROH-003 — Terminologie cross-library

Interdit dans la documentation RTK Query du projet :

- `staleTime` présenté comme option RTKQ ;
- `gcTime` présenté comme option RTKQ ;
- `structuralSharing: false` présenté comme option RTKQ.

---

## PROH-004 — Faux équivalents

Interdit d’écrire :

```text
keepUnusedDataFor = fraîcheur
refetchOnMountOrArgChange:true = no cache
isFetching = cache présent
prefetch = subscription
maxPages = memory manager global
RTK Query = source de vérité
```

---

## PROH-005 — UI destructrice

Interdit par défaut :

- vider une liste avant refetch ;
- fermer un modal pour recharger ;
- global skeleton alors que donnée admissible existe ;
- reset scroll/focus/selection sans raison métier ;
- index de tableau comme identité métier.

---

## PROH-006 — Optimisation aveugle

Interdit de déclarer « optimisation » sans diagnostic :

- ajouter `memo` partout ;
- `useMemo` partout ;
- virtualiser 20 lignes ;
- prefetcher toutes les routes/data ;
- monter `keepUnusedDataFor` arbitrairement ;
- polling agressif ;
- nouvelle librairie cache.

---

# 23. DEFINITION OF DONE — CONFORMITÉ D’UNE INTERFACE

Une interface ne peut être déclarée conforme que si les points applicables sont prouvés.

## Données / API

- [ ] La donnée provient uniquement du contrat API ou d’un état optimiste autorisé.
- [ ] Aucun fallback métier local n’a été ajouté.
- [ ] Empty et Error sont distingués.
- [ ] La classe sémantique A–F est identifiée.
- [ ] La politique stale est explicitée.
- [ ] `maxVisibleStaleAge` éventuel est une convention projet documentée.

## RTK Query

- [ ] Les args produisant la cache identity sont stables.
- [ ] Pas de `staleTime`/`gcTime` faux.
- [ ] `keepUnusedDataFor` n’est pas utilisé comme freshness.
- [ ] La politique de refetch est explicite.
- [ ] Tags/invalidation sont corrects après mutation.
- [ ] `selectFromResult` n’est utilisé que si justifié.
- [ ] Prefetch est intention-aware si utilisé.
- [ ] Infinite query est bornée si nécessaire.
- [ ] Streaming cleanup est prouvé si applicable.

## UI

- [ ] First-load distinct de background fetch.
- [ ] Aucun global skeleton inutile avec donnée admissible.
- [ ] Pas de `[]` temporaire inutile.
- [ ] Focus stable.
- [ ] Scroll stable.
- [ ] Sélection stable par ID.
- [ ] Layout raisonnablement stable.
- [ ] Stale/degraded visible si nécessaire.
- [ ] Transaction-sensitive gated jusqu’à validation requise.

## Concurrence

- [ ] Même query key ne produit pas de doublon réseau in-flight.
- [ ] La réponse d’un ancien intent ne remplace pas la vue d’un intent récent.
- [ ] Les workflows composites ont une stratégie anti-duplication explicite si nécessaire.

## Performance

- [ ] Le bottleneck identifié est documenté : réseau / cache / render / DOM / mémoire.
- [ ] Toute optimisation React significative a une mesure.
- [ ] Toute virtualisation/prefetch/polling a une justification.

## Browser proof

- [ ] Network inspecté.
- [ ] DOM/visuel inspecté.
- [ ] Console inspectée.
- [ ] Performance inspectée si mission de jank.
- [ ] Memory inspectée si mission mémoire/longue session.
- [ ] Les scénarios de panne pertinents ont été testés.

---

# 24. PROTOCOLE D’EXÉCUTION POUR CODEX / AGENT1 / AGENT2 / AUTRE LLM

Lorsqu’un agent reçoit :

> « Mets cette interface en conformité avec `API_FIRST_STALE_WHILE_REVALIDATE_DIRECTIVE.md`. »

il DOIT suivre ce protocole.

## PHASE 1 — READ

Lire :

1. `API_FIRST_ABSOLUTE_RULE.md` si présent ;
2. `ARCHITECTURE_DATA_FLOW.md` ;
3. ce fichier ;
4. le repository concerné ;
5. l’endpoint RTK Query concerné ;
6. la page/composant concerné ;
7. les transformations utilisées.

Ne pas modifier le code avant de reconstruire le flux réel.

---

## PHASE 2 — CLASSIFY

Déclarer :

```text
RESOURCE_CLASS =
immutable | reference | user-mutable | market | transaction | live
```

Puis documenter :

```text
ALLOW_STALE_RENDER =
MAX_VISIBLE_STALE_AGE =
REVALIDATION_TRIGGER =
MUTATION_INVALIDATION =
PREFETCH_POLICY =
```

Les valeurs chiffrées non existantes doivent être marquées :

```text
RECOMMANDATION À CALIBRER
```

---

## PHASE 3 — DIAGNOSE

Inspecter au minimum :

```text
NETWORK
CACHE
QUERY KEY
LOADING STATES
DUPLICATE FETCH
REMOUNT
RENDERING
DOM SIZE
MEMORY si pertinent
```

Produire la cause racine avant de choisir la correction.

---

## PHASE 4 — MINIMAL FIX

Appliquer la plus petite correction qui satisfait la directive.

Ordre de préférence :

```text
corriger UI state
→ corriger query args
→ exploiter RTK cache natif
→ corriger tags/invalidation
→ corriger revalidation
→ prefetch ciblé
→ pagination/virtualisation si volume
→ rendering optimization si mesuré
→ custom workflow dedup seulement si nécessaire
```

Ne pas refondre l’architecture.

---

## PHASE 5 — TEST

Exécuter :

- tests existants ;
- tests ciblés ajoutés si nécessaire ;
- typecheck ;
- scénarios de la matrice pertinents.

---

## PHASE 6 — BROWSER PROOF

Dans Chrome :

- Network ;
- DOM ;
- Console ;
- interactions ;
- cache/revalidation ;
- erreur ;
- sélection/focus/scroll.

Ajouter Performance/Memory selon la cause racine.

---

## PHASE 7 — REPORT

Le rapport final doit inclure :

```text
CAUSE RACINE
CLASSE DE DONNÉE
POLITIQUE RETENUE
FICHIERS MODIFIÉS
COMPORTEMENT AVANT
COMPORTEMENT APRÈS
TESTS
BROWSER PROOF
LIMITATIONS / NON CONTRÔLABLE BACKEND
```

Interdit :

```text
« Done » sans preuve.
```

---

# 25. EXEMPLES DE RAISONNEMENT

## Exemple A — Modal de titres lent

Symptôme :

```text
à chaque ouverture → skeleton 800 ms
```

Diagnostic :

```text
RTK cache existe
+
useLazyQuery trigger refetch
+
page fait if (isFetching) skeleton
```

Correction :

```text
isLoading sans donnée → skeleton
isFetching avec donnée admissible → liste reste visible
revalidation continue
```

Aucun nouveau cache.

---

## Exemple B — Trois GET identiques

Symptôme :

```text
3 composants → 3 GET
```

Diagnostic :

1. comparer endpoint ;
2. comparer args sérialisés ;
3. identifier différences de types/params ;
4. vérifier si les appels sont réellement simultanés ;
5. vérifier si le repository déclenche des workflows distincts.

Correction :

- normaliser args si bug ;
- réutiliser même query ;
- ne pas ajouter une `Map` cache par réflexe.

---

## Exemple C — Autocomplete lent

Symptôme :

```text
une request par frappe
```

Observation :

```text
"a" != "ab" != "abc"
```

Donc ce ne sont pas des requests dédupliquées par même query key.

Solutions possibles :

- debounce ;
- minimum chars ;
- cancellation/ignore ;
- cache RTK des recherches précédentes ;
- `useDeferredValue` uniquement pour jank de rendu.

---

## Exemple D — Chart se vide au changement de période

Si ancienne série et nouvelle période sont sémantiquement compatibles pour transition :

```text
conserver ancienne série
+
indicateur loading
+
remplacer lorsque nouvelle série arrive
```

Si elles ne sont pas compatibles :

- conserver layout ;
- afficher placeholder local ;
- ne pas laisser croire que l’ancienne période correspond à la nouvelle.

---

## Exemple E — Confirmation financière

Cache contient un ancien solde.

Policy = transaction-sensitive.

Interdit :

```text
ancien solde cache
→ bouton confirmer immédiatement
```

Correct :

```text
ancien solde éventuellement affiché comme non confirmé/historique
+
fresh verification
+
action gated
+
API success
→ confirmation
```

---

# 26. CE QUI EST CONSERVÉ DE L’ANCIENNE DIRECTIVE

Les principes suivants restent pleinement actifs :

- API-first ;
- cache = optimisation, pas vérité indépendante ;
- afficher vite lorsque le cache est admissible ;
- ne jamais inventer ;
- ne pas blanker l’UI pendant revalidation ;
- focus/scroll/sélection stables ;
- tags/invalidation ;
- pagination non destructive ;
- empty ≠ error ;
- erreur de revalidation ne détruit pas automatiquement une ancienne réponse admissible ;
- test browser obligatoire ;
- observabilité ;
- protection contre les intents/réponses hors ordre comme invariant ;
- aucune donnée locale pour « compléter » l’API.

---

# 27. CE QUI EST SUPERSEDED / CORRIGÉ

## Ancienne règle : « SWR partout »

**SUPERSEDED**

Remplacé par :

> politique de fraîcheur déterminée par la classe sémantique A–F.

---

## Ancienne règle : « revalidation à chaque ouverture même < 30 s » universelle

**SUPERSEDED COMME RÈGLE UNIVERSELLE**

Peut rester policy d’un endpoint précis si son risque/contrat le justifie.

---

## Ancienne règle : `freshnessWindow = fenêtre de déduplication`

**CORRIGÉE**

Séparer :

- in-flight dedup RTK Query ;
- age-based refetch ;
- prefetch age ;
- app max visible stale age ;
- retention.

---

## Ancienne règle : anti-race universel attribué au framework

**CORRIGÉE**

La non-régression vers un ancien intent est un invariant système à tester.

---

## Ancienne limite : « la directive ne traite que freshness, pas rendering »

**SUPERSEDED**

La présente version couvre désormais :

```text
Data Freshness
+
Cache
+
Rendering
+
Memory
+
Scheduling
+
Prefetch
+
Measurement
```

sans prétendre que toutes ces dimensions sont résolues par RTK Query.

---

# 28. ARBRE DE DÉCISION RAPIDE

```text
INTERFACE API LENTE / INSTABLE
        |
        v
1. CLASSER LA DONNÉE A–F
        |
        v
2. CACHE RTK EXISTE ?
   |            |
  NON          OUI
   |            |
first load     3. EST-IL ADMISSIBLE ?
loading          |          |
                NON        OUI
                 |          |
           ne pas utiliser  rendre immédiatement
                 |          |
                 +----- revalidation selon policy
                            |
                            v
4. LENTE MALGRÉ CACHE ?
        |
        +--> duplicate requests ?
        +--> args instables ?
        +--> remount ?
        +--> isFetching => skeleton ?
        +--> gros payload ?
        +--> trop de DOM ?
        +--> re-render React ?
        +--> cache/mémoire non borné ?
        |
        v
5. APPLIQUER LE PLUS PETIT FIX
        |
        v
6. TESTS + CHROME PROOF
        |
        v
7. MESURE AVANT/APRÈS SI PERFORMANCE
```

---

# 29. RÈGLE FINALE À MÉMORISER

```text
FETCH LESS
+
FETCH EARLY QUAND L’INTENTION EST FORTE
+
CACHE USEFULLY
+
REVALIDATE SELON LE RISQUE MÉTIER
+
RENDER LESS
+
RETAIN LESS
+
NE JAMAIS INVENTER
+
NE JAMAIS BLOQUER INUTILEMENT
+
NE JAMAIS MASQUER UNE DONNÉE STALE COMME FRAÎCHE
+
MESURER
+
PROUVER DANS LE NAVIGATEUR
```

Version courte :

> **Afficher immédiatement la dernière vérité API uniquement lorsqu’elle reste admissible pour l’usage courant ; revalider avec les primitives natives de RTK Query ; préserver l’interface ; limiter réseau, DOM et mémoire ; ne jamais inventer ; mesurer et prouver le comportement réel.**

---

# 30. CHECKLIST EXPRESS POUR REVUE DE CODE

```text
[ ] API-first respecté
[ ] classe de donnée identifiée
[ ] pas de faux fallback
[ ] query args stables
[ ] pas de duplicate GET injustifié
[ ] keepUnusedDataFor ≠ freshness
[ ] aucun staleTime/gcTime TanStack présenté comme RTKQ
[ ] isLoading / isFetching correctement distingués
[ ] donnée admissible non blankée pendant refetch
[ ] empty ≠ error
[ ] stale visible/gated selon classe
[ ] tags/invalidation après mutation
[ ] prefetch seulement si utile
[ ] infinite pages bornées si nécessaire
[ ] streaming cleanup si applicable
[ ] memo/useMemo seulement si justifié
[ ] focus/scroll/selection stables
[ ] race/ancien intent testé si pertinent
[ ] Network + DOM + Console vérifiés
[ ] Performance/Memory vérifiés si cause concernée
[ ] aucune refonte architecturale hors mission
```

---

# 31. RÉFÉRENCES PRIMAIRES ET TECHNIQUES

Les références ci-dessous servent à vérifier les primitives et à empêcher les futurs agents de transformer des conventions projet en « garanties framework ».

## Redux Toolkit / RTK Query

- Cache Behavior  
  https://redux-toolkit.js.org/rtk-query/usage/cache-behavior
- Queries  
  https://redux-toolkit.js.org/rtk-query/usage/queries
- createApi  
  https://redux-toolkit.js.org/rtk-query/api/createApi
- Generated React Hooks / useLazyQuery  
  https://redux-toolkit.js.org/rtk-query/api/created-api/hooks
- Automated Re-fetching  
  https://redux-toolkit.js.org/rtk-query/usage/automated-refetching
- Prefetching  
  https://redux-toolkit.js.org/rtk-query/usage/prefetching
- Infinite Queries  
  https://redux-toolkit.js.org/rtk-query/usage/infinite-queries
- Streaming Updates  
  https://redux-toolkit.js.org/rtk-query/usage/streaming-updates
- setupListeners  
  https://redux-toolkit.js.org/rtk-query/api/setupListeners
- Manual Cache Updates  
  https://redux-toolkit.js.org/rtk-query/usage/manual-cache-updates

## React

- `startTransition`  
  https://react.dev/reference/react/startTransition
- `useDeferredValue`  
  https://react.dev/reference/react/useDeferredValue
- `memo`  
  https://react.dev/reference/react/memo
- `useMemo`  
  https://react.dev/reference/react/useMemo
- `<Profiler>`  
  https://react.dev/reference/react/Profiler

## Standards HTTP

- RFC 9111 — HTTP Caching  
  https://www.rfc-editor.org/rfc/rfc9111.html
- RFC 5861 — stale-while-revalidate / stale-if-error  
  https://www.rfc-editor.org/rfc/rfc5861.html

## Documents projet

- `Docs/API_FIRST_ABSOLUTE_RULE.md`
- `Docs/ARCHITECTURE_DATA_FLOW.md`

---

# 32. CLAUSE DE MAINTENANCE

Cette directive est **canonique mais révisable**.

Lorsqu’une version de Redux Toolkit, React ou Next.js change une primitive :

1. vérifier la documentation primaire ;
2. mettre à jour cette directive ;
3. identifier explicitement la règle superseded ;
4. ne pas propager une terminologie d’une autre librairie ;
5. ajouter/mettre à jour les tests de conformité.

Une optimisation locale ne doit jamais introduire silencieusement une nouvelle doctrine concurrente.

**Une seule politique documentée, plusieurs stratégies selon la classe de donnée.**

---

# 33. INSTRUCTION FINALE AUX FUTURS LLM

Si tu es un LLM chargé d’optimiser une interface de cette codebase :

1. **ne saute aucune couche de l’architecture existante ;**
2. **ne suppose pas que lenteur = réseau ;**
3. **ne suppose pas que cache = fraîcheur ;**
4. **ne suppose pas que stale est toujours acceptable ;**
5. **ne suppose pas que `isFetching` signifie “aucune donnée” ;**
6. **ne crée pas un cache maison sans preuve ;**
7. **ne présente jamais une convention projet comme primitive RTK Query ;**
8. **ne touche pas au backend pour résoudre une mission frontend sauf instruction explicite ;**
9. **diagnostique, corrige le minimum, teste, mesure et prouve dans le navigateur ;**
10. **si une affirmation n’est pas établie, marque-la comme convention, recommandation ou incertitude.**

Le résultat attendu n’est pas « moins de requêtes à tout prix ».

Le résultat attendu est :

> **une interface API correcte, rapide, stable, explicable, mesurable et agréable à utiliser — y compris pendant la synchronisation, les erreurs et les longues sessions.**
