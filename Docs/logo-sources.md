# Sources et licences des logos

Ce registre décrit la provenance technique des fichiers présents sous `public/logos-*`.
Il ne concède aucun droit sur les marques : les noms, logos et signes distinctifs restent la propriété de leurs détenteurs.

## Contrat commun

Chaque logo livré à l'application est un WebP lossless normalisé sur une toile blanche carrée de 256 × 256 pixels.
`normalization-manifest.json` est la preuve de l'empreinte et du format final. Les fichiers de collecte historiques restent des preuves de provenance et ne sont pas utilisés directement par l'interface.

La complétude est déterminée par l'inventaire unique de l'API réelle du marché, et non par le nombre de fichiers déjà présents sur disque. Pour chaque marché, le dossier de livraison doit pouvoir répondre à la chaîne suivante :

`API → tickers uniques → source vérifiée → WebP canonique → manifeste → résolveur → modal`.

Les compteurs de ces étapes doivent être conservés séparément afin de distinguer un titre absent, une source échouée, un doublon canonisé et un problème de résolveur.

| Marché | Source technique | Manifestes conservés |
| --- | --- | --- |
| BRVM | Sources locales historiques de la collecte BRVM | `mapping.json`, `normalization-manifest.json`, `deduplication-manifest.json` |
| CSE | API réelle du marché, sites des émetteurs, pages de la Bourse de Casablanca et références de marque vérifiées | `source-manifest.json`, `normalization-manifest.json` |
| GSE | Catalogue Mula Technologies / API GSE observé pendant la collecte | `source-map.json`, `normalization-manifest.json`, `deduplication-manifest.json` |
| JSE | Catalogue officiel JSE et CDN tickerlogos utilisé par le collecteur | `manifest.json`, `normalization-manifest.json` |
| NGX | Archive communautaire NGX fournie pour la collecte | `normalization-manifest.json`, `deduplication-manifest.json` |
| NSE | Manifest source de la collecte NSE | `source-manifest.json`, `normalization-manifest.json`, `deduplication-manifest.json` |

## CSE et JSE : règle d'harmonisation historique

Pour CSE et JSE, `manifest.json` est le journal brut de collecte : il peut contenir des tentatives échouées ou plusieurs symboles partageant une même image.
Le contrat exploitable par l'application est `normalization-manifest.json`, dont chaque entrée doit pointer vers un WebP réellement présent.
Les champs de provenance des manifestes bruts (`source_url`, `source_catalog`, `api`, `logo_cdn`, `catalog_url`) sont conservés et ne doivent pas être remplacés par une URL inventée.

## Stratégie de récupération

La collecte suit une stratégie progressive :

1. site officiel de l'émetteur ou fichier de marque officiel ;
2. page de l'émetteur sur le site officiel de la bourse ou catalogue de symboles ;
3. référence publique reconnue, uniquement si les deux premières sources échouent.

Un favicon générique, une initiale générée par l'interface ou une image sans lien vérifiable avec l'émetteur ne constitue pas un logo accepté. Chaque recours à une source secondaire doit conserver son URL exacte, son type (`issuer`, `exchange`, `brand-reference`) et son statut de vérification dans le manifeste.

## Doublons et alias

`public/logo-aliases.json` est la source unique des alias utilisés par le résolveur applicatif.
Les manifestes `deduplication-manifest.json` restent la preuve de la décision de canonisation.
Un alias ne doit être ajouté qu'après vérification que son fichier canonique existe et que l'identité visuelle est exacte.

Le contrôle combine le ticker, le hash SHA-256 et une comparaison perceptuelle sur vignette après composition sur fond blanc. Deux fichiers visuellement identiques ne doivent pas être conservés sous deux noms lorsque la provenance confirme le même émetteur. En cas d'incertitude, on conserve les fichiers et on ouvre une anomalie : on ne fusionne jamais uniquement sur la ressemblance.

## Lisibilité et validation visuelle

L'uniformité de la toile ne suffit pas. Le mot-symbole, le nom de marque et les éléments distinctifs doivent rester lisibles à la taille d'affichage du modal. Les logos minuscules, flous, entièrement blancs ou réduits à une forme indistincte sont des échecs de conformité, même si leurs dimensions et leur format sont corrects. La correction repart toujours de l'original, jamais d'un WebP déjà normalisé.

La validation finale comprend une ouverture du modal de sélection des titres dans le navigateur, un parcours de toutes les catégories et un contrôle des cas qui affichent encore les initiales. Une compilation réussie seule ne prouve pas que le résolveur charge les images.

## Licence et conformité

Les sources publiques ou communautaires n'impliquent pas automatiquement une licence de redistribution. La provenance technique d'une image ne vaut pas autorisation commerciale de la marque. Avant une mise en production commerciale, valider les conditions de chaque API/CDN et obtenir les autorisations nécessaires pour l'usage des marques.
Ne pas supprimer les champs de provenance ni les empreintes SHA-256 : ils permettent un audit et un retrait ciblé d'un asset litigieux.
