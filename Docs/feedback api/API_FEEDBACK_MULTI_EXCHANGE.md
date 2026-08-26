# Feedback API — catalogue multi-bourses et filtrage des titres

**Statut :** retour frontend pour l’équipe backend  
**Vérification :** 14 août 2026, 08:57 UTC (10:57 Africa/Porto-Novo)  
**API :** http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/

## Décision

Le backend ne sera pas modifié dans ce chantier. Le frontend utilise les données API reçues et applique localement le filtre `action.bourse.ticker`. Aucun catalogue local, mock ou fallback fictif ne complète une réponse API.

## Contrat local

- `base.api.ts` construit `NEXT_PUBLIC_CLIENT_API_BASE/api/v1`.
- `bourse.api.ts` expose `GET /bourses/`.
- `action.api.ts` expose `GET /actions/`.
- `action.type.ts` déclare `bourse?: string` et `bourses?: string`.
- `bourse.entity.ts` expose `ticker`, `name`, `slug` et `currency`.
- `cours.api.ts` expose `GET /cours/?instrument=<instrument_id>`.

## Preuve CDP — catalogue des bourses

```text
GET http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/api/v1/bourses/?format=json&page_size=100
HTTP 200
Content-Type: application/json
count: 6
```

| ticker | nom | devise |
|---|---|---|
| BRVM | Bourse Régionale des Valeurs mobilières | XOF |
| JSE | Johannesburg Exchange | ZAR |
| CSE | Bourse de Casablanca | MAD |
| NGX | Nigerian Exchange | NGN |
| GSE | Ghana Stock Exchange | GHS |
| NSE | Nairobi Stock Exchange | KES |

**Classification :** `API_FIELD_PRESENT`.

## Preuve CDP — titres par marché

La route `GET /api/v1/actions/?format=json&page=<1..7>&page_size=100` a retourné HTTP 200, 7 pages et 635 titres.

| marché | titres |
|---|---:|
| BRVM | 6 |
| JSE | 326 |
| CSE | 33 |
| NGX | 163 |
| NSE | 69 |
| GSE | 38 |
| **Total** | **635** |

### Anomalie de filtrage serveur

Les requêtes suivantes ont toutes retourné les mêmes données mélangées :

```text
/api/v1/actions/?format=json&bourse=BRVM&page_size=100
/api/v1/actions/?format=json&bourse=JSE&page_size=100
/api/v1/actions/?format=json&bourse=NSE&page_size=100
/api/v1/actions/?format=json&bourses=BRVM&page_size=100
```

Résultat commun :

```text
HTTP 200
count: 635
distinctBourses: JSE, NSE, GSE, NGX, BRVM, CSE
```

Le serveur accepte le paramètre HTTP, mais n’applique pas le filtrage attendu. HTTP 200 ne prouve donc pas que le filtre a été exécuté.

**Classification :** le champ `bourse` est `API_FIELD_PRESENT`, mais le contrat fonctionnel du filtrage serveur est non conforme.

## Preuve CDP — OHLCV

Des instruments réels issus de `actions` ont été testés avec `GET /cours/?instrument=...`.

| marché | tests | résultat |
|---|---:|---|
| BRVM | 3 | données OHLCV présentes |
| CSE | 3 | données OHLCV présentes |
| JSE | 3 | HTTP 200, `count: 0` |
| NSE | 3 | HTTP 200, `count: 0` |
| GSE | 3 | HTTP 200, `count: 0` |
| NGX | 3 | HTTP 200, `count: 0` |

Extraits :

```text
BRVM / SICOR_CI: count=3325, open=3995, close=3995, volume=468
CSE / BCP: count=5391, open=246.9, high=248.6, low=243, close=248.2, volume=49584
```

Les quatre marchés à `count: 0` ne sont pas déclarés globalement absents : seuls neuf échantillons ont été vérifiés.

## Décision frontend immédiate

1. Charger `GET /bourses/`.
2. Charger `GET /actions/` avec pagination.
3. Vérifier que la réponse est un tableau.
4. Vérifier que `action.bourse.ticker` est une chaîne.
5. Regrouper et filtrer localement par ticker de marché.
6. Afficher un état vide/indisponible si aucune action API ne correspond.
7. Ne jamais injecter de titres locaux pour compléter une réponse vide.
8. Ne pas faire confiance à `bourse=` ou `bourses=` tant que le serveur ne filtre pas réellement.

La sélection globale Redux pourra porter l’identifiant stable de la bourse, son ticker et sa devise. Elle ne doit activer une surface que si sa route API fournit des données vérifiées.

## Surfaces encore non prouvées

Avant le changement global, il faut documenter séparément les routes/réponses réelles pour la watchlist, les statistiques, les actualités, les fondamentaux, la devise, le fuseau horaire et l’OHLCV complet de chaque marché.

Aucune donnée locale ou mock ne doit masquer une lacune API en mode réel.

## État localhost observé

```text
Page: http://localhost:3000/en/equity/technical-analysis?profile_verify=20260813
DOM: SONATEL_SN / SIMU / BRVM / XOF / aria-checked="true"
```

Le bouton Bourse/Exchange n’est pas encore implémenté. Ce rapport ne modifie pas ce comportement.

## Demandes backend futures

1. Rendre effectif `bourse` ou `bourses` sur `GET /actions/`.
2. Documenter le paramètre canonique.
3. Préserver la pagination après filtrage.
4. Gérer les tickers inconnus de manière déterministe.
5. Fournir ou confirmer OHLCV pour JSE, NSE, GSE et NGX.
6. Documenter les routes dépendantes du marché pour les autres surfaces.

## Verdict

```text
CATALOGUE_BOURSES      = API_FIELD_PRESENT
TITRES_MULTI_MARCHES   = API_FIELD_PRESENT
FILTRAGE_SERVEUR       = NON_EFFECTIF_OBSERVE
FILTRAGE_FRONTEND      = STRATEGIE_RETENUE
OHLCV_BRVM_CSE         = API_FIELD_PRESENT
OHLCV_AUTRES_MARCHES   = NON_CONCLUANT_SUR_ECHANTILLON
BACKEND_MODIFIE        = NON
FALLBACK_LOCAL         = NON
```
