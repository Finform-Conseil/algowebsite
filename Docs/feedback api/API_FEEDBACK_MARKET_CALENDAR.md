# Feedback API — calendrier officiel des séances multi-bourses

**Statut :** demande backend — évolution prioritaire pour fiabiliser le statut de marché  
**Équipe destinataire :** senior backend / fullstack  
**Périmètre :** BRVM, JSE, CSE, NGX, GSE, NSE  
**Frontend concerné :** sidebar droit de Technical Analysis  
**API cible observée :** http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io/

## 1. Demande

Fournir une route API officielle permettant au frontend de connaître, pour une bourse donnée et une année donnée :

- les horaires réguliers de séance ;
- les jours fériés de fermeture ;
- les fermetures exceptionnelles ;
- les séances écourtées ;
- les fêtes mobiles dont la date peut être ajustée par avis officiel ;
- la date de dernière mise à jour du calendrier.

Le frontend doit pouvoir afficher un statut fiable :

`Market open`, `Market closed` ou `Statut de séance indisponible`.

Cette demande concerne uniquement le calendrier de marché. Elle ne remplace aucune donnée financière API.

## 2. Constat frontend actuel

La route catalogue existante expose bien les six bourses :

`GET /api/v1/bourses/?format=json&page_size=100`

La réponse observée contient :

| ticker | marché | devise |
|---|---|---|
| BRVM | Bourse Régionale des Valeurs mobilières | XOF |
| JSE | Johannesburg Exchange | ZAR |
| CSE | Bourse de Casablanca | MAD |
| NGX | Nigerian Exchange | NGN |
| GSE | Ghana Stock Exchange | GHS |
| NSE | Nairobi Stock Exchange | KES |

Aucune route calendrier ou jours fériés n’a été identifiée dans le store API frontend actuel.

Les routes API disponibles dans `core/infra/store/api` concernent notamment :

- `actions/` ;
- `cours/` ;
- `bourses/` ;
- `events/` ;
- `results/` ;
- `dividends/` ;
- `fixed-income/`.

La route `events/` ne constitue pas actuellement un contrat de calendrier de séance par bourse et par année.

## 3. Contrat API proposé

Route recommandée :

```text
GET /api/v1/market-calendars/{exchange_ticker}/?year=2027
```

Exemples :

```text
GET /api/v1/market-calendars/BRVM/?year=2027
GET /api/v1/market-calendars/JSE/?year=2027
GET /api/v1/market-calendars/CSE/?year=2027
GET /api/v1/market-calendars/NGX/?year=2027
GET /api/v1/market-calendars/GSE/?year=2027
GET /api/v1/market-calendars/NSE/?year=2027
```

Le ticker doit correspondre au ticker canonique retourné par `bourses/`.

## 4. Réponse minimale attendue

```json
{
  "exchange": {
    "ticker": "BRVM",
    "name": "Bourse Régionale des Valeurs mobilières",
    "timezone": "UTC"
  },
  "year": 2027,
  "regular_session": {
    "weekdays": [1, 2, 3, 4, 5],
    "open": "09:00",
    "close": "15:00"
  },
  "closures": [
    {
      "date": "2027-01-01",
      "name": "Jour de l'an",
      "kind": "public_holiday",
      "status": "closed",
      "observed": true,
      "source": "official_exchange_calendar"
    }
  ],
  "special_sessions": [
    {
      "date": "2027-12-24",
      "open": "09:00",
      "close": "12:00",
      "kind": "early_close",
      "source": "official_exchange_notice"
    }
  ],
  "metadata": {
    "source": "official_exchange_calendar",
    "updated_at": "2026-12-15T10:30:00Z",
    "valid_from": "2027-01-01",
    "valid_to": "2027-12-31",
    "version": "2027.1"
  }
}
```

## 5. Champs indispensables

### Identification

- `exchange.ticker` : ticker canonique de la bourse ;
- `exchange.name` : nom officiel ;
- `exchange.timezone` : fuseau IANA, par exemple `Africa/Abidjan`, `Africa/Johannesburg`, `Africa/Lagos`, `Africa/Casablanca`, `Africa/Accra`, `Africa/Nairobi`.

### Horaires réguliers

- jours ouvrés ;
- heure d’ouverture ;
- heure de clôture ;
- phases optionnelles : pré-ouverture, fixing, continu, clôture officielle ;
- unité et convention horaire clairement documentées.

### Fermetures

- date locale de fermeture ;
- libellé ;
- type : `public_holiday`, `exchange_closure`, `special_closure` ;
- statut : `closed` ou `early_close` ;
- indication `observed` pour les reports de fêtes tombant le week-end ;
- source officielle.

### Fraîcheur

- `updated_at` ;
- `valid_from` ;
- `valid_to` ;
- version du calendrier ;
- source de publication ;
- date d’annonce lorsque la date dépend d’une observation lunaire.

## 6. Fêtes mobiles et mises à jour

Certaines dates religieuses ou fêtes mobiles peuvent évoluer selon :

- l’observation officielle du calendrier lunaire ;
- un avis de la bourse ;
- une décision gouvernementale ;
- un report lorsqu’une fête tombe un week-end ;
- une fermeture exceptionnelle publiée après le calendrier annuel.

Le backend doit donc pouvoir publier une nouvelle version du calendrier sans modifier le contrat de route.

Le frontend ne doit jamais recalculer ou deviner ces dates. Il consomme la dernière version API reçue.

## 7. Règle API-first

Lorsque cette route sera disponible :

```text
API calendrier officiel
  → repository calendrier
  → hook de données
  → résolution du statut de séance
  → sidebar droit
```

Le frontend doit :

- utiliser le calendrier API comme source nominale ;
- respecter le fuseau retourné par l’API ;
- appliquer les fermetures et séances écourtées ;
- afficher `N/D` si le calendrier API est absent, invalide ou non publié ;
- ne jamais compléter les prix, volumes, indicateurs ou fondamentaux avec ce calendrier ;
- ne jamais transformer une date approximative en fermeture certaine.

## 8. Mesure temporaire frontend actuelle

En attendant cette route, le frontend utilise une configuration locale contrôlée pour les horaires réguliers et certaines fermetures 2026 vérifiées.

Cette configuration :

- ne contient aucune donnée financière ;
- ne remplace aucune réponse API ;
- sert uniquement à éviter le message permanent `Statut du marché indisponible via l’API` ;
- conserve `N/D` lorsqu’aucun calendrier vérifié n’est disponible ;
- doit être retirée ou rétrogradée dès que la route API devient disponible.

Le code temporaire se trouve dans :

```text
core/data/ExchangesStaticData.ts
components/technical-analysis/components/sidebar/hooks/useSidebarMarketClock.ts
components/technical-analysis/components/sidebar/hooks/useTechnicalAnalysisSidebarController.ts
```

## 9. À propos de calendrier.com

`https://www.calendrier.com/` fournit des calendriers généraux de jours fériés, principalement orientés France.

Il ne constitue pas actuellement :

- une API officielle des six bourses ;
- un calendrier de séances par ticker de bourse ;
- une source garantie des fermetures exceptionnelles ;
- un contrat temps réel versionné.

Il ne doit donc pas être appelé directement par le frontend. Les calendriers des bourses doivent provenir des places concernées ou d’un agrégateur backend validé.

## 10. Critères d’acceptation backend

La demande sera considérée comme livrée lorsque :

1. les six tickers sont acceptés ;
2. `year` est supporté ;
3. le fuseau IANA est retourné ;
4. les horaires réguliers sont retournés ;
5. les jours fériés et fermetures exceptionnelles sont retournés ;
6. les séances écourtées sont supportées ;
7. les dates mobiles peuvent être mises à jour ;
8. la source et la date de mise à jour sont exposées ;
9. une absence de calendrier renvoie un état explicite, pas une liste vide ambiguë ;
10. une preuve réseau/CDP confirme les réponses pour les six bourses ;
11. la pagination n’est pas nécessaire pour un calendrier annuel ou son comportement est documenté ;
12. le frontend peut consommer la route sans calcul local.

## 11. Priorité

**Priorité : P1 — fiabilité du statut de marché**

Le statut `Market open/closed` est actuellement fonctionnel pour les horaires réguliers et certaines dates vérifiées, mais il ne peut pas être garanti pour toutes les années, fêtes mobiles et fermetures exceptionnelles sans calendrier API officiel.

**Backend modifié dans ce chantier :** non.  
**Frontend modifié par cette demande documentaire :** non.  
**Fallback financier local :** aucun.  
**Demande principale :** fournir une route calendrier officielle multi-bourses versionnée.
