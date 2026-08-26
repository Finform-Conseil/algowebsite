# Feedback API — champ YTM explicite

Date : 14 août 2026  
Périmètre : endpoint obligataire consommé par le sidebar droit  
Priorité : P2 — évolution backend future

## 1. Constat actuel

Le frontend consomme actuellement la route :

```text
GET /api/proxy/10/api/v1/fixed-income/bond-securities?page_size=100
```

Le champ obligataire effectivement fourni et utilisé est :

```text
issue_lots.clearing_yield
```

Le frontend affiche donc correctement :

```text
Highest clearing yield bonds
```

Aucune équivalence automatique entre `clearing_yield` et `ytm` n’est supposée côté frontend.

## 2. Besoin backend futur

Si le produit doit afficher une section intitulée :

```text
Highest YTM bonds
```

l’API doit exposer un champ explicite `ytm`, avec sa définition métier documentée.

Exemple de contrat attendu :

```json
{
  "issue_lots": [
    {
      "maturity_date": "2031-02-21",
      "clearing_yield": 17.62,
      "ytm": 17.62
    }
  ]
}
```

La valeur d’exemple ne constitue pas une valeur métier exigée. Le backend doit fournir la valeur calculée selon sa source officielle.

## 3. Contrat à documenter

Le backend devra préciser :

- la définition exacte de `ytm` ;
- l’unité retournée : pourcentage ou décimal ;
- la convention de calcul et la date de valorisation ;
- la précision et l’arrondi ;
- le comportement lorsque `ytm` est absent ou non calculable ;
- la différence fonctionnelle entre `ytm` et `clearing_yield`.

## 4. Règle frontend actuelle

Tant que `ytm` n’existe pas explicitement dans l’API :

- ne pas renommer `clearing_yield` en `ytm` ;
- conserver le libellé `Highest clearing yield bonds` ;
- ne pas calculer localement un YTM ;
- ne pas utiliser de catalogue obligataire local ;
- afficher le bloc indisponible si aucune donnée API valide n’est reçue.

## 5. Critères d’acceptation futurs

L’évolution backend sera considérée exploitable lorsque :

1. la route obligataire retourne `ytm` pour les lots concernés ;
2. le contrat API décrit clairement ce champ ;
3. les valeurs nulles ou non calculables sont explicitement gérées ;
4. le frontend peut mapper directement `ytm` sans déduction ni fallback local ;
5. une preuve réseau/CDP confirme la présence du champ dans la réponse réelle.

## 6. Décision actuelle

Aucune modification backend n’est effectuée dans le périmètre frontend actuel.

Décision : utiliser strictement `clearing_yield` fourni par l’API et conserver le libellé `Highest clearing yield bonds`.
