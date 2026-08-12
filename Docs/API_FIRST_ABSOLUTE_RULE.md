# API-First Absolute Rule

Statut: regle absolue d'architecture pour les donnees de l'application.

## Regle fondamentale

Toute donnee metier affichee par l'interface doit provenir en priorite de l'API officielle du domaine. L'interface ne doit jamais utiliser mock, faker, fixture, catalogue local ou valeur fabriquee lorsqu'une donnee API correspondante existe.

## Contrat de priorite

API officielle
  -> repository/domain adapter
  -> hook de donnees
  -> modele de presentation
  -> interface

Les composants consomment les entites et contrats du domaine. Ils ne contournent pas les repositories et ne reintroduisent pas une source locale concurrente.

## Donnees concernees

- identite, ticker, ISIN, FIGI, secteur et pays;
- prix, variation, volume et OHLCV;
- indicateurs techniques;
- fondamentaux, resultats et dividendes;
- indices, obligations, screener et statistiques de marche;
- toute nouvelle donnee metier ajoutee a la page.

Une source locale est autorisee uniquement pour une donnee explicitement hors API et documentee, ou comme fallback de degradation controlee lorsque l'API est indisponible. Le fallback doit etre tracable et ne doit jamais devenir la source nominale.

## Obligations

- Verifier le contrat API reel avant de coder.
- Valider schemas et types au niveau domain.
- Utiliser repositories et adaptateurs infra.
- Respecter pagination, continuation, timeouts et annulation.
- Dedoublonner requetes et rerenders.
- Exposer les donnees manquantes et erreurs API explicitement.
- Tester source, mapping, erreurs et rendu avec donnees reelles.

## Interdictions

- Aucun mock ou faker dans le chemin nominal.
- Aucun catalogue local pour remplacer une entite presente dans l'API.
- Aucun fallback silencieux qui invente une donnee.
- Aucun endpoint legacy si l'API officielle couvre le besoin.
- Aucune affirmation API-first sans preuve reseau et trace du flux.


NB: pas de falback ou calcul local a afficher quand on demande API FIRST,  dit toi que on s'attend à voir null ou N/A si l'api napas ces donne sou ne retourne pas de donnes pour un niveau specifique! affiche des falback ou mock ne permet pas de savoir ce que l'api affiche reelemnt! donc API FIRST obligatoire il faut le respecter EPICETOUT!