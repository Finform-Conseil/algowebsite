# API-FIRST EVIDENCE CONTRACT

Status: CANONICAL
Scope: données affichées par les surfaces financières et techniques
Authority:
- `Docs/API_FIRST_ABSOLUTE_RULE.md`
- `Docs/ARCHITECTURE_DATA_FLOW.md`

## 1. Objectif

Avant d'affirmer qu'une donnée est absente, indisponible, calculée ou non fournie,
l'agent doit rechercher et produire des preuves dans les deux sources suivantes :

1. le code du store API et ses couches de transport ;
2. la réponse réelle observée dans Chrome via CDP.

Une seule de ces sources ne suffit jamais pour conclure.

## 2. Périmètre obligatoire de recherche

### 2.1 Store API local

Rechercher dans cet ordre :

1. `core/infra/store/api/`
   - route ;
   - méthode HTTP ;
   - paramètres ;
   - type de réponse ;
   - transformation éventuelle.
2. `core/infra/repositories/`
   - méthode appelée ;
   - normalisation ;
   - filtrage ;
   - cache ;
   - fallback.
3. `core/domain/entities/` et `core/domain/types/`
   - champ typé ;
   - champ optionnel ;
   - champ renommé ;
   - champ absent du contrat TypeScript.
4. hook, adapter et composant consommateur
   - mapping final ;
   - formule ;
   - état `N/D` ou indisponible ;
   - source locale éventuelle.

La recherche du seul nom d'un champ ne suffit pas. Il faut vérifier la route
réellement appelée et le chemin complet jusqu'à l'interface.

### 2.2 API réelle via CDP Chrome

Dans Chrome connecté au CDP :

1. identifier la page applicative ;
2. identifier ou ouvrir la page API cible est: "http://a21mldhl1xhs0dumr7kfo1fg.85.190.99.121.sslip.io";
3. relever l'URL exacte et le statut HTTP ;
4. relever la requête capturée dans le réseau ;
5. inspecter la réponse JSON réelle ;
6. rechercher le champ à tous les niveaux pertinents :
   - racine ;
   - objet principal ;
   - tableaux ;
   - objets imbriqués ;
   - variantes de nom explicitement présentes dans la réponse ;
7. relever le DOM réellement affiché après résolution de la requête.

La preuve CDP doit contenir au minimum :

- URL de la page ;
- URL de la route ;
- statut HTTP ;
- présence ou absence du champ dans la réponse ;
- extrait ciblé de la réponse, sans secret ;
- texte DOM observé ;
- date/heure de vérification.

## 3. Classification obligatoire du résultat

Une conclusion doit utiliser exactement une des catégories suivantes.

### API_FIELD_PRESENT

Le champ existe dans la réponse réelle et son chemin est confirmé dans le
store/repository. Il peut être affiché après le mapping documenté.

### API_FIELD_PRESENT_UNTYPED

Le champ existe dans la réponse CDP mais n'existe pas encore dans les types
domain/store. Il est interdit de le déclarer absent. Il faut signaler un contrat
TypeScript incomplet et ouvrir une correction de typage avant de conclure.

### API_FIELD_ABSENT_VERIFIED

Le champ recherché est absent de la réponse CDP, après inspection de tous les
niveaux pertinents, et aucune variante équivalente n'est exposée par le contrat
du store API. L'interface peut afficher `N/D` ou l'état indisponible prévu.

### API_ROUTE_NOT_VERIFIED

La route réelle n'a pas été observée dans Chrome, ou la réponse n'a pas pu être
inspectée. Il est interdit d'affirmer que le champ est absent ou indisponible.

### UI_UNAVAILABLE

L'API a été appelée, mais le composant ne peut pas afficher la donnée selon son
contrat de validation. La cause doit être explicitement citée : champ absent,
type invalide, réponse vide, erreur HTTP ou annulation.

### API_FIELD_DERIVED

La donnée affichée est calculée à partir de champs API vérifiés. La preuve doit
donner la formule, les champs d'entrée et le fichier qui porte la formule. Une
dérivation locale ne doit jamais être présentée comme un champ API brut.

## 4. Interdictions

Il est interdit de :

- conclure « absent » après une recherche limitée au code local ;
- conclure « absent » après une requête CDP différente de la route consommée ;
- confondre champ non typé et champ absent ;
- confondre réponse vide, erreur réseau et champ absent ;
- renommer `coupon_rate`, `clearing_yield` ou tout autre champ en `ytm`
  sans preuve que l'API fournit réellement un YTM ;
- calculer une maturité depuis `tenor` si la maturité affichée est présentée
  comme une date API ;
- utiliser un catalogue, un cache ou une constante locale pour masquer l'absence
  d'une donnée en mode réel ;
- déclarer une vérification CDP qui n'a pas été exécutée ;
- présenter une valeur observée dans une autre route comme provenant de la route
  étudiée.

## 5. Fiche de preuve à remplir

Pour chaque nouveau bloc documenté :

```text
Bloc UI :
Titre de la surface :
Mode : réel | mock

Store API :
Route :
Méthode :
Fichier API :
Repository :
Hook/adapter :
Type domain :

Vérification CDP :
Page :
Route capturée :
Statut HTTP :
Réponse inspectée :
Chemins API trouvés :
Champ recherché :
Variantes recherchées :
Résultat : API_FIELD_PRESENT | API_FIELD_PRESENT_UNTYPED |
          API_FIELD_ABSENT_VERIFIED | API_ROUTE_NOT_VERIFIED |
          UI_UNAVAILABLE | API_FIELD_DERIVED

DOM observé :
Transformation/formule :
Fallback utilisé :
Preuve de non-fallback :
Conclusion :
Date de vérification :
```

Une fiche incomplète ne constitue pas une preuve.

## 6. Contrat particulier pour un panneau indisponible

Un panneau peut afficher « Données indisponibles » uniquement si :

1. la route API nominale est identifiée dans `core/infra/store/api/` ;
2. cette route a été observée ou exécutée via CDP ;
3. la réponse HTTP a été inspectée ;
4. le champ recherché et ses variantes sont absents, invalides ou non exploitables ;
5. aucun fallback local ne fournit la valeur affichée ;
6. le DOM confirme l'état indisponible ;
7. la conclusion est classée `API_FIELD_ABSENT_VERIFIED` ou
   `UI_UNAVAILABLE`.

Si l'une de ces conditions manque, le verdict obligatoire est
`API_ROUTE_NOT_VERIFIED`, jamais « absent ».

## 7. Contrat particulier pour une donnée affichée

Une valeur affichée comme donnée API doit avoir :

- une route ;
- un chemin JSON ;
- un type ou une preuve `API_FIELD_PRESENT_UNTYPED` ;
- un repository ou adapter ;
- un composant consommateur ;
- une preuve CDP correspondante.

Une valeur calculée doit en plus avoir :

- les champs API d'entrée ;
- la formule exacte ;
- le fichier de calcul ;
- la mention explicite `API_FIELD_DERIVED`.

## 8. Exemple de décision correcte

Pour un bloc intitulé « Highest YTM bonds » :

- `coupon_rate` présent ne prouve pas la présence de YTM ;
- `clearing_yield` présent ne prouve pas la présence de YTM ;
- `issue_lots[].maturity_date` prouve seulement la maturité ;
- l'absence de `ytm` et `yield_to_maturity` doit être confirmée dans la
  réponse CDP réelle ;
- sans YTM API vérifié, le panneau affiche l'état indisponible ou doit changer
  de titre pour refléter le champ réellement fourni.

## 9. Anti-hallucination et anti-duplication

Avant de créer ou documenter une nouvelle donnée, une route ou une logique,
l'agent doit rechercher l'existant. Cette recherche est une précondition, pas
une étape optionnelle.

### 9.1 Recherche avant création

Rechercher d'abord :

- la route et sa méthode HTTP dans `core/infra/store/api/` ;
- l'endpoint injecté, ses paramètres et son type de réponse ;
- le repository qui expose déjà cette route ;
- l'adapter, le hook ou le port qui transporte déjà la donnée ;
- la formule ou le normalizer déjà utilisé par une autre surface ;
- les tests et contrats existants ;
- le flux canonique déjà documenté dans
  `Docs/ARCHITECTURE_DATA_FLOW.md`.

La recherche doit couvrir les variantes de nom, les routes équivalentes et les
appels indirects. Une recherche limitée au nom visible dans l'interface ne
constitue pas une vérification.

### 9.2 Réutilisation obligatoire

Si une route, un repository, un adapter, un hook, une formule ou un contrat
existe déjà, il faut le réutiliser. Il est interdit de :

- recréer une route identique ou équivalente dans `core/infra/store/api/` ;
- créer un second repository pour la même ressource ;
- dupliquer une transformation ou une formule existante ;
- ajouter un fetch direct dans un composant qui dispose déjà d'un port, hook ou
  repository ;
- recopier dans ce document le flux détaillé déjà défini dans
  `Docs/ARCHITECTURE_DATA_FLOW.md`.

### 9.3 Référence plutôt que duplication documentaire

`Docs/ARCHITECTURE_DATA_FLOW.md` est la source canonique du flux architectural.
Ce contrat définit seulement les contrôles de preuve. Pour un flux déjà décrit,
il faut :

1. référencer la section ou le document canonique ;
2. ajouter uniquement la preuve spécifique à la donnée contrôlée ;
3. ne pas recopier les routes, imports, couches ou séquences déjà documentés ;
4. signaler explicitement toute divergence observée.

Une nouvelle route ou une nouvelle logique n'est autorisée qu'après preuve que
l'existant ne couvre pas le besoin et après justification écrite de cette
absence.

### 9.4 Verdict anti-hallucination

Toute proposition de création doit être classée avant action :

- `REUSE_EXISTING` : l'existant couvre le besoin ; aucune création autorisée ;
- `EXTEND_EXISTING` : l'existant est le bon point d'extension ;
- `NEW_ROUTE_JUSTIFIED` : aucune route équivalente trouvée, preuve fournie ;
- `NEW_LOGIC_JUSTIFIED` : aucune logique équivalente trouvée, preuve fournie ;
- `DUPLICATION_BLOCKED` : l'agent s'apprêtait à recréer ou recopier l'existant.

Sans verdict et preuve de recherche, la création est invalide.

## 10. Règle de décision finale

Aucune donnée ne doit être déclarée absente, indisponible, locale, dérivée ou
API-first sur la base d'une intuition.

La décision finale doit toujours répondre à cette chaîne :

```
Store API inspecté
  -> repository/domain inspectés
  -> route réelle vérifiée via CDP
  -> réponse JSON inspectée
  -> DOM observé
  -> catégorie de résultat attribuée
  -> conclusion documentée
```

Sans cette chaîne complète, la décision est invalide.
