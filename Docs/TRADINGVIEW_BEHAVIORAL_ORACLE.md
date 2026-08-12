# TradingView Behavioral Oracle

Statut: regle canonique d'observation et de reproduction des interactions chart.
Reference: https://www.tradingview.com/chart/omHukTbl/

## Regle absolue

TradingView est l'oracle comportemental de la page technical-analysis. Toute interaction graphique visible doit etre observee sur TradingView via Chrome DevTools Protocol (CDP) avant son implementation locale.

La presence d'un mecanisme dans le code local ne prouve jamais son equivalence. Seul le comportement observable apres une interaction reelle fait foi.

## Surface a observer

- pan horizontal et marge future a droite;
- pan vertical et deplacement de l'echelle de prix;
- zoom centre sur le curseur;
- pagination historique et injection de nouvelles bougies;
- selection, curseur, crosshair et axes;
- transitions, inertie, fluidite et etat de relachement;
- dimensions, couleurs, fonds, espaces et overlays;
- requetes reseau, cache, prechargement et conservation du viewport;
- chargement, erreurs et degradation partielle.

## Protocole obligatoire

1. Observer l'etat initial sur TradingView via CDP.
2. Rejouer l'interaction humaine exacte.
3. Mesurer l'etat avant/apres: pixels, viewport, axes, canvas, donnees et reseau.
4. Identifier les invariants et changements autorises.
5. Implementer le comportement local.
6. Rejouer la meme interaction sur localhost.
7. Comparer TradingView et localhost.
8. Corriger jusqu'a equivalence observable.

## Invariants

- Une interaction verticale conserve l'axe temporel et modifie uniquement la plage de prix.
- Une interaction horizontale conserve l'ancrage de la bougie/date ciblee.
- Une pagination historique ajoute les donnees sans recentrer ni provoquer de saut visuel.
- Une marge future ne cree aucune fausse bougie.
- Un mecanisme declare implemente n'est accepte qu'apres validation visuelle reelle.

## Interdictions

- Ne pas deduire le comportement du seul code local.
- Ne pas remplacer une observation CDP par une intuition.
- Ne pas declarer une parite TradingView sans preuve avant/apres.
- Ne pas ajouter une dependance navigateur externe pour contourner CDP.



## Reflexe TENOR obligatoire avant modification

Avant toute modification d interaction, le premier reflexe est de lire et verifier TradingView via CDP. La formule verification CDP effectuee n est recevable que si une preuve runtime existe : page cible, element cible, listeners, sequence d evenements et logique observable.

Le protocole est strict :

1. Inspecter la cible TradingView avec DOM et DOMDebugger.
2. Lire le handler ou le bundle charge via Debugger lorsque la logique n est pas determinable par le DOM seul.
3. Rejouer le geste sur TradingView et localhost dans les memes conditions.
4. Ne modifier le code local qu apres identification d un invariant comportemental concret.
5. Conserver la preuve de la divergence et verifier la non-regression apres le changement.

Exemple grave le 2026-08-11 : TradingView attache wheel en non-passif et les handlers mousedown, mouseup, touchstart, touchmove et mousemove sur la cellule chart. Son zoom de l axe des prix utilise la position clientY, preventDefault, puis un deplacement de scalePriceTo de 15 fois le delta normalise. Cette observation a servi de reference pour le viewport local.

Regle de sortie : si le CDP ne prouve pas le comportement, aucune implementation locale ne doit etre presentee comme equivalente.
