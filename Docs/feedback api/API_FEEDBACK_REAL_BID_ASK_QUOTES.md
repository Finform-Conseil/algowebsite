# Feedback API — cotation réelle bid/ask pour les boutons SELL/BUY

**Statut :** retour frontend pour l’équipe backend/API
**Priorité :** haute — fonctionnalité de cotation et cohérence avec l’expérience attendue
**Vérification :** 24 août 2026, localhost via Chrome DevTools
**API :** http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/

## Constat

TradingView affiche une cotation exécutable distincte du dernier cours :

- `SELL` correspond au `bid` réel ;
- `BUY` correspond au `ask` réel ;
- le spread correspond à `ask - bid` ;
- les valeurs sont rafraîchies par le flux de marché du symbole courant.

Sur notre frontend, l’endpoint suivant a été observé :

```text
GET /api/proxy/10/api/v1/actions?ticker=VIVO_CI&page_size=1
HTTP 200
```

La réponse contient notamment :

```json
{
  "bourse": {
    "ticker": "BRVM",
    "currency": {
      "symbol": "XOF",
      "name": "Franc CFA"
    }
  },
  "latest_price_metric": {
    "timestamp": "2026-04-09T00:00:00+0000",
    "price": 2185.0,
    "open": 2185.0,
    "prev_close": 2185.0,
    "volume": 2962
  }
}
```

Dans cette réponse, aucun champ `bid` ni `ask` n’est présent. Le champ `price` représente le dernier cours connu ; il ne permet pas de déduire une cotation d’achat ou de vente.

## Écart contractuel

L’API expose actuellement un dernier prix, mais pas de quote bid/ask. Le frontend ne peut donc pas reproduire fidèlement les boutons SELL/BUY de TradingView sans inventer des données de carnet.

Le frontend applique volontairement le comportement API-first suivant :

1. afficher le dernier cours lorsqu’il existe ;
2. afficher `N/D` pour SELL et BUY lorsque `bid` ou `ask` est absent ;
3. désactiver ces boutons dans cet état ;
4. ne calculer aucun spread synthétique ;
5. ne pas utiliser de donnée locale, mock ou fallback fictif pour masquer l’absence du contrat API.

Ce comportement est nécessaire pour éviter de présenter à l’utilisateur un prix exécutable qui n’a jamais été fourni par le marché.

## Demande backend

Merci d’exposer une quote réelle pour l’instrument et le marché demandés, idéalement dans `latest_price_metric` ou dans une ressource de quote dédiée :

```json
{
  "bid": 2184.0,
  "ask": 2186.0,
  "spread": 2.0,
  "timestamp": "2026-04-09T00:00:00+0000",
  "currency": "XOF",
  "instrument": "VIVO_CI",
  "bourse": "BRVM"
}
```

Le contrat doit préciser :

- le type numérique et l’unité de prix ;
- la devise et le marché concernés ;
- la signification exacte de `bid` et `ask` ;
- la fraîcheur maximale et le timestamp de la quote ;
- le comportement hors séance, quote indisponible et quote périmée ;
- la nullabilité explicite (`null` plutôt qu’une valeur inventée) ;
- la pagination ou le flux utilisé si plusieurs niveaux de carnet sont disponibles.

Le champ `spread` peut être fourni pour faciliter l’affichage, mais il doit être cohérent avec `ask - bid`. Le frontend ne doit pas reconstruire un bid/ask à partir du dernier cours.

## Critères d’acceptation

1. Une requête d’un instrument réel retourne `bid` et `ask` lorsque le marché fournit effectivement ces données.
2. Les deux valeurs correspondent au même instrument, au même marché, à la même devise et à une quote suffisamment récente.
3. Une quote indisponible retourne explicitement `null` ou un état documenté ; elle ne retourne ni zéro arbitraire ni spread synthétique.
4. Le contrat est documenté avec un exemple de réponse et des tests backend couvrant quote disponible, quote absente et quote périmée.
5. Le frontend peut alors remplacer `N/D` par les valeurs réelles sans modifier le modèle API-first.

## Verdict actuel

```text
LAST_PRICE_API       = PRESENT
BID_API              = ABSENT_OBSERVE
ASK_API              = ABSENT_OBSERVE
SPREAD_API           = ABSENT_OBSERVE
SELL_BUY_FRONTEND    = N/D + DISABLED_WHEN_NO_QUOTE
SYNTHETIC_QUOTE      = REFUSED
LOCAL_FALLBACK       = REFUSED
BACKEND_MODIFIE      = NON
```

