[# Workflow: TradingView Feature Reproduction

Derniere mise a jour: 2026-06-18

Version: TVR-WORKFLOW-V2-LEAD-PIXEL-PERFECT

Reference source actuelle: `https://www.tradingview.com/chart/omHukTbl/`

Target local canonique: `http://localhost:3000/equity/technical-analysis`

Important: `/equity/technical-analysis/old` sert uniquement a nettoyer ou migrer du legacy. Il ne valide jamais la fonctionnalite produit principale.

---

# 0. Mission absolue

Ce workflow sert a reproduire avec rigueur senior lead front-end chaque outil, section, partie, fonctionnalite et detail visuel de l'interface TradingView vers le TA local.

Objectif:

* reproduction visuelle pixel-perfect;
* reproduction fonctionnelle fidele;
* comportement utilisateur coherent;
* validation navigateur reelle;
* robustesse production;
* zero auto-validation mensongere;
* zero "presque pareil" vendu comme fini.

Ce fichier est le contrat complet. Quand l'utilisateur demande de reproduire une feature TradingView et dit d'appliquer ce workflow, l'agent doit executer tout ce protocole sans demander a l'utilisateur de reecrire un prompt long.

---

# 1. Ingenierie de robustesse — charge reelle de production

L'agent DOIT redoubler d'effort d'ingenierie logicielle pour que tout ce qui est livre fonctionne avec des performances et une robustesse long-terme.

Le code sera soumis a:

* charge concurrente: N utilisateurs simultanes, race conditions reelles, deadlocks evites;
* donnees a l'echelle: volumetrie 10x, 100x, 1000x anticipee des la conception;
* latence reseau africaine et mondiale: timeouts calibres, retry avec exponential backoff, circuit breakers actifs si backend concerne;
* pannes partielles: un service tombe, le reste survit avec graceful degradation;
* memory leaks interdits: cleanup explicite, subscriptions detruites, listeners supprimes;
* securite sous charge: aucun bypass auth possible, rate limiting si action sensible;
* observabilite integree: logs structures, metriques utiles, erreurs tracables jusqu'a la source.

Regle fondamentale:
si l'agent doit choisir entre "ca marche en demo" et "ca tient en prod a 3h du matin sous charge x10", il choisit toujours la seconde option.

Exception:
si la feature est purement front-end locale sans backend ni runtime, l'agent doit quand meme verifier:

* absence de fuite memoire;
* absence d'effet concurrent non controle;
* absence de boucle de rendu couteuse;
* absence de listener orphelin;
* absence de re-render massif;
* absence de faux etat produit non connecte.

---

# 2. Protocole de pre-engagement obligatoire avant tout code

Avant d'ecrire la premiere ligne de code, l'agent DOIT declarer explicitement:

1. La liste exhaustive de tous les fichiers qu'il pense modifier ou produire.
2. Pour chaque fichier:

   * fonctions;
   * classes;
   * composants;
   * hooks;
   * modules;
   * styles;
   * tests;
   * registres touches.
3. Son estimation honnete:

   * peut-il livrer 100% en un seul passage ?
   * si non, il declare le chunking: Partie 1/N, Partie 2/N, etc.
4. Les risques:

   * visuels;
   * fonctionnels;
   * legacy;
   * canvas;
   * performance;
   * donnees;
   * persistence;
   * navigateur/MCP/CDP.

Interdit:

* surprise de troncature en cours de livraison;
* commencer a coder sans liste de fichiers;
* creer un fichier non annonce sans mettre a jour le plan;
* annoncer une livraison totale si une partie est volontairement laissee incomplete.

---

# 3. Niveau de completude absolu

Exigence:

* completude exhaustive;
* granularite integrale;
* zero ellipse;
* zero simplification cachee;
* code final directement executable;
* isomorphisme fonctionnel entre spec et output.

Interdictions:

* `TODO`;
* `FIXME`;
* `...`;
* corps symbolique;
* faux-achievement;
* structure nommee sans corps;
* composant vide;
* handler qui ne fait rien sans indication produit explicite;
* input actif sans action reelle;
* mock non marque comme mock;
* comportement invente non observe sur TradingView.

Si une fonctionnalite ne peut pas etre implementee faute de backend, login, donnees ou permissions, elle doit etre:

* affichee comme non connectee;
* desactivee proprement;
* documentee comme gap production;
* jamais presentee comme terminee a 100%.

---

# 4. Anti-amnesie de spec

Les contraintes de debut de mission gardent le meme poids du token 1 au token final.

Avant chaque fichier, composant ou patch majeur, l'agent doit mentalement revalider:

* target canonique;
* feature TradingView cible;
* capture utilisateur;
* contrat observe;
* table de parite;
* modes actifs;
* contraintes de robustesse;
* interdiction de legacy actif;
* validation navigateur requise;
* jauges de completion.

Aucune contrainte ne s'attenue parce que la session devient longue.

---

# 5. Edge cases first

Pour chaque fonction, composant, hook ou runtime, l'agent traite les cas difficiles avant le happy path:

* null;
* undefined;
* tableau vide;
* donnees invalides;
* ticker absent;
* chart non pret;
* canvas non monte;
* instance ECharts disposee;
* dimensions zero;
* resize pendant interaction;
* double clic;
* clic hors zone;
* changement ticker pendant panneau ouvert;
* reload;
* navigation;
* cleanup;
* timeouts;
* race conditions;
* backend absent;
* permissions/login;
* network slow;
* mode mobile ou largeur reduite si visible.

Le happy path est banal. La robustesse est le vrai travail.

---

# 6. Auto-audit obligatoire avant livraison de chaque fichier

Avant de livrer ou valider chaque fichier modifie, l'agent doit verifier:

* toutes les fonctions declarees ont un corps reel et complet;
* les edge cases sont implementes, pas seulement commentes;
* les imports existent;
* les dependances sont disponibles;
* aucun secret en dur;
* aucune mutation dangereuse;
* aucun `catch` vide;
* aucune boucle bloquante;
* aucun N+1 evident;
* cleanup effectue pour listeners/timers/subscriptions;
* le code domine les commentaires;
* les commentaires expliquent le pourquoi, pas le quoi banal;
* aucun drift entre la spec et l'implementation.

---

# 7. Non-negociables absolus

* Tout ce qui est annonce comme fait doit fonctionner reellement.
* Pas 99%, pas 65%, pas "a peu pres".
* Zero detail omis quand il est visible dans TradingView ou dans la capture.
* Zero approximation non declaree.
* Zero travail bacle.
* Zero element partiel presente comme complet.
* Zero drift documentation.
* Double-verification obligatoire.
* Triple-check: auth, data, security, performance, robustesse.
* Qualite superieure a rapidite.

Si l'agent n'est pas certain, il annonce l'incertitude et produit une preuve partielle au lieu d'inventer.

---

# 8. Standard d'excellence

L'agent doit travailler avec un niveau senior lead front-end, comme si le code devait etre relu par une equipe qui a concu:

* systemes d'exploitation;
* compilateurs;
* moteurs graphiques;
* outils financiers critiques;
* interfaces pixel-perfect d'agences web mondiales.

Methodologies a appliquer selon pertinence:

* SRE;
* TDD quand testable;
* DDD quand domaine metier touche;
* Clean Architecture;
* architecture hexagonale si backend/domain concerne;
* DRY;
* SOLID;
* preconditions/postconditions/invariants;
* threat modeling;
* zero-trust;
* defense in depth;
* performance engineering;
* idempotence;
* resilience by design;
* gestion async propre;
* latence variable;
* degradation controlee.

Important:
ce workflow n'autorise pas le theatre d'excellence. Il exige des preuves observables.

---

# 9. Contrat mission universel

Ce workflow doit permettre a l'utilisateur de donner seulement:

* une capture TradingView;
* le nom ou l'icone de la fonctionnalite;
* l'emplacement attendu dans le TA local;
* une consigne courte comme "reproduis ca dans localhost".

A partir de ces elements minimaux, l'agent doit executer la mission complete sans demander a l'utilisateur de reecrire un prompt long.

## Phrase d'activation courte

L'utilisateur peut dire:

```text
TradingView reproduction: <nom feature>.
Reference: <capture ou URL TradingView>.
Target: http://localhost:3000/equity/technical-analysis.
Applique .agent/workflow/tradingview-reproduction.md.
```

L'agent doit alors considerer ce fichier comme le contrat de travail complet.

## Responsabilite de l'agent

L'agent ne doit pas interpreter vite la capture. Il doit:

1. reconnaitre la feature et son emplacement TradingView;
2. explorer TradingView avant toute implementation;
3. extraire un contrat visuel et fonctionnel mesurable;
4. comparer avec le localhost actuel;
5. decider s'il faut adapter une surface existante ou creer une vraie surface;
6. implementer dans le TA local seulement apres les preuves;
7. verifier dans le navigateur reel;
8. annoncer une completion honnete.

Si une etape est bloquee par login, permissions, reseau ou transport MCP, l'agent documente le blocage avec preuve et continue uniquement sur les etats observables.

Il ne doit jamais inventer un comportement TradingView non observe.

---

# 10. Modes d'execution et de reprise

Ce workflow ne fonctionne pas seulement en mode lineaire. L'agent doit choisir explicitement un mode avant d'agir.

Objectifs des modes:

* eviter l'auto-satisfaction prematuree;
* forcer la remise en question quand localhost ne ressemble pas a TradingView;
* separer reproduction, audit, correction fine et reset architectural;
* permettre a l'utilisateur de declencher une reprise forte avec une phrase courte;
* coiffer tout le processus quand la reproduction capote.

## Regle globale anti-auto-validation

Si l'utilisateur signale que le rendu local ne correspond pas a TradingView, l'agent doit immediatement considerer sa derniere completion comme invalidee.

Interdictions:

* ne pas defendre l'implementation;
* ne pas expliquer que "c'est proche" sans mesures;
* ne pas repondre seulement par une justification;
* ne pas patcher au hasard;
* ne pas annoncer "fini" tant que la divergence signalee n'a pas ete re-observee;
* ne pas ignorer la capture ou le jugement visuel utilisateur.

L'agent doit repasser en mode audit ou reset selon la gravite.

---

## MODE 1 — STANDARD_REPRODUCTION

### Quand l'utiliser

Mode par defaut quand l'utilisateur donne:

* une capture TradingView;
* le nom d'un outil, d'une section ou d'une fonctionnalite;
* la target locale `/equity/technical-analysis`;
* une consigne de reproduction.

### But

Executer le workflow normal:

1. Phase A reconnaissance TradingView;
2. contrat observe;
3. table de parite;
4. plan;
5. implementation locale;
6. validation navigateur;
7. completion meter.

### Sortie obligatoire

* mode actif;
* contrat TradingView observe;
* decision ADAPTER_EXISTANT / CREER_SURFACE / ISOLER_LEGACY;
* fichiers modifies;
* preuves locales;
* completion locale;
* completion parite TradingView;
* completion production;
* ecarts restants.

---

## MODE 2 — PIXEL_AUDIT_STRICT

### Quand l'utiliser

A utiliser quand:

* l'implementation existe deja;
* l'utilisateur doute du rendu;
* une feature est fonctionnelle mais pas pixel-perfect;
* une capture locale et une capture TradingView doivent etre comparees;
* l'agent a deja code et doit prouver que le rendu est fidele.

### But

Ne pas coder immediatement. Mesurer et comparer.

### Procedure obligatoire

1. Reprendre la capture TradingView ou reouvrir TradingView.
2. Reprendre le localhost sur `/equity/technical-analysis`.
3. Produire une comparaison visuelle zone par zone:

   * position;
   * taille;
   * alignement;
   * couleurs;
   * spacing;
   * typographie;
   * etats hover/active;
   * surface ouverte;
   * densite;
   * interactions;
   * responsive si visible.
4. Produire une table des deltas.
5. Classer chaque delta:

   * P0: casse la ressemblance principale;
   * P1: visible et genant;
   * P2: difference mineure;
   * P3: acceptable provisoirement.

### Interdiction

Ne pas modifier le code avant d'avoir produit la table des deltas.

### Table obligatoire

| Zone | TradingView | Localhost | Delta observe | Gravite | Correction requise |
| ---- | ----------- | --------- | ------------- | ------- | ------------------ |

---

## MODE 3 — USER_RED_FLAG_REDO

### Phrase d'activation courte

L'utilisateur peut dire:

```text
MODE RED FLAG: le rendu localhost ne correspond pas a TradingView.
Reprends depuis l'observation, dezoome, audite les deltas et corrige sans te defendre.
```

L'utilisateur peut aussi dire de maniere informelle:

```text
C'est la merde, ce n'est pas identique.
```

Dans ce cas, l'agent doit comprendre que le mode USER_RED_FLAG_REDO est active.

### Quand l'utiliser

Ce mode est obligatoire des que l'utilisateur dit que:

* le rendu local ne ressemble pas a TradingView;
* l'agent a rate le visuel;
* la reproduction est incoherente;
* une section, un outil ou un detail est faux;
* le localhost et la capture source ne racontent pas la meme chose;
* le resultat fait perdre du temps;
* le produit local est visuellement different de ce que l'utilisateur voit.

### Regle comportementale

L'utilisateur devient la source de verite sur la divergence observee.

L'agent doit repondre comme un senior lead front:

* accepter l'invalidation;
* arreter l'auto-justification;
* refaire une observation;
* comparer avec humilite;
* isoler les deltas;
* corriger methodiquement.

### Procedure obligatoire

1. Marquer la derniere completion comme invalidee.
2. Relire la consigne initiale et la capture source.
3. Reouvrir TradingView ou utiliser la capture source comme reference si TradingView est bloque.
4. Reouvrir le localhost.
5. Faire un audit visuel strict.
6. Produire une table de divergence.
7. Identifier la cause probable:

   * mauvaise surface;
   * mauvais composant recycle;
   * mauvaise largeur;
   * mauvaise iconographie;
   * mauvais etat actif;
   * mauvaise densite;
   * mauvaise interaction;
   * mauvaise interpretation de la capture;
   * legacy encore monte;
   * DOM correct mais rendu visuel faux;
   * canvas incorrect;
   * mauvais calque;
   * mauvaise categorie d'outil;
   * mauvaise source de verite.
8. Decider:

   * MICRO_DELTA_PATCH si les differences sont petites;
   * DEZOOM_RESET si l'approche est mauvaise;
   * CREER_SURFACE si la surface locale actuelle est un faux equivalent;
   * ISOLER_LEGACY si l'ancien code pollue encore la route canonique.
9. Corriger uniquement les divergences observees.
10. Revalider avec capture ou DOM observable.
11. Donner une nouvelle jauge honnete.

### Interdictions

* Ne pas dire "c'est juste une difference mineure" sans mesure.
* Ne pas annoncer 100% si l'utilisateur voit encore une difference.
* Ne pas corriger uniquement la couleur si la structure est fausse.
* Ne pas patcher 10 fichiers sans expliquer le delta vise.
* Ne pas ignorer la capture utilisateur.
* Ne pas utiliser l'ancienne implementation comme preuve qu'elle est correcte.
* Ne pas se cacher derriere TypeScript si le visuel est faux.

---

## MODE 4 — DEZOOM_RESET

### Quand l'utiliser

A utiliser quand l'audit montre que le probleme n'est pas un petit ecart, mais une mauvaise interpretation globale.

Signaux:

* le local utilise un modal alors que TradingView utilise un rail;
* le local recycle une ancienne surface qui ne correspond pas;
* l'outil est fonctionnel mais sa logique de placement est fausse;
* les proportions generales sont incorrectes;
* la zone est au mauvais endroit;
* plusieurs P0 apparaissent dans la table des deltas;
* l'utilisateur dit que "ce n'est pas du tout la meme chose";
* l'implementation semble etre une abstraction locale au lieu d'une reproduction TradingView.

### But

Revenir au niveau architecture et intention produit.

### Procedure obligatoire

1. Stopper les micro-patchs.
2. Reprendre la question: "Quelle surface TradingView suis-je vraiment en train de reproduire ?"
3. Reidentifier:

   * surface source;
   * emplacement;
   * runtime;
   * comportement;
   * dimensions;
   * donnees;
   * etats;
   * relation avec les surfaces locales existantes.
4. Decider si l'implementation actuelle doit etre:

   * gardee;
   * corrigee;
   * isolee en legacy;
   * supprimee du montage produit;
   * remplacee par une nouvelle surface.
5. Produire un nouveau plan avant tout edit.

### Sortie obligatoire

```text
Verdict DEZOOM:
- Ce que j'ai mal compris:
- Ce que TradingView fait reellement:
- Ce que le localhost fait actuellement:
- Pourquoi les deux divergent:
- Decision: ADAPTER_EXISTANT / CREER_SURFACE / ISOLER_LEGACY / REECRIRE
- Plan de correction:
```

---

## MODE 5 — MICRO_DELTA_PATCH

### Quand l'utiliser

A utiliser uniquement apres PIXEL_AUDIT_STRICT ou USER_RED_FLAG_REDO, si les differences sont localisees.

Exemples:

* bouton 44px vs 40px;
* icone trop grande;
* gap incorrect;
* couleur active differente;
* panel trop etroit;
* padding vertical faux;
* typo trop grosse;
* hover state incomplet;
* border radius faux;
* hauteur de ligne incorrecte.

### But

Corriger les differences visibles une par une, sans refaire toute l'architecture.

### Regle

Un patch doit viser un delta observe.

Chaque modification doit etre liee a une ligne de la table des deltas.

### Sortie obligatoire

| Delta cible | Fichier modifie | Correction appliquee | Validation |
| ----------- | --------------- | -------------------- | ---------- |

---

## MODE 6 — SOURCE_OF_TRUTH_LOCK

### Quand l'utiliser

Quand plusieurs sources se contredisent:

* TradingView live;
* capture utilisateur;
* DOM MCP;
* screenshot local;
* interpretation de l'agent;
* anciens contrats du workflow;
* SCRIBE;
* Graphify.

### Hierarchie de verite

1. Capture utilisateur actuelle de TradingView.
2. TradingView live observe par MCP/CDP.
3. DOM et mesures pixel observees.
4. Contrat ecrit dans le workflow.
5. Memoire SCRIBE/Graphify.
6. Intuition de l'agent.

Si la capture utilisateur contredit l'interpretation de l'agent, la capture gagne.

### Regle

L'agent doit verrouiller la source de verite avant de corriger.

Sortie obligatoire:

```text
Source de verite retenue:
- Reference principale:
- Reference secondaire:
- Elements ignores:
- Pourquoi:
```

---

## MODE 7 — BLOCKED_BUT_HONEST

### Quand l'utiliser

Quand TradingView, MCP, CDP, reseau, login ou permissions bloquent l'observation complete.

### But

Continuer seulement sur les faits observables, sans inventer.

### Procedure

1. Dire ce qui est bloque.
2. Dire ce qui reste observable.
3. Dire quelle source remplace l'observation manquante:

   * capture utilisateur;
   * DOM partiel;
   * screenshot local;
   * ancienne observation documentee;
   * contrat deja present.
4. Marquer les hypotheses comme hypotheses.
5. Interdire la completion 100%.

### Formule obligatoire

```text
Blocage observe:
Hypotheses interdites:
Ce que je peux verifier:
Ce que je ne peux pas verifier:
Niveau de confiance:
```

---

## MODE 8 — LEAD_QA_CLOSEOUT

### Quand l'utiliser

Avant d'annoncer que la tranche est terminee.

### But

Forcer une conclusion senior, pas une conclusion optimiste.

### Checklist obligatoire

* La source TradingView a ete observee ou la capture utilisateur a ete verrouillee.
* Le localhost canonique a ete teste.
* Les etats idle, hover, active/open ont ete verifies si applicables.
* La table de parite existe.
* Les deltas restants sont listes.
* Les P0 sont corriges ou explicitement bloques.
* Les P1 sont corriges ou justifies.
* Aucun legacy actif ne contredit la route produit.
* Console et network sont expliques.
* La completion locale et production sont separees.
* La completion parite TradingView est separee.
* Si l'utilisateur a active USER_RED_FLAG_REDO, la divergence signalee est explicitement traitee.

### Sortie obligatoire

```text
Closeout Lead QA:
- Ce qui est maintenant conforme:
- Ce qui reste different:
- P0 restants:
- P1 restants:
- Risques production:
- Completion locale:
- Completion parite TradingView:
- Completion production:
- Verdict honnete:
```

---

## MODE 9 — REGRESSION_GUARD

### Quand l'utiliser

A utiliser apres une correction RED FLAG ou apres une feature sensible.

### But

Verifier que la correction n'a pas casse:

* une feature voisine;
* un ancien outil TradingView;
* un panel deja valide;
* une route canonique;
* une persistence;
* un canvas;
* un runtime.

### Procedure obligatoire

1. Identifier les zones adjacentes touchees.
2. Rejouer au minimum un smoke test sur chaque zone adjacente.
3. Verifier console.
4. Verifier network si runtime.
5. Verifier que l'ancien bug ne revient pas.
6. Si regression detectee, ne pas annoncer fini.

### Sortie obligatoire

| Zone adjacente | Risque | Verification | Resultat |
| -------------- | ------ | ------------ | -------- |

---

## Router de modes

L'agent doit choisir le mode selon le contexte:

| Situation                               | Mode obligatoire      |
| --------------------------------------- | --------------------- |
| Nouvelle feature a reproduire           | STANDARD_REPRODUCTION |
| Feature deja codee mais doute visuel    | PIXEL_AUDIT_STRICT    |
| L'utilisateur dit que le rendu est faux | USER_RED_FLAG_REDO    |
| Plusieurs differences majeures P0       | DEZOOM_RESET          |
| Differences petites et mesurees         | MICRO_DELTA_PATCH     |
| Sources contradictoires                 | SOURCE_OF_TRUTH_LOCK  |
| TradingView/MCP/CDP bloque              | BLOCKED_BUT_HONEST    |
| Avant de dire "fait"                    | LEAD_QA_CLOSEOUT      |
| Apres correction sensible               | REGRESSION_GUARD      |

---

## Phrase d'activation utilisateur recommandee

Pour forcer une reprise stricte, l'utilisateur peut dire:

```text
MODE RED FLAG TradingView.
Ta reproduction localhost ne correspond pas a la reference.
Ne te justifie pas.
Reprends la source de verite, compare TradingView vs localhost, produis la table des deltas, dezoome si necessaire, puis corrige uniquement les divergences observees.
Applique .agent/workflow/tradingview-reproduction.md.
```

---

# 11. Ordre d'attaque obligatoire

Une mission TradingView suit toujours deux phases separees.

## Phase A — Reconnaissance et exploration

L'agent observe et documente. Il ne code pas.

Sortie obligatoire de Phase A:

* mode actif;
* nom canonique de la feature TradingView;
* position exacte dans l'interface source;
* surface ouverte: rail, drawer, modal, popover, overlay, canvas, toolbar;
* etats observes: inactive, hover, active, loading, empty, error, locked, logged-out, logged-in si visible;
* preuves visuelles ou DOM;
* mesures pixel-perfect;
* ecarts avec localhost;
* decision: adapter une surface existante ou creer une nouvelle surface.

## Phase B — Reproduction locale

L'agent implemente seulement apres Phase A.

Sortie obligatoire de Phase B:

* fichiers modifies;
* comportement local obtenu;
* validations statiques;
* validation navigateur MCP ou fallback CDP documente;
* table de deltas restants;
* jauge de completion locale;
* jauge de parite TradingView;
* jauge de production;
* entree SCRIBE si la tranche est terminee.

Abort si l'agent veut coder avant d'avoir produit le contrat observe.

---

# 12. Evidence pack minimal

Pour une feature visible, l'agent doit produire au minimum:

1. une preuve de l'etat ferme ou inactif;
2. une preuve hover ou tooltip si l'element en a un;
3. une preuve de l'etat ouvert ou actif;
4. une preuve locale sur `/equity/technical-analysis`;
5. une table de parite;
6. une table des deltas si une divergence est signalee;
7. une jauge de completion honnete.

Table obligatoire:

| TradingView observe | Local actuel | Ecart | Action requise | Priorite |
| ------------------- | ------------ | ----- | -------------- | -------- |

Si screenshot MCP est indisponible mais DOM observable, l'agent peut fournir une preuve DOM/CDP. Il doit expliquer pourquoi le screenshot n'a pas ete obtenu.

---

# 13. Mesures pixel-perfect obligatoires

L'agent doit mesurer ou estimer explicitement:

* taille du bouton;
* taille de l'icone;
* padding interne;
* gap entre icones voisines;
* couleurs inactive, hover, active;
* border;
* radius;
* shadow;
* background;
* position dans le rail ou la toolbar;
* largeur et ancrage du panneau ouvert;
* animation d'ouverture/fermeture;
* typographie visible;
* densite verticale des listes, lignes ou cartes;
* comportement responsive si la surface est visible en mobile ou largeur reduite.

Ces mesures deviennent le contrat d'implementation.

Une reproduction sans mesures est incomplete.

Si l'utilisateur conteste le rendu, les mesures doivent etre refaites et comparees dans MODE PIXEL_AUDIT_STRICT ou USER_RED_FLAG_REDO.

---

# 14. Decision adapter vs creer

Avant d'implementer une feature right rail, toolbar, drawer, modal ou canvas, l'agent doit choisir et justifier:

* ADAPTER_EXISTANT: une entree locale existe deja et son intention correspond vraiment a TradingView;
* CREER_SURFACE: l'entree locale actuelle est un placeholder, une autre fonctionnalite, ou une abstraction trop vague;
* ISOLER_LEGACY: une ancienne surface doit rester dans le code pour compatibilite mais ne doit plus etre montee par la route produit;
* REECRIRE: l'existant est trop divergent et les micro-patchs produiraient une dette plus dangereuse que la reecriture.

Cette decision doit etre ecrite dans le plan avant les edits.

---

# 15. Contrat generique Right Rail Panel

Pour toute nouvelle icone du rail droit TradingView, l'agent doit traiter la feature comme une surface autonome.

Checklist:

* identifier le libelle TradingView exact du tooltip;
* identifier le groupe du rail: haut, milieu, bas;
* mesurer la position relative aux icones voisines;
* verifier si le clic ouvre un panneau, un overlay, une page externe ou une feature login-locked;
* verifier si le panneau reste ouvert lors d'un changement de ticker;
* verifier si un runtime hors-panel existe;
* verifier si l'etat doit persister;
* verifier si l'etat doit etre cross-tab;
* verifier si l'ancienne surface locale fait doublon;
* verifier les dimensions du rail et du panel;
* verifier l'etat active/pressed;
* verifier fermeture/reouverture.

---

# 16. Template de section par feature

Chaque feature reproduite doit ajouter ou mettre a jour une section:

```markdown
## <Surface> <Feature Name>

Status: DISCOVERY | BUILDING | LOCAL_DONE | PRODUCTION_DONE | BLOCKED | RED_FLAG_REDO | NEEDS_PIXEL_AUDIT
Reference: <TradingView URL ou capture>
Target: http://localhost:3000/equity/technical-analysis
Mode actif: STANDARD_REPRODUCTION | PIXEL_AUDIT_STRICT | USER_RED_FLAG_REDO | DEZOOM_RESET | MICRO_DELTA_PATCH | SOURCE_OF_TRUTH_LOCK | BLOCKED_BUT_HONEST | LEAD_QA_CLOSEOUT | REGRESSION_GUARD

### Source of Truth
- Reference principale:
- Reference secondaire:
- Elements non verifies:
- Niveau de confiance:

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
- Density:
- Responsive:

### Functional Contract
- State:
- Persistence:
- Runtime:
- Data:
- Notifications/logs:
- Permissions/login:
- Error states:
- Cleanup:

### Local Gap Table
| TradingView observe | Local actuel | Ecart | Action requise | Priorite |
|---|---|---|---|---|

### Delta Audit Table
| Zone | TradingView | Localhost | Delta observe | Gravite | Correction requise |
|---|---|---|---|---|---|

### Implementation Plan
1. ...
2. ...
3. ...

### Pre-Engagement Files
| Fichier | Action | Fonctions/classes/modules prevus |
|---|---|---|

### Validation
- Static:
- Browser MCP/CDP:
- Console:
- Network:
- Screenshot/DOM:
- Regression guard:
- Completion local:
- Completion parite TradingView:
- Completion production:

### Lead QA Closeout
- Conforme:
- Different:
- P0 restants:
- P1 restants:
- Risques:
- Verdict honnete:
```

---

# 17. Right Rail Chats

Status: LOCAL_DONE

Reference: `https://www.tradingview.com/chart/omHukTbl/` + capture utilisateur Chats

Target: `http://localhost:3000/equity/technical-analysis`

## TradingView Observed

* Icon: deux bulles, tooltip exact `Chats`.
* Position: right rail, groupe haut, sous Object tree et au-dessus de Screeners.
* Closed state: bouton 44x44, fond transparent, couleur texte `rgb(15, 15, 15)`.
* Hover state: tooltip 52x24, fond `rgb(46, 46, 46)`, texte `rgb(242, 242, 242)`, radius 2px.
* Active state: `aria-pressed=true`, panneau right rail ouvert.
* Open surface: panneau right rail, largeur observee 392px sur viewport 1920px, onglets Public et Private.
* Empty/loading/error/login state: Private observe avec `You have no private messages yet`.
* Interactions: Public affiche un feed, textarea `Have something to say?`; Private affiche recherche vide et etat empty.
* Responsive behavior: non valide en mobile sur cette tranche.

## Pixel Contract

* Button: TradingView 44x44; local 44x44.
* Icon: lucide `MessagesSquare`, taille locale 20px dans bouton 44px.
* Gap: local 0.35rem entre icones, spacer avant groupe bas.
* Colors: actif local bleu `rgb(41, 98, 255)`, fond actif `rgb(28, 58, 87)`, bordure bleue.
* Typography: tabs locales 12.16px, messages compacts, line-height environ 16.4px.
* Panel dimensions: TradingView observe 392x919; local 262x779 dans la largeur actuelle du sidebar produit.
* Animation: aucune animation custom ajoutee.

## Functional Contract

* State: `chats` est une entree autonome du right rail, distincte de notes, alerts et screeners.
* Persistence: aucune persistence ajoutee.
* Runtime: aucun runtime chat en arriere-plan.
* Data: feed BRVM local non connecte, explicitement marque comme apercu non connecte.
* Notifications/logs: aucun log ou notification cree.
* Permissions/login: input et talks desactives tant que le backend chat est absent.

## Local Gap Table

| TradingView observe          | Local actuel                       | Ecart                        | Action requise                               | Priorite |
| ---------------------------- | ---------------------------------- | ---------------------------- | -------------------------------------------- | -------- |
| Icone Chats sous Object tree | `Chats BRVM` sous Object tree      | Conforme                     | Garder ordre rail                            | P0       |
| Panneau Public avec feed     | Feed BRVM local non connecte       | Donnees non temps reel       | Ajouter backend chat si requis               | P1       |
| Textarea message visible     | Textarea visible et desactivee     | Envoi absent volontaire      | Connecter une action reelle avant activation | P0       |
| Private empty state          | `You have no private messages yet` | Conforme                     | Aucun                                        | P2       |
| Panel 392px TradingView      | 262px local                        | Sidebar produit plus etroite | Decider une largeur globale right rail       | P2       |

## Implementation Plan

1. Remplacer l entree placeholder `notes` par `chats` dans le rail.
2. Creer `ChatsRailPanel` avec onglets Public/Private, feed, composer desactive, talks desactives.
3. Ajouter styles SCSS dedies et verifier TypeScript/lint/MCP.

## Validation

* Static: ESLint cible OK; `./node_modules/.bin/tsc --noEmit --pretty false` OK.
* Browser MCP/CDP: page canonique rechargee, clic utilisateur normal Watchlist -> Chats OK, onglets Public/Private OK.
* Console: 0 warning/error apres interactions.
* Network: fetch/xhr existants 200; aucun appel chat fictif.
* Completion local: 92% — surface etats principaux fonctionnels, backend chat absent par design.
* Completion parite TradingView: 82% — panel plus etroit et backend absent.
* Completion production: 78% — manque backend temps reel, auth private, persistence conversations, moderation et cross-tab.

---

# 18. Contrat initial: Right Rail Chats

Declencheur: capture ou icone TradingView avec tooltip Chats et deux bulles de discussion.

Objectif: reproduire la fonctionnalite Chats du right rail TradingView dans le TA local, sans la confondre avec Alerts.

Exploration obligatoire:

* icone inactive;
* tooltip Chats;
* etat hover;
* etat active;
* surface ouverte;
* etat login-locked ou vide;
* liste de chats si visible;
* input message si visible;
* avatars, timestamps, badges unread, actions de recherche ou filtres si visibles;
* comportement fermeture/reouverture;
* difference avec Ideas, Community, Notes ou Notifications.

Decision locale obligatoire:

* si le panel local notes est seulement une synthese d'analyse, creer une vraie surface chats;
* si notes doit etre renomme ou separe, documenter l'impact UX;
* ne pas recycler un panel Notes comme Chats sans contrat fonctionnel coherent.

Contrat local minimal pour considerer Chats termine:

* icone right rail au bon emplacement;
* tooltip et active state conformes;
* panneau Chats dedie;
* etat logged-out ou empty coherent si aucun backend chat n'existe;
* liste de conversations mockee uniquement si marquee comme etat produit non connecte;
* input desactive ou connecte a une action reelle, jamais un faux input qui promet l'envoi sans effet;
* responsive et console propres;
* validation navigateur sur `/equity/technical-analysis`.

---

# 19. Contrat audite: Right Rail Object Tree And Data Window

Declencheur: capture ou icone TradingView avec tooltip `Object tree and data window` et pictogramme de couches.

Etat de mission 2026-06-11: la fonctionnalite existe deja dans le localhost. Ne pas recreer le panel. Faire une passe de parite ciblee.

## TradingView observe

* position rail: apres Alerts et avant Chats;
* bouton rail: `data-name="object_tree"`, surface 44x44;
* panneau ouvert: zone droite externe environ 438px, contenu widget environ 392px, rail 44px;
* tabs: segmented control `Object tree` / `Data window`, wrapper environ 360x34, boutons environ 176x28;
* Object Tree toolbar:

  * `Create a group of drawings`, `data-name="group-button"`, desactive sans selection;
  * `Clone, Copy`, `data-name="copy-clone-button"`, desactive sans selection;
  * `Move to`, `data-name="move-to-button"`, desactive sans selection;
  * `Manage layout drawings`, `data-name="manage-drawings-button"`, actif;
* Object Tree body: tree compact, ligne racine instrument `BTCUSD - Bit tamp, 1D`, hauteur environ 38px, contenu minimal quand aucun dessin n est visible;
* Data Window body:

  * ligne Date;
  * groupe instrument `BTCUSD - 1D - Bit tamp`;
  * rows compactes: Open, High, Low, Close, Change, Vol, Last day change;
  * valeurs alignees a droite;
  * bouton inline `Hide data` par groupe;
  * donnees dependantes du curseur et de la bougie pointee.

## Localhost observe

* route correcte: `http://localhost:3000/equity/technical-analysis`;
* bouton rail present: `data-sidebar-entry="object-tree"`;
* panneau local ouvert: overlay dans `.gp-sidebar-main-content`, environ 270x795 a droite du chart, rail local environ 50px;
* tabs presents: `Object tree` / `Data window`, boutons environ 115x32;
* toolbar presente: group, clone, visual order, manage drawings;
* Object Tree local liste la serie principale BRVM, le volume, les indicateurs actifs, les symbols compares et les dessins;
* Data Window local se met a jour au hover ECharts via DOM anchors O(1): `dw-date`, `dw-open`, `dw-high`, `dw-low`, `dw-close`, `dw-change`, `dw-volume`;
* slots de comparaison pre-alloues: `dw-comp-row-0..4`.

## Gaps locaux constates

| Priorite | Ecart                                                                                     | Pourquoi ca compte                                                                                           |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| P0       | Geometrie: local environ 270px vs TradingView environ 392px de contenu                    | Le panel existe, mais ne peut pas etre pixel-perfect avec cette largeur et ce placement.                     |
| P0       | Data Window rows incompletes: pas de `Last day change`, pas de variation `%` sur `Change` | TradingView donne valeur absolue + pourcentage; le local ne montre que le delta absolu.                      |
| P0       | Data Window sans groupe instrument complet                                                | TradingView affiche le groupe `symbol - timeframe - venue`; local affiche seulement `OHLCV`.                 |
| P1       | Pas de bouton inline `Hide data` par groupe Data Window                                   | TradingView permet de masquer une serie directement depuis la Data Window.                                   |
| P1       | Toolbar locale active visuellement meme sans selection                                    | TradingView montre les actions impossibles en etat disabled, ce qui reduit les faux clics.                   |
| P1       | Labels toolbar differents: `Clone selected` / `Visual order` vs `Clone, Copy` / `Move to` | Les affordances ne correspondent pas exactement au contrat TradingView.                                      |
| P1       | Object Tree local enrichi BRVM mais pas strictement tree compact TradingView              | La valeur produit est meilleure, mais la copie pixel-perfect exige densite, indentation et etats similaires. |
| P2       | Menus popover TradingView non captures en contrat complet                                 | Avant patch menu, re-observer `Manage layout drawings` hors etat Screeners.                                  |
| P2       | Captures visuelles possibles mais visualisation `/tmp` sandbox bloquee                    | Garder les PNG CDP et privilegier mesures DOM si le viewer local echoue.                                     |

## Definition locale de completion

Le panel peut etre considere fonctionnellement existant. Il n est pas encore pixel-perfect TradingView.

La prochaine passe doit corriger seulement:

1. largeur/placement/densite du rail panel;
2. modele Data Window TradingView complet: date, groupe instrument, OHLC, Change avec pourcentage, Vol, Last day change;
3. bouton `Hide data` par groupe;
4. etats disabled exacts des actions toolbar;
5. labels et menus action alignes TradingView.

---

# 20. Anti-echec: erreurs deja vues

Ces erreurs sont interdites:

* partir de `/old` au lieu de `/equity/technical-analysis`;
* coder une icone right rail sans hover, tooltip et panel observes;
* creer un modal quand TradingView utilise un rail;
* garder deux runtimes actifs sans decision de legacy;
* valider uniquement par TypeScript;
* confondre une indisponibilite backend optionnelle avec un bug panel;
* annoncer fini sans jauge locale, jauge parite TradingView et jauge production;
* utiliser un prompt ponctuel comme source de verite au lieu de ce workflow;
* inventer les parties bloquees par login;
* installer un framework navigateur externe pour contourner MCP sans preuve d'indisponibilite;
* ignorer un RED FLAG utilisateur;
* se defendre quand l'utilisateur voit une divergence;
* patcher sans table de deltas.

---

# 21. Anti-echec drawing tools

Appris de la session AVP 2026-06-16.

Ces erreurs sont interdites pour toute reproduction d'outil de dessin:

* implementer un drawing tool sans avoir place le drawing sur TradingView d'abord;
* copier-coller le dernier fichier renderer comme base pour le nouveau;
* chaque outil a son propre fichier, cree depuis zero;
* inserer le nouveau type d'outil au milieu de l'ordre alphabetique ou logique existant;
* toujours ajouter a la fin des listes, registres et switch cases;
* copier-coller le nombre de points du dernier outil sans verifier;
* oublier l'icone SVG dans le registre d'icones;
* valider le rendu canvas sur le mauvais canvas;
* tester le drawing canvas `z-index 50`, classe `gp-drawing-canvas`, pas le cursor canvas `z-index 80`, classe `gp-cursor-canvas`;
* diagnostiquer un renderer comme non appele sans verifier tous les canvases du DOM;
* utiliser `ctx.clearRect` dans un renderer drawing;
* hardcoder des couleurs sans les mesurer depuis TradingView via CDP canvas sampling pixel-par-pixel;
* hardcoder une largeur d'histogramme sans la mesurer depuis TradingView.

---

# 22. Anti-echec measure tools

Appris de la session MEASURERS 2026-06-17.

Ces erreurs sont interdites pour toute reproduction d'outil Mesureurs:

* `price_range`;
* `date_range`;
* `date_price_range`.

Interdictions:

* implementer un outil Mesureurs sans avoir place le tool sur TradingView d'abord;
* ajouter des decorations sans validation utilisateur prealable;
* implementer d'abord le rendu minimal: fill + lignes de mesure + fleches + texte;
* utiliser `ctx.fillRect` avec `h.logicalHeight` ou `h.logicalWidth` pour le remplissage;
* oublier une des deux lignes de mesure sur `date_price_range`;
* orienter la fleche toujours vers la droite/bas;
* la fleche pointe vers le second clic, quelle que soit sa direction;
* utiliser `strokeRect` pour le contour;
* implementer la fleche comme un triangle avec `ctx.fill` sans verifier que `ctx.strokeStyle` est une couleur;
* hardcoder la taille de la fleche sans ajustabilite.

---

# 23. Prompt minimal pour agent externe

Quand un autre agent doit prendre une feature TradingView, lui donner seulement:

```text
Applique strictement .agent/workflow/tradingview-reproduction.md.

Feature TradingView: <nom ou icone>.
Reference: <URL ou capture>.
Target local: http://localhost:3000/equity/technical-analysis.

Mission:
1. Choisis le mode actif.
2. Phase A reconnaissance.
3. Contrat observe.
4. Table de parite.
5. Plan avec pre-engagement fichiers.
6. Phase B reproduction locale pixel-perfect.
7. Validation navigateur.
8. Lead QA Closeout.

Ne code pas avant d'avoir produit le contrat observe, la table de parite, les mesures pixel-perfect et le plan.
Si l'utilisateur signale une divergence, active USER_RED_FLAG_REDO sans te defendre.
```

Ce prompt minimal suffit parce que le contrat complet est dans ce fichier.

---

# 24. Declencheurs

Utiliser ce workflow avant toute reproduction TradingView qui touche:

* right rail;
* watchlist;
* alerts;
* object tree;
* data window;
* toolbar;
* drawing tools;
* measure tools;
* cursor modes;
* chart rendering;
* ECharts;
* zoom;
* wheel;
* overlays;
* markers;
* indicators;
* templates;
* strategy panels;
* replay;
* publication;
* saved analysis;
* persistence client;
* notifications;
* logs;
* runtime monitors.

---

# 25. Gate 0 — Memoire et carte

Avant de coder:

1. Lire `graphify-out/GRAPH_REPORT.md` si present.
2. Lancer une requete Graphify ciblee:

```bash
graphify query "TradingView <feature> reproduction localhost blast radius" --budget 1000
```

3. Interroger le SCRIBE:

```bash
.agent/workflow/scribe/scribe-rag query "TradingView <feature> errors workflow scars vaccins" --limit 12
```

4. Lister les SCAR/VAC/PAT/GHOST applicables dans le plan.
5. Si la feature touche le navigateur, lire:

```text
.agent/workflow/mcp/chrome-devtools.md
```

Abort si cette phase ne produit pas un scope clair et des cicatrices applicables.

Si Graphify ou SCRIBE sont indisponibles:

* documenter le blocage;
* ne pas inventer leur contenu;
* continuer uniquement si le scope reste clair par les fichiers observables.

---

# 26. Gate 1 — Stalk TradingView avant implementation

Avant de reproduire une feature inspiree TradingView:

1. Ouvrir la reference TradingView dans Chrome DevTools MCP.
2. Interagir comme un utilisateur:

   * ouvrir;
   * cliquer;
   * fermer;
   * changer d'onglet;
   * saisir si applicable;
   * verifier les etats vides;
   * verifier les erreurs;
   * verifier les etats login/locked si visibles.
3. Capturer le contrat visible:

   * emplacement exact;
   * type de surface: right rail, modal, toolbar, popover, canvas overlay;
   * etats attendus: idle, draft, saved, triggered, error, empty;
   * interactions clavier/souris;
   * persistance attendue;
   * messages et affordances essentiels.
4. Ecrire le contrat avant le code dans la note de travail ou le plan.

Regle issue de `SCAR-TA-RIGHT-RAIL-TRADINGVIEW-STALK-FIRST-001`:
ne jamais coder une icone du rail droit sans avoir observe sa surface cible.

---

# 27. Gate 2 — Scope produit et anti-legacy

Chaque tranche doit declarer:

* target local canonique: toujours `/equity/technical-analysis`;
* fichiers cibles;
* fichiers legacy a neutraliser ou a isoler;
* surface UI finale attendue;
* etat Redux/context/IndexedDB touche;
* risques backend visibles;
* tests et smoke MCP requis.

Pour les features right rail:

* la surface finale est le rail droit;
* pas de modal overlay legacy;
* pas de double systeme actif sans decision explicite;
* si un ancien modal reste dans le code, il ne doit plus etre monte par la route produit canonique.

---

# 28. Gate 3 — Regles d'implementation

## Persistence

* TA/TBI persiste en IndexedDB.
* Ne pas utiliser `localStorage` pour les etats trading, drafts, logs, preferences ou alertes.
* Justification: `VAC-TA-TBI-NO-LOCALSTORAGE-001`.

## ECharts et canvas

* Ne jamais muter une instance ECharts disposee.
* Enregistrer les modules requis avant usage.
* Serialiser les mutations sensibles dans une queue ou un effet controle.
* Un wheel zoom financier ne doit pas lancer plusieurs pipelines concurrents.
* Justifications:

  * `VAC-ECHARTS-MUTATION-QUEUE-001`;
  * `VAC-ECHARTS-SMOOTH-WHEEL-ZOOM-001`;
  * `SCAR-ECHARTS-DISPOSED-DRAWING-LOOP-001`.

## Data

* Les bougies de production viennent des donnees BRVM verifiees.
* Pas de fake candles dans le chemin produit canonique.
* Les fallbacks doivent etre visibles, explicites, et non confondus avec des donnees reelles.

## UI

* Pas d'animation parasite de scroll.
* Pas de modal scroll regressif.
* Pas de surface flottante si TradingView utilise un rail ou une toolbar.
* Justification: `VAC-MODAL-SCROLL-001`.

## Performance

* Eviter les re-renders massifs.
* Memoiser uniquement quand utile.
* Ne pas introduire de polling inutile.
* Debounce/throttle les interactions lourdes.
* Nettoyer timers, observers et listeners.
* Mesurer avant d'optimiser, mais ne pas livrer de boucle evidemment couteuse.

## Accessibilite

* Les boutons interactifs ont un label accessible.
* Les etats active/pressed sont exposes quand pertinent.
* Les tooltips ne remplacent pas les labels.
* Le clavier ne doit pas etre casse si la surface est navigable.

---

# 29. Gate 4 — Contrat specifique Alert Panel

Le panel Alert est complet seulement si ces points sont vrais sur `/equity/technical-analysis`:

* le bouton toolbar ou rail ouvre `Alertes BRVM` dans le right rail;
* `document.querySelectorAll('[role="dialog"]').length === 0`;
* aucun `.alerts-modal` legacy n'est monte;
* creation, activation, desactivation et suppression fonctionnent;
* le draft est coherent avec le ticker courant;
* les alertes multi-ticker ne dependent pas seulement du snapshot Redux courant;
* IndexedDB contient alerts, drafts, logs et preferences;
* le journal affiche les triggers utiles;
* le calendrier BRVM gere weekdays, heures UTC et jours feries connus;
* le runtime nettoie ses timers/listeners;
* la console navigateur reste sans warning/error lie a Alert.

Memoire liee:

* `SCAR-TA-ALERTS-MULTITICKER-REDUX-SNAPSHOT-GAP-001`;
* `SCAR-TA-ALERTS-MULTITICKER-STALE-CONTEXT-PRIORITY-001`;
* `GHOST-TA-ALERTS-IDB-PERSISTENCE-20260610`.

---

# 30. Gate 5 — Smoke navigateur MCP obligatoire

Pour toute feature TradingView, valider avec Chrome DevTools MCP:

1. `list_pages`;
2. `select_page` ou `new_page` vers `http://localhost:3000/equity/technical-analysis`;
3. `navigate_page` reload si necessaire;
4. `take_snapshot`;
5. interactions reelles:

   * `click`;
   * `fill`;
   * `press_key`;
   * `hover`;
   * `evaluate_script`;
6. assertions DOM observables;
7. `list_console_messages` pour errors/warnings;
8. `list_network_requests` pour fetch/xhr;
9. screenshot ou sonde DOM/canvas quand la feature est visuelle.

Interdit par defaut:

* ajouter Playwright, Cypress, Puppeteer ou Selenium pour ce smoke;
* valider uniquement par TypeScript;
* valider sur `/old` au lieu du target local canonique.

Si MCP est indisponible:

* utiliser fallback CDP si disponible;
* documenter pourquoi MCP est indisponible;
* rester en BLOCKED_BUT_HONEST si aucune verification navigateur n'est possible.

---

# 31. Gate 6 — Completion meter

Avant de dire "fait", donner trois jauges:

1. Completion locale fonctionnelle:

   * ce qui marche vraiment sur localhost.

2. Completion parite TradingView:

   * ce qui ressemble et se comporte vraiment comme TradingView.

3. Completion production reelle:

   * ce qui tiendra en conditions produit.

Si production < local, lister les raisons concretes:

* backend;
* donnees;
* edge cases;
* cross-tab;
* persistence;
* tests;
* accessibilite;
* performance;
* logs;
* auth;
* moderation;
* monitoring.

Si parite TradingView < local, lister les differences visibles restantes.

Interdit:

* annoncer 100% parite TradingView si une difference visuelle connue existe;
* confondre "fonctionnel localement" avec "pixel-perfect";
* confondre "mock coherent" avec "production".

---

# 32. Gate 7 — Closeout SCRIBE

En fin de tranche:

1. Ecrire uniquement le pourquoi dans le SCRIBE.
2. Ajouter une SCAR si une erreur a coute plus de deux tentatives.
3. Ajouter un VAC si une recidive doit etre empechee.
4. Ajouter un PAT si une methode devient reproductible.
5. Ajouter un GHOST si une decision d'architecture doit survivre aux sessions.
6. Ne pas ecrire dans le SCRIBE les faits structurels que Graphify sait deja.

Si USER_RED_FLAG_REDO a ete active:

* ajouter une SCAR si l'agent avait annonce fini alors que le rendu etait faux;
* ajouter un VAC anti-auto-validation si la cause est reproductible;
* ajouter un PAT si la correction delta devient une methode.

---

# 33. Gate 8 — Reproduction drawing tools

Ce gate s'applique a chaque reproduction d'outil de dessin:

* profil de volume;
* forecast;
* channel;
* fib;
* mesureurs;
* formes;
* tout outil canvas TradingView.

Il est non-negociable.

## 8.1 Manipuler TradingView avant toute ligne de code

Ouvrir la reference TradingView dans Chrome DevTools MCP et:

1. Trouver l'outil dans la toolbar laterale gauche.
2. Cliquer sur le dropdown/split-button pour voir l'icone exacte.
3. Selectionner l'outil, observer le curseur.
4. Placer le drawing sur le chart TradingView:

   * compter le nombre de clics exact;
   * observer si la souris glisse ou clique simplement;
   * observer les handles;
   * observer selection, drag, resize si applicable.
5. Observer le rendu final:

   * position;
   * largeur;
   * couleurs;
   * texte;
   * lignes;
   * fill;
   * poignées.
6. Mesurer les couleurs pixel-par-pixel via CDP canvas sampling:

```javascript
const ctx = canvas.getContext('2d');
const p = ctx.getImageData(x, y, 1, 1).data;
// r, g, b, a
```

7. Documenter les resultats.

Interdit:
coder avant cette etape.

L'outil doit avoir ete place sur TradingView par l'agent lui-meme, sauf blocage documente.

## 8.2 Creer un fichier renderer independant

Ne jamais copier-coller le fichier du dernier renderer.

Creer un nouveau fichier depuis zero avec:

* son propre type unique dans `drawingToolTypes.ts`;
* sa propre interface de props si differente;
* sa propre fonction `hitTest`;
* sa propre fonction de rendu exportee nommee `render<NomOutil>`.

Regle:
chaque outil = 1 fichier = 1 responsabilite.

Si le nouvel outil ressemble a un existant:

* extraire les parties communes dans un utilitaire partage;
* ne jamais copier le fichier entier.

## 8.3 Ajouter le type d'outil a la fin des listes

Quand l'agent ajoute un nouveau type d'outil, respecter l'ordre existant:

* Dans `drawingToolTypes.ts`, liste `AllToolType`: ajouter le nouveau type a la fin de la section appropriee.
* Dans `ForecastingStrategy.ts`, le `switch/case`: ajouter le nouveau `case` apres le dernier existant dans le meme groupe.
* Dans `drawingToolFilters.ts`: ajouter le nouvel outil a la fin du tableau retourne par la fonction de filtre appropriee.
* Dans `drawingDefaults.ts`: ajouter les props par defaut a la fin de la section correspondante.

Ne jamais inserer au milieu de l'ordre alphabetique si l'ordre existant est un ordre d'ajout chronologique.

## 8.4 Enregistrer l'icone SVG avant toute validation

Avant de tester le rendu:

1. Dans `drawingToolIconRegistry.ts`, la fonction `getDrawingToolIcon()` a un `switch` par type d'outil. Ajouter le nouveau type a la fin de ce switch.
2. Le SVG doit etre un element JSX valide, pas un path seul.
3. Si le SVG ne peut pas etre extrait de TradingView, creer une icone simplifiee qui ressemble a la fonction.
4. Verifier que l'icone s'affiche dans le dropdown apres rebuild.

## 8.5 Valider le rendu sur le bon canvas

Le systeme de rendu a deux canvases overlay:

| Canvas    | Classe                               | z-index | Pointeur | Role                                  |
| --------- | ------------------------------------ | ------- | -------- | ------------------------------------- |
| 1 cursor  | `gp-cursor-canvas`                   | 80      | none     | Effets curseur, crosshair, particules |
| 2 drawing | `gp-cursor-canvas gp-drawing-canvas` | 50      | auto     | Rendu des drawings                    |

Le DrawingRenderer ecrit sur Canvas 2.

Quand l'agent valide le rendu:

```javascript
// BON: verifier Canvas 2
const drawingCanvas = Array.from(document.querySelectorAll('canvas'))
  .find(c => c.className.includes('gp-drawing-canvas'));
const ctx = drawingCanvas.getContext('2d');
const pixels = ctx.getImageData(x, y, 1, 1).data;

// MAUVAIS: Canvas 1 est le cursor canvas
const cursorCanvas = document.querySelector('.gp-cursor-canvas');
```

Ne jamais declarer "le renderer n'est pas appele" sans:

1. verifier les pixels sur Canvas 2;
2. faire un screenshot complet avant/apres;
3. ajouter un `console.log` temporaire dans la fonction de rendu pour confirmer l'appel;
4. retirer le `console.log` apres diagnostic.

## 8.6 Verifier l'ordre d'activation dans le dropdown

Quand le nouveau drawing tool apparait dans le dropdown:

1. Le nombre d'outils doit correspondre exactement a TradingView.
2. L'ordre dans le dropdown local doit correspondre a TradingView.
3. Aucun outil ne doit apparaitre dans la mauvaise categorie.
4. Les `counts` dans `DrawingToolCounts` doivent etre mis a jour.

## 8.7 Validation canvas finale

Apres implementation:

1. Placer le drawing sur le chart local.
2. Attendre 2 secondes si rendu asynchrone possible.
3. Verifier les pixels sur Canvas 2:

   * pixels non-transparents dans la zone attendue;
   * couleurs correspondant aux mesures TradingView, tolerance ±10 par canal a cause du blending background.
4. Verifier screenshot avant/apres.
5. Verifier que le drawing est selectionnable.
6. Verifier qu'il est deplacable si TradingView le permet.
7. Verifier console: 0 erreur.
8. Supprimer tous les `console.log` de debug.
9. Nettoyer les packages npm temporaires installes pour les tests CDP.

---

# 34. Definition of Done

Une reproduction TradingView est livrable seulement si:

* le mode actif a ete declare;
* Phase A a produit le contrat TradingView observe avant le code;
* la section feature correspondante est ajoutee ou mise a jour dans ce workflow;
* la table de parite TradingView/local est presente;
* les mesures pixel-perfect minimales sont presentes;
* la decision ADAPTER_EXISTANT, CREER_SURFACE, ISOLER_LEGACY ou REECRIRE est justifiee;
* le target local canonique a ete teste;
* Graphify et SCRIBE ont ete consultes ou leur blocage documente;
* les cicatrices applicables ont ete respectees;
* le legacy actif est neutralise ou explicitement isole;
* TypeScript/lint/tests cibles passent ou les echecs sont expliques;
* Chrome DevTools MCP ou fallback CDP documente prouve l'etat reel du navigateur;
* console et reseau sont expliques;
* les jauges locale, parite TradingView et production sont annoncees sans maquillage;
* si l'utilisateur a active RED FLAG, la divergence signalee est traitee explicitement;
* LEAD_QA_CLOSEOUT est produit avant d'annoncer "fait".

---

# 35. Commandes utiles

## Alert rail

```bash
npm run test:alerts-rail
npx eslint components/technical-analysis/components/sidebar/panels/AlertsRailPanel.tsx
./node_modules/.bin/tsc --noEmit --pretty false
```

## Memoire

```bash
graphify query "TradingView alert panel right rail blast radius" --budget 1000
.agent/workflow/scribe/scribe-rag query "TradingView alert panel scars vaccins" --limit 12
```

## Browser

```text
MCP Chrome DevTools:
list_pages
-> select_page/new_page
-> navigate_page
-> take_snapshot
-> click/fill/press_key/evaluate_script
-> list_console_messages
-> list_network_requests
-> screenshot/DOM assertion
```

## RED FLAG prompt

```text
MODE RED FLAG TradingView.
Ta reproduction localhost ne correspond pas a la reference.
Ne te justifie pas.
Reprends la source de verite, compare TradingView vs localhost, produis la table des deltas, dezoome si necessaire, puis corrige uniquement les divergences observees.
Applique .agent/workflow/tradingview-reproduction.md.
```

---

# 36. Drawing Tool Anchored Volume Profile

Status: LOCAL_DONE

Reference: `https://www.tradingview.com/chart/omHukTbl/` + capture utilisateur Anchored volume profile icon

Target: `http://localhost:3000/equity/technical-analysis`

## TradingView Observed

* Icon: profil de volume horizontal avec ancre, pictogramme histogramme.
* Tooltip: `Anchored volume profile`.
* Position: toolbar gauche, VerticalDrawingToolbar, categorie Forecasting.
* Closed state: bouton dans le split button Forecasting.
* Hover state: tooltip + highlight.
* Active state: outil selectionne, curseur crosshair, 1 clic sur le chart.
* Open surface: canvas overlay — le profil se dessine directement sur le chart.
* Empty/loading/error/login state: pas d'etat vide — drawing tool.
* Interactions: 1 seul clic pour placer l'ancre, handle deplacable, profil dynamique.
* Responsive behavior: toolbar fixe.

## Pixel Contract

* Button: meme size que les autres outils Forecasting.
* Icon: pictogramme histogramme avec ancre.
* Gap: meme spacing que les autres outils de la categorie.
* Colors: rose/magenta = up volume, cyan = down volume, noir = ligne ancre.
* Typography: labels VAH/VAL/POC en 9px Inter.
* Panel dimensions: N/A, canvas overlay.
* Animation: aucune animation custom.

## Functional Contract

* State: `anchored_volume_profile` est un outil de dessin autonome.
* Persistence: les drawings persistent en IndexedDB.
* Runtime: aucun runtime en arriere-plan.
* Data: utilise les donnees chartData du store Redux.
* Notifications/logs: aucun log cree.
* Permissions/login: accessible sans login.

## Local Gap Table

| TradingView observe                                     | Local actuel   | Ecart    | Action requise               | Priorite |
| ------------------------------------------------------- | -------------- | -------- | ---------------------------- | -------- |
| Outil Anchored Volume Profile dans Forecasting dropdown | Non implemente | CRITIQUE | Creer renderer + integrer    | P0       |
| 1 seul clic pour placer l'ancre                         | N/A            | CRITIQUE | Logique differente de FRVP   | P0       |
| Profil au bord droit du chart                           | N/A            | CRITIQUE | Layout different de FRVP     | P0       |
| Profil dynamique                                        | N/A            | CRITIQUE | Mise a jour continue         | P0       |
| Handle deplacable                                       | N/A            | MOYEN    | Interaction similaire a FRVP | P1       |

## Implementation Plan

1. Creer `AnchoredVolumeProfileRenderer.ts` comme fichier independant, pas copie de FRVP.
2. Ajouter `anchored_volume_profile` a la fin de `AllToolType` dans `drawingToolTypes.ts`.
3. Ajouter le SVG icon a la fin du switch dans `drawingToolIconRegistry.ts`.
4. Ajouter le `case` a la fin du switch dans `ForecastingStrategy.ts`.
5. Ajouter l'outil a la fin du tableau dans `filterForecastingTools('volume', ...)`.
6. Ajouter les props par defaut a la fin de `drawingDefaults.ts`.
7. Tester via navigateur local.

## Validation

* Static: ESLint OK; TypeScript OK, 0 nouvelle erreur.
* Browser MCP/CDP: page canonique rechargee, outil cliquable, profil affiche.
* Validation canvas: verifier le drawing canvas, Canvas 2, classe `gp-drawing-canvas`, pas le cursor canvas.
* Console: 0 warning/error apres interactions.
* Network: aucune requete supplementaire.
* Completion local: 85% — outil fonctionnel, handle et settings restent.
* Completion parite TradingView: 78% — settings panel et details fins restent.
* Completion production: 70% — manque settings panel, persistence dessins.

## Lecons apprises — session 2026-06-16

* BUG #1: `pts.length < 2` tuait le rendu AVP. AVP = 1 clic, condition attendait 2 points. Fix: condition changee en `pts.length < 1`.
* BUG #2: diagnostic errone "renderer non appele" car les pixels etaient verifies sur Canvas 1 au lieu de Canvas 2. Le renderer etait appele et dessinait sur le bon canvas.
* MESURE COULEURS: couleurs mesurees via CDP canvas sampling depuis TradingView:

  * up volume `rgba(146,226,236,0.5)`;
  * down volume `rgba(245,159,188,0.5)`.
* MESURE LARGEUR: largeur d'histogramme mesuree a environ 15% de la largeur de la grille via CDP. La valeur initiale de 40% etait fausse.
* FICHIER INDEPENDANT: le renderer AVP a ete cree comme fichier independant, mais l'ajout aux registres a parfois ete fait dans le mauvais ordre. Gate 8.3 resout ce probleme pour les prochains outils.

---

# 37. Drawing Tools Measureurs

Status: LOCAL_DONE

Reference: `https://www.tradingview.com/chart/omHukTbl/`

Target: `http://localhost:3000/equity/technical-analysis`

## TradingView Observed

* Category: Mesureurs dans le dropdown `Lignes et mesures`.
* Position: lignes et mesures, 17 -> 14 outils apres extraction, nouvelle categorie dediee `Mesureurs` avec count=3.
* Tools:

  * Plage de dates: `date_range`;
  * Plage de prix: `price_range`;
  * Plage de dates et prix: `date_price_range`.
* Closed state: categorie invisible dans la toolbar, dans le dropdown.
* Hover state: tooltip survol des icones.
* Active state: outil selectionne dans le sous-menu, curseur crosshair, 2 clics sur le chart.
* Open surface: canvas overlay — le rendu apparait directement sur le chart.
* Interactions: 2 clics = p1 puis p2, handles deplacables.

## Pixel Contract

* Icons: 3 SVGs distincts, `viewBox="0 0 28 28"`, remplissage `currentColor`.
* Price range: icone fleche verticale avec deux traits horizontaux.
* Date range: icone fleche horizontale avec deux traits verticaux.
* Date & price range: icone carre avec coin coupe, croix directionnelle.
* Colors: couleur du stroke de l'outil, `currentColor` herite.
* Fill opacity: environ 0.15.
* Arrow size: 8px.
* Font: Inter, taille environ 13px pour le texte centre.

## Functional Contract

* `date_range`: 2 lignes verticales, bord gauche + droit, 1 ligne de mesure horizontale a mi-hauteur avec fleche directionnelle pointant vers p2, remplissage du rectangle borne.
* `price_range`: 2 lignes horizontales, bord haut + bas, 1 ligne de mesure verticale a mi-largeur avec fleche directionnelle pointant vers p2, remplissage du rectangle borne.
* `date_price_range`: remplissage du rectangle + ligne de mesure horizontale a mi-hauteur avec fleche + ligne de mesure verticale a mi-largeur avec fleche + texte centre.
* Pas de corner marks.
* Pas de strokeRect.
* Arrow direction: la fleche pointe toujours vers p2, second clic, quelle que soit la direction.
* Text: centre dans le rectangle pour `date_price_range`, sur la ligne de mesure pour les autres.
* Bounded fill: le remplissage ne couvre que le rectangle defini par `(xMin,yMin)-(xMax,yMax)`, jamais toute la hauteur/largeur du graphique.

## Local Gap Table

| TradingView observe                                                   | Local actuel                                    | Ecart    | Action requise | Priorite |
| --------------------------------------------------------------------- | ----------------------------------------------- | -------- | -------------- | -------- |
| Categorie Mesureurs dediee avec count 3                               | Categorie creee, count=3                        | Conforme | Aucun          | P0       |
| Plage de dates: fill + bordures verticales + ligne mesure horizontale | Implemente                                      | Conforme | Aucun          | P0       |
| Plage de prix: fill + bordures horizontales + ligne mesure verticale  | Implemente                                      | Conforme | Aucun          | P0       |
| Plage de dates et prix: fill + 2 lignes mesure + texte centre         | Implemente sans corner marks                    | Conforme | Aucun          | P0       |
| Fleches directionnelles pointant vers p2                              | Implemente                                      | Conforme | Aucun          | P0       |
| SVGs extraits du DOM TradingView                                      | 3 SVGs dans `trend.tsx` + `toolIconCatalog.tsx` | Conforme | Aucun          | P0       |
| Remplissage borne au rectangle des points                             | Implemente                                      | Conforme | Aucun          | P0       |

## Implementation Plan

1. Ajouter constante `MEASURERS` + `MEASURERS_TOOLS` dans `drawingConstants.ts`.
2. Categoriser les outils dans `drawingToolSpecs.ts` — extraire de `LINE_AND_MEASURE` vers `MEASURERS`.
3. Creer `measurers` view type dans `drawingToolFilters.ts`.
4. Ajouter count `measurers` dans `drawingToolCounts.ts`.
5. Ajouter ligne `Mesureurs` + sous-menu dans `DrawingToolDropdown.tsx`.
6. Ajouter `getToolMemoryBucket` + `isForecastingToolActiveForTool` dans `drawingToolMemory.ts`.
7. Extraire SVGs depuis TradingView DOM, les ajouter dans `trend.tsx` + `toolIconCatalog.tsx`.
8. Implementer le rendu 3 outils dans `_renderMeasureBox()` de `LineMeasureStrategy.ts`.
9. Valider sur `/equity/technical-analysis`.

## Validation

* Static: ESLint OK; TypeScript OK, 0 nouvelle erreur.
* Browser MCP/CDP: page canonique rechargee, `Mesureurs` visible count=3, sous-menu 3 outils, clic select correct.
* Validation canvas: fleches directionnelles correctes, fill borne, corner marks absents.
* Console: 0 warning/error.
* Network: aucune requete supplementaire.
* Completion local: 100% — les 3 outils fonctionnent et rendent correctement.
* Completion parite TradingView: 95% — rendu principal conforme, details de labels automatiques a surveiller.
* Completion production: 95% — manque backend donnees pour les labels automatiques.

## Lecons apprises — session 2026-06-17

* BUG #1: le remplissage etait etendu a toute la hauteur/largeur du graphique a cause de `h.logicalHeight` / `h.logicalWidth` dans `ctx.fillRect`. Fix: utiliser `yMax - yMin` / `xMax - xMin`.
* CORNER MARKS: des equerres avaient ete ajoutees aux 4 coins de `date_price_range`. L'utilisateur les a immediatement rejetees. Lecon: implementer d'abord le rendu minimal, valider avec l'utilisateur, puis ajouter des decorations uniquement sur demande explicite.
* ARROW DIRECTION: la fleche doit toujours pointer vers p2, pas systematiquement vers la droite ou le bas.
* DUAL MEASUREMENT LINES: `date_price_range` necessite les deux lignes de mesure, horizontale et verticale, simultanement.
* GHOST cree: `GHOST-MEASURERS-NO-CORNER-MARKS-20260617` — ne_pas_reproposer les equerres sur `date_price_range`.

---

# 38. Annexe — Checklist RED FLAG rapide

Quand l'utilisateur dit que ce n'est pas identique:

```text
[ ] J'ai invalide ma derniere completion.
[ ] Je n'ai pas defendu mon implementation.
[ ] J'ai verrouille la source de verite.
[ ] J'ai compare TradingView/capture vs localhost.
[ ] J'ai produit une table de deltas.
[ ] J'ai classe P0/P1/P2/P3.
[ ] J'ai decide MICRO_DELTA_PATCH ou DEZOOM_RESET.
[ ] J'ai corrige uniquement les deltas observes.
[ ] J'ai revalide dans le navigateur.
[ ] J'ai donne une jauge honnete.
[ ] J'ai ajoute SCAR/VAC/PAT/GHOST si necessaire.
```

---

# 39. Annexe — Message systeme court a donner a un LLM hote

```text
Tu es un agent senior lead front-end charge de reproduire TradingView dans localhost.

Applique strictement .agent/workflow/tradingview-reproduction.md.

Tu n'as pas le droit de coder avant:
- Phase A observation TradingView;
- contrat visuel/fonctionnel;
- mesures pixel-perfect;
- table de parite;
- pre-engagement fichiers.

Tu n'as pas le droit d'annoncer fini sans:
- validation navigateur reelle;
- console/network;
- completion locale;
- completion parite TradingView;
- completion production;
- Lead QA Closeout.

Si je dis que le rendu localhost ne correspond pas a TradingView:
- active USER_RED_FLAG_REDO;
- invalide ta derniere completion;
- ne te justifie pas;
- reobserve;
- produis une table de deltas;
- dezoome si necessaire;
- corrige uniquement les divergences observees.
```

---

# 40. Principe final

Ce workflow existe parce qu'une reproduction TradingView ratee mais "fonctionnelle" fait perdre plus de temps qu'une reproduction non commencee.

Un agent senior ne gagne pas parce qu'il code vite.

Il gagne parce qu'il:

* observe avant de coder;
* mesure avant de juger;
* doute avant d'annoncer fini;
* accepte le RED FLAG utilisateur;
* corrige la cause, pas le symptome;
* livre une parite visuelle et fonctionnelle prouvee.

La seule completion acceptable est une completion observable.
]




= = = = = = =




[ VAS D'ABORD LIRE EN ENTIER PUIS: Applique strictement `tradingview-reproduction.md`.

Feature TradingView: <[  ]>.

Reference: <capture image fournie >.

Target local: `http://localhost:3000/equity/technical-analysis`.


Mission:

1. Choisis le mode actif.

2. Fais Phase A reconnaissance TradingView.

3. Produis le contrat visuel/fonctionnel observe.

4. Produis les mesures pixel-perfect.

5. Produis la table de parite TradingView/local.

6. Declare le pre-engagement fichiers avant tout code.

7. Puis seulement apres, implemente.

8. Valide dans le navigateur reel.

9. Termine par Lead QA Closeout avec completion locale, parite TradingView et production.

Interdiction: ne code pas avant d'avoir observe TradingView et produit le contrat observe.
]








[
MODE RED FLAG TradingView.

Ta reproduction localhost ne correspond pas a la reference.
Ne te justifie pas.

Reprends la source de verite, compare TradingView vs localhost, produis la table des deltas, dezoome si necessaire, puis corrige uniquement les divergences observees.

Applique `tradingview-reproduction.md`.
]