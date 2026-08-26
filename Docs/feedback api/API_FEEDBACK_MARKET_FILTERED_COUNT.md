# API Feedback — Count des titres filtré par bourse

## Priorité

**Haute — bloque l’affichage fiable du total des titres dans le sélecteur de ticker.**

## Contexte

Le modal de sélection des titres charge les actions depuis :

```text
GET /api/v1/actions/
```

L’interface doit afficher le nombre total de titres appartenant à la bourse sélectionnée : BRVM, CSE, GSE, JSE, NGX ou NSE.

## Problème observé

Le paramètre de filtrage `bourse` ne semble pas être appliqué côté serveur.

Exemples observés :

```text
GET /api/v1/actions/?bourse=NSE&page_size=100&page=1
GET /api/v1/actions/?bourse=JSE&page_size=100&page=1
GET /api/v1/actions/?bourse=NGX&page_size=100&page=1
GET /api/v1/actions/?page_size=100&page=1
```

Les réponses retournent le même total global :

```text
count = 635
total_pages = 7
data_length = 100
```

Les données d’une réponse contiennent plusieurs marchés malgré le paramètre `bourse`.

Le champ marché est bien présent dans chaque action :

```text
action.bourse.ticker
```

Le filtrage frontend permet donc d’afficher les bons titres, mais `response.count` reste un compteur global et ne peut pas être utilisé pour afficher le total d’une seule bourse.

## Impact frontend

- Le modal ne peut pas afficher rapidement un total fiable par bourse.
- Afficher `635 titres` pour NSE, NGX ou JSE serait faux.
- Attendre toutes les pages avant de compter correctement ralentit fortement l’ouverture et le scroll.
- L’interface doit actuellement afficher `… titres` pendant le calcul local afin d’éviter une information fausse.
- Le problème concerne les six bourses et tous les utilisateurs du sélecteur de titres.

## Comportement API attendu

Pour une requête filtrée, l’API doit retourner uniquement les actions de la bourse demandée et un compteur correspondant à ce même périmètre :

```text
GET /api/v1/actions/?bourse=NGX&page=1&page_size=100
```

Réponse attendue conceptuellement :

```json
{
  "count": 123,
  "total_pages": 2,
  "data": [
    {
      "bourse": {
        "ticker": "NGX"
      }
    }
  ]
}
```

Invariant obligatoire : toutes les actions retournées doivent satisfaire :

```text
action.bourse.ticker === query.bourse
```

Le champ `count` doit être le nombre total d’actions correspondant au filtre serveur, avant pagination.

## Critères d’acceptation

1. `bourse=BRVM` ne retourne aucune action CSE, GSE, JSE, NGX ou NSE.
2. `bourse=CSE` ne retourne aucune action d’un autre marché.
3. Même comportement pour GSE, JSE, NGX et NSE.
4. `count` est spécifique à la bourse demandée.
5. `total_pages` est calculé à partir du count filtré.
6. Les paramètres `page` et `page_size` continuent de fonctionner.
7. Une requête sans filtre conserve son comportement global.
8. Les tests API couvrent le filtrage, le count et la pagination.
9. Les paramètres acceptés sont documentés : `bourse` ou éventuellement un autre nom canonique, mais un seul contrat doit être retenu.

## Contournement frontend actuel

Le frontend filtre localement `action.bourse.ticker` et déduplique les tickers. Il peut calculer un total exact uniquement après avoir parcouru toutes les pages globales, ce qui est coûteux et incompatible avec une ouverture rapide du modal.

Ce contournement ne doit pas être considéré comme la solution définitive : il augmente le nombre de requêtes, la latence et la mémoire consommée côté client.

## Demande au développement backend

Merci de corriger le filtrage serveur de `/actions/` et de garantir que `count`, `total_pages` et `data` partagent exactement le même périmètre `bourse`.

Après correction, le frontend pourra afficher le total immédiatement depuis la première réponse API, tout en chargeant progressivement les pages suivantes.
