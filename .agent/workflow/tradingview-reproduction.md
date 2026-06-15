# Workflow: TradingView Feature Reproduction

Derniere mise a jour: 2026-06-11

## Objectif

Ce workflow empeche les futures reproductions de grosses fonctionnalites
TradingView de redevenir des cycles d'echec. Il transforme les cicatrices du
projet en gates operationnels obligatoires.

Reference source actuelle: `https://www.tradingview.com/chart/omHukTbl/`
Target local canonique: `http://localhost:3000/equity/technical-analysis`

Important: `/equity/technical-analysis/old` sert uniquement a nettoyer ou
migrer du legacy. Il ne valide jamais la fonctionnalite produit principale.

## Contrat mission universel

Ce workflow doit permettre a l'utilisateur de donner seulement:

- une capture TradingView;
- le nom ou l'icone de la fonctionnalite;
- l'emplacement attendu dans le TA local;
- une consigne courte comme "reproduis ca dans localhost".

A partir de ces elements minimaux, l'agent doit executer la mission complete
sans demander a l'utilisateur de reecrire un prompt long.

### Phrase d'activation courte

L'utilisateur peut dire:

```text
TradingView reproduction: <nom feature>.
Reference: <capture ou URL TradingView>.
Target: http://localhost:3000/equity/technical-analysis.
Applique .agent/workflow/tradingview-reproduction.md.
```

L'agent doit alors considerer ce fichier comme le contrat de travail complet.

### Responsabilite de l'agent

L'agent ne doit pas interpreter vite la capture. Il doit:

1. reconnaitre la feature et son emplacement TradingView;
2. explorer TradingView avant toute implementation;
3. extraire un contrat visuel et fonctionnel mesurable;
4. comparer avec le localhost actuel;
5. decider s'il faut adapter une surface existante ou creer une vraie surface;
6. implementer dans le TA local seulement apres les preuves;
7. verifier dans le navigateur reel;
8. annoncer une completion honnete.

Si une etape est bloquee par login, permissions, reseau ou transport MCP,
l'agent documente le blocage avec preuve et continue uniquement sur les etats
observables. Il ne doit jamais inventer un comportement TradingView non observe.

## Ordre d'attaque obligatoire

Une mission TradingView suit toujours deux phases separees.

### Phase A - Reconnaissance et exploration

L'agent observe et documente. Il ne code pas.

Sortie obligatoire de Phase A:

- nom canonique de la feature TradingView;
- position exacte dans l'interface source;
- surface ouverte: rail, drawer, modal, popover, overlay, canvas, toolbar;
- etats observes: inactive, hover, active, loading, empty, error, locked,
  logged-out, logged-in si visible;
- preuves visuelles ou DOM;
- ecarts avec localhost;
- decision: adapter une surface existante ou creer une nouvelle surface.

### Phase B - Reproduction locale

L'agent implemente seulement apres Phase A.

Sortie obligatoire de Phase B:

- fichiers modifies;
- comportement local obtenu;
- validations statiques;
- validation navigateur MCP ou fallback CDP documente;
- jauge de completion;
- entree SCRIBE si la tranche est terminee.

Abort si l'agent veut coder avant d'avoir produit le contrat observe.

## Evidence pack minimal

Pour une feature visible, l'agent doit produire au minimum:

1. une preuve de l'etat ferme ou inactif;
2. une preuve hover ou tooltip si l'element en a un;
3. une preuve de l'etat ouvert ou actif;
4. une preuve locale sur /equity/technical-analysis;
5. une table de parite.

Table obligatoire:

| TradingView observe | Local actuel | Ecart | Action requise | Priorite |
|---|---|---|---|---|

Si screenshot MCP est indisponible mais DOM observable, l'agent peut fournir une
preuve DOM/CDP. Il doit expliquer pourquoi le screenshot n'a pas ete obtenu.

## Mesures pixel-perfect obligatoires

L'agent doit mesurer ou estimer explicitement:

- taille du bouton;
- taille de l'icone;
- padding interne;
- gap entre icones voisines;
- couleurs inactive, hover, active;
- border, radius, shadow, background;
- position dans le rail ou la toolbar;
- largeur et ancrage du panneau ouvert;
- animation d'ouverture/fermeture;
- typographie visible;
- densite verticale des listes, lignes ou cartes;
- comportement responsive si la surface est visible en mobile ou largeur reduite.

Ces mesures deviennent le contrat d'implementation. Une reproduction sans
mesures est incomplete.

## Decision adapter vs creer

Avant d'implementer une feature right rail, l'agent doit choisir et justifier:

- ADAPTER_EXISTANT: une entree locale existe deja et son intention correspond
  vraiment a TradingView;
- CREER_SURFACE: l'entree locale actuelle est un placeholder, une autre
  fonctionnalite, ou une abstraction trop vague;
- ISOLER_LEGACY: une ancienne surface doit rester dans le code pour
  compatibilite mais ne doit plus etre montee par la route produit.

Cette decision doit etre ecrite dans le plan avant les edits.

## Contrat generique Right Rail Panel

Pour toute nouvelle icone du rail droit TradingView, l'agent doit traiter la
feature comme une surface autonome.

Checklist:

- identifier le libelle TradingView exact du tooltip;
- identifier le groupe du rail: haut, milieu, bas;
- mesurer la position relative aux icones voisines;
- verifier si le clic ouvre un panneau, un overlay, une page externe ou une
  feature login-locked;
- verifier si le panneau reste ouvert lors d'un changement de ticker;
- verifier si un runtime hors-panel existe;
- verifier si l'etat doit persister;
- verifier si l'etat doit etre cross-tab;
- verifier si l'ancienne surface locale fait doublon.

## Template de section par feature

Chaque feature reproduite doit ajouter ou mettre a jour une section:

```markdown
## Right Rail <Feature Name>

Status: DISCOVERY | BUILDING | LOCAL_DONE | PRODUCTION_DONE | BLOCKED
Reference: <TradingView URL ou capture>
Target: http://localhost:3000/equity/technical-analysis

### TradingView Observed
- Icon:
- Tooltip:
- Position:
- Closed state:
- Hover state:
- Active state:
- Open surface:
- Empty/loading/error/login state:
- Interactions:
- Responsive behavior:

### Pixel Contract
- Button:
- Icon:
- Gap:
- Colors:
- Typography:
- Panel dimensions:
- Animation:

### Functional Contract
- State:
- Persistence:
- Runtime:
- Data:
- Notifications/logs:
- Permissions/login:

### Local Gap Table
| TradingView observe | Local actuel | Ecart | Action requise | Priorite |
|---|---|---|---|---|

### Implementation Plan
1. ...
2. ...
3. ...

### Validation
- Static:
- Browser MCP/CDP:
- Console:
- Network:
- Completion local:
- Completion production:
```

## Right Rail Chats

Status: LOCAL_DONE
Reference: https://www.tradingview.com/chart/omHukTbl/ + capture utilisateur Chats
Target: http://localhost:3000/equity/technical-analysis

### TradingView Observed
- Icon: deux bulles, tooltip exact `Chats`.
- Position: right rail, groupe haut, sous Object tree et au-dessus de Screeners.
- Closed state: bouton 44x44, fond transparent, couleur texte `rgb(15, 15, 15)`.
- Hover state: tooltip 52x24, fond `rgb(46, 46, 46)`, texte `rgb(242, 242, 242)`, radius 2px.
- Active state: `aria-pressed=true`, panneau right rail ouvert.
- Open surface: panneau right rail, largeur observee 392px sur viewport 1920px, onglets Public et Private.
- Empty/loading/error/login state: Private observe avec `You have no private messages yet`.
- Interactions: Public affiche un feed, textarea `Have something to say?`; Private affiche recherche vide et etat empty.
- Responsive behavior: non valide en mobile sur cette tranche.

### Pixel Contract
- Button: TradingView 44x44; local 44x44.
- Icon: lucide `MessagesSquare`, taille locale 20px dans bouton 44px.
- Gap: local 0.35rem entre icones, spacer avant groupe bas.
- Colors: actif local bleu `rgb(41, 98, 255)`, fond actif `rgb(28, 58, 87)`, bordure bleue.
- Typography: tabs locales 12.16px, messages compacts, line-height ~16.4px.
- Panel dimensions: TradingView observe 392x919; local 262x779 dans la largeur actuelle du sidebar produit.
- Animation: aucune animation custom ajoutee.

### Functional Contract
- State: `chats` est une entree autonome du right rail, distincte de notes, alerts et screeners.
- Persistence: aucune persistence ajoutee.
- Runtime: aucun runtime chat en arriere-plan.
- Data: feed BRVM local non connecte, explicitement marque comme apercu non connecte.
- Notifications/logs: aucun log ou notification cree.
- Permissions/login: input et talks desactives tant que le backend chat est absent.

### Local Gap Table
| TradingView observe | Local actuel | Ecart | Action requise | Priorite |
|---|---|---|---|---|
| Icone Chats sous Object tree | `Chats BRVM` sous Object tree | Conforme | Garder ordre rail | P0 |
| Panneau Public avec feed | Feed BRVM local non connecte | Donnees non temps reel | Ajouter backend chat si requis | P1 |
| Textarea message visible | Textarea visible et desactivee | Envoi absent volontaire | Connecter une action reelle avant activation | P0 |
| Private empty state | `You have no private messages yet` | Conforme | Aucun | P2 |
| Panel 392px TradingView | 262px local | Sidebar produit plus etroite | Decider une largeur globale right rail | P2 |

### Implementation Plan
1. Remplacer l entree placeholder `notes` par `chats` dans le rail.
2. Creer `ChatsRailPanel` avec onglets Public/Private, feed, composer desactive, talks desactives.
3. Ajouter styles SCSS dedies et verifier TypeScript/lint/MCP.

### Validation
- Static: ESLint cible OK; `./node_modules/.bin/tsc --noEmit --pretty false` OK.
- Browser MCP/CDP: page canonique rechargee, clic utilisateur normal Watchlist -> Chats OK, onglets Public/Private OK.
- Console: 0 warning/error apres interactions.
- Network: fetch/xhr existants 200; aucun appel chat fictif.
- Completion local: 92% - surface etats principaux fonctionnels, backend chat absent par design.
- Completion production: 78% - manque backend temps reel, auth private, persistence conversations, moderation et cross-tab.

## Contrat initial: Right Rail Chats

Declencheur: capture ou icone TradingView avec tooltip Chats et deux bulles de
discussion.

Objectif: reproduire la fonctionnalite Chats du right rail TradingView dans le
TA local, sans la confondre avec Alerts.

Exploration obligatoire:

- icone inactive;
- tooltip Chats;
- etat hover;
- etat active;
- surface ouverte;
- etat login-locked ou vide;
- liste de chats si visible;
- input message si visible;
- avatars, timestamps, badges unread, actions de recherche ou filtres si
  visibles;
- comportement fermeture/reouverture;
- difference avec Ideas, Community, Notes ou Notifications.

Decision locale obligatoire:

- si le panel local notes est seulement une synthese d'analyse, creer une vraie
  surface chats;
- si notes doit etre renomme ou separe, documenter l'impact UX;
- ne pas recycler un panel Notes comme Chats sans contrat fonctionnel coherent.

Contrat local minimal pour considerer Chats termine:

- icone right rail au bon emplacement;
- tooltip et active state conformes;
- panneau Chats dedie;
- etat logged-out ou empty coherent si aucun backend chat n'existe;
- liste de conversations mockee uniquement si marquee comme etat produit non
  connecte;
- input desactive ou connecte a une action reelle, jamais un faux input qui
  promet l'envoi sans effet;
- responsive et console propres;
- validation navigateur sur /equity/technical-analysis.

## Contrat audite: Right Rail Object Tree And Data Window

Declencheur: capture ou icone TradingView avec tooltip `Object tree and data
window` et pictogramme de couches.

Etat de mission 2026-06-11: la fonctionnalite existe deja dans le localhost.
Ne pas recreer le panel. Faire une passe de parite ciblee.

### TradingView observe

- position rail: apres Alerts et avant Chats;
- bouton rail: `data-name="object_tree"`, surface 44x44;
- panneau ouvert: zone droite externe ~438px, contenu widget ~392px, rail 44px;
- tabs: segmented control `Object tree` / `Data window`, wrapper ~360x34,
  boutons ~176x28;
- Object Tree toolbar:
  - `Create a group of drawings`, `data-name="group-button"`, desactive sans
    selection;
  - `Clone, Copy`, `data-name="copy-clone-button"`, desactive sans selection;
  - `Move to`, `data-name="move-to-button"`, desactive sans selection;
  - `Manage layout drawings`, `data-name="manage-drawings-button"`, actif;
- Object Tree body: tree compact, ligne racine instrument `BTCUSD - Bit tamp,
  1D`, hauteur ~38px, contenu minimal quand aucun dessin n est visible;
- Data Window body:
  - ligne Date;
  - groupe instrument `BTCUSD - 1D - Bit tamp`;
  - rows compactes: Open, High, Low, Close, Change, Vol, Last day change;
  - valeurs alignees a droite;
  - bouton inline `Hide data` par groupe;
  - donnees dependantes du curseur et de la bougie pointee.

### Localhost observe

- route correcte: `http://localhost:3000/equity/technical-analysis`;
- bouton rail present: `data-sidebar-entry="object-tree"`;
- panneau local ouvert: overlay dans `.gp-sidebar-main-content`, ~270x795 a
  droite du chart, rail local ~50px;
- tabs presents: `Object tree` / `Data window`, boutons ~115x32;
- toolbar presente: group, clone, visual order, manage drawings;
- Object Tree local liste la serie principale BRVM, le volume, les indicateurs
  actifs, les symbols compares et les dessins;
- Data Window local se met a jour au hover ECharts via DOM anchors O(1):
  `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-change`,
  `dw-volume`;
- slots de comparaison pre-alloues: `dw-comp-row-0..4`.

### Gaps locaux constates

| Priorite | Ecart | Pourquoi ca compte |
|---|---|---|
| P0 | Geometrie: local ~270px vs TradingView ~392px de contenu | Le panel existe, mais ne peut pas etre pixel-perfect avec cette largeur et ce placement. |
| P0 | Data Window rows incompletes: pas de `Last day change`, pas de variation `%` sur `Change` | TradingView donne valeur absolue + pourcentage; le local ne montre que le delta absolu. |
| P0 | Data Window sans groupe instrument complet | TradingView affiche le groupe `symbol - timeframe - venue`; local affiche seulement `OHLCV`. |
| P1 | Pas de bouton inline `Hide data` par groupe Data Window | TradingView permet de masquer une serie directement depuis la Data Window. |
| P1 | Toolbar locale active visuellement meme sans selection | TradingView montre les actions impossibles en etat disabled, ce qui reduit les faux clics. |
| P1 | Labels toolbar differents: `Clone selected` / `Visual order` vs `Clone, Copy` / `Move to` | Les affordances ne correspondent pas exactement au contrat TradingView. |
| P1 | Object Tree local enrichi BRVM mais pas strictement tree compact TradingView | La valeur produit est meilleure, mais la copie pixel-perfect exige densite, indentation et etats similaires. |
| P2 | Menus popover TradingView non captures en contrat complet | Avant patch menu, re-observer `Manage layout drawings` hors etat Screeners. |
| P2 | Captures visuelles possibles mais visualisation `/tmp` sandbox bloquee | Garder les PNG CDP et privilegier mesures DOM si le viewer local echoue. |

### Definition locale de completion

Le panel peut etre considere fonctionnellement existant. Il n est pas encore
pixel-perfect TradingView. La prochaine passe doit corriger seulement:

1. largeur/placement/densite du rail panel;
2. modele Data Window TradingView complet: date, groupe instrument, OHLC,
   Change avec pourcentage, Vol, Last day change;
3. bouton `Hide data` par groupe;
4. etats disabled exacts des actions toolbar;
5. labels et menus action alignes TradingView.

## Anti-echec: erreurs deja vues

Ces erreurs sont interdites:

- partir de /old au lieu de /equity/technical-analysis;
- coder une icone right rail sans hover, tooltip et panel observes;
- creer un modal quand TradingView utilise un rail;
- garder deux runtimes actifs sans decision de legacy;
- valider uniquement par TypeScript;
- confondre une indisponibilite backend optionnelle avec un bug panel;
- annoncer fini sans jauge locale et TradingView;
- utiliser un prompt ponctuel comme source de verite au lieu de ce workflow;
- inventer les parties bloquees par login;
- installer un framework navigateur externe pour contourner MCP sans preuve
  d'indisponibilite.

## Prompt minimal pour agent externe

Quand un autre agent doit prendre une feature TradingView, lui donner seulement:

```text
Applique strictement .agent/workflow/tradingview-reproduction.md.
Feature TradingView: <nom ou icone>.
Reference: <URL ou capture>.
Target local: http://localhost:3000/equity/technical-analysis.
Mission: Phase A reconnaissance, puis Phase B reproduction locale pixel-perfect.
Ne code pas avant d'avoir produit le contrat observe, la table de parite et le plan.
```

Ce prompt minimal suffit parce que le contrat complet est dans ce fichier.

## Declencheurs

Utiliser ce workflow avant toute reproduction TradingView qui touche:

- right rail, watchlist, alerts, object tree, data window;
- toolbar, drawing tools, measure tools, cursor modes;
- chart rendering, ECharts, zoom, wheel, overlays, markers;
- indicators, templates, strategy panels;
- replay, publication, saved analysis;
- persistence client, notifications, logs, runtime monitors.

## Gate 0 - Memoire et carte

Avant de coder:

1. Lire `graphify-out/GRAPH_REPORT.md` si present.
2. Lancer une requete Graphify ciblee:
   `graphify query "TradingView <feature> reproduction localhost blast radius" --budget 1000`
3. Interroger le SCRIBE:
   `.agent/workflow/scribe/scribe-rag query "TradingView <feature> errors workflow scars vaccins" --limit 12`
4. Lister les SCAR/VAC/PAT/GHOST applicables dans le plan.
5. Si la feature touche le navigateur, lire `.agent/workflow/mcp/chrome-devtools.md`.

Abort si cette phase ne produit pas un scope clair et des cicatrices
applicables.

## Gate 1 - Stalk TradingView avant implementation

Avant de reproduire une feature inspiree TradingView:

1. Ouvrir la reference TradingView dans Chrome DevTools MCP.
2. Interagir comme un utilisateur: ouvrir le panneau, cliquer, fermer,
   changer d'onglet, saisir, verifier les etats vides et les erreurs.
3. Capturer le contrat visible:
   - emplacement exact;
   - type de surface: right rail, modal, toolbar, popover, canvas overlay;
   - etats attendus: idle, draft, saved, triggered, error, empty;
   - interactions clavier/souris;
   - persistance attendue;
   - messages et affordances essentiels.
4. Ecrire le contrat avant le code dans la note de travail ou le plan.

Regle issue de `SCAR-TA-RIGHT-RAIL-TRADINGVIEW-STALK-FIRST-001`:
ne jamais coder une icone du rail droit sans avoir observe sa surface cible.

## Gate 2 - Scope produit et anti-legacy

Chaque tranche doit declarer:

- target local canonique: toujours `/equity/technical-analysis`;
- fichiers cibles;
- fichiers legacy a neutraliser ou a isoler;
- surface UI finale attendue;
- etat Redux/context/IndexedDB touche;
- risques backend visibles;
- tests et smoke MCP requis.

Pour les features right rail:

- la surface finale est le rail droit;
- pas de modal overlay legacy;
- pas de double systeme actif sans decision explicite;
- si un ancien modal reste dans le code, il ne doit plus etre monte par la route
  produit canonique.

## Gate 3 - Regles d'implementation

### Persistence

- TA/TBI persiste en IndexedDB.
- Ne pas utiliser `localStorage` pour les etats trading, drafts, logs,
  preferences ou alertes.
- Justification: `VAC-TA-TBI-NO-LOCALSTORAGE-001`.

### ECharts et canvas

- Ne jamais muter une instance ECharts disposee.
- Enregistrer les modules requis avant usage.
- Serialiser les mutations sensibles dans une queue ou un effet controle.
- Un wheel zoom financier ne doit pas lancer plusieurs pipelines concurrents.
- Justifications: `VAC-ECHARTS-MUTATION-QUEUE-001`,
  `VAC-ECHARTS-SMOOTH-WHEEL-ZOOM-001`,
  `SCAR-ECHARTS-DISPOSED-DRAWING-LOOP-001`.

### Data

- Les bougies de production viennent des donnees BRVM verifiees.
- Pas de fake candles dans le chemin produit canonique.
- Les fallbacks doivent etre visibles, explicites, et non confondus avec des
  donnees reelles.

### UI

- Pas d'animation parasite de scroll.
- Pas de modal scroll regressif.
- Pas de surface flottante si TradingView utilise un rail ou une toolbar.
- Justification: `VAC-MODAL-SCROLL-001`.

## Gate 4 - Contrat specifique Alert Panel

Le panel Alert est complet seulement si ces points sont vrais sur
`/equity/technical-analysis`:

- le bouton toolbar ou rail ouvre `Alertes BRVM` dans le right rail;
- `document.querySelectorAll('[role="dialog"]').length === 0`;
- aucun `.alerts-modal` legacy n'est monte;
- creation, activation, desactivation et suppression fonctionnent;
- le draft est coherent avec le ticker courant;
- les alertes multi-ticker ne dependent pas seulement du snapshot Redux courant;
- IndexedDB contient alerts, drafts, logs et preferences;
- le journal affiche les triggers utiles;
- le calendrier BRVM gere weekdays, heures UTC et jours feries connus;
- le runtime nettoie ses timers/listeners;
- la console navigateur reste sans warning/error lie a Alert.

Memoire liee:

- `SCAR-TA-ALERTS-MULTITICKER-REDUX-SNAPSHOT-GAP-001`
- `SCAR-TA-ALERTS-MULTITICKER-STALE-CONTEXT-PRIORITY-001`
- `GHOST-TA-ALERTS-IDB-PERSISTENCE-20260610`

## Gate 5 - Smoke navigateur MCP obligatoire

Pour toute feature TradingView, valider avec Chrome DevTools MCP:

1. `list_pages`
2. `select_page` ou `new_page` vers `http://localhost:3000/equity/technical-analysis`
3. `navigate_page` reload si necessaire
4. `take_snapshot`
5. interactions reelles: `click`, `fill`, `press_key`, `hover`, ou
   `evaluate_script`
6. assertions DOM observables
7. `list_console_messages` pour errors/warnings
8. `list_network_requests` pour fetch/xhr
9. screenshot ou sonde DOM/canvas quand la feature est visuelle

Interdit par defaut:

- ajouter Playwright, Cypress, Puppeteer ou Selenium pour ce smoke;
- valider uniquement par TypeScript;
- valider sur `/old` au lieu du target local canonique.

## Gate 6 - Completion meter

Avant de dire "fait", donner deux jauges:

- Completion locale fonctionnelle: ce qui marche vraiment sur localhost.
- Completion production reelle: ce qui tiendra en conditions produit.

Si production < local, lister les raisons concretes: backend, donnees, edge
cases, cross-tab, persistence, tests, accessibilite, perf, logs.

## Gate 7 - Closeout SCRIBE

En fin de tranche:

1. Ecrire uniquement le pourquoi dans le SCRIBE.
2. Ajouter une SCAR si une erreur a coute plus de deux tentatives.
3. Ajouter un VAC si une recidive doit etre empechee.
4. Ajouter un PAT si une methode devient reproductible.
5. Ajouter un GHOST si une decision d'architecture doit survivre aux sessions.
6. Ne pas ecrire dans le SCRIBE les faits structurels que Graphify sait deja.

## Definition of Done

Une reproduction TradingView est livrable seulement si:

- Phase A a produit le contrat TradingView observe avant le code;
- la section feature correspondante est ajoutee ou mise a jour dans ce workflow;
- la table de parite TradingView/local est presente;
- les mesures pixel-perfect minimales sont presentes;
- la decision ADAPTER_EXISTANT, CREER_SURFACE ou ISOLER_LEGACY est justifiee;
- le target local canonique a ete teste;
- Graphify et SCRIBE ont ete consultes;
- les cicatrices applicables ont ete respectees;
- le legacy actif est neutralise ou explicitement isole;
- TypeScript/lint/tests cibles passent;
- Chrome DevTools MCP ou fallback CDP documente prouve l'etat reel du navigateur;
- console et reseau sont expliques;
- les jauges feuille de route, local fonctionnel et parite TradingView sont annoncees sans maquillage.

## Commandes utiles

Alert rail:

```bash
npm run test:alerts-rail
npx eslint components/technical-analysis/components/sidebar/panels/AlertsRailPanel.tsx
./node_modules/.bin/tsc --noEmit --pretty false
```

Memoire:

```bash
graphify query "TradingView alert panel right rail blast radius" --budget 1000
.agent/workflow/scribe/scribe-rag query "TradingView alert panel scars vaccins" --limit 12
```

Browser:

```text
MCP Chrome DevTools:
list_pages -> select_page/new_page -> navigate_page -> take_snapshot ->
click/fill/press_key/evaluate_script -> list_console_messages ->
list_network_requests -> screenshot/DOM assertion
```
