# 📚 Architecture des Données de Marché Algoway
# Document de Référence Complet — RÉVISION VÉRITÉ SRE/HDR — TENOR 2026

> **Ce document répond à une question fondamentale :**
> *Comment Algoway affiche-t-il un graphique BRVM à jour, sachant que les sources publiques sont limitées, asynchrones, et parfois instables ?*
> 
> **L'ARCHITECTURE "CERVEAU & MUSCLES" :**
> - **MUSCLES (Fredysessie/GitHub) :** Fournit l'historique massif (CSV journaliers).
> - **CERVEAU (Algoway Backend / Redis Upstash) :** Gère le temps réel, le crowdsourcing distribué, et l'intraday minute par minute avec une résilience de niveau institutionnel.

---

## PARTIE 1 — LE PROBLÈME DE BASE (La distinction cruciale)

### 1.1 Le "Mensonge" de la Doc Fredysessie (`brvm-data-public`)
La documentation officielle de Fredysessie affirme que les données sont mises à jour **toutes les 15 minutes**. En réalité, après analyse des commits et des fichiers réels, voici la **VÉRITÉ** :

- **INDICES (BRVMC, BRVM10, BRVM30) :** ✅ VRAI. Les fichiers CSV des indices reçoivent effectivement une nouvelle ligne toutes les ~15 à 60 minutes. On peut construire des bougies horaires pour les indices.
- **ACTIONS/TICKERS (SMBC, BOAB, etc.) :** ❌ FAUX. Leurs fichiers `.daily.csv` ne reçoivent qu'**UNE SEULE ligne par jour**, généralement entre 09h54 et 10h15 UTC. Aucune donnée intraday n'est stockée dans ces CSV pour les actions individuelles.

#### 📊 Tableau Comparatif (Doc Officielle vs Réalité 2026)

| Type de Donnée          | Format | Fréquence (Officiel) | Fréquence (Réel)      | Point d'Accès (URL Pattern)            |
| :---------------------- | :----- | :------------------- | :-------------------- | :------------------------------------- |
| **Actions (Tickers)**   | CSV    | 15 minutes           | **1x / jour (matin)** | `.../data/{ticker}/{ticker}.daily.csv` |
| **Indices (BRVM10...)** | CSV    | 15 minutes           | ✅ ~15-60 minutes      | `.../data/BRVM10/BRVM10.daily.csv`     |
| **Devises (paires)**    | JSON   | Quotidien            | ✅ Quotidien           | `.../data/currency_data/{code}.json`   |
| **Archives (Releases)** | ZIP    | Périodique           | ✅ Périodique          | `.../releases`                         |

> [!IMPORTANT]
> C'est cette limitation sur les **Actions (Tickers)** qui a imposé la création du système **Intraday Redis** d'Algoway. Sans lui, le graphique des actions serait "mort" toute la journée après 10h00 UTC.

### 1.2 Pourquoi Algoway ne peut pas se contenter du CSV ?
Si un utilisateur ouvre Algoway à 14h00 :
1. Le fichier `SMBC.daily.csv` de Fredysessie contient sa dernière bougie de ce matin à 10h.
2. Tout ce qui s'est passé entre 10h et 14h (transactions, pics, chutes) est **INVISIBLE** dans le CSV.
3. Conséquence : Sans Algoway, le graphique s'arrêterait à 10h du matin.

### 1.3 La Solution Algoway : Le Système Hybride
Algoway ne se contente pas de lire des fichiers ; il **construit** sa propre mémoire intraday en combinant 4 sources de données distinctes et une base de données en mémoire (Redis).

---

## PARTIE 2 — LA TOPOLOGIE DES 8 APIs (L'Écosystème SRE)

Pour soutenir ce système hybride, le dossier `src/app/api/market-data/` contient 8 micro-services Serverless. Chacun a une responsabilité unique et stricte, protégé par un **Circuit Breaker** et un cache **SWR (Stale-While-Revalidate)**.

1. **`brvm-live`** : Scrape le prix instantané d'une action. C'est le "Tick" rouge que vous voyez sur l'axe Y du graphique.
2. **`brvm-collect`** : Le collecteur silencieux. Reçoit le prix live du client et l'écrit dans Redis via un pipeline atomique (`HSET`).
3. **`brvm-intraday`** : Le lecteur. Lit Redis (`HGETALL`), trie les minutes chronologiquement, et fabrique les bougies OHLCV (1m, 5m, 15m).
4. **`brvm-fundamentals`** : Scrape les données financières (P/E, Revenus, Dividendes) et le profil de l'entreprise.
5. **`brvm-bonds`** : Scrape le marché obligataire pour extraire les obligations au plus haut rendement (YTM).
6. **`brvm-news`** : Scrape les dernières actualités de la BRVM.
7. **`brvm-live-capitalisation`** : Scrape les données macro (Capitalisation globale, nombre de titres).
8. **`indices`** : Scrape la performance des indices majeurs (BRVMC, BRVM30, BRVMPR).

---

## PARTIE 3 — LES 4 SOURCES DE DONNÉES (Le Flux de Travail)

À chaque rafraîchissement, le hook `useMarketData` et le système `useIntradayData` orchestrent ces appels :

### 3.1 SOURCE 1 : `dailyUrl` (L'Ancre Historique)
- **Fichier :** `{TICKER}.daily.csv` sur GitHub.
- **Rôle :** Fournir l'historique de 2015 à hier.
- **Fréquence :** 1x par jour.
- **Usage :** C'est la base du graphique (99% des points).

### 3.2 SOURCE 2 : `liveScraperUrl` (Le Radar Temps Réel)
- **Fichier :** Aucun (Scraping dynamique de `brvm.org` via l'API `brvm-live`).
- **Rôle :** Donne le prix **exact** à la seconde près et le volume cumulé.
- **Usage :** Utilisé pour créer la bougie "Live" et alimenter le TickerPanel.

### 3.3 SOURCE 3 : `githubIndicatorUrl` (Le Backup)
- **Fichier :** `{TICKER}.indicator.csv` sur GitHub.
- **Rôle :** Contient le prix actuel si le scraper interne d'Algoway échoue (Circuit Breaker ouvert).
- **Fréquence :** Mis à jour plus souvent que le daily, mais reste dépendant des robots GitHub.

### 3.4 SOURCE 4 : `brvm-intraday` (La Mémoire Algoway / Redis)
- **Base de données :** Cluster Upstash Redis (Serverless).
- **Rôle :** Stocker chaque minute de cotation que Fredysessie ignore.
- **Usage :** C'est la seule source permettant d'afficher des bougies de 1m, 5m, 15m, 1H.

---

## PARTIE 4 — COMMENT LES DONNÉES SONT "COUTURÉES" (Data Stitching)

La fusion se fait en deux étapes dans le composant `TechnicalAnalysis.tsx`.

### 4.1 Étape A : Le Filtrage de Plage (1J → 5Y)
On prend les données **journalières** (SOURCE 1) et on les filtre selon le bouton cliqué :
- **1J :** Affiche seulement les 2 derniers jours.
- **YTD :** Affiche du 1er Janvier à aujourd'hui.
- **Tout :** Affiche l'historique complet.

### 4.2 Étape B : L'Injection Live
Si le timeframe est journalier, on ajoute à la fin une bougie "artificielle" calculée ainsi :
- **Open :** Donnée par le scraper (prix d'ouverture du matin).
- **High/Low :** Plus hauts/bas de la journée en cours via le scraper.
- **Close :** Le prix actuel (`liveSnapshot.price`).
- **Volume :** Le volume cumulé de la journée.

**Pourquoi il n'y a pas de doublon ?**
Le code compare la date ISO `"2026-03-06"`. Si cette date existe déjà dans le CSV, on **met à jour** la dernière ligne. Si elle n'existe pas, on **ajoute** la ligne.

---

## PARTIE 5 — LE MOTEUR INTRADAY "CROWDSOURCED" (L'Innovation Algoway)

Comme Fredysessie ne donne pas de bougies intraday pour les actions, Algoway les **fabrique**. Puisque la BRVM ne fournit pas d'API WebSocket, Algoway utilise les navigateurs de ses propres utilisateurs comme des "Workers" distribués.

### 5.1 Collecte (Le Scrapper Silencieux)
Toutes les minutes, tant que le marché est ouvert (09h00-15h30 UTC), le hook `useIntradayData` :
1. Interroge le scraper live (`brvm-live`).
2. Envoie le prix à `/api/market-data/brvm-collect`.
3. Le serveur écrit ce point `{ts, p, v}` dans **Redis**.

### 5.2 L'Idempotence (La Magie SRE)
Si 100 utilisateurs regardent l'action `BOAB` en même temps, ils envoient tous le prix à Redis. Mais Redis utilise un **HASH** où la clé est la minute exacte (ex: `10:05`). Les 100 requêtes écrasent la même clé avec la même valeur. **Zéro duplication. Zéro surcharge. Complexité O(1).**

### 5.3 Agrégation (OHLCV à la volée)
Quand tu cliques sur "5m" ou "15m" :
1. L'API `/api/market-data/brvm-intraday` lit le Hash Redis de la journée (`HGETALL`).
2. Elle **trie** les minutes chronologiquement (car les clés d'un Hash ne sont pas ordonnées).
3. Elle groupe les points par paquets (buckets) de 5 ou 15 minutes.
4. Elle calcule :
   - **Open** : 1er point du bucket.
   - **High/Low** : Max/Min du bucket.
   - **Close** : Dernier point du bucket.
5. **Résultat :** De vraies bougies intraday professionnelles, même si la source d'origine ne les fournit pas.

---

## PARTIE 6 — LA VÉRITÉ SUR LES "FAUSSES BOUGIES" (Continuité Temporelle)

Une question légitime se pose : *"Si le prix ne bouge pas sur le site de la BRVM pendant 10 minutes, pourquoi Algoway dessine-t-il quand même 10 bougies de 1 minute ? Ne crée-t-on pas de la fausse information ?"*

**La Réponse Mathématique (Standard Institutionnel) :**
Dans un marché illiquide, une absence de transaction **n'est pas** une absence de temps. 

Si le prix est de 7500 FCFA à 10h00, et qu'aucune transaction n'a lieu jusqu'à 10h15, l'état réel du marché pendant ces 15 minutes est que l'actif vaut toujours 7500 FCFA. 

Si nous ne dessinions rien (en sautant de 10h00 à 10h15 sur l'axe X) :
- Le graphique serait visuellement trompeur (le temps semblerait compressé).
- **Pire encore :** Les algorithmes mathématiques (Moyennes Mobiles, RSI, Bandes de Bollinger) seraient **corrompus**. Une Moyenne Mobile sur 20 périodes a besoin de 20 unités de temps réelles pour calculer sa valeur. Si on omet les minutes sans transaction, la moyenne calculera son résultat sur le passé lointain au lieu du présent stagnant.

**Ce que fait Algoway :**
Il applique la **Loi de la Continuité des Séries Temporelles**. Pour chaque minute sans nouvelle transaction, Algoway génère une bougie "plate" (un Doji) où :
`Open = High = Low = Close = 7500` et `Volume = 0`.
Ce n'est pas une fausse donnée, c'est la représentation exacte de la stagnation du marché. C'est ainsi que fonctionnent les terminaux Bloomberg et TradingView.

---

## PARTIE 7 — LE SEAMLESS INTRADAY STITCHING (SIS)

Que se passe-t-il à 09h00, à l'ouverture du marché, quand Redis est encore vide pour la journée ? Le graphique serait vide.

Pour éviter cela, la route `brvm-intraday` implémente le **SIS (Seamless Intraday Stitching)** :
1. Elle va chercher le dernier cours de clôture de la veille dans les archives CSV de GitHub.
2. Elle injecte ce prix comme un point de départ artificiel à `08:59:00 UTC`.
3. Ainsi, la première vraie bougie de la journée (à 09h00) s'ancrera visuellement sur la clôture de la veille, évitant un "gap" visuel perturbant pour l'utilisateur.

---

## PARTIE 8 — CYCLE DE VIE D'UNE JOURNÉE (Exemple SMBC)

1. **09:00 UTC :** Ouverture. Le CSV GitHub est à Hier. Algoway commence la collecte Redis pour Aujourd'hui (SIS injecte la clôture de la veille).
2. **09:30 UTC :** Le graphique 1m montre 30 bougies tirées de notre Hash Redis.
3. **10:00 UTC :** Fredysessie commit le CSV journalier. Algoway continue d'afficher Redis pour l'intraday, mais met à jour son fond historique.
4. **15:30 UTC :** Fermeture. La collecte s'arrête. Le Hash Redis contient l'empreinte complète de la journée.
5. **Le lendemain :** Le CSV de Fredysessie contiendra la bougie officielle de la veille. Notre Hash Redis expire automatiquement après 7 jours (TTL).

---

## PARTIE 9 — SCHÉMA DE DÉCISION DES DONNÉES

```mermaid
graph TD
    START[Demande de données] --> CHECK_TF{Timeframe ?}
    
    CHECK_TF -- "1m, 5m, 15m, 1H, 4H" --> REAL_MODE{Mode Réel ?}
    REAL_MODE -- Oui --> FETCH_REDIS[Fetch API /brvm-intraday]
    FETCH_REDIS --> REDIS[(Upstash Redis HGETALL)]
    REDIS --> SORT[Tri Chronologique des Clés]
    SORT --> AGGREGATE[Agrégation OHLCV]
    AGGREGATE --> GRAPH_INTRA[Affichage Intraday]
    
    CHECK_TF -- "1J, YTD, Tout..." --> FETCH_CSV[Fetch GitHub CSV]
    FETCH_CSV --> FILTER[Filtre par TimeRange]
    FILTER --> STITCH[Injection du prix Live du Scraper]
    STITCH --> GRAPH_DAILY[Affichage Journalier]
    
    REAL_MODE -- Non/Demo --> MOCK[Génération de données fictives]