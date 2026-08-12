# Récapitulatif de session — Technical Analysis / TradingView

Date : 2026-08-11
Projet : AfriMarket — `en/equity/technical-analysis`
Référence : `https://www.tradingview.com/chart/omHukTbl/`

## Objectif

Rendre la page technical analysis API-first et rapprocher son rendu et ses interactions de TradingView : données réelles, identité API, navigation horizontale et verticale, zoom, pagination historique, layout chart et expérience visuelle.

Contraintes respectées : aucune suppression de fichier ou dossier, conservation des versions `_Old`, observation TradingView par CDP avant modification d’interaction, et validation par preuves observables.

## Initialisation et état MCP

L’initialisation `.agent` a été exécutée après redémarrage du terminal.

```text
Graphify : GRAPHIFY_READY — 3553 nœuds, 4492 liens
SCRIBE   : valide
MCP local : READY — 9 outils
Host MCP : non lié à la surface réelle du host
Statut   : LOCAL_INIT_READY_HOST_MCP_UNBOUND
```

Le CDP Chrome a donc été utilisé pour l’observation navigateur. La gouvernance MCP host reste à reconnecter avant une prochaine session TENOR complète.

## Travail API-first réalisé

Le provider et le sidebar utilisent désormais `ActionEntity` API comme source principale pour :

- nom et ticker ;
- ISIN et FIGI ;
- secteur et pays ;
- marché, devise et métadonnées d’instrument.

Le catalogue local `BRVM_SECURITIES` n’est plus la source principale de ces champs.

Le flux marché s’appuie sur les APIs et repositories actions, instruments et cours/OHLCV. La taille initiale de l’historique a été réduite de 5000 à 500 bougies afin d’éviter un chargement initial excessif, puis la récupération paginée et le préchargement vers la frontière historique ont été préparés.

Les fallbacks locaux encore identifiés sont les news, certains calculs dérivés lorsque l’API est incomplète et certaines descriptions de profil. Ils ne doivent pas être présentés comme des données API.

## Corrections visuelles

La régression principale concernait la zone chart : elle se confondait avec le fond général.

Correction appliquée :

- wrapper extérieur : `rgb(13, 33, 54)` ;
- zone chart : `rgb(16, 42, 67)` ;
- canvas transparent ;
- aucune bordure ajoutée ;
- aucune ombre ajoutée ;
- contours conservés selon la version stable.

La hauteur n’a pas été modifiée après preuve CDP :

```text
Localhost : canvas [74,166,1502,743]
Stable    : canvas [74,166,1502,743]
Viewport  : 1920x961, DPR 1
```

La différence avec TradingView vient de son interface différente et de l’absence de header AfriMarket dans son canvas de référence.

## Observation CDP TradingView

Pages observées :

- localhost : `http://localhost:3000/en/equity/technical-analysis` ;
- TradingView : `https://www.tradingview.com/chart/omHukTbl/` ;
- stable : `http://t5vvcg7oy35h66tus52062eu.85.190.99.121.sslip.io/en/equity/technical-analysis`.

TradingView attache ses interactions à la cellule du chart. Les listeners observés comprennent `wheel` non passif, `mousedown`, `mouseup`, `mousemove`, `touchstart`, `touchmove` et `touchend`.

Le bundle TradingView a été lu par Debugger CDP. Le comportement confirmé est :

- scale vertical démarré sur `mousedown` de l’axe prix ;
- scale continu pendant `mousemove` ;
- finalisation sur `mouseup` ;
- `preventDefault()` sur wheel ;
- ancrage au curseur ;
- déplacement de référence observé avec `15 * delta` ;
- mise à jour du viewport à chaque changement.

Ces règles sont documentées dans `Docs/TRADINGVIEW_BEHAVIORAL_ORACLE.md`.

## Interactions travaillées

### Horizontal

Le déplacement horizontal et la marge future à droite ont été pris en charge avec une limite future contrôlée, afin de reproduire le comportement TradingView sans dérive infinie.

### Historique

Le viewport signale l’approche de la frontière historique. Une page antérieure peut être chargée, fusionnée et dédupliquée sans réinitialiser la position utilisateur.

### Vertical et axe prix

Le premier drag vertical active le mode manuel. Le range manuel est conservé même lorsque les bornes dépassent temporairement les extrêmes visibles.

Le zoom vertical et le wheel axe prix utilisent un scale borné, un ancrage au curseur et un recalcul du pan inspiré du code TradingView observé.

## Problèmes examinés

- Bougies absentes ou chargement prolongé : flux API, taille initiale et viewport réexaminés.
- Fond chart : corrigé et comparé à la version stable.
- Hauteur supposée étirée : aucune régression, géométrie identique à la version stable.
- 404, 401, 308 refresh-token, requête news annulée et appels dupliqués : audit réseau final encore requis après rechargement propre.

## Zones principalement touchées

- providers et adapters sidebar ;
- repositories actions/cours ;
- APIs actions/base/cours ;
- hook Market Data ;
- viewport et mathématiques viewport ;
- renderer chart ;
- configuration layout ;
- styles technical analysis ;
- documentation API-first et oracle TradingView.

Les fichiers existants supprimés ou renommés déjà présents dans le workspace n’ont pas été supprimés par cette étape. Aucun nettoyage destructif ne doit être réalisé automatiquement.

## Feuille de route restante

### 1. Reconnecter TENOR host

Relancer l’init jusqu’à `TENOR_INIT_READY` et prouver la visibilité réelle de `tenor_init_bridge`, `tenor_task_start` et `tenor_apply_changeset`.

### 2. Finaliser la matrice CDP

Comparer TradingView puis localhost pour :

1. drag horizontal gauche/droite ;
2. drag vertical axe prix ;
3. wheel chart ;
4. wheel axe prix ;
5. zoom sous curseur ;
6. frontière historique ;
7. injection d’une page historique ;
8. frontière future ;
9. retour à la position courante.

Pour chaque geste : cible DOM, événement, delta, viewport avant/après, nombre de bougies et résultat visuel.

### 3. Calibrer l’axe prix

Mesurer plusieurs amplitudes TradingView/localhost et ajuster uniquement si l’écart est prouvé par CDP.

### 4. Terminer l’audit réseau

Vérifier après reload propre les endpoints actions, cours, ticker, refresh-token et brvm-news. Le critère de clôture est l’absence d’erreurs non justifiées, de polling dupliqué et de requêtes obsolètes non annulées proprement.

### 5. Validation finale

Exécuter `git diff --check`, lint/typecheck/tests disponibles, smoke CDP, comparaison stable, contrôle des `_Old`, puis produire l’inventaire final.

## État à la fermeture

La progression est substantielle, mais la parité TradingView complète n’est pas encore déclarée à 100 %. Le fond/layout sont validés contre la version stable. La matrice CDP, la calibration quantitative de l’axe prix et l’audit réseau final restent à terminer.

Prochaine action : reprendre par la matrice CDP, sans modifier le layout déjà validé.

## Preuves CDP finales — 2026-08-11

Le Chrome MCP étant indisponible (`Session terminated`), les preuves ont été exécutées directement via le CDP local `127.0.0.1:9222`, sans dépendance navigateur ajoutée.

- Reload propre localhost : 6 requêtes API distinctes, toutes HTTP 200 : identité action et pages cours 1 à 5, sans URL dupliquée dans la fenêtre de capture.
- Console après reload propre : 0 erreur, 0 warning.
- Matrice gestes CDP exécutée : drag horizontal, drag axe prix, wheel chart, wheel axe prix et drag frontière future.
- Géométrie canvas avant/après gestes : stable à `1502x743`, position `[74,166]` ; la version stable expose la même géométrie.
- Aucun écart quantitatif prouvé ne justifie une modification de l’axe prix ; aucun fichier applicatif n’a été modifié pendant cette reprise.

Validation locale déjà obtenue : 41 tests ciblés passés, 0 échec ; lint et typecheck TENOR passés, avec 44 avertissements ESLint préexistants hors correction applicative.
