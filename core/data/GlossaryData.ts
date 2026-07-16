export interface GlossarySection {
  id: string;
  title: string;
  content: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  category: string;
  definition: string;
  simplyPut: string;
  subtitle?: string;
  formula?: string;
  secondaryBadge?: string;
  screenerLink?: string;
  sections: GlossarySection[];
  relatedSlugs: string[];
  group: "financial" | "sector";
}

export const GLOSSARY_CATEGORIES = [
  "Besoin en Fonds de Roulement",
  "Catégories de Peter Lynch",
  "Concepts d'Investissement",
  "Croissance",
  "Dividendes",
  "Endettement et Solvabilité",
  "Entreprise et Secteur",
  "Flux de Trésorerie",
  "Rentabilité",
  "Valorisation",
] as const;

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "quality-score",
    term: "Score de Qualit\u00e9",
    category: "Concepts d'Investissement",
    definition: "Moyenne pond\u00e9r\u00e9e de 9 crit\u00e8res fondamentaux de qualit\u00e9, chacun not\u00e9 de 0 \u00e0 10.",
    simplyPut: "CasaValue examine la rentabilit\u00e9, le cash-flow, le niveau d'endettement et la croissance d'une entreprise, puis combine le tout en un seul score de 0 \u00e0 10. Un score \u00e9lev\u00e9 signifie que l'entreprise coche de nombreuses cases de sant\u00e9 financi\u00e8re. C'est comme un bulletin scolaire, mais pour les entreprises.",
    subtitle: "Score de Qualit\u00e9 CasaValue (0\u201310)",
    secondaryBadge: "Regulatory & Market",
    screenerLink: "Score de Qualit\u00e9",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Le Score de Qualit\u00e9 est la notation propri\u00e9taire de CasaValue qui r\u00e9sume la solidit\u00e9 fondamentale d'une entreprise en un seul chiffre de 0 \u00e0 10. Il est la moyenne pond\u00e9r\u00e9e de neuf facteurs individuels, chacun not\u00e9 ind\u00e9pendamment sur une \u00e9chelle de 0 \u00e0 10. La valorisation est not\u00e9e s\u00e9par\u00e9ment et n'affecte pas le Score de Qualit\u00e9."
      },
      {
        id: "les-9-facteurs",
        title: "Les 9 facteurs",
        content: "Moat \u2014 Avantages concurrentiels comme les co\u00fbts de transfert, la marque, les effets de r\u00e9seau ou les barri\u00e8res r\u00e9glementaires qui prot\u00e8gent les b\u00e9n\u00e9fices.\nSecteur \u2014 Vents porteurs s\u00e9culaires, taille du march\u00e9, environnement r\u00e9glementaire et croissance structurelle du secteur.\nEfficacit\u00e9 \u2014 La capacit\u00e9 de l'entreprise \u00e0 convertir le capital en profit (ROE, ROIC, marges op\u00e9rationnelles).\nPotentiel de croissance \u2014 Potentiel de croissance du chiffre d'affaires et des r\u00e9sultats selon le march\u00e9 adressable, le carnet de commandes et la trajectoire historique.\nStabilit\u00e9 des r\u00e9sultats \u2014 R\u00e9gularit\u00e9 et pr\u00e9visibilit\u00e9 des b\u00e9n\u00e9fices dans le temps. Des r\u00e9sultats volatils ou en d\u00e9clin obtiennent un score inf\u00e9rieur.\nQualit\u00e9 du cash-flow \u2014 G\u00e9n\u00e9ration de flux de tr\u00e9sorerie disponible, taux de conversion du FCF et gestion du besoin en fonds de roulement (DSO, stocks).\nBilan \u2014 Sant\u00e9 financi\u00e8re : ratios d'endettement, couverture des int\u00e9r\u00eats, position de dette nette et exposition au goodwill.\nAllocation du capital \u2014 Historique de la direction dans le d\u00e9ploiement judicieux du capital : r\u00e9investissement, acquisitions, rachats d'actions, dividendes.\nGouvernance \u2014 Structure de l'actionnariat, ind\u00e9pendance du conseil, alignement des dirigeants, transparence et protection des actionnaires minoritaires."
      },
      {
        id: "comment-l-interpreter",
        title: "Comment l'interpr\u00e9ter",
        content: "8\u201310 : Qualit\u00e9 exceptionnelle. Rare.\n6\u20138 : Fondamentaux solides avec quelques r\u00e9serves sur un ou deux facteurs.\n4\u20136 : Moyen ou mitig\u00e9. Peut pr\u00e9senter des op\u00e9rations solides compens\u00e9es par des faiblesses ailleurs.\nEn dessous de 4 : Faiblesses significatives sur plusieurs dimensions. N\u00e9cessite une conviction profonde pour investir."
      },
      {
        id: "mises-en-garde-importantes",
        title: "Mises en garde importantes",
        content: "Le score est un point de d\u00e9part, pas un signal d'achat ou de vente. Un score \u00e9lev\u00e9 ne signifie pas \u00ab acheter \u00bb \u2014 il signifie que l'entreprise est fondamentalement solide. Il faut encore estimer la valeur intrins\u00e8que et la comparer au cours actuel. De m\u00eame, un score faible ne signifie pas \u00ab \u00e9viter \u00bb \u2014 il peut refl\u00e9ter une situation temporaire (retournement, creux cyclique) qui cr\u00e9e une opportunit\u00e9."
      }
    ],
    relatedSlugs: ["moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity", "compounding"],
    group: "financial"
  },
  {
    slug: "ebitda",
    term: "EBITDA",
    category: "Rentabilité",
    definition: "Approximation du cash-flow opérationnel, mais qui ignore des coûts réels comme les amortissements.",
    simplyPut: "L'EBITDA, c'est comme regarder le chiffre d'affaires d'un restaurant en ignorant le loyer et l'usure des cuisines. Cela donne une idée de la performance opérationnelle brute, mais ne raconte pas toute l'histoire financière.",
    subtitle: "Résultat avant intérêts, impôts, dépréciation et amortissement",
    formula: "Résultat Net + Impôts + Intérêts + Dépréciations et Amortissements",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Approximation du cash-flow opérationnel, mais qui ignore des coûts réels comme les amortissements. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebit", "net-income", "gross-margin", "operating-margin", "net-margin", "roe"],
    group: "financial"
  },
  {
    slug: "ebit",
    term: "EBIT",
    category: "Rentabilité",
    definition: "Résultat d\'exploitation avant charges financières et impôts. Aussi appelé résultat opérationnel.",
    simplyPut: "Imaginez que vous dirigiez une petite entreprise. L'EBIT, c'est le profit que vous réalisez avant de payer les intérêts à la banque et les impôts au gouvernement. C'est la mesure la plus pure de votre talent de gestionnaire.",
    subtitle: "Résultat avant intérêts et impôts",
    formula: "Chiffre d'affaires - Coût des marchandises vendues - Charges d'exploitation (y compris dépréciation et amortissement)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Résultat d'exploitation avant charges financières et impôts. Aussi appelé résultat opérationnel. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "net-income", "gross-margin", "operating-margin", "net-margin", "roe"],
    group: "financial"
  },
  {
    slug: "net-income",
    term: "RNPG",
    category: "Rentabilité",
    definition: "Le résultat final, ce qui reste après toutes les charges, intérêts et impôts.",
    simplyPut: "Le RNPG, c'est ce qu'il reste après que tout le monde a été payé : les fournisseurs, les employés, les banquiers et l'État. C'est le profit ultime qui revient aux actionnaires.",
    subtitle: "Résultat Net Part du Groupe",
    formula: "Produits - Charges - Impôts - Intérêts - Part des minoritaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Le résultat final, ce qui reste après toutes les charges, intérêts et impôts. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "gross-margin", "operating-margin", "net-margin", "roe"],
    group: "financial"
  },
  {
    slug: "gross-margin",
    term: "Marge brute",
    category: "Rentabilité",
    definition: "Chiffre d\'affaires moins coût des marchandises vendues, divisé par le chiffre d\'affaires. Mesure le pouvoir de fixation des prix.",
    simplyPut: "Si vous vendez un produit 100 MAD et qu'il vous coûte 60 MAD à fabriquer, votre marge brute est de 40 %. Plus elle est élevée, plus vous avez de pouvoir sur vos prix.",
    subtitle: "Marge bénéficiaire brute",
    formula: "(Chiffre d'affaires - Coût des marchandises vendues) / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Chiffre d'affaires moins coût des marchandises vendues, divisé par le chiffre d'affaires. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "operating-margin", "net-margin", "roe"],
    group: "financial"
  },
  {
    slug: "operating-margin",
    term: "Marge op\u00e9rationnelle",
    category: "Rentabilité",
    definition: "EBIT divisé par le chiffre d\'affaires. Montre combien de profit l\'activité principale génère par dirham de ventes.",
    simplyPut: "La marge opérationnelle indique combien de centimes de profit une entreprise conserve pour chaque dirham de vente après avoir payé tous ses coûts d'exploitation. C'est un indicateur de l'efficacité de la gestion.",
    subtitle: "Marge bénéficiaire opérationnelle",
    formula: "Résultat d'exploitation / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "EBIT divisé par le chiffre d'affaires. Montre combien de profit l'activité principale génère par dirham de ventes. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "net-margin", "roe"],
    group: "financial"
  },
  {
    slug: "net-margin",
    term: "Marge nette",
    category: "Rentabilité",
    definition: "Résultat net divisé par le chiffre d\'affaires. La mesure ultime de la rentabilité après tous les coûts.",
    simplyPut: "La marge nette vous dit combien de centimes de bénéfice final l'entreprise conserve sur chaque dirham de vente. Si elle est de 10 %, l'entreprise garde 10 centimes de profit pour chaque dirham gagné.",
    subtitle: "Marge bénéficiaire nette",
    formula: "Résultat Net Part du Groupe / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Résultat net divisé par le chiffre d'affaires. La mesure ultime de la rentabilité après tous les coûts. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "roe"],
    group: "financial"
  },
  {
    slug: "roe",
    term: "ROE",
    category: "Rentabilit\u00e9",
    definition: "R\u00e9sultat net divis\u00e9 par les capitaux propres. Mesure l'efficacit\u00e9 de l'utilisation de l'argent des actionnaires.",
    simplyPut: "Il exprime combien de centimes de profit net l'entreprise g\u00e9n\u00e8re pour chaque dirham d\u00e9tenu par les actionnaires.",
    subtitle: "Rentabilit\u00e9 des capitaux propres",
    formula: "Résultat Net / Capitaux Propres Moyens",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, il exprime combien de centimes de profit net l'entreprise g\u00e9n\u00e8re pour chaque dirham d\u00e9tenu par les actionnaires."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "roa",
    term: "ROA",
    category: "Rentabilité",
    definition: "Résultat net divisé par le total des actifs. Mesure l\'efficacité d\'utilisation de l\'ensemble des actifs.",
    simplyPut: "En langage courant, R\u00e9sultat net divis\u00e9 par le total des actifs. Mesure l'efficacit\u00e9 d'utilisation de l'ensemble des actifs.",
    subtitle: "Rentabilité des actifs",
    formula: "Résultat Net / Total des actifs",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, R\u00e9sultat net divis\u00e9 par le total des actifs. Mesure l'efficacit\u00e9 d'utilisation de l'ensemble des actifs."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "roic",
    term: "ROIC",
    category: "Rentabilité",
    definition: "Résultat opérationnel après impôts divisé par les capitaux investis. La référence absolue pour mesurer la qualité d\'une entreprise.",
    simplyPut: "Imaginez que vous et un ami mettiez chacun 50 000 MAD dans un commerce, et que la banque vous prête 100 000 MAD. Le ROIC mesure le profit généré sur l'ensemble des 200 000 MAD investis.",
    subtitle: "Retour sur capitaux investis",
    formula: "Résultat d'exploitation après impôt / Capitaux investis",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Résultat opérationnel après impôts divisé par les capitaux investis. La référence absolue pour mesurer la qualité d'une entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "roce",
    term: "ROCE",
    category: "Rentabilité",
    definition: "EBIT divisé par les capitaux employés. Similaire au ROIC mais utilise le résultat opérationnel avant impôts.",
    simplyPut: "Le ROCE est similaire au ROIC mais utilise le résultat avant impôts. Il mesure combien de profit opérationnel une entreprise génère pour chaque dirham de capital employé.",
    subtitle: "Retour sur capitaux employés",
    formula: "Résultat d'exploitation / Capitaux employés",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "EBIT divisé par les capitaux employés. Similaire au ROIC mais utilise le résultat opérationnel avant impôts. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "pe-ratio",
    term: "PER",
    category: "Valorisation",
    definition: "Cours de l\'action divisé par le bénéfice par action. Le multiple de valorisation le plus courant.",
    simplyPut: "Si un commerce réalise 10 000 MAD de bénéfice par an et qu'on vous propose de l'acheter pour 150 000 MAD, le PER est de 15. Vous payez 15 années de bénéfice pour l'acquérir.",
    subtitle: "Ratio cours/bénéfice",
    formula: "Cours de l'action / Bénéfice par action",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Cours de l'action divisé par le bénéfice par action. Le multiple de valorisation le plus courant. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value", "market-cap"],
    group: "financial"
  },
  {
    slug: "price-to-book",
    term: "P/B",
    category: "Valorisation",
    definition: "Cours de l\'action divisé par la valeur comptable par action. En dessous de 1,0, l\'action cote sous sa valeur d\'actif net.",
    simplyPut: "Le P/B compare le prix de marché d'une action à sa valeur comptable. Si le P/B est inférieur à 1, l'action se négocie en dessous de la valeur de ses actifs nets.",
    subtitle: "Ratio cours/valeur comptable",
    formula: "Cours de l'action / Valeur comptable par action",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Cours de l'action divisé par la valeur comptable par action. En dessous de 1,0, l'action cote sous sa valeur d'actif net. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["pe-ratio", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value", "market-cap"],
    group: "financial"
  },
  {
    slug: "ev-ebitda",
    term: "EV/EBITDA",
    category: "Valorisation",
    definition: "Valeur d\'entreprise divisée par l\'EBITDA. Valorisation neutre par rapport à la structure du capital. Plus c\'est bas, moins c\'est cher.",
    simplyPut: "L'EV/EBITDA est comme le PER, mais en mieux. Il tient compte de la dette et donne une image plus complète de la valorisation, indépendamment de la structure financière.",
    subtitle: "Valeur d'entreprise / EBITDA",
    formula: "Valeur d'entreprise / EBITDA",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Valeur d'entreprise divisée par l'EBITDA. Valorisation neutre par rapport à la structure du capital. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "earnings-yield", "peg-ratio", "enterprise-value", "market-cap"],
    group: "financial"
  },
  {
    slug: "earnings-yield",
    term: "Rendement b\u00e9n\u00e9ficiaire",
    category: "Valorisation",
    definition: "BPA divisé par le cours de l\'action (1/PER). Permet de comparer directement le rendement des actions à celui des obligations.",
    simplyPut: "Le rendement bénéficiaire, c'est l'inverse du PER. Si le PER est de 20, le rendement est de 5 %. Cela permet de comparer directement le rendement d'une action à celui d'une obligation.",
    subtitle: "Rendement bénéficiaire",
    formula: "BPA / Cours de l'action",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "BPA divisé par le cours de l'action (1/PER). Permet de comparer directement le rendement des actions à celui des obligations. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "peg-ratio", "enterprise-value", "market-cap"],
    group: "financial"
  },
  {
    slug: "peg-ratio",
    term: "PEG",
    category: "Valorisation",
    definition: "PER divisé par le taux de croissance des bénéfices. En dessous de 1,0, cela suggère une sous-évaluation par rapport à la croissance.",
    simplyPut: "Le PEG ajuste le PER en fonction de la croissance. Un PER de 20 avec une croissance de 20 % donne un PEG de 1,0 — considéré comme une valorisation équitable par Peter Lynch.",
    subtitle: "Ratio PER/croissance",
    formula: "PER / Taux de croissance annuel moyen du BPA",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "PER divisé par le taux de croissance des bénéfices. Mesure si la croissance est correctement valorisée. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "enterprise-value", "market-cap"],
    group: "financial"
  },
  {
    slug: "enterprise-value",
    term: "Valeur d'entreprise",
    category: "Valorisation",
    definition: "Capitalisation boursière plus dette nette. Le prix total pour acquérir l\'ensemble de l\'entreprise.",
    simplyPut: "La valeur d'entreprise (EV) est le prix total qu'un acquéreur devrait payer pour acheter une entreprise : la capitalisation boursière plus la dette nette. C'est le vrai prix d'acquisition.",
    subtitle: "Valeur d'entreprise",
    formula: "Capitalisation boursière + Dette nette",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Capitalisation boursière + Dette nette. Le vrai prix d'une entreprise, dette comprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "market-cap"],
    group: "financial"
  },
  {
    slug: "market-cap",
    term: "Capitalisation boursi\u00e8re",
    category: "Valorisation",
    definition: "Cours de l\'action multiplié par le nombre d\'actions en circulation. La valorisation totale des capitaux propres par le marché.",
    simplyPut: "La capitalisation boursière est la valeur totale d'une entreprise selon le marché. Si une action vaut 100 MAD et qu'il y a 1 million d'actions, la capitalisation est de 100 millions de MAD.",
    subtitle: "Capitalisation boursière",
    formula: "Cours de l'action × Nombre d'actions en circulation",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Cours de l'action multiplié par le nombre total d'actions. La valeur boursière totale d'une entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "book-value",
    term: "Valeur comptable",
    category: "Valorisation",
    definition: "Capitaux propres totaux divisés par le nombre d\'actions en circulation. La valeur nette comptable par action.",
    simplyPut: "Actifs totaux moins passifs totaux. La valeur comptable nette d'une entreprise.",
    subtitle: "Valeur comptable",
    formula: "Total des actifs - Total des passifs",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Actifs totaux moins passifs totaux. La valeur comptable nette d'une entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "intrinsic-value",
    term: "Valeur intrins\u00e8que",
    category: "Valorisation",
    definition: "La valeur réelle d\'une entreprise basée sur la valeur actualisée de ses flux de trésorerie futurs. Le concept fondamental de l\'investissement « value ».",
    simplyPut: "Estimation de la valeur réelle d'une entreprise basée sur ses flux de trésorerie futurs actualisés.",
    subtitle: "Valeur intrinsèque",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Estimation de la valeur réelle d'une entreprise basée sur ses flux de trésorerie futurs actualisés. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "eps",
    term: "BPA",
    category: "Valorisation",
    definition: "Résultat net divisé par le nombre d\'actions en circulation. Le bénéfice attribuable à chaque action.",
    simplyPut: "Résultat net divisé par le nombre d'actions. La part de bénéfice attribuable à chaque action.",
    subtitle: "Bénéfice par action",
    formula: "Résultat Net Part du Groupe / Nombre d'actions moyen",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Résultat net divisé par le nombre d'actions. La part de bénéfice attribuable à chaque action. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "free-cash-flow",
    term: "Flux de tr\u00e9sorerie disponible",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Flux de trésorerie opérationnel moins les investissements. La trésorerie réelle qu\'une entreprise génère après entretien de ses actifs.",
    simplyPut: "Le Free Cash Flow, c'est l'argent qu'une entreprise génère après avoir payé ses factures et investi dans son activité. C'est le cash vraiment disponible pour les actionnaires.",
    subtitle: "Flux de trésorerie disponible (FCF)",
    formula: "Flux de trésorerie opérationnel - Dépenses d'investissement",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Trésorerie générée par l'activité après déduction des investissements nécessaires au maintien de l'outil productif. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "fcf-margin",
    term: "Marge de FCF",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Flux de trésorerie disponible divisé par le chiffre d\'affaires. Mesure l\'efficacité de la conversion des ventes en trésorerie.",
    simplyPut: "Free Cash Flow divisé par le chiffre d'affaires. Mesure la conversion en trésorerie disponible.",
    subtitle: "Marge de Free Cash Flow",
    formula: "Free Cash Flow / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Free Cash Flow divisé par le chiffre d'affaires. Mesure la conversion en trésorerie disponible. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "fcf-conversion",
    term: "Conversion du FCF",
    category: "Flux de Tr\u00e9sorerie",
    definition: "FCF divisé par le résultat net. Au-dessus de 1,0, l\'entreprise génère plus de cash que de bénéfice comptable.",
    simplyPut: "Free Cash Flow divisé par l'EBITDA ou le résultat net. Mesure la qualité de la conversion des bénéfices en cash.",
    subtitle: "Conversion en Free Cash Flow",
    formula: "Free Cash Flow / Résultat net",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Free Cash Flow divisé par l'EBITDA ou le résultat net. Mesure la qualité de la conversion des bénéfices en cash. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "operating-cash-flow", "capex", "owner-earnings", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "operating-cash-flow",
    term: "Flux de tr\u00e9sorerie op\u00e9rationnel",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Trésorerie générée par l\'activité courante. Le point de départ du flux de trésorerie disponible.",
    simplyPut: "Le cash-flow opérationnel mesure la trésorerie générée par l'activité principale. Contrairement au résultat net, il ne peut pas être facilement manipulé par des artifices comptables.",
    subtitle: "Flux de trésorerie opérationnel",
    formula: "Résultat net + Dotations aux amortissements - Variation du BFR",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Trésorerie générée par l'activité opérationnelle courante avant investissements. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "capex", "owner-earnings", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "capex",
    term: "Capex",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Dépenses en immobilisations (terrains, usines, équipements). Le coût de maintien et de développement de l\'activité.",
    simplyPut: "Dépenses d'investissement en immobilisations corporelles et incorporelles nécessaires à l'activité.",
    subtitle: "Dépenses d'investissement (CapEx)",
    formula: "Acquisitions d'immobilisations corporelles et incorporelles",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dépenses d'investissement en immobilisations corporelles et incorporelles nécessaires à l'activité. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "owner-earnings", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "owner-earnings",
    term: "Owner Earnings",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Résultat net + amortissements - Capex de maintien. La mesure préférée de Buffett du véritable pouvoir bénéficiaire.",
    simplyPut: "Les Owner Earnings, concept de Buffett, représentent le cash réellement disponible pour les actionnaires après tous les investissements nécessaires au maintien de l'activité.",
    subtitle: "Bénéfices de l'actionnaire (Owner Earnings)",
    formula: "Résultat net + Dotations aux amortissements - Dépenses de maintenance",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Mesure de la trésorerie disponible pour les actionnaires, concept popularisé par Warren Buffett. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "cfo-to-net-income"],
    group: "financial"
  },
  {
    slug: "net-debt",
    term: "Dette nette",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Emprunts totaux moins trésorerie et équivalents. La charge réelle de dette après utilisation des liquidités disponibles.",
    simplyPut: "Dette totale moins trésorerie et équivalents de trésorerie. Mesure l'endettement net réel.",
    subtitle: "Dette nette",
    formula: "Total des dettes financières - Trésorerie et équivalents",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dette totale moins trésorerie et équivalents de trésorerie. Mesure l'endettement net réel. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging", "gearing"],
    group: "financial"
  },
  {
    slug: "net-debt-ebitda",
    term: "Dette Nette/EBITDA",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Nombre d\'années de résultat opérationnel nécessaires pour rembourser toute la dette. En dessous de 2x, c\'est prudent.",
    simplyPut: "Dette nette divisée par l'EBITDA. Indicateur clé de la capacité de remboursement d'une entreprise.",
    subtitle: "Ratio Dette Nette sur EBITDA",
    formula: "Dette nette / EBITDA",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dette nette divisée par l'EBITDA. Indicateur clé de la capacité de remboursement d'une entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["net-debt", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging", "gearing"],
    group: "financial"
  },
  {
    slug: "debt-to-equity",
    term: "Ratio d'endettement",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Dettes totales divisées par les fonds propres. Montre la part de dette dans le financement par rapport aux fonds propres.",
    simplyPut: "Dette totale divisée par les capitaux propres. Mesure le levier financier de l'entreprise.",
    subtitle: "Ratio d'endettement",
    formula: "Total des dettes / Capitaux propres",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dette totale divisée par les capitaux propres. Mesure le levier financier de l'entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "interest-coverage", "current-ratio", "deleveraging", "gearing"],
    group: "financial"
  },
  {
    slug: "interest-coverage",
    term: "Ratio de couverture des int\u00e9r\u00eats",
    category: "Endettement et Solvabilit\u00e9",
    definition: "EBIT divisé par les charges d\'intérêts. Combien de fois l\'entreprise peut couvrir ses intérêts. Au-dessus de 5x, c\'est confortable.",
    simplyPut: "EBIT divisé par les charges d'intérêts. Mesure la capacité à payer les intérêts de la dette.",
    subtitle: "Couverture des intérêts",
    formula: "Résultat d'exploitation / Charges d'intérêts",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "EBIT divisé par les charges d'intérêts. Mesure la capacité à payer les intérêts de la dette. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "current-ratio", "deleveraging", "gearing"],
    group: "financial"
  },
  {
    slug: "current-ratio",
    term: "Ratio de liquidit\u00e9 g\u00e9n\u00e9rale",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Actifs courants divisés par passifs courants. En dessous de 1,0, les obligations à court terme dépassent les ressources à court terme.",
    simplyPut: "Actifs courants divisés par les passifs courants. Mesure la liquidité à court terme.",
    subtitle: "Ratio de liquidité générale",
    formula: "Actifs courants / Passifs courants",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Actifs courants divisés par les passifs courants. Mesure la liquidité à court terme. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "deleveraging", "gearing"],
    group: "financial"
  },
  {
    slug: "cagr",
    term: "TCAC",
    category: "Croissance",
    definition: "Le taux de croissance annuel lissé sur une période. Élimine la volatilité d\'une année sur l\'autre.",
    simplyPut: "Taux de croissance annualisé composé sur une période donnée. Mesure la progression régulière d'un indicateur.",
    subtitle: "Taux de Croissance Annuel Composé",
    formula: "(Valeur finale / Valeur initiale)^(1/Nombre d'années) - 1",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Taux de croissance annualisé composé sur une période donnée. Mesure la progression régulière d'un indicateur. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Peter Lynch aimait les entreprises avec une croissance régulière et prévisible. La croissance organique est particulièrement précieuse car elle ne dépend pas d'acquisitions risquées."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["organic-growth", "operating-leverage", "yoy", "backlog", "secular-growth"],
    group: "financial"
  },
  {
    slug: "organic-growth",
    term: "Croissance organique",
    category: "Croissance",
    definition: "Croissance du CA hors acquisitions, cessions et effets de change. Le vrai taux de croissance.",
    simplyPut: "Croissance du chiffre d'affaires générée par l'activité existante, hors acquisitions et effets de change.",
    subtitle: "Croissance organique",
    formula: "Croissance du chiffre d'affaires à périmètre et change constants",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Croissance du chiffre d'affaires générée par l'activité existante, hors acquisitions et effets de change. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Peter Lynch aimait les entreprises avec une croissance régulière et prévisible. La croissance organique est particulièrement précieuse car elle ne dépend pas d'acquisitions risquées."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["cagr", "operating-leverage", "yoy", "backlog", "secular-growth"],
    group: "financial"
  },
  {
    slug: "operating-leverage",
    term: "Levier op\u00e9rationnel",
    category: "Croissance",
    definition: "L\'ampleur avec laquelle les coûts fixes amplifient l\'impact des variations de CA sur le résultat. Coûts fixes élevés = levier élevé.",
    simplyPut: "Mesure de la sensibilité du résultat opérationnel aux variations du chiffre d'affaires.",
    subtitle: "Levier opérationnel",
    formula: "Variation en % du résultat opérationnel / Variation en % du chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Mesure de la sensibilité du résultat opérationnel aux variations du chiffre d'affaires. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Peter Lynch aimait les entreprises avec une croissance régulière et prévisible. La croissance organique est particulièrement précieuse car elle ne dépend pas d'acquisitions risquées."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["cagr", "organic-growth", "yoy", "backlog", "secular-growth"],
    group: "financial"
  },
  {
    slug: "dividend-yield",
    term: "Rendement du dividende",
    category: "Dividendes",
    definition: "Dividende annuel par action divisé par le cours de l\'action. Le rendement en cash de la détention du titre.",
    simplyPut: "Dividende annuel par action divisé par le cours de l'action. Rendement immédiat pour l'actionnaire.",
    subtitle: "Rendement du Dividende",
    formula: "Dividende par action / Cours de l'action",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dividende annuel par action divisé par le cours de l'action. Rendement immédiat pour l'actionnaire. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value apprécient les dividendes car ils représentent un retour tangible sur l'investissement. Une entreprise qui verse des dividendes réguliers fait preuve de discipline financière."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["payout-ratio", "dps", "dividend-coverage", "share-count-cagr"],
    group: "financial"
  },
  {
    slug: "payout-ratio",
    term: "Taux de distribution",
    category: "Dividendes",
    definition: "Dividendes versés en pourcentage du résultat net. Au-dessus de 100 %, cela signifie que l\'entreprise puise dans ses réserves.",
    simplyPut: "Dividendes versés divisés par le résultat net. Part du bénéfice distribuée aux actionnaires.",
    subtitle: "Taux de distribution",
    formula: "Total des dividendes versés / Résultat Net Part du Groupe",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dividendes versés divisés par le résultat net. Part du bénéfice distribuée aux actionnaires. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value apprécient les dividendes car ils représentent un retour tangible sur l'investissement. Une entreprise qui verse des dividendes réguliers fait preuve de discipline financière."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["dividend-yield", "dps", "dividend-coverage", "share-count-cagr"],
    group: "financial"
  },
  {
    slug: "dps",
    term: "DPA",
    category: "Dividendes",
    definition: "Dividendes totaux versés divisés par le nombre d\'actions. Le montant en cash versé par action.",
    simplyPut: "Dividende distribué par action. Montant versé à chaque actionnaire pour une action détenue.",
    subtitle: "Dividende par action (DPA)",
    formula: "Total des dividendes versés / Nombre d'actions",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Dividende distribué par action. Montant versé à chaque actionnaire pour une action détenue. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value apprécient les dividendes car ils représentent un retour tangible sur l'investissement. Une entreprise qui verse des dividendes réguliers fait preuve de discipline financière."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["dividend-yield", "payout-ratio", "dividend-coverage", "share-count-cagr"],
    group: "financial"
  },
  {
    slug: "working-capital",
    term: "Besoin en fonds de roulement",
    category: "Besoin en Fonds de Roulement",
    definition: "Actifs courants moins passifs courants. La trésorerie immobilisée dans l\'exploitation courante.",
    simplyPut: "Actifs courants moins passifs courants. Mesure la liquidité opérationnelle nécessaire au cycle d'exploitation.",
    subtitle: "Fonds de Roulement Net",
    formula: "Actifs courants - Passifs courants",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Actifs courants moins passifs courants. Mesure la liquidité opérationnelle nécessaire au cycle d'exploitation. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Une gestion efficace du BFR est un signe de qualité opérationnelle. Les entreprises qui optimisent leur cycle d'exploitation génèrent plus de cash et dépendent moins du financement externe."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["dso", "inventory-turnover", "asset-turnover", "ccc", "dpo", "dio"],
    group: "financial"
  },
  {
    slug: "dso",
    term: "DSO",
    category: "Besoin en Fonds de Roulement",
    definition: "Nombre moyen de jours pour encaisser un paiement après une vente. Un DSO en hausse peut signaler des problèmes de recouvrement.",
    simplyPut: "Délai moyen de encaissement des créances clients. Nombre de jours pour convertir une vente en cash.",
    subtitle: "Délai de encaissement (DSO)",
    formula: "(Créances clients / Chiffre d'affaires) × 365",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Délai moyen de encaissement des créances clients. Nombre de jours pour convertir une vente en cash. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Une gestion efficace du BFR est un signe de qualité opérationnelle. Les entreprises qui optimisent leur cycle d'exploitation génèrent plus de cash et dépendent moins du financement externe."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["working-capital", "inventory-turnover", "asset-turnover", "ccc", "dpo", "dio"],
    group: "financial"
  },
  {
    slug: "inventory-turnover",
    term: "Rotation des stocks",
    category: "Besoin en Fonds de Roulement",
    definition: "Coût des ventes divisé par le stock moyen. Mesure la rapidité avec laquelle l\'entreprise écoule ses stocks.",
    simplyPut: "Rotation des stocks. Mesure l'efficacité de la gestion des stocks.",
    subtitle: "Rotation des stocks",
    formula: "Coût des marchandises vendues / Stocks moyens",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Rotation des stocks. Mesure l'efficacité de la gestion des stocks. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Une gestion efficace du BFR est un signe de qualité opérationnelle. Les entreprises qui optimisent leur cycle d'exploitation génèrent plus de cash et dépendent moins du financement externe."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["working-capital", "dso", "asset-turnover", "ccc", "dpo", "dio"],
    group: "financial"
  },
  {
    slug: "asset-turnover",
    term: "Rotation des actifs",
    category: "Besoin en Fonds de Roulement",
    definition: "CA divisé par le total des actifs. Mesure l\'efficacité avec laquelle l\'entreprise utilise ses actifs pour générer des ventes.",
    simplyPut: "Chiffre d'affaires divisé par le total des actifs. Efficacité d'utilisation des actifs.",
    subtitle: "Rotation des actifs",
    formula: "Chiffre d'affaires / Total des actifs",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Chiffre d'affaires divisé par le total des actifs. Efficacité d'utilisation des actifs. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Une gestion efficace du BFR est un signe de qualité opérationnelle. Les entreprises qui optimisent leur cycle d'exploitation génèrent plus de cash et dépendent moins du financement externe."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "ccc", "dpo", "dio"],
    group: "financial"
  },
  {
    slug: "moat",
    term: "Moat",
    category: "Concepts d'Investissement",
    definition: "Un avantage concurrentiel durable qui protège une entreprise de ses concurrents. L\'idée centrale de Buffett.",
    simplyPut: "Le moat, ou fossé économique, est l'avantage concurrentiel qui protège une entreprise. Comme les douves d'un château médiéval, il empêche les concurrents d'attaquer les profits.",
    subtitle: "Avantage Concurrentiel Durable (Moat)",
    formula: "Avantage concurrentiel durable — marque, brevets, coûts de transfert, effets de réseau ou barrières réglementaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Avantage concurrentiel durable qui protège une entreprise de ses concurrents sur le long terme. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "margin-of-safety", "competitive-advantage", "free-float", "private-equity", "compounding"],
    group: "financial"
  },
  {
    slug: "margin-of-safety",
    term: "Marge de s\u00e9curit\u00e9",
    category: "Concepts d'Investissement",
    definition: "La décote entre le prix d\'achat et la valeur intrinsèque estimée. Le concept le plus important de l\'investissement value.",
    simplyPut: "La marge de sécurité est la différence entre le prix que vous payez et la valeur réelle que vous estimez. Plus elle est grande, moins vous risquez de perdre de l'argent.",
    subtitle: "Marge de Sécurité",
    formula: "Valeur intrinsèque estimée - Prix d'achat",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Différence entre le prix d'achat et la valeur intrinsèque estimée. Concept fondamental de l'investissement value. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "competitive-advantage", "free-float", "private-equity", "compounding"],
    group: "financial"
  },
  {
    slug: "competitive-advantage",
    term: "Avantage concurrentiel",
    category: "Concepts d'Investissement",
    definition: "Ce qui permet à une entreprise de surperformer ses concurrents dans le temps. L\'aspect qualitatif de l\'analyse du moat.",
    simplyPut: "Avantage qui permet à une entreprise de surperformer ses concurrents de manière durable.",
    subtitle: "Avantage Concurrentiel Durable",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Avantage qui permet à une entreprise de surperformer ses concurrents de manière durable. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "free-float", "private-equity", "compounding"],
    group: "financial"
  },
  {
    slug: "free-float",
    term: "Flottant",
    category: "Concepts d'Investissement",
    definition: "Actions disponibles à la négociation publique, hors participations de contrôle. Un faible flottant signifie une liquidité moindre.",
    simplyPut: "Pourcentage d'actions disponibles à la négociation sur le marché, hors participations stables.",
    subtitle: "Flottant (Free Float)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Pourcentage d'actions disponibles à la négociation sur le marché, hors participations stables. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "private-equity", "compounding"],
    group: "financial"
  },
  {
    slug: "private-equity",
    term: "PE",
    category: "Concepts d'Investissement",
    definition: "Capital investi dans des sociétés non cotées ou des rachats. À ne pas confondre avec le PER (ratio cours/bénéfice).",
    simplyPut: "Investissement dans des entreprises non cotées en bourse, généralement avec un horizon de long terme.",
    subtitle: "Capital-Investissement (Private Equity)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Investissement dans des entreprises non cotées en bourse, généralement avec un horizon de long terme. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "compounding"],
    group: "financial"
  },
  {
    slug: "compounding",
    term: "Int\u00e9r\u00eats compos\u00e9s",
    category: "Concepts d'Investissement",
    definition: "Générer des rendements sur vos rendements. La huitième merveille du monde, selon Einstein (attribué).",
    simplyPut: "Les intérêts composés, c'est la magie de faire travailler votre argent. Vous gagnez des rendements sur vos rendements, et la croissance devient exponentielle avec le temps.",
    subtitle: "Rendements composés",
    formula: "Capital × (1 + Taux de rendement)^(Nombre de périodes)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Génération de rendements sur les rendements déjà obtenus. La croissance exponentielle par réinvestissement. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "normalized-earnings",
    term: "R\u00e9sultats normalis\u00e9s",
    category: "Concepts d'Investissement",
    definition: "Résultats ajustés pour éliminer les éléments exceptionnels et les distorsions cycliques. Ce que l\'entreprise gagne réellement en année normale.",
    simplyPut: "Bénéfices ajustés pour refléter la performance économique récurrente, hors éléments exceptionnels.",
    subtitle: "Résultats Normalisés",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Bénéfices ajustés pour refléter la performance économique récurrente, hors éléments exceptionnels. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "goodwill",
    term: "Goodwill",
    category: "Concepts d'Investissement",
    definition: "La prime payée au-dessus de la valeur comptable lors d\'une acquisition. Figure au bilan en tant qu\'immobilisation incorporelle.",
    simplyPut: "Le goodwill apparaît quand une entreprise paie plus que la valeur comptable des actifs lors d'une acquisition. C'est la prime pour la marque, les clients ou la technologie acquise.",
    subtitle: "Écart d'acquisition (Goodwill)",
    formula: "Prix d'acquisition - Juste valeur des actifs nets acquis",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Écart d'acquisition. Survaleur payée lors d'une acquisition au-delà de la valeur comptable des actifs. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "dilution",
    term: "Dilution",
    category: "Concepts d'Investissement",
    definition: "Augmentation du nombre d\'actions en circulation qui réduit le pourcentage de détention de chaque action existante.",
    simplyPut: "Réduction du pourcentage de détention d'un actionnaire suite à l'émission de nouvelles actions.",
    subtitle: "Dilution du capital",
    formula: "Nouvelles actions émises / Ancien nombre d'actions",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Réduction du pourcentage de détention d'un actionnaire suite à l'émission de nouvelles actions. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "share-buyback",
    term: "Rachat d'actions",
    category: "Concepts d'Investissement",
    definition: "Lorsqu\'une entreprise rachète ses propres actions, réduisant le nombre d\'actions en circulation et augmentant le BPA.",
    simplyPut: "Un rachat d'actions réduit le nombre d'actions en circulation, ce qui augmente mécaniquement le BPA. C'est un moyen de retourner du cash aux actionnaires de façon flexible.",
    subtitle: "Rachat d'actions",
    formula: "Montant total racheté / Nombre d'actions rachetées",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Rachat par une entreprise de ses propres actions sur le marché. Opération de retour à l'actionnaire. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "mean-reversion",
    term: "Retour \u00e0 la moyenne",
    category: "Concepts d'Investissement",
    definition: "La tendance des valeurs extrêmes à revenir vers la moyenne au fil du temps. S\'applique aux marges, rendements et multiples.",
    simplyPut: "Tendance des indicateurs financiers et des valorisations à revenir vers leur moyenne historique.",
    subtitle: "Retour à la Moyenne",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Tendance des indicateurs financiers et des valorisations à revenir vers leur moyenne historique. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "terminal-value",
    term: "Valeur terminale",
    category: "Concepts d'Investissement",
    definition: "La valeur estimée d\'une entreprise au-delà de la période de prévision explicite dans un modèle DCF.",
    simplyPut: "La valeur terminale représente souvent 70 à 80 % de la valeur totale dans un DCF. C'est la valeur estimée de l'entreprise après la période de projection explicite.",
    subtitle: "Valeur terminale",
    formula: "Flux de trésorerie final × (1 + g) / (WACC - g)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Valeur résiduelle d'une entreprise au-delà de la période de projection explicite dans un DCF. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "discount-rate",
    term: "Taux d'actualisation",
    category: "Concepts d'Investissement",
    definition: "Le rendement exigé utilisé pour actualiser les flux de trésorerie futurs. Un taux plus élevé = une valeur actuelle plus faible.",
    simplyPut: "Taux utilisé pour actualiser les flux de trésorerie futurs à leur valeur présente.",
    subtitle: "Taux d'actualisation",
    formula: "Taux d'actualisation reflétant le coût d'opportunité du capital",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Taux utilisé pour actualiser les flux de trésorerie futurs à leur valeur présente. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "wacc",
    term: "WACC",
    category: "Concepts d'Investissement",
    definition: "Le coût mixte de la dette et des fonds propres. Utilisé comme taux d\'actualisation dans les modèles DCF au niveau de l\'entreprise.",
    simplyPut: "Le WACC est le taux de rendement minimum qu'une entreprise doit générer pour satisfaire ses actionnaires et créanciers. C'est le coût de son financement.",
    subtitle: "Coût moyen pondéré du capital (WACC)",
    formula: "E/(E+D) × Coût des capitaux propres + D/(E+D) × Coût de la dette × (1 - Taux d'impôt)",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Coût moyen pondéré du capital. Taux d'actualisation reflétant le coût de la dette et des capitaux propres. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "dcf",
    term: "DCF",
    category: "Concepts d'Investissement",
    definition: "Méthode de valorisation qui estime la valeur intrinsèque en actualisant les flux de trésorerie futurs projetés.",
    simplyPut: "Le DCF consiste à estimer tous les cash-flows futurs d'une entreprise et à les ramener à leur valeur d'aujourd'hui. C'est la méthode d'évaluation préférée de Buffett.",
    subtitle: "Discounted Cash Flow (DCF)",
    formula: "Somme des Flux de trésorerie actualisés + Valeur terminale actualisée",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Méthode d'évaluation qui actualise les flux de trésorerie futurs prévus pour estimer la valeur d'une entreprise. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "La compréhension de ces concepts est essentielle pour tout investisseur value. Ils forment la boîte à outils intellectuelle nécessaire pour analyser une entreprise au-delà des apparences."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "price-to-fcf",
    term: "P/FCF",
    category: "Valorisation",
    definition: "Cours de l\'action divisé par le FCF par action. Comme le PER, mais utilise le vrai cash au lieu du bénéfice comptable.",
    simplyPut: "Capitalisation boursière divisée par le Free Cash Flow. Multiple de valorisation basé sur le cash réel.",
    subtitle: "Cours / Free Cash Flow",
    formula: "Capitalisation boursière / Free Cash Flow",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Capitalisation boursière divisée par le Free Cash Flow. Multiple de valorisation basé sur le cash réel. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "cfo-to-net-income",
    term: "CFO / R\u00e9sultat Net",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Flux de trésorerie opérationnel divisé par le résultat net. Au-dessus de 1,0 signifie que les bénéfices sont adossés à du cash réel. Le détecteur de mensonges de la qualité des résultats.",
    simplyPut: "Ratio du cash-flow opérationnel sur résultat net. Mesure la qualité des bénéfices.",
    subtitle: "CFO / Résultat net",
    formula: "Flux de trésorerie opérationnel / Résultat net",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Ratio du cash-flow opérationnel sur résultat net. Mesure la qualité des bénéfices. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "reinvestment-rate",
    term: "Taux de r\u00e9investissement",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Part du flux de trésorerie opérationnel réinvestie en Capex et fonds de roulement. Montre combien de cash l\'entreprise doit réinjecter pour se maintenir.",
    simplyPut: "Taux auquel une entreprise réinvestit ses bénéfices dans l'activité plutôt que de les distribuer.",
    subtitle: "Taux de réinvestissement",
    formula: "Dividendes non versés / Résultat net",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Taux auquel une entreprise réinvestit ses bénéfices dans l'activité plutôt que de les distribuer. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "capex-to-revenue",
    term: "Capex / CA",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Investissements en pourcentage du CA. Faible signifie un modèle léger en actifs ; élevé signifie de lourds investissements récurrents.",
    simplyPut: "Ratio des dépenses d'investissement sur le chiffre d'affaires. Mesure l'intensité capitalistique.",
    subtitle: "CapEx / Chiffre d'affaires",
    formula: "Dépenses d'investissement / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Ratio des dépenses d'investissement sur le chiffre d'affaires. Mesure l'intensité capitalistique. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "capex-to-depreciation",
    term: "Capex / D&A",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Capex divisé par les amortissements. En dessous de 1,0, l\'entreprise investit moins que l\'usure de ses actifs — signe de sous-investissement.",
    simplyPut: "Ratio des investissements sur les dotations aux amortissements. Indique si l'entreprise maintient ou développe son outil productif.",
    subtitle: "CapEx / Amortissements",
    formula: "Dépenses d'investissement / Dotations aux amortissements",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Ratio des investissements sur les dotations aux amortissements. Indique si l'entreprise maintient ou développe son outil productif. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "ebitda-margin",
    term: "Marge d'EBITDA",
    category: "Rentabilité",
    definition: "EBITDA divisé par le CA. Montre la rentabilité opérationnelle avant amortissements, intérêts et impôts.",
    simplyPut: "EBITDA divisé par le chiffre d'affaires. Mesure de la rentabilité opérationnelle avant amortissements.",
    subtitle: "Marge d'EBITDA",
    formula: "EBITDA / Chiffre d'affaires",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "EBITDA divisé par le chiffre d'affaires. Mesure de la rentabilité opérationnelle avant amortissements. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "dividend-coverage",
    term: "Couverture du dividende",
    category: "Dividendes",
    definition: "FCF divisé par le total des dividendes versés. Indique si l\'entreprise génère assez de cash réel pour financer son dividende.",
    simplyPut: "BPA divisé par le DPA. Capacité à maintenir le dividende.",
    subtitle: "Couverture du dividende",
    formula: "FCF / Total des dividendes versés",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "BPA divisé par le DPA. Capacité à maintenir le dividende. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value apprécient les dividendes car ils représentent un retour tangible sur l'investissement. Une entreprise qui verse des dividendes réguliers fait preuve de discipline financière."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["dividend-yield", "payout-ratio", "dps", "share-count-cagr"],
    group: "financial"
  },
  {
    slug: "dupont-analysis",
    term: "Analyse DuPont",
    category: "Rentabilité",
    definition: "Décompose le ROE en trois parties : marge nette, rotation des actifs et levier financier. Révèle la vraie source de la rentabilité des fonds propres.",
    simplyPut: "L'analyse DuPont décompose le ROE en trois parties pour révéler ce qui le motive réellement : la marge, la rotation des actifs et le levier financier.",
    subtitle: "Analyse DuPont",
    formula: "Marge nette × Rotation des actifs × Levier financier",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Décomposition du ROE en trois composantes : marge nette, rotation des actifs et levier financier. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      },
      {
            id: "ce-qu-en-disent-les-grands",
            title: "Ce qu'en disent les grands",
            content: "Warren Buffett considère que la qualité d'une entreprise se mesure par sa capacité à générer des rendements élevés sur le capital investi. Benjamin Graham insistait sur l'importance de la marge de sécurité. Peter Lynch recherchait des entreprises simples avec des avantages concurrentiels durables."
      }

    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "revenue-per-share",
    term: "CA/Action",
    category: "Valorisation",
    definition: "CA total divisé par le nombre d\'actions en circulation. Suit la performance du chiffre d\'affaires par action.",
    simplyPut: "Chiffre d'affaires par action. Mesure de la productivité par action.",
    subtitle: "Chiffre d'affaires par action",
    formula: "Chiffre d'affaires / Nombre d'actions",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Chiffre d'affaires par action. Mesure de la productivité par action. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "fcf-per-share",
    term: "FCF/Action",
    category: "Flux de Tr\u00e9sorerie",
    definition: "FCF divisé par le nombre d\'actions. Le cash par action réellement généré — plus difficile à manipuler que le BPA.",
    simplyPut: "Free Cash Flow par action. Trésorerie disponible par action.",
    subtitle: "Free Cash Flow par action",
    formula: "Free Cash Flow / Nombre d'actions",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Free Cash Flow par action. Trésorerie disponible par action. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value portent une attention particulière à cet indicateur car il révèle la santé fondamentale d'une entreprise. Une analyse rigoureuse permet d'éviter les pièges et d'identifier les véritables opportunités."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "share-count-cagr",
    term: "TCAC du nombre d'actions",
    category: "Dividendes",
    definition: "Taux de croissance annuel du nombre d\'actions sur 5 ou 10 ans. Positif signifie dilution, négatif signifie rachats.",
    simplyPut: "Taux de croissance annualisé du nombre d'actions. Mesure la dilution ou la réduction du capital.",
    subtitle: "Taux de Croissance Annuel Composé du Nombre d&#x27;Actions",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Taux de croissance annualisé du nombre d'actions. Mesure la dilution ou la réduction du capital. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value apprécient les dividendes car ils représentent un retour tangible sur l'investissement. Une entreprise qui verse des dividendes réguliers fait preuve de discipline financière."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["dividend-yield", "payout-ratio", "dps", "dividend-coverage"],
    group: "financial"
  },
  {
    slug: "ev-ebit",
    term: "EV/EBIT",
    category: "Valorisation",
    definition: "Valeur d\'entreprise divisée par l\'EBIT. Plus conservateur que l\'EV/EBITDA car il inclut les amortissements.",
    simplyPut: "Valeur d'entreprise divisée par l'EBIT. Multiple de valorisation opérationnelle.",
    subtitle: "Valeur d'entreprise / EBIT",
    formula: "Valeur d'entreprise / EBIT",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Valeur d'entreprise divisée par l'EBIT. Multiple de valorisation opérationnelle. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Les investisseurs value utilisent ce ratio pour déterminer si une action est sous-évaluée. Un niveau trop élevé peut signaler une surévaluation, tandis qu'un niveau trop bas peut révéler une opportunité."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "lynch-categories",
    term: "Cat\u00e9gories de Lynch",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Un cadre tiré de « One Up On Wall Street » pour classer les actions en six types, chacun avec ses propres règles d\'achat et de vente.",
    simplyPut: "En résumé pratique : Un cadre tir\u00e9 de \u00ab One Up On Wall Street \u00bb pour classer les actions en six types, chacun avec ses propres r\u00e8gles d'achat et de vente.",
    subtitle: "Les six catégories d&#x27;actions de Peter Lynch",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Un cadre tir\u00e9 de \u00ab One Up On Wall Street \u00bb pour classer les actions en six types, chacun avec ses propres r\u00e8gles d'achat et de vente."
      }
    ],
    relatedSlugs: ["slow-grower", "stalwart", "fast-grower", "cyclical", "turnaround", "asset-play"],
    group: "financial"
  },
  {
    slug: "slow-grower",
    term: "Slow Grower",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Entreprise mature croissant au rythme du PIB. Détenue pour les dividendes, pas pour les plus-values.",
    simplyPut: "Concrètement, Entreprise mature croissant au rythme du PIB. D\u00e9tenue pour les dividendes, pas pour les plus-values.",
    subtitle: "Slow Grower (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Entreprise mature croissant au rythme du PIB. D\u00e9tenue pour les dividendes, pas pour les plus-values."
      }
    ],
    relatedSlugs: ["lynch-categories", "stalwart", "fast-grower", "cyclical", "turnaround", "asset-play"],
    group: "financial"
  },
  {
    slug: "stalwart",
    term: "Stalwart",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Grande entreprise croissant encore de 5 à 12 % par an. Acheter dans les creux, vendre après un gain de 30 à 50 %. Bonne protection en récession.",
    simplyPut: "Des g\u00e9ants \u00e9tablis, stables et rassurants qui consolident un portefeuille \u00e0 long terme.",
    subtitle: "Stalwart (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, des g\u00e9ants \u00e9tablis, stables et rassurants qui consolident un portefeuille \u00e0 long terme."
      }
    ],
    relatedSlugs: ["lynch-categories", "slow-grower", "fast-grower", "cyclical", "turnaround", "asset-play"],
    group: "financial"
  },
  {
    slug: "fast-grower",
    term: "Fast Grower",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Petite entreprise agressive en croissance de 15 à 25 %+ par an. Le terrain des multibaggers, mais risque élevé si la croissance cale.",
    simplyPut: "Des entreprises agiles en forte conqu\u00eate commerciale qui multiplient leurs profits d'ann\u00e9e en ann\u00e9e.",
    subtitle: "Fast Grower (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, des entreprises agiles en forte conqu\u00eate commerciale qui multiplient leurs profits d'ann\u00e9e en ann\u00e9e."
      }
    ],
    relatedSlugs: ["lynch-categories", "slow-grower", "stalwart", "cyclical", "turnaround", "asset-play"],
    group: "financial"
  },
  {
    slug: "cyclical",
    term: "Cyclical",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Entreprise dont les bénéfices fluctuent avec le cycle économique. Le timing est primordial -- acheter dans le creux, vendre au pic des bénéfices.",
    simplyPut: "Dit autrement, Entreprise dont les b\u00e9n\u00e9fices fluctuent avec le cycle \u00e9conomique. Le timing est primordial -- acheter dans le creux, vendre au pic des b\u00e9n\u00e9fices.",
    subtitle: "Cyclical (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, Entreprise dont les b\u00e9n\u00e9fices fluctuent avec le cycle \u00e9conomique. Le timing est primordial -- acheter dans le creux, vendre au pic des b\u00e9n\u00e9fices."
      }
    ],
    relatedSlugs: ["lynch-categories", "slow-grower", "stalwart", "fast-grower", "turnaround", "asset-play"],
    group: "financial"
  },
  {
    slug: "turnaround",
    term: "Turnaround",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Entreprise proche du désastre qui pourrait se redresser spectaculairement -- ou faire faillite. Gain élevé si le marché surestime la crise.",
    simplyPut: "En clair, Entreprise proche du d\u00e9sastre qui pourrait se redresser spectaculairement -- ou faire faillite. Gain \u00e9lev\u00e9 si le march\u00e9 surestime la crise.",
    subtitle: "Turnaround (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Entreprise proche du d\u00e9sastre qui pourrait se redresser spectaculairement -- ou faire faillite. Gain \u00e9lev\u00e9 si le march\u00e9 surestime la crise."
      }
    ],
    relatedSlugs: ["lynch-categories", "slow-grower", "stalwart", "fast-grower", "cyclical", "asset-play"],
    group: "financial"
  },
  {
    slug: "asset-play",
    term: "Asset Play",
    category: "Cat\u00e9gories de Peter Lynch",
    definition: "Entreprise assise sur des actifs de valeur que le marché néglige. Nécessite de la patience jusqu\'à ce que la valeur se révèle.",
    simplyPut: "Pour faire simple, Entreprise assise sur des actifs de valeur que le march\u00e9 n\u00e9glige. N\u00e9cessite de la patience jusqu'\u00e0 ce que la valeur se r\u00e9v\u00e8le.",
    subtitle: "Asset Play (catégorie Peter Lynch)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, Entreprise assise sur des actifs de valeur que le march\u00e9 n\u00e9glige. N\u00e9cessite de la patience jusqu'\u00e0 ce que la valeur se r\u00e9v\u00e8le."
      }
    ],
    relatedSlugs: ["lynch-categories", "slow-grower", "stalwart", "fast-grower", "cyclical", "turnaround"],
    group: "financial"
  },
  {
    slug: "ccc",
    term: "CCC",
    category: "Besoin en Fonds de Roulement",
    definition: "DSO + DIO − DPO. Nombre de jours entre le paiement des fournisseurs et l\'encaissement des clients.",
    simplyPut: "En termes simples, DSO + DIO \u2212 DPO. Nombre de jours entre le paiement des fournisseurs et l'encaissement des clients.",
    formula: "DSO + DIO - DPO",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, DSO + DIO \u2212 DPO. Nombre de jours entre le paiement des fournisseurs et l'encaissement des clients."
      }
    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "asset-turnover", "dpo", "dio"],
    group: "financial"
  },
  {
    slug: "dpo",
    term: "DPO",
    category: "Besoin en Fonds de Roulement",
    definition: "Nombre moyen de jours qu\'une entreprise met pour payer ses fournisseurs. Un DPO élevé = plus de fonds de roulement financé par les fournisseurs.",
    simplyPut: "Concrètement, Nombre moyen de jours qu'une entreprise met pour payer ses fournisseurs. Un DPO \u00e9lev\u00e9 = plus de fonds de roulement financ\u00e9 par les fournisseurs.",
    formula: "(Dettes fournisseurs / Achats) × 365",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Nombre moyen de jours qu'une entreprise met pour payer ses fournisseurs. Un DPO \u00e9lev\u00e9 = plus de fonds de roulement financ\u00e9 par les fournisseurs."
      }
    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "asset-turnover", "ccc", "dio"],
    group: "financial"
  },
  {
    slug: "dio",
    term: "DIO",
    category: "Besoin en Fonds de Roulement",
    definition: "Nombre moyen de jours avant la vente des stocks. Plus c\'est bas, mieux c\'est pour la plupart des activités.",
    simplyPut: "En termes simples, Nombre moyen de jours avant la vente des stocks. Plus c'est bas, mieux c'est pour la plupart des activit\u00e9s.",
    formula: "(Stocks / Coût des ventes) × 365",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, Nombre moyen de jours avant la vente des stocks. Plus c'est bas, mieux c'est pour la plupart des activit\u00e9s."
      }
    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "asset-turnover", "ccc", "dpo"],
    group: "financial"
  },
  {
    slug: "bfr",
    term: "BFR",
    category: "Besoin en Fonds de Roulement",
    definition: "Trésorerie immobilisée dans le cycle d\'exploitation : créances + stocks − dettes fournisseurs. Un BFR négatif signifie que l\'activité génère de la trésorerie par son fonctionnement même.",
    simplyPut: "Concrètement, Tr\u00e9sorerie immobilis\u00e9e dans le cycle d'exploitation : cr\u00e9ances + stocks \u2212 dettes fournisseurs. Un BFR n\u00e9gatif signifie que l'activit\u00e9 g\u00e9n\u00e8re de la tr\u00e9sorerie par son fonctionnement m\u00eame.",
    formula: "Stocks + Créances clients - Dettes fournisseurs",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Tr\u00e9sorerie immobilis\u00e9e dans le cycle d'exploitation : cr\u00e9ances + stocks \u2212 dettes fournisseurs. Un BFR n\u00e9gatif signifie que l'activit\u00e9 g\u00e9n\u00e8re de la tr\u00e9sorerie par son fonctionnement m\u00eame."
      }
    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "asset-turnover", "ccc", "dpo"],
    group: "financial"
  },
  {
    slug: "cogs",
    term: "COGS",
    category: "Rentabilité",
    definition: "Coûts directs de production de ce que l\'entreprise vend. CA moins COGS égale la marge brute.",
    simplyPut: "Pour les non-initiés, Co\u00fbts directs de production de ce que l'entreprise vend. CA moins COGS \u00e9gale la marge brute.",
    formula: "Stocks initiaux + Achats - Stocks finaux",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Co\u00fbts directs de production de ce que l'entreprise vend. CA moins COGS \u00e9gale la marge brute."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "sga",
    term: "SG&A",
    category: "Rentabilité",
    definition: "Charges d\'exploitation non directement liées à la production -- salaires, loyers, marketing, back-office. Les frais généraux entre la marge brute et le résultat d\'exploitation.",
    simplyPut: "En pratique, Charges d'exploitation non directement li\u00e9es \u00e0 la production -- salaires, loyers, marketing, back-office. Les frais g\u00e9n\u00e9raux entre la marge brute et le r\u00e9sultat d'exploitation.",
    formula: "Frais commerciaux + Frais généraux + Frais administratifs",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Charges d'exploitation non directement li\u00e9es \u00e0 la production -- salaires, loyers, marketing, back-office. Les frais g\u00e9n\u00e9raux entre la marge brute et le r\u00e9sultat d'exploitation."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "d-and-a",
    term: "D&A",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Charges non décaissées répartissant le coût des actifs corporels (amortissement) et incorporels (amortissement des immos incorporelles) sur leur durée de vie utile.",
    simplyPut: "Traduit simplement : Charges non d\u00e9caiss\u00e9es r\u00e9partissant le co\u00fbt des actifs corporels (amortissement) et incorporels (amortissement des immos incorporelles) sur leur dur\u00e9e de vie utile.",
    subtitle: "Dotations aux Amortissements et Provisions",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Charges non d\u00e9caiss\u00e9es r\u00e9partissant le co\u00fbt des actifs corporels (amortissement) et incorporels (amortissement des immos incorporelles) sur leur dur\u00e9e de vie utile."
      }
    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "nopat",
    term: "NOPAT",
    category: "Rentabilité",
    definition: "EBIT × (1 − taux d\'imposition). Résultat d\'exploitation ajusté de l\'impôt, utilisé comme numérateur du ROIC.",
    simplyPut: "Concrètement, EBIT \u00d7 (1 \u2212 taux d'imposition). R\u00e9sultat d'exploitation ajust\u00e9 de l'imp\u00f4t, utilis\u00e9 comme num\u00e9rateur du ROIC.",
    formula: "Résultat d'exploitation × (1 - Taux d'imposition effectif)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, EBIT \u00d7 (1 \u2212 taux d'imposition). R\u00e9sultat d'exploitation ajust\u00e9 de l'imp\u00f4t, utilis\u00e9 comme num\u00e9rateur du ROIC."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "etr",
    term: "TIE",
    category: "Rentabilité",
    definition: "Impôt réellement payé divisé par le résultat avant impôt. Peut diverger fortement du taux légal en raison d\'incitations, de reports ou d\'ajustements antérieurs.",
    simplyPut: "En termes simples, Imp\u00f4t r\u00e9ellement pay\u00e9 divis\u00e9 par le r\u00e9sultat avant imp\u00f4t. Peut diverger fortement du taux l\u00e9gal en raison d'incitations, de reports ou d'ajustements ant\u00e9rieurs.",
    formula: "Charge d'impôt / Résultat avant impôt",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, Imp\u00f4t r\u00e9ellement pay\u00e9 divis\u00e9 par le r\u00e9sultat avant imp\u00f4t. Peut diverger fortement du taux l\u00e9gal en raison d'incitations, de reports ou d'ajustements ant\u00e9rieurs."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "yoy",
    term: "YoY",
    category: "Croissance",
    definition: "Comparaison d\'un indicateur à la même période un an plus tôt. La méthode standard pour mesurer la croissance ou le déclin.",
    simplyPut: "En termes simples, Comparaison d'un indicateur \u00e0 la m\u00eame p\u00e9riode un an plus t\u00f4t. La m\u00e9thode standard pour mesurer la croissance ou le d\u00e9clin.",
    formula: "Valeur actuelle / Valeur période précédente - 1",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, Comparaison d'un indicateur \u00e0 la m\u00eame p\u00e9riode un an plus t\u00f4t. La m\u00e9thode standard pour mesurer la croissance ou le d\u00e9clin."
      }
    ],
    relatedSlugs: ["cagr", "organic-growth", "operating-leverage", "backlog", "secular-growth"],
    group: "financial"
  },
  {
    slug: "ltm",
    term: "LTM",
    category: "Valorisation",
    definition: "Données financières des 12 mois les plus récents. Utilisées pour des ratios de valorisation à jour quand le dernier exercice complet est obsolète.",
    simplyPut: "Autrement dit, Donn\u00e9es financi\u00e8res des 12 mois les plus r\u00e9cents. Utilis\u00e9es pour des ratios de valorisation \u00e0 jour quand le dernier exercice complet est obsol\u00e8te.",
    subtitle: "Douze Derniers Mois (Trailing Twelve Months)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Donn\u00e9es financi\u00e8res des 12 mois les plus r\u00e9cents. Utilis\u00e9es pour des ratios de valorisation \u00e0 jour quand le dernier exercice complet est obsol\u00e8te."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "fy",
    term: "FY",
    category: "Concepts d'Investissement",
    definition: "Période comptable de 12 mois d\'une entreprise. La plupart des entreprises marocaines utilisent l\'année civile (jan.–déc.).",
    simplyPut: "En langage courant, P\u00e9riode comptable de 12 mois d'une entreprise. La plupart des entreprises marocaines utilisent l'ann\u00e9e civile (jan.\u2013d\u00e9c.).",
    subtitle: "Exercice Fiscal",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, P\u00e9riode comptable de 12 mois d'une entreprise. La plupart des entreprises marocaines utilisent l'ann\u00e9e civile (jan.\u2013d\u00e9c.)."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "s1-semestre",
    term: "S1 / S2",
    category: "Concepts d'Investissement",
    definition: "Périodes de reporting semestrielles. S1 = jan.–juin, S2 = juil.–déc. pour la plupart des entreprises marocaines. Aussi appelées H1/H2.",
    simplyPut: "En langage courant, P\u00e9riodes de reporting semestrielles. S1 = jan.\u2013juin, S2 = juil.\u2013d\u00e9c. pour la plupart des entreprises marocaines. Aussi appel\u00e9es H1/H2.",
    subtitle: "Semestre 1 &amp; 2 (Premier et Second Semestre)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, P\u00e9riodes de reporting semestrielles. S1 = jan.\u2013juin, S2 = juil.\u2013d\u00e9c. pour la plupart des entreprises marocaines. Aussi appel\u00e9es H1/H2."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "ifrs",
    term: "IFRS",
    category: "Concepts d'Investissement",
    definition: "Référentiel comptable international. De nombreux groupes marocains utilisent les IFRS pour les comptes consolidés en parallèle du PCG/CGNC local pour les comptes sociaux.",
    simplyPut: "Dit autrement, R\u00e9f\u00e9rentiel comptable international. De nombreux groupes marocains utilisent les IFRS pour les comptes consolid\u00e9s en parall\u00e8le du PCG/CGNC local pour les comptes sociaux.",
    subtitle: "Normes Internationales d&#x27;Information Financière",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, R\u00e9f\u00e9rentiel comptable international. De nombreux groupes marocains utilisent les IFRS pour les comptes consolid\u00e9s en parall\u00e8le du PCG/CGNC local pour les comptes sociaux."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "bvps",
    term: "BVPS",
    category: "Valorisation",
    definition: "Capitaux propres totaux divisés par le nombre d\'actions. La valeur nette comptable par action.",
    simplyPut: "Traduit simplement : Capitaux propres totaux divis\u00e9s par le nombre d'actions. La valeur nette comptable par action.",
    formula: "Capitaux propres / Nombre d'actions",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Capitaux propres totaux divis\u00e9s par le nombre d'actions. La valeur nette comptable par action."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "tailwind",
    term: "Vent Favorable",
    category: "Concepts d'Investissement",
    definition: "Un facteur externe qui stimule la croissance ou les marges d\'une entreprise -- le vent dans le dos.",
    simplyPut: "En termes simples, Un facteur externe qui stimule la croissance ou les marges d'une entreprise -- le vent dans le dos.",
    subtitle: "Vent Favorable (Facteur Externe Positif)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, Un facteur externe qui stimule la croissance ou les marges d'une entreprise -- le vent dans le dos."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "headwind",
    term: "Vent Contraire",
    category: "Concepts d'Investissement",
    definition: "Un facteur externe qui freine la croissance ou comprime les marges d\'une entreprise -- le vent de face.",
    simplyPut: "Autrement dit, Un facteur externe qui freine la croissance ou comprime les marges d'une entreprise -- le vent de face.",
    subtitle: "Vent Contraire (Facteur Externe Défavorable)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Un facteur externe qui freine la croissance ou comprime les marges d'une entreprise -- le vent de face."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "oligopoly",
    term: "Oligopole",
    category: "Concepts d'Investissement",
    definition: "Un marché dominé par un petit nombre de grands acteurs, limitant la concurrence et permettant souvent une discipline tarifaire.",
    simplyPut: "Pour faire simple, Un march\u00e9 domin\u00e9 par un petit nombre de grands acteurs, limitant la concurrence et permettant souvent une discipline tarifaire.",
    subtitle: "Oligopole (Marché Dominé par Quelques Acteurs)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, Un march\u00e9 domin\u00e9 par un petit nombre de grands acteurs, limitant la concurrence et permettant souvent une discipline tarifaire."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "pass-through-pricing",
    term: "R\u00e9percussion des Co\u00fbts",
    category: "Concepts d'Investissement",
    definition: "Capacité à répercuter les hausses de coûts des intrants directement sur les clients via des augmentations de prix, protégeant ainsi les marges.",
    simplyPut: "En résumé pratique : Capacit\u00e9 \u00e0 r\u00e9percuter les hausses de co\u00fbts des intrants directement sur les clients via des augmentations de prix, prot\u00e9geant ainsi les marges.",
    subtitle: "Répercussion des Coûts (Pass-Through Pricing)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Capacit\u00e9 \u00e0 r\u00e9percuter les hausses de co\u00fbts des intrants directement sur les clients via des augmentations de prix, prot\u00e9geant ainsi les marges."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "vertical-integration",
    term: "Int\u00e9gration Verticale",
    category: "Concepts d'Investissement",
    definition: "Contrôle de plusieurs étapes de la chaîne de valeur, des matières premières à la livraison finale, pour capturer plus de marge et réduire la dépendance.",
    simplyPut: "En langage courant, Contr\u00f4le de plusieurs \u00e9tapes de la cha\u00eene de valeur, des mati\u00e8res premi\u00e8res \u00e0 la livraison finale, pour capturer plus de marge et r\u00e9duire la d\u00e9pendance.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Contr\u00f4le de plusieurs \u00e9tapes de la cha\u00eene de valeur, des mati\u00e8res premi\u00e8res \u00e0 la livraison finale, pour capturer plus de marge et r\u00e9duire la d\u00e9pendance."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "deleveraging",
    term: "D\u00e9sendettement",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Réduction de l\'endettement d\'une entreprise par rapport aux fonds propres ou aux bénéfices, renforçant le bilan et réduisant le risque financier.",
    simplyPut: "En pratique, R\u00e9duction de l'endettement d'une entreprise par rapport aux fonds propres ou aux b\u00e9n\u00e9fices, renfor\u00e7ant le bilan et r\u00e9duisant le risque financier.",
    subtitle: "Désendettement (Réduction de la Dette)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, R\u00e9duction de l'endettement d'une entreprise par rapport aux fonds propres ou aux b\u00e9n\u00e9fices, renfor\u00e7ant le bilan et r\u00e9duisant le risque financier."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "gearing"],
    group: "financial"
  },
  {
    slug: "gearing",
    term: "Gearing",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Dette par rapport aux fonds propres -- mesure la part du financement provenant de l\'emprunt versus des capitaux des actionnaires.",
    simplyPut: "Concrètement, Dette par rapport aux fonds propres -- mesure la part du financement provenant de l'emprunt versus des capitaux des actionnaires.",
    subtitle: "Gearing (Ratio de Levier Financier)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Dette par rapport aux fonds propres -- mesure la part du financement provenant de l'emprunt versus des capitaux des actionnaires."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging"],
    group: "financial"
  },
  {
    slug: "quick-ratio",
    term: "Quick Ratio",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Trésorerie + créances divisés par les passifs courants. Un test de liquidité plus strict que le ratio de liquidité générale car il exclut les stocks.",
    simplyPut: "En résumé pratique : Tr\u00e9sorerie + cr\u00e9ances divis\u00e9s par les passifs courants. Un test de liquidit\u00e9 plus strict que le ratio de liquidit\u00e9 g\u00e9n\u00e9rale car il exclut les stocks.",
    subtitle: "Quick Ratio (Ratio de Liquidité Immédiate)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Tr\u00e9sorerie + cr\u00e9ances divis\u00e9s par les passifs courants. Un test de liquidit\u00e9 plus strict que le ratio de liquidit\u00e9 g\u00e9n\u00e9rale car il exclut les stocks."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging"],
    group: "financial"
  },
  {
    slug: "net-cash-position",
    term: "Tr\u00e9sorerie Nette Positive",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Quand la trésorerie dépasse la dette totale -- l\'inverse de la dette nette. Signe d\'un bilan forteresse.",
    simplyPut: "Dit autrement, Quand la tr\u00e9sorerie d\u00e9passe la dette totale -- l'inverse de la dette nette. Signe d'un bilan forteresse.",
    subtitle: "Position de Trésorerie Nette Positive",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, Quand la tr\u00e9sorerie d\u00e9passe la dette totale -- l'inverse de la dette nette. Signe d'un bilan forteresse."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging"],
    group: "financial"
  },
  {
    slug: "multiple-expansion",
    term: "Expansion des Multiples",
    category: "Valorisation",
    definition: "Quand le multiple de valorisation d\'un titre (PER, VE/EBITDA) monte ou baisse, faisant varier le cours au-delà de ce que les bénéfices seuls justifieraient.",
    simplyPut: "Pour les non-initiés, Quand le multiple de valorisation d'un titre (PER, VE/EBITDA) monte ou baisse, faisant varier le cours au-del\u00e0 de ce que les b\u00e9n\u00e9fices seuls justifieraient.",
    subtitle: "Expansion / Compression des Multiples",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Quand le multiple de valorisation d'un titre (PER, VE/EBITDA) monte ou baisse, faisant varier le cours au-del\u00e0 de ce que les b\u00e9n\u00e9fices seuls justifieraient."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "impairment",
    term: "D\u00e9pr\u00e9ciation",
    category: "Concepts d'Investissement",
    definition: "Réduction permanente de la valeur comptable d\'un actif quand sa valeur recouvrable tombe sous sa valeur au bilan. Charge non décaissée qui réduit les fonds propres.",
    simplyPut: "Ce que cela signifie : R\u00e9duction permanente de la valeur comptable d'un actif quand sa valeur recouvrable tombe sous sa valeur au bilan. Charge non d\u00e9caiss\u00e9e qui r\u00e9duit les fonds propres.",
    subtitle: "Dépréciation d&#x27;Actifs (Impairment)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : R\u00e9duction permanente de la valeur comptable d'un actif quand sa valeur recouvrable tombe sous sa valeur au bilan. Charge non d\u00e9caiss\u00e9e qui r\u00e9duit les fonds propres."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "non-recurring-items",
    term: "\u00c9l\u00e9ments Non R\u00e9currents",
    category: "Rentabilité",
    definition: "Gains ou pertes qu\'on ne s\'attend pas à voir se répéter -- cessions d\'actifs, charges de restructuration, régularisations fiscales. À éliminer pour obtenir le bénéfice normalisé.",
    simplyPut: "L'idée essentielle : Gains ou pertes qu'on ne s'attend pas \u00e0 voir se r\u00e9p\u00e9ter -- cessions d'actifs, charges de restructuration, r\u00e9gularisations fiscales. \u00c0 \u00e9liminer pour obtenir le b\u00e9n\u00e9fice normalis\u00e9.",
    subtitle: "Éléments Non Récurrents / Exceptionnels",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : Gains ou pertes qu'on ne s'attend pas \u00e0 voir se r\u00e9p\u00e9ter -- cessions d'actifs, charges de restructuration, r\u00e9gularisations fiscales. \u00c0 \u00e9liminer pour obtenir le b\u00e9n\u00e9fice normalis\u00e9."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "financial"
  },
  {
    slug: "provision-accounting",
    term: "Provision",
    category: "Concepts d'Investissement",
    definition: "Montant mis de côté au bilan pour des coûts futurs probables -- litiges, contentieux fiscaux, créances douteuses. Réduit le résultat courant par précaution.",
    simplyPut: "Pour faire simple, Montant mis de c\u00f4t\u00e9 au bilan pour des co\u00fbts futurs probables -- litiges, contentieux fiscaux, cr\u00e9ances douteuses. R\u00e9duit le r\u00e9sultat courant par pr\u00e9caution.",
    subtitle: "Provision (Réserve Comptable pour Pertes Futures)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, Montant mis de c\u00f4t\u00e9 au bilan pour des co\u00fbts futurs probables -- litiges, contentieux fiscaux, cr\u00e9ances douteuses. R\u00e9duit le r\u00e9sultat courant par pr\u00e9caution."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "related-party-transactions",
    term: "Conventions R\u00e9glement\u00e9es",
    category: "Concepts d'Investissement",
    definition: "Transactions entre une entreprise et ses initiés, sa maison mère ou ses sociétés affiliées. Nécessitent un examen attentif pour garantir l\'équité envers les actionnaires minoritaires.",
    simplyPut: "Pour les non-initiés, Transactions entre une entreprise et ses initi\u00e9s, sa maison m\u00e8re ou ses soci\u00e9t\u00e9s affili\u00e9es. N\u00e9cessitent un examen attentif pour garantir l'\u00e9quit\u00e9 envers les actionnaires minoritaires.",
    subtitle: "Conventions Réglementées (Transactions avec des Parties Liées)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Transactions entre une entreprise et ses initi\u00e9s, sa maison m\u00e8re ou ses soci\u00e9t\u00e9s affili\u00e9es. N\u00e9cessitent un examen attentif pour garantir l'\u00e9quit\u00e9 envers les actionnaires minoritaires."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "value-trap",
    term: "Pi\u00e8ge \u00e0 Valeur",
    category: "Concepts d'Investissement",
    definition: "Un titre qui semble bon marché sur les indicateurs traditionnels mais reste bon marché ou se déprécie davantage parce que les fondamentaux se détériorent.",
    simplyPut: "En langage courant, Un titre qui semble bon march\u00e9 sur les indicateurs traditionnels mais reste bon march\u00e9 ou se d\u00e9pr\u00e9cie davantage parce que les fondamentaux se d\u00e9t\u00e9riorent.",
    subtitle: "Piège à Valeur (Value Trap)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Un titre qui semble bon march\u00e9 sur les indicateurs traditionnels mais reste bon march\u00e9 ou se d\u00e9pr\u00e9cie davantage parce que les fondamentaux se d\u00e9t\u00e9riorent."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "mid-cycle-earnings",
    term: "B\u00e9n\u00e9fice de Milieu de Cycle",
    category: "Valorisation",
    definition: "Bénéfice moyen sur un cycle économique complet. Utilisé pour valoriser les entreprises cycliques au lieu de bénéfices de pic ou de creux trompeurs.",
    simplyPut: "Traduit simplement : B\u00e9n\u00e9fice moyen sur un cycle \u00e9conomique complet. Utilis\u00e9 pour valoriser les entreprises cycliques au lieu de b\u00e9n\u00e9fices de pic ou de creux trompeurs.",
    subtitle: "Bénéfice de Milieu de Cycle / Bénéfice Normalisé",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : B\u00e9n\u00e9fice moyen sur un cycle \u00e9conomique complet. Utilis\u00e9 pour valoriser les entreprises cycliques au lieu de b\u00e9n\u00e9fices de pic ou de creux trompeurs."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "going-concern",
    term: "Continuit\u00e9 d'Exploitation",
    category: "Concepts d'Investissement",
    definition: "L\'hypothèse qu\'une entreprise continuera son activité. Un doute sur la continuité d\'exploitation émis par l\'auditeur est un avertissement sérieux de survie.",
    simplyPut: "L'idée essentielle : L'hypoth\u00e8se qu'une entreprise continuera son activit\u00e9. Un doute sur la continuit\u00e9 d'exploitation \u00e9mis par l'auditeur est un avertissement s\u00e9rieux de survie.",
    subtitle: "Continuité d&#x27;Exploitation (Going Concern)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : L'hypoth\u00e8se qu'une entreprise continuera son activit\u00e9. Un doute sur la continuit\u00e9 d'exploitation \u00e9mis par l'auditeur est un avertissement s\u00e9rieux de survie."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "switching-costs",
    term: "Co\u00fbts de Substitution",
    category: "Concepts d'Investissement",
    definition: "Le coût (financier, opérationnel, en temps) que supporte un client pour changer de fournisseur. Des coûts de substitution élevés créent un avantage concurrentiel durable.",
    simplyPut: "Ce qu'il faut retenir : Le co\u00fbt (financier, op\u00e9rationnel, en temps) que supporte un client pour changer de fournisseur. Des co\u00fbts de substitution \u00e9lev\u00e9s cr\u00e9ent un avantage concurrentiel durable.",
    subtitle: "Coûts de Substitution (Switching Costs)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Le co\u00fbt (financier, op\u00e9rationnel, en temps) que supporte un client pour changer de fournisseur. Des co\u00fbts de substitution \u00e9lev\u00e9s cr\u00e9ent un avantage concurrentiel durable."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "commoditization",
    term: "Banalisation",
    category: "Concepts d'Investissement",
    definition: "Quand les produits deviennent interchangeables entre fournisseurs, érodant le pricing power et comprimant les marges au strict minimum.",
    simplyPut: "Autrement dit, Quand les produits deviennent interchangeables entre fournisseurs, \u00e9rodant le pricing power et comprimant les marges au strict minimum.",
    subtitle: "Banalisation (Commoditization / Perte de Différenciation)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Quand les produits deviennent interchangeables entre fournisseurs, \u00e9rodant le pricing power et comprimant les marges au strict minimum."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "backlog",
    term: "Carnet de Commandes",
    category: "Croissance",
    definition: "Valeur totale des contrats signés mais non encore livrés. L\'indicateur avancé clé du CA futur pour les entreprises travaillant par projets.",
    simplyPut: "Concrètement, Valeur totale des contrats sign\u00e9s mais non encore livr\u00e9s. L'indicateur avanc\u00e9 cl\u00e9 du CA futur pour les entreprises travaillant par projets.",
    subtitle: "Carnet de Commandes (Backlog / Order Book)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Valeur totale des contrats sign\u00e9s mais non encore livr\u00e9s. L'indicateur avanc\u00e9 cl\u00e9 du CA futur pour les entreprises travaillant par projets."
      }
    ],
    relatedSlugs: ["cagr", "organic-growth", "operating-leverage", "yoy", "secular-growth"],
    group: "financial"
  },
  {
    slug: "secular-growth",
    term: "Croissance S\u00e9culaire",
    category: "Croissance",
    definition: "Tendance structurelle de long terme durant des années ou décennies, indépendante des cycles économiques -- démographie, ruptures technologiques ou changements de politique.",
    simplyPut: "En langage courant, Tendance structurelle de long terme durant des ann\u00e9es ou d\u00e9cennies, ind\u00e9pendante des cycles \u00e9conomiques -- d\u00e9mographie, ruptures technologiques ou changements de politique.",
    subtitle: "Tendance de Croissance Séculaire",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Tendance structurelle de long terme durant des ann\u00e9es ou d\u00e9cennies, ind\u00e9pendante des cycles \u00e9conomiques -- d\u00e9mographie, ruptures technologiques ou changements de politique."
      }
    ],
    relatedSlugs: ["cagr", "organic-growth", "operating-leverage", "yoy", "backlog"],
    group: "financial"
  },
  {
    slug: "maintenance-capex",
    term: "Capex de Maintenance",
    category: "Flux de Tr\u00e9sorerie",
    definition: "Investissements pour maintenir l\'exploitation existante (maintenance) versus accroître la capacité (croissance). La distinction détermine le vrai flux de trésorerie disponible.",
    simplyPut: "En pratique, Investissements pour maintenir l'exploitation existante (maintenance) versus accro\u00eetre la capacit\u00e9 (croissance). La distinction d\u00e9termine le vrai flux de tr\u00e9sorerie disponible.",
    subtitle: "Capex de Maintenance vs Capex de Croissance",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Investissements pour maintenir l'exploitation existante (maintenance) versus accro\u00eetre la capacit\u00e9 (croissance). La distinction d\u00e9termine le vrai flux de tr\u00e9sorerie disponible."
      }
    ],
    relatedSlugs: ["free-cash-flow", "fcf-margin", "fcf-conversion", "operating-cash-flow", "capex", "owner-earnings"],
    group: "financial"
  },
  {
    slug: "conglomerate-discount",
    term: "D\u00e9cote de Conglom\u00e9rat",
    category: "Valorisation",
    definition: "Les holdings diversifiés tendent à se négocier sous la somme de leurs parties car les investisseurs préfèrent les entreprises focalisées, en pure-play.",
    simplyPut: "Traduit simplement : Les holdings diversifi\u00e9s tendent \u00e0 se n\u00e9gocier sous la somme de leurs parties car les investisseurs pr\u00e9f\u00e8rent les entreprises focalis\u00e9es, en pure-play.",
    subtitle: "Décote de Conglomérat (Décote de Holding)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Les holdings diversifi\u00e9s tendent \u00e0 se n\u00e9gocier sous la somme de leurs parties car les investisseurs pr\u00e9f\u00e8rent les entreprises focalis\u00e9es, en pure-play."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "negative-working-capital",
    term: "Fonds de Roulement N\u00e9gatif",
    category: "Besoin en Fonds de Roulement",
    definition: "Quand les passifs courants dépassent les actifs courants. Un point fort si l\'entreprise encaisse avant de payer ses fournisseurs -- un flottant qui finance l\'exploitation gratuitement.",
    simplyPut: "Traduit simplement : Quand les passifs courants d\u00e9passent les actifs courants. Un point fort si l'entreprise encaisse avant de payer ses fournisseurs -- un flottant qui finance l'exploitation gratuitement.",
    subtitle: "Fonds de Roulement Négatif (Modèle de Génération de Trésorerie)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Quand les passifs courants d\u00e9passent les actifs courants. Un point fort si l'entreprise encaisse avant de payer ses fournisseurs -- un flottant qui finance l'exploitation gratuitement."
      }
    ],
    relatedSlugs: ["working-capital", "dso", "inventory-turnover", "asset-turnover", "ccc", "dpo"],
    group: "financial"
  },
  {
    slug: "ipo",
    term: "IPO",
    category: "Concepts d'Investissement",
    definition: "Première mise en vente d\'actions au public sur une bourse. Transforme une entreprise privée en société cotée.",
    simplyPut: "En résumé pratique : Premi\u00e8re mise en vente d'actions au public sur une bourse. Transforme une entreprise priv\u00e9e en soci\u00e9t\u00e9 cot\u00e9e.",
    subtitle: "Introduction en Bourse (IPO)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Premi\u00e8re mise en vente d'actions au public sur une bourse. Transforme une entreprise priv\u00e9e en soci\u00e9t\u00e9 cot\u00e9e."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "minority-interest",
    term: "Int\u00e9r\u00eats Minoritaires",
    category: "Concepts d'Investissement",
    definition: "La part des fonds propres et du résultat d\'une filiale revenant aux actionnaires extérieurs, et non à la maison mère.",
    simplyPut: "En langage courant, La part des fonds propres et du r\u00e9sultat d'une filiale revenant aux actionnaires ext\u00e9rieurs, et non \u00e0 la maison m\u00e8re.",
    subtitle: "Intérêts Minoritaires (Participations Ne Donnant Pas le Contrôle)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, La part des fonds propres et du r\u00e9sultat d'une filiale revenant aux actionnaires ext\u00e9rieurs, et non \u00e0 la maison m\u00e8re."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "equity-method",
    term: "Mise en \u00c9quivalence",
    category: "Concepts d'Investissement",
    definition: "Comptabilisation d\'une participation de 20 à 50 % en enregistrant la quote-part du résultat de la société associée, sans consolider l\'intégralité du CA et des charges.",
    simplyPut: "En clair, Comptabilisation d'une participation de 20 \u00e0 50 % en enregistrant la quote-part du r\u00e9sultat de la soci\u00e9t\u00e9 associ\u00e9e, sans consolider l'int\u00e9gralit\u00e9 du CA et des charges.",
    subtitle: "Mise en Équivalence (Equity Method)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Comptabilisation d'une participation de 20 \u00e0 50 % en enregistrant la quote-part du r\u00e9sultat de la soci\u00e9t\u00e9 associ\u00e9e, sans consolider l'int\u00e9gralit\u00e9 du CA et des charges."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "financial"
  },
  {
    slug: "earnings-normalization-bridge",
    term: "Pont de Normalisation des B\u00e9n\u00e9fices",
    category: "Valorisation",
    definition: "Plusieurs scénarios de BPA (publié, corrigé, creux, milieu de cycle, pic) montrant l\'éventail de la vraie capacité bénéficiaire pour la valorisation.",
    simplyPut: "Dit autrement, Plusieurs sc\u00e9narios de BPA (publi\u00e9, corrig\u00e9, creux, milieu de cycle, pic) montrant l'\u00e9ventail de la vraie capacit\u00e9 b\u00e9n\u00e9ficiaire pour la valorisation.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, Plusieurs sc\u00e9narios de BPA (publi\u00e9, corrig\u00e9, creux, milieu de cycle, pic) montrant l'\u00e9ventail de la vraie capacit\u00e9 b\u00e9n\u00e9ficiaire pour la valorisation."
      }
    ],
    relatedSlugs: ["pe-ratio", "price-to-book", "ev-ebitda", "earnings-yield", "peg-ratio", "enterprise-value"],
    group: "financial"
  },
  {
    slug: "arpu",
    term: "ARPU",
    category: "Entreprise et Secteur",
    definition: "Chiffre d\'affaires divisé par le nombre d\'abonnés. Indicateur clé de rentabilité dans les télécoms.",
    simplyPut: "Concrètement, Chiffre d'affaires divis\u00e9 par le nombre d'abonn\u00e9s. Indicateur cl\u00e9 de rentabilit\u00e9 dans les t\u00e9l\u00e9coms.",
    formula: "Chiffre d'affaires / Nombre d'abonnés",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Chiffre d'affaires divis\u00e9 par le nombre d'abonn\u00e9s. Indicateur cl\u00e9 de rentabilit\u00e9 dans les t\u00e9l\u00e9coms."
      }
    ],
    relatedSlugs: ["ftth", "ott", "churn-rate", "termination-rates", "degroupage", "mobile-money"],
    group: "sector"
  },
  {
    slug: "ftth",
    term: "FTTH",
    category: "Entreprise et Secteur",
    definition: "Connexion haut débit par fibre optique livrée directement aux résidences. Infrastructure internet à très haut débit.",
    simplyPut: "Pour faire simple, Connexion haut d\u00e9bit par fibre optique livr\u00e9e directement aux r\u00e9sidences. Infrastructure internet \u00e0 tr\u00e8s haut d\u00e9bit.",
    subtitle: "Fibre optique jusqu&#x27;au domicile",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, Connexion haut d\u00e9bit par fibre optique livr\u00e9e directement aux r\u00e9sidences. Infrastructure internet \u00e0 tr\u00e8s haut d\u00e9bit."
      }
    ],
    relatedSlugs: ["arpu", "ott", "churn-rate", "termination-rates", "degroupage", "mobile-money"],
    group: "sector"
  },
  {
    slug: "ott",
    term: "OTT",
    category: "Entreprise et Secteur",
    definition: "Applications comme WhatsApp/Zoom qui contournent les services télécoms traditionnels. Principal facteur de cannibalisation du CA.",
    simplyPut: "Ce que cela signifie : Applications comme WhatsApp/Zoom qui contournent les services t\u00e9l\u00e9coms traditionnels. Principal facteur de cannibalisation du CA.",
    subtitle: "Services Over-the-Top",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Applications comme WhatsApp/Zoom qui contournent les services t\u00e9l\u00e9coms traditionnels. Principal facteur de cannibalisation du CA."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "churn-rate", "termination-rates", "degroupage", "mobile-money"],
    group: "sector"
  },
  {
    slug: "churn-rate",
    term: "Taux de r\u00e9siliation",
    category: "Entreprise et Secteur",
    definition: "Pourcentage d\'abonnés qui partent sur une période donnée. Plus il est bas, mieux c\'est — la rétention est le moteur de la rentabilité.",
    simplyPut: "En d'autres termes, Pourcentage d'abonn\u00e9s qui partent sur une p\u00e9riode donn\u00e9e. Plus il est bas, mieux c'est \u2014 la r\u00e9tention est le moteur de la rentabilit\u00e9.",
    formula: "Abonnés partis / Abonnés totaux moyens × 100",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Pourcentage d'abonn\u00e9s qui partent sur une p\u00e9riode donn\u00e9e. Plus il est bas, mieux c'est \u2014 la r\u00e9tention est le moteur de la rentabilit\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "termination-rates", "degroupage", "mobile-money"],
    group: "sector"
  },
  {
    slug: "termination-rates",
    term: "Tarifs de terminaison",
    category: "Entreprise et Secteur",
    definition: "Frais payés entre opérateurs quand un appel transite d\'un réseau à l\'autre. Régulés par l\'ANRT au Maroc.",
    simplyPut: "En langage courant, Frais pay\u00e9s entre op\u00e9rateurs quand un appel transite d'un r\u00e9seau \u00e0 l'autre. R\u00e9gul\u00e9s par l'ANRT au Maroc.",
    subtitle: "Tarifs de terminaison d&#x27;interconnexion",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Frais pay\u00e9s entre op\u00e9rateurs quand un appel transite d'un r\u00e9seau \u00e0 l'autre. R\u00e9gul\u00e9s par l'ANRT au Maroc."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "degroupage", "mobile-money"],
    group: "sector"
  },
  {
    slug: "degroupage",
    term: "D\u00e9groupage",
    category: "Entreprise et Secteur",
    definition: "Obligation réglementaire imposant à l\'opérateur historique de partager son infrastructure de dernier kilomètre avec les concurrents.",
    simplyPut: "En langage courant, Obligation r\u00e9glementaire imposant \u00e0 l'op\u00e9rateur historique de partager son infrastructure de dernier kilom\u00e8tre avec les concurrents.",
    subtitle: "Dégroupage (accès à la boucle locale)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Obligation r\u00e9glementaire imposant \u00e0 l'op\u00e9rateur historique de partager son infrastructure de dernier kilom\u00e8tre avec les concurrents."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "mobile-money"],
    group: "sector"
  },
  {
    slug: "mobile-money",
    term: "Mobile Money",
    category: "Entreprise et Secteur",
    definition: "Services de paiement et financiers via téléphone mobile. Moteur de croissance majeur sur les marchés télécoms africains.",
    simplyPut: "Ce que cela signifie : Services de paiement et financiers via t\u00e9l\u00e9phone mobile. Moteur de croissance majeur sur les march\u00e9s t\u00e9l\u00e9coms africains.",
    subtitle: "Services de monnaie mobile",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Services de paiement et financiers via t\u00e9l\u00e9phone mobile. Moteur de croissance majeur sur les march\u00e9s t\u00e9l\u00e9coms africains."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "anrt",
    term: "ANRT",
    category: "Entreprise et Secteur",
    definition: "Régulateur marocain des télécoms. Contrôle les tarifs de terminaison, le spectre et les règles de partage d\'infrastructure.",
    simplyPut: "L'idée essentielle : R\u00e9gulateur marocain des t\u00e9l\u00e9coms. Contr\u00f4le les tarifs de terminaison, le spectre et les r\u00e8gles de partage d'infrastructure.",
    subtitle: "Autorité Nationale de Régulation des Télécommunications",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : R\u00e9gulateur marocain des t\u00e9l\u00e9coms. Contr\u00f4le les tarifs de terminaison, le spectre et les r\u00e8gles de partage d'infrastructure."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "aisc",
    term: "AISC",
    category: "Entreprise et Secteur",
    definition: "Coût total par unité de métal produit, incluant le capex de maintien. Le vrai coût de production.",
    simplyPut: "En pratique, Co\u00fbt total par unit\u00e9 de m\u00e9tal produit, incluant le capex de maintien. Le vrai co\u00fbt de production.",
    formula: "Coûts d'extraction + Frais généraux + Capex de maintenance / Production",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Co\u00fbt total par unit\u00e9 de m\u00e9tal produit, incluant le capex de maintien. Le vrai co\u00fbt de production."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "lme",
    term: "LME",
    category: "Entreprise et Secteur",
    definition: "Bourse mondiale de référence pour les prix des métaux de base (plomb, zinc, cuivre). Détermine le CA des sociétés minières.",
    simplyPut: "Pour les non-initiés, Bourse mondiale de r\u00e9f\u00e9rence pour les prix des m\u00e9taux de base (plomb, zinc, cuivre). D\u00e9termine le CA des soci\u00e9t\u00e9s mini\u00e8res.",
    subtitle: "London Metal Exchange",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Bourse mondiale de r\u00e9f\u00e9rence pour les prix des m\u00e9taux de base (plomb, zinc, cuivre). D\u00e9termine le CA des soci\u00e9t\u00e9s mini\u00e8res."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ore-grade",
    term: "Teneur du minerai",
    category: "Entreprise et Secteur",
    definition: "Concentration en métal dans la roche extraite, mesurée en g/t ou %. Plus la teneur est élevée, plus on extrait de métal par tonne.",
    simplyPut: "En d'autres termes, Concentration en m\u00e9tal dans la roche extraite, mesur\u00e9e en g/t ou %. Plus la teneur est \u00e9lev\u00e9e, plus on extrait de m\u00e9tal par tonne.",
    formula: "Teneur en métal du minerai exprimée en grammes par tonne (g/t)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Concentration en m\u00e9tal dans la roche extraite, mesur\u00e9e en g/t ou %. Plus la teneur est \u00e9lev\u00e9e, plus on extrait de m\u00e9tal par tonne."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "mineral-reserves",
    term: "R\u00e9serves",
    category: "Entreprise et Secteur",
    definition: "Gisements minéraux géologiquement prouvés exploitables économiquement. Détermine la durée de vie de la mine.",
    simplyPut: "En pratique, Gisements min\u00e9raux g\u00e9ologiquement prouv\u00e9s exploitables \u00e9conomiquement. D\u00e9termine la dur\u00e9e de vie de la mine.",
    subtitle: "Réserves et ressources minérales",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Gisements min\u00e9raux g\u00e9ologiquement prouv\u00e9s exploitables \u00e9conomiquement. D\u00e9termine la dur\u00e9e de vie de la mine."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "office-des-changes",
    term: "Office des Changes",
    category: "Entreprise et Secteur",
    definition: "Régulateur marocain des opérations de change contrôlant les flux de capitaux et auditant les entreprises pour la conformité devises — source de passifs éventuels majeurs.",
    simplyPut: "Dit autrement, R\u00e9gulateur marocain des op\u00e9rations de change contr\u00f4lant les flux de capitaux et auditant les entreprises pour la conformit\u00e9 devises \u2014 source de passifs \u00e9ventuels majeurs.",
    subtitle: "Office des Changes (Autorité de contrôle des changes)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, R\u00e9gulateur marocain des op\u00e9rations de change contr\u00f4lant les flux de capitaux et auditant les entreprises pour la conformit\u00e9 devises \u2014 source de passifs \u00e9ventuels majeurs."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "tailings-reprocessing",
    term: "Retraitement des haldes",
    category: "Entreprise et Secteur",
    definition: "Extraction de métaux résiduels dans les terrils historiques grâce aux technologies modernes de traitement — source de production complémentaire à faible coût.",
    simplyPut: "Traduit simplement : Extraction de m\u00e9taux r\u00e9siduels dans les terrils historiques gr\u00e2ce aux technologies modernes de traitement \u2014 source de production compl\u00e9mentaire \u00e0 faible co\u00fbt.",
    subtitle: "Retraitement des Haldes (retraitement des résidus miniers)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Extraction de m\u00e9taux r\u00e9siduels dans les terrils historiques gr\u00e2ce aux technologies modernes de traitement \u2014 source de production compl\u00e9mentaire \u00e0 faible co\u00fbt."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "onhym",
    term: "ONHYM",
    category: "Entreprise et Secteur",
    definition: "Agence étatique marocaine des mines et hydrocarbures qui cogère l\'exploration minérale et perçoit des redevances auprès des sociétés minières.",
    simplyPut: "Traduit simplement : Agence \u00e9tatique marocaine des mines et hydrocarbures qui cog\u00e8re l'exploration min\u00e9rale et per\u00e7oit des redevances aupr\u00e8s des soci\u00e9t\u00e9s mini\u00e8res.",
    subtitle: "Office National des Hydrocarbures et des Mines",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Agence \u00e9tatique marocaine des mines et hydrocarbures qui cog\u00e8re l'exploration min\u00e9rale et per\u00e7oit des redevances aupr\u00e8s des soci\u00e9t\u00e9s mini\u00e8res."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "conservatory-seizure",
    term: "Saisie Conservatoire",
    category: "Entreprise et Secteur",
    definition: "Gel juridique inscrit au registre du commerce empêchant toute disposition d\'actifs en attendant l\'issue d\'un litige — contrairement aux provisions, ces mesures sont exécutoires.",
    simplyPut: "En clair, Gel juridique inscrit au registre du commerce emp\u00eachant toute disposition d'actifs en attendant l'issue d'un litige \u2014 contrairement aux provisions, ces mesures sont ex\u00e9cutoires.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Gel juridique inscrit au registre du commerce emp\u00eachant toute disposition d'actifs en attendant l'issue d'un litige \u2014 contrairement aux provisions, ces mesures sont ex\u00e9cutoires."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "management-fee-convention",
    term: "Convention de gestion",
    category: "Entreprise et Secteur",
    definition: "Accord récurrent entre parties liées par lequel une filiale rémunère sa société mère pour des services de gestion — forme courante d\'extraction de valeur au détriment des minoritaires.",
    simplyPut: "En résumé pratique : Accord r\u00e9current entre parties li\u00e9es par lequel une filiale r\u00e9mun\u00e8re sa soci\u00e9t\u00e9 m\u00e8re pour des services de gestion \u2014 forme courante d'extraction de valeur au d\u00e9triment des minoritaires.",
    subtitle: "Convention d&#x27;Assistance de Gestion",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Accord r\u00e9current entre parties li\u00e9es par lequel une filiale r\u00e9mun\u00e8re sa soci\u00e9t\u00e9 m\u00e8re pour des services de gestion \u2014 forme courante d'extraction de valeur au d\u00e9triment des minoritaires."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "squeeze-out",
    term: "Retrait obligatoire",
    category: "Entreprise et Secteur",
    definition: "Rachat forcé des actionnaires minoritaires, typiquement déclenché au-dessus de 95% de détention. Le prix de rachat est basé sur la performance boursière passée, pas sur le potentiel futur.",
    simplyPut: "L'idée essentielle : Rachat forc\u00e9 des actionnaires minoritaires, typiquement d\u00e9clench\u00e9 au-dessus de 95% de d\u00e9tention. Le prix de rachat est bas\u00e9 sur la performance boursi\u00e8re pass\u00e9e, pas sur le potentiel futur.",
    subtitle: "Offre Publique de Retrait (retrait obligatoire / squeeze-out)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : Rachat forc\u00e9 des actionnaires minoritaires, typiquement d\u00e9clench\u00e9 au-dessus de 95% de d\u00e9tention. Le prix de rachat est bas\u00e9 sur la performance boursi\u00e8re pass\u00e9e, pas sur le potentiel futur."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ffo",
    term: "FFO",
    category: "Entreprise et Secteur",
    definition: "Mesure de résultat pour les REIT : résultat net + amortissements immobiliers - plus-values de cession. Plus pertinent que le résultat net pour les foncières.",
    simplyPut: "En résumé pratique : Mesure de r\u00e9sultat pour les REIT : r\u00e9sultat net + amortissements immobiliers - plus-values de cession. Plus pertinent que le r\u00e9sultat net pour les fonci\u00e8res.",
    formula: "Résultat net + Amortissements - Gains sur cessions immobilières",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Mesure de r\u00e9sultat pour les REIT : r\u00e9sultat net + amortissements immobiliers - plus-values de cession. Plus pertinent que le r\u00e9sultat net pour les fonci\u00e8res."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "nav-reit",
    term: "ANR",
    category: "Entreprise et Secteur",
    definition: "Valeur totale des biens immobiliers moins les dettes. Pour les foncières, la valeur de marché de l\'ensemble du patrimoine immobilier.",
    simplyPut: "Autrement dit, Valeur totale des biens immobiliers moins les dettes. Pour les fonci\u00e8res, la valeur de march\u00e9 de l'ensemble du patrimoine immobilier.",
    formula: "Juste valeur des biens immobiliers - Dettes financières",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Valeur totale des biens immobiliers moins les dettes. Pour les fonci\u00e8res, la valeur de march\u00e9 de l'ensemble du patrimoine immobilier."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "gla",
    term: "SLB",
    category: "Entreprise et Secteur",
    definition: "Surface totale de plancher louable dans un portefeuille immobilier, mesurée en mètres carrés.",
    simplyPut: "L'idée essentielle : Surface totale de plancher louable dans un portefeuille immobilier, mesur\u00e9e en m\u00e8tres carr\u00e9s.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : Surface totale de plancher louable dans un portefeuille immobilier, mesur\u00e9e en m\u00e8tres carr\u00e9s."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "opci",
    term: "OPCI",
    category: "Entreprise et Secteur",
    definition: "Véhicule d\'investissement immobilier marocain similaire à un REIT. Structure fiscalement avantageuse pour l\'investissement immobilier.",
    simplyPut: "Ce qu'il faut retenir : V\u00e9hicule d'investissement immobilier marocain similaire \u00e0 un REIT. Structure fiscalement avantageuse pour l'investissement immobilier.",
    subtitle: "Organisme de Placement Collectif Immobilier",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : V\u00e9hicule d'investissement immobilier marocain similaire \u00e0 un REIT. Structure fiscalement avantageuse pour l'investissement immobilier."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "cap-rate",
    term: "Taux de capitalisation",
    category: "Entreprise et Secteur",
    definition: "Résultat net d\'exploitation divisé par la valeur du bien. Le rendement d\'un investissement immobilier.",
    simplyPut: "En clair, R\u00e9sultat net d'exploitation divis\u00e9 par la valeur du bien. Le rendement d'un investissement immobilier.",
    formula: "Résultat net d'exploitation / Valeur du bien",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, R\u00e9sultat net d'exploitation divis\u00e9 par la valeur du bien. Le rendement d'un investissement immobilier."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ltv",
    term: "LTV",
    category: "Entreprise et Secteur",
    definition: "Dette totale divisée par la valeur totale des biens. Mesure l\'effet de levier immobilier. Au-dessus de 60%, c\'est agressif.",
    simplyPut: "En clair, Dette totale divis\u00e9e par la valeur totale des biens. Mesure l'effet de levier immobilier. Au-dessus de 60%, c'est agressif.",
    formula: "Dette totale / Valeur totale des biens",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Dette totale divis\u00e9e par la valeur totale des biens. Mesure l'effet de levier immobilier. Au-dessus de 60%, c'est agressif."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "shareholder-yield",
    term: "Rendement actionnaire",
    category: "Entreprise et Secteur",
    definition: "Rendement du dividende moins la dilution liée aux émissions d\'actions — le vrai rendement cash pour l\'actionnaire. Celui d\'Aradei n\'est que de 2,7% malgré un rendement affiché de 5,0%.",
    simplyPut: "Autrement dit, Rendement du dividende moins la dilution li\u00e9e aux \u00e9missions d'actions \u2014 le vrai rendement cash pour l'actionnaire. Celui d'Aradei n'est que de 2,7% malgr\u00e9 un rendement affich\u00e9 de 5,0%.",
    formula: "Rendement du dividende - Dilution + Rachats d'actions nets",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Rendement du dividende moins la dilution li\u00e9e aux \u00e9missions d'actions \u2014 le vrai rendement cash pour l'actionnaire. Celui d'Aradei n'est que de 2,7% malgr\u00e9 un rendement affich\u00e9 de 5,0%."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ias-40-fair-value",
    term: "Juste valeur IAS 40",
    category: "Entreprise et Secteur",
    definition: "Norme IFRS permettant aux foncières de réévaluer leurs biens annuellement — crée des gains/pertes non cash qui rendent le PER sans signification. Utilisez toujours le FFO.",
    simplyPut: "En résumé pratique : Norme IFRS permettant aux fonci\u00e8res de r\u00e9\u00e9valuer leurs biens annuellement \u2014 cr\u00e9e des gains/pertes non cash qui rendent le PER sans signification. Utilisez toujours le FFO.",
    subtitle: "IAS 40 — Modèle de la juste valeur pour les immeubles de placement",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Norme IFRS permettant aux fonci\u00e8res de r\u00e9\u00e9valuer leurs biens annuellement \u2014 cr\u00e9e des gains/pertes non cash qui rendent le PER sans signification. Utilisez toujours le FFO."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "caisse-de-compensation",
    term: "Caisse de Compensation",
    category: "Entreprise et Secteur",
    definition: "Fonds public qui subventionne les produits de première nécessité (butane, sucre, farine), couvrant l\'écart entre les prix internationaux et les prix intérieurs réglementés.",
    simplyPut: "En langage courant, Fonds public qui subventionne les produits de premi\u00e8re n\u00e9cessit\u00e9 (butane, sucre, farine), couvrant l'\u00e9cart entre les prix internationaux et les prix int\u00e9rieurs r\u00e9glement\u00e9s.",
    subtitle: "Caisse de Compensation (Fonds de péréquation des subventions)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Fonds public qui subventionne les produits de premi\u00e8re n\u00e9cessit\u00e9 (butane, sucre, farine), couvrant l'\u00e9cart entre les prix internationaux et les prix int\u00e9rieurs r\u00e9glement\u00e9s."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ebe",
    term: "EBE",
    category: "Entreprise et Secteur",
    definition: "Indicateur de rentabilité comptable marocain similaire à l\'EBITDA mais calculé différemment. Ne PAS confondre EBE et EBITDA dans les multiples de valorisation.",
    simplyPut: "Ce qu'il faut retenir : Indicateur de rentabilit\u00e9 comptable marocain similaire \u00e0 l'EBITDA mais calcul\u00e9 diff\u00e9remment. Ne PAS confondre EBE et EBITDA dans les multiples de valorisation.",
    formula: "Résultat net + Impôts + Intérêts + D&A - Reprises sur provisions",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Indicateur de rentabilit\u00e9 comptable marocain similaire \u00e0 l'EBITDA mais calcul\u00e9 diff\u00e9remment. Ne PAS confondre EBE et EBITDA dans les multiples de valorisation."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "rnpg",
    term: "RNPG",
    category: "Entreprise et Secteur",
    definition: "Résultat net consolidé après déduction des intérêts minoritaires — le bénéfice réellement attribuable aux actionnaires de la société mère.",
    simplyPut: "Pour les non-initiés, R\u00e9sultat net consolid\u00e9 apr\u00e8s d\u00e9duction des int\u00e9r\u00eats minoritaires \u2014 le b\u00e9n\u00e9fice r\u00e9ellement attribuable aux actionnaires de la soci\u00e9t\u00e9 m\u00e8re.",
    subtitle: "Résultat Net Part du Groupe",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, R\u00e9sultat net consolid\u00e9 apr\u00e8s d\u00e9duction des int\u00e9r\u00eats minoritaires \u2014 le b\u00e9n\u00e9fice r\u00e9ellement attribuable aux actionnaires de la soci\u00e9t\u00e9 m\u00e8re."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "caf",
    term: "CAF",
    category: "Entreprise et Secteur",
    definition: "Indicateur comptable marocain similaire au cash flow opérationnel avant variation du BFR — la mesure standard de flux de trésorerie dans les comptes sociaux.",
    simplyPut: "Ce que cela signifie : Indicateur comptable marocain similaire au cash flow op\u00e9rationnel avant variation du BFR \u2014 la mesure standard de flux de tr\u00e9sorerie dans les comptes sociaux.",
    formula: "Résultat net + Dotations aux amortissements et provisions - Reprises - Produits de cession",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Indicateur comptable marocain similaire au cash flow op\u00e9rationnel avant variation du BFR \u2014 la mesure standard de flux de tr\u00e9sorerie dans les comptes sociaux."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "tvp",
    term: "TVP",
    category: "Entreprise et Secteur",
    definition: "Placements financiers à court terme (bons du Trésor, OPCVM monétaires) détenus comme liquidités quasi immédiates au bilan.",
    simplyPut: "En langage courant, Placements financiers \u00e0 court terme (bons du Tr\u00e9sor, OPCVM mon\u00e9taires) d\u00e9tenus comme liquidit\u00e9s quasi imm\u00e9diates au bilan.",
    subtitle: "Titres et Valeurs de Placement",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Placements financiers \u00e0 court terme (bons du Tr\u00e9sor, OPCVM mon\u00e9taires) d\u00e9tenus comme liquidit\u00e9s quasi imm\u00e9diates au bilan."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "campagne-agricole",
    term: "Campagne Agricole",
    category: "Entreprise et Secteur",
    definition: "Cycle annuel de culture et de récolte — principal facteur de la production agricole locale et source majeure de volatilité d\'une année sur l\'autre.",
    simplyPut: "Concrètement, Cycle annuel de culture et de r\u00e9colte \u2014 principal facteur de la production agricole locale et source majeure de volatilit\u00e9 d'une ann\u00e9e sur l'autre.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Cycle annuel de culture et de r\u00e9colte \u2014 principal facteur de la production agricole locale et source majeure de volatilit\u00e9 d'une ann\u00e9e sur l'autre."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "contrat-programme",
    term: "Contrat-Programme",
    category: "Entreprise et Secteur",
    definition: "Accord contraignant entre l\'État marocain et une filière industrielle, fixant des objectifs, investissements et engagements mutuels sur une période définie.",
    simplyPut: "Ce qu'il faut retenir : Accord contraignant entre l'\u00c9tat marocain et une fili\u00e8re industrielle, fixant des objectifs, investissements et engagements mutuels sur une p\u00e9riode d\u00e9finie.",
    subtitle: "Accord-cadre pluriannuel État-industrie",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Accord contraignant entre l'\u00c9tat marocain et une fili\u00e8re industrielle, fixant des objectifs, investissements et engagements mutuels sur une p\u00e9riode d\u00e9finie."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "trituration",
    term: "Trituration",
    category: "Entreprise et Secteur",
    definition: "Broyage industriel des graines oléagineuses pour extraire l\'huile végétale — première étape de la production d\'huile alimentaire et fondement de l\'activité de Lesieur Cristal.",
    simplyPut: "En résumé pratique : Broyage industriel des graines ol\u00e9agineuses pour extraire l'huile v\u00e9g\u00e9tale \u2014 premi\u00e8re \u00e9tape de la production d'huile alimentaire et fondement de l'activit\u00e9 de Lesieur Cristal.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Broyage industriel des graines ol\u00e9agineuses pour extraire l'huile v\u00e9g\u00e9tale \u2014 premi\u00e8re \u00e9tape de la production d'huile alimentaire et fondement de l'activit\u00e9 de Lesieur Cristal."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "lfl-same-store-sales",
    term: "LFL / SSS",
    category: "Entreprise et Secteur",
    definition: "Croissance du CA des magasins ouverts depuis au moins un an, hors nouvelles ouvertures — la mesure la plus pure de la performance organique en distribution.",
    simplyPut: "Croissance des ventes à périmètre comparable, hors ouvertures et fermetures de magasins.",
    subtitle: "Croissance à périmètre comparable",
    formula: "(Ventes des magasins ouverts depuis au moins un an / Ventes de l'année précédente) - 1",
    sections: [

      {
            id: "de-quoi-s-agit-il",
            title: "De quoi s'agit-il",
            content: "Croissance des ventes à périmètre comparable, hors ouvertures et fermetures de magasins. Cet indicateur permet d'évaluer la performance fondamentale d'une entreprise sous cet angle spécifique."
      },
      {
            id: "pourquoi-les-investisseurs-value-s-y-interessent",
            title: "Pourquoi les investisseurs « value » s'y intéressent",
            content: "Comprendre les dynamiques sectorielles est crucial. Un avantage concurrentiel dans un secteur porteur peut générer des rendements exceptionnels sur de longues périodes."
      },
      {
            id: "le-piege",
            title: "Le piège",
            content: "Comme tout indicateur unique, celui-ci peut être trompeur s'il est utilisé isolément. Ne vous fiez jamais à un seul ratio sans examiner l'ensemble du tableau financier. Comparez toujours entre entreprises du même secteur, car les références varient considérablement."
      }

    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "cash-and-carry",
    term: "Cash & Carry",
    category: "Entreprise et Secteur",
    definition: "Grand format de distribution type entrepôt où les acheteurs professionnels paient des prix de gros. Label Vie exploite 23 magasins Atacadao dans ce format.",
    simplyPut: "En d'autres termes, Grand format de distribution type entrep\u00f4t o\u00f9 les acheteurs professionnels paient des prix de gros. Label Vie exploite 23 magasins Atacadao dans ce format.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Grand format de distribution type entrep\u00f4t o\u00f9 les acheteurs professionnels paient des prix de gros. Label Vie exploite 23 magasins Atacadao dans ce format."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "hard-discount",
    term: "Hard Discount",
    category: "Entreprise et Secteur",
    definition: "Distribution ultra-low-cost avec assortiment réduit (~1 500 références). Le format Supeco de Label Vie, chaîne à la croissance la plus rapide, en concurrence avec BIM et les épiceries traditionnelles.",
    simplyPut: "En langage courant, Distribution ultra-low-cost avec assortiment r\u00e9duit (~1 500 r\u00e9f\u00e9rences). Le format Supeco de Label Vie, cha\u00eene \u00e0 la croissance la plus rapide, en concurrence avec BIM et les \u00e9piceries traditionnelles.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Distribution ultra-low-cost avec assortiment r\u00e9duit (~1 500 r\u00e9f\u00e9rences). Le format Supeco de Label Vie, cha\u00eene \u00e0 la croissance la plus rapide, en concurrence avec BIM et les \u00e9piceries traditionnelles."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "sca",
    term: "SCA",
    category: "Entreprise et Secteur",
    definition: "Structure juridique où un gérant commandité contrôle la société avec une responsabilité illimitée tandis que les actionnaires apportent le capital — permet aux fondateurs de garder le contrôle avec une participation faible.",
    simplyPut: "Ce qu'il faut retenir : Structure juridique o\u00f9 un g\u00e9rant commandit\u00e9 contr\u00f4le la soci\u00e9t\u00e9 avec une responsabilit\u00e9 illimit\u00e9e tandis que les actionnaires apportent le capital \u2014 permet aux fondateurs de garder le contr\u00f4le avec une participation faible.",
    subtitle: "Société en Commandite par Actions",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Structure juridique o\u00f9 un g\u00e9rant commandit\u00e9 contr\u00f4le la soci\u00e9t\u00e9 avec une responsabilit\u00e9 illimit\u00e9e tandis que les actionnaires apportent le capital \u2014 permet aux fondateurs de garder le contr\u00f4le avec une participation faible."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "amo",
    term: "AMO",
    category: "Entreprise et Secteur",
    definition: "Régime marocain d\'assurance maladie obligatoire. L\'extension de la couverture stimule la demande en soins de santé.",
    simplyPut: "L'idée essentielle : R\u00e9gime marocain d'assurance maladie obligatoire. L'extension de la couverture stimule la demande en soins de sant\u00e9.",
    subtitle: "Assurance Maladie Obligatoire",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : R\u00e9gime marocain d'assurance maladie obligatoire. L'extension de la couverture stimule la demande en soins de sant\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "biosimilars",
    term: "Biosimilaires",
    category: "Entreprise et Secteur",
    definition: "Copies quasi identiques de médicaments biologiques coûteux, proposées à moindre coût. Opportunité de croissance pour la pharma marocaine.",
    simplyPut: "En pratique, Copies quasi identiques de m\u00e9dicaments biologiques co\u00fbteux, propos\u00e9es \u00e0 moindre co\u00fbt. Opportunit\u00e9 de croissance pour la pharma marocaine.",
    subtitle: "Médicaments biosimilaires",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Copies quasi identiques de m\u00e9dicaments biologiques co\u00fbteux, propos\u00e9es \u00e0 moindre co\u00fbt. Opportunit\u00e9 de croissance pour la pharma marocaine."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "gmp",
    term: "BPF",
    category: "Entreprise et Secteur",
    definition: "Normes de qualité et de sécurité pour la fabrication pharmaceutique. Indispensables pour la production et l\'exportation de médicaments.",
    simplyPut: "L'idée essentielle : Normes de qualit\u00e9 et de s\u00e9curit\u00e9 pour la fabrication pharmaceutique. Indispensables pour la production et l'exportation de m\u00e9dicaments.",
    subtitle: "Bonnes Pratiques de Fabrication",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : Normes de qualit\u00e9 et de s\u00e9curit\u00e9 pour la fabrication pharmaceutique. Indispensables pour la production et l'exportation de m\u00e9dicaments."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "resultat-non-courant",
    term: "R\u00e9sultat Non Courant",
    category: "Entreprise et Secteur",
    definition: "Gains ou pertes liés à des événements non récurrents — cessions d\'actifs, provisions, restructurations — distincts du résultat d\'exploitation courant.",
    simplyPut: "En langage courant, Gains ou pertes li\u00e9s \u00e0 des \u00e9v\u00e9nements non r\u00e9currents \u2014 cessions d'actifs, provisions, restructurations \u2014 distincts du r\u00e9sultat d'exploitation courant.",
    formula: "Produits non courants - Charges non courantes",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Gains ou pertes li\u00e9s \u00e0 des \u00e9v\u00e9nements non r\u00e9currents \u2014 cessions d'actifs, provisions, restructurations \u2014 distincts du r\u00e9sultat d'exploitation courant."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "cotisation-minimale",
    term: "Cotisation Minimale",
    category: "Entreprise et Secteur",
    definition: "Obligation fiscale minimale au Maroc imposant aux sociétés de payer un plancher d\'impôt quel que soit leur niveau de rentabilité.",
    simplyPut: "Concrètement, Obligation fiscale minimale au Maroc imposant aux soci\u00e9t\u00e9s de payer un plancher d'imp\u00f4t quel que soit leur niveau de rentabilit\u00e9.",
    formula: "0,5% × Chiffre d'affaires (hors TVA)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Obligation fiscale minimale au Maroc imposant aux soci\u00e9t\u00e9s de payer un plancher d'imp\u00f4t quel que soit leur niveau de rentabilit\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "cnss",
    term: "CNSS",
    category: "Entreprise et Secteur",
    definition: "Système national marocain de sécurité sociale — les entreprises font face à des audits CNSS pouvant aboutir à d\'importants redressements.",
    simplyPut: "En résumé pratique : Syst\u00e8me national marocain de s\u00e9curit\u00e9 sociale \u2014 les entreprises font face \u00e0 des audits CNSS pouvant aboutir \u00e0 d'importants redressements.",
    subtitle: "Caisse Nationale de Sécurité Sociale",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : Syst\u00e8me national marocain de s\u00e9curit\u00e9 sociale \u2014 les entreprises font face \u00e0 des audits CNSS pouvant aboutir \u00e0 d'importants redressements."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "amm",
    term: "AMM",
    category: "Entreprise et Secteur",
    definition: "Approbation réglementaire marocaine d\'un médicament, équivalent de l\'autorisation FDA. Chaque AMM prend 24-30 mois, créant un avantage réglementaire pour les produits approuvés.",
    simplyPut: "Ce que cela signifie : Approbation r\u00e9glementaire marocaine d'un m\u00e9dicament, \u00e9quivalent de l'autorisation FDA. Chaque AMM prend 24-30 mois, cr\u00e9ant un avantage r\u00e9glementaire pour les produits approuv\u00e9s.",
    subtitle: "Autorisation de Mise sur le Marché",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Approbation r\u00e9glementaire marocaine d'un m\u00e9dicament, \u00e9quivalent de l'autorisation FDA. Chaque AMM prend 24-30 mois, cr\u00e9ant un avantage r\u00e9glementaire pour les produits approuv\u00e9s."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "api-pharma",
    term: "API",
    category: "Entreprise et Secteur",
    definition: "Composant actif du médicament — la plupart des API utilisés par la pharma marocaine sont importés d\'Inde, de Chine ou d\'Europe, créant une exposition au risque de change.",
    simplyPut: "En langage courant, Composant actif du m\u00e9dicament \u2014 la plupart des API utilis\u00e9s par la pharma marocaine sont import\u00e9s d'Inde, de Chine ou d'Europe, cr\u00e9ant une exposition au risque de change.",
    subtitle: "Principe Actif Pharmaceutique",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Composant actif du m\u00e9dicament \u2014 la plupart des API utilis\u00e9s par la pharma marocaine sont import\u00e9s d'Inde, de Chine ou d'Europe, cr\u00e9ant une exposition au risque de change."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "sterile-injectable",
    term: "St\u00e9rile Injectable",
    category: "Entreprise et Secteur",
    definition: "Médicaments nécessitant une fabrication aseptique en salle blanche — segment pharma à la plus forte barrière à l\'entrée. Sothema est le seul fabricant marocain.",
    simplyPut: "En pratique, M\u00e9dicaments n\u00e9cessitant une fabrication aseptique en salle blanche \u2014 segment pharma \u00e0 la plus forte barri\u00e8re \u00e0 l'entr\u00e9e. Sothema est le seul fabricant marocain.",
    subtitle: "Stérile Injectable (médicament injectable stérile)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, M\u00e9dicaments n\u00e9cessitant une fabrication aseptique en salle blanche \u2014 segment pharma \u00e0 la plus forte barri\u00e8re \u00e0 l'entr\u00e9e. Sothema est le seul fabricant marocain."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ppa",
    term: "PPA",
    category: "Entreprise et Secteur",
    definition: "Contrat à long terme de vente d\'électricité à des prix prédéterminés. Offre une visibilité sur le CA pour les producteurs d\'énergie.",
    simplyPut: "Dit autrement, Contrat \u00e0 long terme de vente d'\u00e9lectricit\u00e9 \u00e0 des prix pr\u00e9d\u00e9termin\u00e9s. Offre une visibilit\u00e9 sur le CA pour les producteurs d'\u00e9nergie.",
    subtitle: "Contrat d&#x27;achat d&#x27;électricité",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, Contrat \u00e0 long terme de vente d'\u00e9lectricit\u00e9 \u00e0 des prix pr\u00e9d\u00e9termin\u00e9s. Offre une visibilit\u00e9 sur le CA pour les producteurs d'\u00e9nergie."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "baseload",
    term: "Baseload",
    category: "Entreprise et Secteur",
    definition: "Puissance minimale constante nécessaire au réseau 24h/24. Fournie par les centrales charbon, gaz ou nucléaires.",
    simplyPut: "Dit autrement, Puissance minimale constante n\u00e9cessaire au r\u00e9seau 24h/24. Fournie par les centrales charbon, gaz ou nucl\u00e9aires.",
    subtitle: "Production d&#x27;électricité de base",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, Puissance minimale constante n\u00e9cessaire au r\u00e9seau 24h/24. Fournie par les centrales charbon, gaz ou nucl\u00e9aires."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "onee",
    term: "ONEE",
    category: "Entreprise et Secteur",
    definition: "Opérateur national marocain d\'électricité et d\'eau potable. Client unique de TAQA dans le cadre des PPA.",
    simplyPut: "Traduit simplement : Op\u00e9rateur national marocain d'\u00e9lectricit\u00e9 et d'eau potable. Client unique de TAQA dans le cadre des PPA.",
    subtitle: "Office National de l&#x27;Électricité et de l&#x27;Eau Potable",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Op\u00e9rateur national marocain d'\u00e9lectricit\u00e9 et d'eau potable. Client unique de TAQA dans le cadre des PPA."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "gpl",
    term: "GPL",
    category: "Entreprise et Secteur",
    definition: "Butane et propane utilisés comme combustibles. Le butane est réglementé et subventionné par l\'État ; le propane en vrac est libéralisé.",
    simplyPut: "Concrètement, Butane et propane utilis\u00e9s comme combustibles. Le butane est r\u00e9glement\u00e9 et subventionn\u00e9 par l'\u00c9tat ; le propane en vrac est lib\u00e9ralis\u00e9.",
    subtitle: "Gaz de Pétrole Liquéfié",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Butane et propane utilis\u00e9s comme combustibles. Le butane est r\u00e9glement\u00e9 et subventionn\u00e9 par l'\u00c9tat ; le propane en vrac est lib\u00e9ralis\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "capacity-charges",
    term: "Frais de Puissance",
    category: "Entreprise et Secteur",
    definition: "Paiements fixes à un producteur d\'électricité pour le maintien de la capacité de production disponible, indépendamment de l\'électricité effectivement produite.",
    simplyPut: "En pratique, Paiements fixes \u00e0 un producteur d'\u00e9lectricit\u00e9 pour le maintien de la capacit\u00e9 de production disponible, ind\u00e9pendamment de l'\u00e9lectricit\u00e9 effectivement produite.",
    subtitle: "Frais de Puissance (Capacity Charges)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Paiements fixes \u00e0 un producteur d'\u00e9lectricit\u00e9 pour le maintien de la capacit\u00e9 de production disponible, ind\u00e9pendamment de l'\u00e9lectricit\u00e9 effectivement produite."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "btp",
    term: "BTP",
    category: "Entreprise et Secteur",
    definition: "Secteur du bâtiment et du génie civil. Pilier de l\'industrie marocaine de la construction.",
    simplyPut: "En clair, Secteur du b\u00e2timent et du g\u00e9nie civil. Pilier de l'industrie marocaine de la construction.",
    subtitle: "Bâtiment et Travaux Publics",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Secteur du b\u00e2timent et du g\u00e9nie civil. Pilier de l'industrie marocaine de la construction."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "carnet-de-commandes",
    term: "Carnet de Commandes",
    category: "Entreprise et Secteur",
    definition: "Montant des contrats signés mais non encore exécutés. Donne la visibilité sur le CA des entreprises de construction.",
    simplyPut: "L'idée essentielle : Montant des contrats sign\u00e9s mais non encore ex\u00e9cut\u00e9s. Donne la visibilit\u00e9 sur le CA des entreprises de construction.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, l'idée essentielle : Montant des contrats sign\u00e9s mais non encore ex\u00e9cut\u00e9s. Donne la visibilit\u00e9 sur le CA des entreprises de construction."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "vefa",
    term: "VEFA",
    category: "Entreprise et Secteur",
    definition: "Vente sur plan où les acquéreurs paient pendant la construction. Modèle standard des promoteurs immobiliers marocains.",
    simplyPut: "En d'autres termes, Vente sur plan o\u00f9 les acqu\u00e9reurs paient pendant la construction. Mod\u00e8le standard des promoteurs immobiliers marocains.",
    subtitle: "Vente en État Futur d&#x27;Achèvement",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Vente sur plan o\u00f9 les acqu\u00e9reurs paient pendant la construction. Mod\u00e8le standard des promoteurs immobiliers marocains."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "pcsi",
    term: "PCSI",
    category: "Entreprise et Secteur",
    definition: "Norme comptable sectorielle marocaine pour l\'immobilier, réformée en 2025 avec de nouvelles règles de reconnaissance du CA qui modifient le moment où les promoteurs comptabilisent leurs revenus.",
    simplyPut: "Pour les non-initiés, Norme comptable sectorielle marocaine pour l'immobilier, r\u00e9form\u00e9e en 2025 avec de nouvelles r\u00e8gles de reconnaissance du CA qui modifient le moment o\u00f9 les promoteurs comptabilisent leurs revenus.",
    subtitle: "Plan Comptable du Secteur Immobilier",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Norme comptable sectorielle marocaine pour l'immobilier, r\u00e9form\u00e9e en 2025 avec de nouvelles r\u00e8gles de reconnaissance du CA qui modifient le moment o\u00f9 les promoteurs comptabilisent leurs revenus."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "lgv",
    term: "LGV",
    category: "Entreprise et Secteur",
    definition: "Réseau ferroviaire à grande vitesse du Maroc — l\'extension Kénitra-Marrakech représente un investissement de plusieurs milliards de MAD, moteur pour les entreprises de BTP.",
    simplyPut: "Dit autrement, R\u00e9seau ferroviaire \u00e0 grande vitesse du Maroc \u2014 l'extension K\u00e9nitra-Marrakech repr\u00e9sente un investissement de plusieurs milliards de MAD, moteur pour les entreprises de BTP.",
    subtitle: "Ligne à Grande Vitesse",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, R\u00e9seau ferroviaire \u00e0 grande vitesse du Maroc \u2014 l'extension K\u00e9nitra-Marrakech repr\u00e9sente un investissement de plusieurs milliards de MAD, moteur pour les entreprises de BTP."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "book-to-bill",
    term: "Book-to-Bill",
    category: "Entreprise et Secteur",
    definition: "Ratio entre les nouvelles commandes et le CA facturé. Au-dessus de 1,0x, le carnet de commandes croît — l\'indicateur avancé clé pour les entreprises de construction.",
    simplyPut: "En langage courant, Ratio entre les nouvelles commandes et le CA factur\u00e9. Au-dessus de 1,0x, le carnet de commandes cro\u00eet \u2014 l'indicateur avanc\u00e9 cl\u00e9 pour les entreprises de construction.",
    formula: "Nouvelles commandes / Chiffre d'affaires facturé",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Ratio entre les nouvelles commandes et le CA factur\u00e9. Au-dessus de 1,0x, le carnet de commandes cro\u00eet \u2014 l'indicateur avanc\u00e9 cl\u00e9 pour les entreprises de construction."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "lotissement",
    term: "Lotissement",
    category: "Entreprise et Secteur",
    definition: "Aménagement de terrains bruts en lots viabilisés pour la vente — moins risqué et plus margé que la construction d\'appartements. Modèle cœur d\'Alliances.",
    simplyPut: "Concrètement, Am\u00e9nagement de terrains bruts en lots viabilis\u00e9s pour la vente \u2014 moins risqu\u00e9 et plus marg\u00e9 que la construction d'appartements. Mod\u00e8le c\u0153ur d'Alliances.",
    subtitle: "Lotissement (viabilisation et vente de terrains)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Am\u00e9nagement de terrains bruts en lots viabilis\u00e9s pour la vente \u2014 moins risqu\u00e9 et plus marg\u00e9 que la construction d'appartements. Mod\u00e8le c\u0153ur d'Alliances."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "aide-directe-au-logement",
    term: "Aide Directe",
    category: "Entreprise et Secteur",
    definition: "Réforme 2024 de la subvention au logement au Maroc — des aides directes de 70 000-100 000 MAD aux acquéreurs plutôt que des avantages fiscaux aux promoteurs.",
    simplyPut: "En résumé pratique : R\u00e9forme 2024 de la subvention au logement au Maroc \u2014 des aides directes de 70 000-100 000 MAD aux acqu\u00e9reurs plut\u00f4t que des avantages fiscaux aux promoteurs.",
    subtitle: "Aide Directe au Logement",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en résumé pratique : R\u00e9forme 2024 de la subvention au logement au Maroc \u2014 des aides directes de 70 000-100 000 MAD aux acqu\u00e9reurs plut\u00f4t que des avantages fiscaux aux promoteurs."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "preventes",
    term: "Pr\u00e9ventes",
    category: "Entreprise et Secteur",
    definition: "Unités vendues avant achèvement de la construction — l\'indicateur avancé des promoteurs immobiliers, précédant typiquement le CA de 12 à 24 mois.",
    simplyPut: "En pratique, Unit\u00e9s vendues avant ach\u00e8vement de la construction \u2014 l'indicateur avanc\u00e9 des promoteurs immobiliers, pr\u00e9c\u00e9dant typiquement le CA de 12 \u00e0 24 mois.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Unit\u00e9s vendues avant ach\u00e8vement de la construction \u2014 l'indicateur avanc\u00e9 des promoteurs immobiliers, pr\u00e9c\u00e9dant typiquement le CA de 12 \u00e0 24 mois."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "payment-switching",
    term: "Routage de paiements",
    category: "Entreprise et Secteur",
    definition: "Acheminement et autorisation de transactions de paiement électronique entre banques, commerçants et réseaux de cartes — fonction cœur de PowerCARD d\'HPS.",
    simplyPut: "En d'autres termes, Acheminement et autorisation de transactions de paiement \u00e9lectronique entre banques, commer\u00e7ants et r\u00e9seaux de cartes \u2014 fonction c\u0153ur de PowerCARD d'HPS.",
    subtitle: "Routage de paiements / Traitement transactionnel",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Acheminement et autorisation de transactions de paiement \u00e9lectronique entre banques, commer\u00e7ants et r\u00e9seaux de cartes \u2014 fonction c\u0153ur de PowerCARD d'HPS."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "saas-j-curve",
    term: "Courbe en J du SaaS",
    category: "Entreprise et Secteur",
    definition: "Compression temporaire des marges quand un éditeur logiciel passe des licences ponctuelles aux abonnements récurrents — douleur à court terme pour un gain à long terme.",
    simplyPut: "En langage courant, Compression temporaire des marges quand un \u00e9diteur logiciel passe des licences ponctuelles aux abonnements r\u00e9currents \u2014 douleur \u00e0 court terme pour un gain \u00e0 long terme.",
    subtitle: "Courbe en J de la transition vers le SaaS",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Compression temporaire des marges quand un \u00e9diteur logiciel passe des licences ponctuelles aux abonnements r\u00e9currents \u2014 douleur \u00e0 court terme pour un gain \u00e0 long terme."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "vp-vul",
    term: "VP / VUL",
    category: "Entreprise et Secteur",
    definition: "Véhicules particuliers (VP) et utilitaires légers (VUL) — les deux segments principaux du marché auto suivis par les distributeurs marocains.",
    simplyPut: "Pour faire simple, V\u00e9hicules particuliers (VP) et utilitaires l\u00e9gers (VUL) \u2014 les deux segments principaux du march\u00e9 auto suivis par les distributeurs marocains.",
    subtitle: "Véhicules Particuliers / Véhicules Utilitaires Légers",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, V\u00e9hicules particuliers (VP) et utilitaires l\u00e9gers (VUL) \u2014 les deux segments principaux du march\u00e9 auto suivis par les distributeurs marocains."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "lld",
    term: "LLD",
    category: "Entreprise et Secteur",
    definition: "Location de véhicules pluriannuelle pour flottes d\'entreprise — apporte des revenus récurrents aux distributeurs auto. La filiale LLD d\'Autohall est un relais de croissance.",
    simplyPut: "En langage courant, Location de v\u00e9hicules pluriannuelle pour flottes d'entreprise \u2014 apporte des revenus r\u00e9currents aux distributeurs auto. La filiale LLD d'Autohall est un relais de croissance.",
    subtitle: "Location Longue Durée",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, Location de v\u00e9hicules pluriannuelle pour flottes d'entreprise \u2014 apporte des revenus r\u00e9currents aux distributeurs auto. La filiale LLD d'Autohall est un relais de croissance."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "teu",
    term: "EVP",
    category: "Entreprise et Secteur",
    definition: "Unité standard de conteneur pour mesurer le trafic portuaire. Un conteneur de 40 pieds = 2 EVP.",
    simplyPut: "En d'autres termes, Unit\u00e9 standard de conteneur pour mesurer le trafic portuaire. Un conteneur de 40 pieds = 2 EVP.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Unit\u00e9 standard de conteneur pour mesurer le trafic portuaire. Un conteneur de 40 pieds = 2 EVP."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "transshipment",
    term: "Transbordement",
    category: "Entreprise et Secteur",
    definition: "Transfert de conteneurs entre navires dans un port hub sans entrée dans l\'économie locale — 57% du trafic conteneurs de Marsa Maroc. Trafic discrétionnaire pouvant se déplacer rapidement.",
    simplyPut: "Traduit simplement : Transfert de conteneurs entre navires dans un port hub sans entr\u00e9e dans l'\u00e9conomie locale \u2014 57% du trafic conteneurs de Marsa Maroc. Trafic discr\u00e9tionnaire pouvant se d\u00e9placer rapidement.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : Transfert de conteneurs entre navires dans un port hub sans entr\u00e9e dans l'\u00e9conomie locale \u2014 57% du trafic conteneurs de Marsa Maroc. Trafic discr\u00e9tionnaire pouvant se d\u00e9placer rapidement."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "nwm",
    term: "NWM",
    category: "Entreprise et Secteur",
    definition: "Méga-projet portuaire du Maroc près de Nador — investissement transformationnel de 6+ Mds MAD de Marsa Maroc ajoutant 4,6M EVP de capacité.",
    simplyPut: "Dit autrement, M\u00e9ga-projet portuaire du Maroc pr\u00e8s de Nador \u2014 investissement transformationnel de 6+ Mds MAD de Marsa Maroc ajoutant 4,6M EVP de capacit\u00e9.",
    subtitle: "Nador West Med (Port)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, M\u00e9ga-projet portuaire du Maroc pr\u00e8s de Nador \u2014 investissement transformationnel de 6+ Mds MAD de Marsa Maroc ajoutant 4,6M EVP de capacit\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "anp",
    term: "ANP",
    category: "Entreprise et Secteur",
    definition: "Autorité réglementaire portuaire marocaine qui octroie les concessions, fixe les tarifs de manutention et perçoit les redevances de concession auprès d\'opérateurs comme Marsa Maroc.",
    simplyPut: "En pratique, Autorit\u00e9 r\u00e9glementaire portuaire marocaine qui octroie les concessions, fixe les tarifs de manutention et per\u00e7oit les redevances de concession aupr\u00e8s d'op\u00e9rateurs comme Marsa Maroc.",
    subtitle: "Agence Nationale des Ports",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Autorit\u00e9 r\u00e9glementaire portuaire marocaine qui octroie les concessions, fixe les tarifs de manutention et per\u00e7oit les redevances de concession aupr\u00e8s d'op\u00e9rateurs comme Marsa Maroc."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "concession-portuaire",
    term: "Concession Portuaire",
    category: "Entreprise et Secteur",
    definition: "Droit exclusif octroyé par l\'État d\'exploiter un terminal portuaire pour une durée déterminée, en échange d\'obligations d\'investissement et de redevances de concession.",
    simplyPut: "En termes simples, Droit exclusif octroy\u00e9 par l'\u00c9tat d'exploiter un terminal portuaire pour une dur\u00e9e d\u00e9termin\u00e9e, en \u00e9change d'obligations d'investissement et de redevances de concession.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en termes simples, Droit exclusif octroy\u00e9 par l'\u00c9tat d'exploiter un terminal portuaire pour une dur\u00e9e d\u00e9termin\u00e9e, en \u00e9change d'obligations d'investissement et de redevances de concession."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "messagerie",
    term: "Messagerie",
    category: "Entreprise et Secteur",
    definition: "Service de transport de colis et marchandises de CTM — 240 véhicules, 120 points de distribution, ~6M colis/an. S\'appuie sur le réseau national de lignes.",
    simplyPut: "En d'autres termes, Service de transport de colis et marchandises de CTM \u2014 240 v\u00e9hicules, 120 points de distribution, ~6M colis/an. S'appuie sur le r\u00e9seau national de lignes.",
    subtitle: "Messagerie (transport de colis et fret)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Service de transport de colis et marchandises de CTM \u2014 240 v\u00e9hicules, 120 points de distribution, ~6M colis/an. S'appuie sur le r\u00e9seau national de lignes."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "gestion-deleguee",
    term: "Gestion D\u00e9l\u00e9gu\u00e9e",
    category: "Entreprise et Secteur",
    definition: "Modèle de concession de service public où une entreprise privée exploite un service municipal dans le cadre d\'un contrat pluriannuel avec l\'État.",
    simplyPut: "Ce que cela signifie : Mod\u00e8le de concession de service public o\u00f9 une entreprise priv\u00e9e exploite un service municipal dans le cadre d'un contrat pluriannuel avec l'\u00c9tat.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Mod\u00e8le de concession de service public o\u00f9 une entreprise priv\u00e9e exploite un service municipal dans le cadre d'un contrat pluriannuel avec l'\u00c9tat."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "clinker",
    term: "Clinker",
    category: "Entreprise et Secteur",
    definition: "Nodules de silicate de calcium produits par cuisson des matières premières dans un four à ciment — principal intermédiaire avant broyage en ciment et première source de CO2.",
    simplyPut: "Ce que cela signifie : Nodules de silicate de calcium produits par cuisson des mati\u00e8res premi\u00e8res dans un four \u00e0 ciment \u2014 principal interm\u00e9diaire avant broyage en ciment et premi\u00e8re source de CO2.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Nodules de silicate de calcium produits par cuisson des mati\u00e8res premi\u00e8res dans un four \u00e0 ciment \u2014 principal interm\u00e9diaire avant broyage en ciment et premi\u00e8re source de CO2."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "petcoke",
    term: "Petcoke",
    category: "Entreprise et Secteur",
    definition: "Combustible solide riche en carbone issu du raffinage pétrolier, utilisé comme alternative moins chère au charbon dans les fours à ciment. Les fluctuations de prix impactent directement les marges du ciment.",
    simplyPut: "Ce qu'il faut retenir : Combustible solide riche en carbone issu du raffinage p\u00e9trolier, utilis\u00e9 comme alternative moins ch\u00e8re au charbon dans les fours \u00e0 ciment. Les fluctuations de prix impactent directement les marges du ciment.",
    subtitle: "Coke de pétrole (Petcoke)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Combustible solide riche en carbone issu du raffinage p\u00e9trolier, utilis\u00e9 comme alternative moins ch\u00e8re au charbon dans les fours \u00e0 ciment. Les fluctuations de prix impactent directement les marges du ciment."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "bpe",
    term: "BPE",
    category: "Entreprise et Secteur",
    definition: "Béton mélangé en usine et livré sur les chantiers — canal de demande captif pour les cimentiers.",
    simplyPut: "En langage courant, B\u00e9ton m\u00e9lang\u00e9 en usine et livr\u00e9 sur les chantiers \u2014 canal de demande captif pour les cimentiers.",
    subtitle: "Béton Prêt à l&#x27;Emploi",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, B\u00e9ton m\u00e9lang\u00e9 en usine et livr\u00e9 sur les chantiers \u2014 canal de demande captif pour les cimentiers."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "cbam",
    term: "CBAM",
    category: "Entreprise et Secteur",
    definition: "Taxe carbone européenne sur les biens importés comme l\'acier et le ciment — affectera les exportateurs marocains vers l\'Europe à partir de 2026.",
    simplyPut: "En d'autres termes, Taxe carbone europ\u00e9enne sur les biens import\u00e9s comme l'acier et le ciment \u2014 affectera les exportateurs marocains vers l'Europe \u00e0 partir de 2026.",
    subtitle: "Mécanisme d&#x27;ajustement carbone aux frontières (UE)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Taxe carbone europ\u00e9enne sur les biens import\u00e9s comme l'acier et le ciment \u2014 affectera les exportateurs marocains vers l'Europe \u00e0 partir de 2026."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "eaf",
    term: "FEA",
    category: "Entreprise et Secteur",
    definition: "Four de sidérurgie qui fond la ferraille recyclée par arc électrique. Méthode de production principale de Sonasid — le coût dépend des prix de la ferraille et des tarifs électriques.",
    simplyPut: "En d'autres termes, Four de sid\u00e9rurgie qui fond la ferraille recycl\u00e9e par arc \u00e9lectrique. M\u00e9thode de production principale de Sonasid \u2014 le co\u00fbt d\u00e9pend des prix de la ferraille et des tarifs \u00e9lectriques.",
    subtitle: "Four Électrique à Arc",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Four de sid\u00e9rurgie qui fond la ferraille recycl\u00e9e par arc \u00e9lectrique. M\u00e9thode de production principale de Sonasid \u2014 le co\u00fbt d\u00e9pend des prix de la ferraille et des tarifs \u00e9lectriques."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "scrap-rebar-spread",
    term: "\u00c9cart ferraille-rond \u00e0 b\u00e9ton",
    category: "Entreprise et Secteur",
    definition: "Différence entre le prix de vente du rond à béton et le coût de la ferraille — le moteur de profit fondamental des sidérurgistes à FEA.",
    simplyPut: "En clair, Diff\u00e9rence entre le prix de vente du rond \u00e0 b\u00e9ton et le co\u00fbt de la ferraille \u2014 le moteur de profit fondamental des sid\u00e9rurgistes \u00e0 FEA.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Diff\u00e9rence entre le prix de vente du rond \u00e0 b\u00e9ton et le co\u00fbt de la ferraille \u2014 le moteur de profit fondamental des sid\u00e9rurgistes \u00e0 FEA."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "tio2",
    term: "TiO\u2082",
    category: "Entreprise et Secteur",
    definition: "Pigment blanc pour la peinture — intrant majeur coté sur les marchés mondiaux. Une offre concentrée entraîne des fluctuations de prix de 20-30% impactant directement les marges.",
    simplyPut: "En clair, Pigment blanc pour la peinture \u2014 intrant majeur cot\u00e9 sur les march\u00e9s mondiaux. Une offre concentr\u00e9e entra\u00eene des fluctuations de prix de 20-30% impactant directement les marges.",
    subtitle: "Dioxyde de Titane",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en clair, Pigment blanc pour la peinture \u2014 intrant majeur cot\u00e9 sur les march\u00e9s mondiaux. Une offre concentr\u00e9e entra\u00eene des fluctuations de prix de 20-30% impactant directement les marges."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "micro-irrigation",
    term: "Micro-Irrigation",
    category: "Entreprise et Secteur",
    definition: "Irrigation de précision livrant l\'eau directement aux racines des plantes, avec 30-50% d\'économie d\'eau. Compétence cœur de CMGP et arme principale du Maroc contre le stress hydrique.",
    simplyPut: "Autrement dit, Irrigation de pr\u00e9cision livrant l'eau directement aux racines des plantes, avec 30-50% d'\u00e9conomie d'eau. Comp\u00e9tence c\u0153ur de CMGP et arme principale du Maroc contre le stress hydrique.",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Irrigation de pr\u00e9cision livrant l'eau directement aux racines des plantes, avec 30-50% d'\u00e9conomie d'eau. Comp\u00e9tence c\u0153ur de CMGP et arme principale du Maroc contre le stress hydrique."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "agrofourniture",
    term: "Agrofourniture",
    category: "Entreprise et Secteur",
    definition: "Distribution d\'intrants agricoles consommables (engrais, semences, protection des cultures) — 51% du CA de CMGP. Demande récurrente chaque saison.",
    simplyPut: "En pratique, Distribution d'intrants agricoles consommables (engrais, semences, protection des cultures) \u2014 51% du CA de CMGP. Demande r\u00e9currente chaque saison.",
    subtitle: "Agrofourniture (distribution d&#x27;intrants agricoles)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Distribution d'intrants agricoles consommables (engrais, semences, protection des cultures) \u2014 51% du CA de CMGP. Demande r\u00e9currente chaque saison."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "roll-up-strategy",
    term: "Strat\u00e9gie de Roll-Up",
    category: "Entreprise et Secteur",
    definition: "Croissance par acquisition systématique de petites entreprises dans un secteur fragmenté. L\'approche de CMGP — mais attention au goodwill vs ROIC.",
    simplyPut: "Ce qu'il faut retenir : Croissance par acquisition syst\u00e9matique de petites entreprises dans un secteur fragment\u00e9. L'approche de CMGP \u2014 mais attention au goodwill vs ROIC.",
    subtitle: "Acquisitions en série / Stratégie de plateforme",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce qu'il faut retenir : Croissance par acquisition syst\u00e9matique de petites entreprises dans un secteur fragment\u00e9. L'approche de CMGP \u2014 mais attention au goodwill vs ROIC."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "ammc",
    term: "AMMC",
    category: "Entreprise et Secteur",
    definition: "Régulateur marocain des marchés financiers. Équivalent de la SEC. Applique les règles de transparence et d\'intégrité du marché.",
    simplyPut: "Autrement dit, R\u00e9gulateur marocain des march\u00e9s financiers. \u00c9quivalent de la SEC. Applique les r\u00e8gles de transparence et d'int\u00e9grit\u00e9 du march\u00e9.",
    subtitle: "Autorité Marocaine du Marché des Capitaux",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, R\u00e9gulateur marocain des march\u00e9s financiers. \u00c9quivalent de la SEC. Applique les r\u00e8gles de transparence et d'int\u00e9grit\u00e9 du march\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "masi",
    term: "MASI",
    category: "Entreprise et Secteur",
    definition: "Indice principal de la Bourse de Casablanca. Suit toutes les sociétés cotées, pondérées par capitalisation flottante.",
    simplyPut: "Pour faire simple, Indice principal de la Bourse de Casablanca. Suit toutes les soci\u00e9t\u00e9s cot\u00e9es, pond\u00e9r\u00e9es par capitalisation flottante.",
    subtitle: "Moroccan All Shares Index",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour faire simple, Indice principal de la Bourse de Casablanca. Suit toutes les soci\u00e9t\u00e9s cot\u00e9es, pond\u00e9r\u00e9es par capitalisation flottante."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "pcg",
    term: "PCG",
    category: "Entreprise et Secteur",
    definition: "Norme comptable locale marocaine. La plupart des petites sociétés utilisent le PCG ; les grandes publient en IFRS.",
    simplyPut: "En d'autres termes, Norme comptable locale marocaine. La plupart des petites soci\u00e9t\u00e9s utilisent le PCG ; les grandes publient en IFRS.",
    subtitle: "Plan Comptable Général Marocain",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, Norme comptable locale marocaine. La plupart des petites soci\u00e9t\u00e9s utilisent le PCG ; les grandes publient en IFRS."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "comptes-sociaux",
    term: "Comptes Sociaux",
    category: "Concepts d'Investissement",
    definition: "États financiers individuels de la maison mère selon le PCG marocain, avant consolidation des filiales.",
    simplyPut: "En d'autres termes, \u00c9tats financiers individuels de la maison m\u00e8re selon le PCG marocain, avant consolidation des filiales.",
    subtitle: "Comptes Sociaux (États Financiers Individuels de la Maison Mère)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en d'autres termes, \u00c9tats financiers individuels de la maison m\u00e8re selon le PCG marocain, avant consolidation des filiales."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "sector"
  },
  {
    slug: "comptes-consolides",
    term: "Comptes Consolid\u00e9s",
    category: "Concepts d'Investissement",
    definition: "États financiers combinant la maison mère et toutes les filiales en un seul jeu de comptes de groupe, éliminant les transactions intercompagnies.",
    simplyPut: "En langage courant, \u00c9tats financiers combinant la maison m\u00e8re et toutes les filiales en un seul jeu de comptes de groupe, \u00e9liminant les transactions intercompagnies.",
    subtitle: "Comptes Consolidés (États Financiers Consolidés du Groupe)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en langage courant, \u00c9tats financiers combinant la maison m\u00e8re et toutes les filiales en un seul jeu de comptes de groupe, \u00e9liminant les transactions intercompagnies."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "sector"
  },
  {
    slug: "rex",
    term: "REX",
    category: "Rentabilité",
    definition: "Terme comptable français/marocain pour le résultat d\'exploitation, équivalent de l\'EBIT. Le profit opérationnel récurrent avant charges financières et impôts.",
    simplyPut: "Concrètement, Terme comptable fran\u00e7ais/marocain pour le r\u00e9sultat d'exploitation, \u00e9quivalent de l'EBIT. Le profit op\u00e9rationnel r\u00e9current avant charges financi\u00e8res et imp\u00f4ts.",
    subtitle: "Résultat d&#x27;Exploitation (Operating Income)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, concrètement, Terme comptable fran\u00e7ais/marocain pour le r\u00e9sultat d'exploitation, \u00e9quivalent de l'EBIT. Le profit op\u00e9rationnel r\u00e9current avant charges financi\u00e8res et imp\u00f4ts."
      }
    ],
    relatedSlugs: ["ebitda", "ebit", "net-income", "gross-margin", "operating-margin", "net-margin"],
    group: "sector"
  },
  {
    slug: "ago",
    term: "AGO",
    category: "Concepts d'Investissement",
    definition: "Assemblée annuelle ordinaire des actionnaires qui approuve les comptes, les dividendes et la nomination des commissaires aux comptes.",
    simplyPut: "Pour les non-initiés, Assembl\u00e9e annuelle ordinaire des actionnaires qui approuve les comptes, les dividendes et la nomination des commissaires aux comptes.",
    subtitle: "Assemblée Générale Ordinaire",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, pour les non-initiés, Assembl\u00e9e annuelle ordinaire des actionnaires qui approuve les comptes, les dividendes et la nomination des commissaires aux comptes."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "sector"
  },
  {
    slug: "pdg",
    term: "PDG",
    category: "Concepts d'Investissement",
    definition: "Cumul des fonctions de Président du Conseil et de Directeur Général, courant dans les entreprises marocaines. Concentre le pouvoir exécutif et de supervision en une seule personne.",
    simplyPut: "En pratique, Cumul des fonctions de Pr\u00e9sident du Conseil et de Directeur G\u00e9n\u00e9ral, courant dans les entreprises marocaines. Concentre le pouvoir ex\u00e9cutif et de supervision en une seule personne.",
    subtitle: "Président Directeur Général",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, en pratique, Cumul des fonctions de Pr\u00e9sident du Conseil et de Directeur G\u00e9n\u00e9ral, courant dans les entreprises marocaines. Concentre le pouvoir ex\u00e9cutif et de supervision en une seule personne."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "sector"
  },
  {
    slug: "controle-fiscal",
    term: "Contr\u00f4le Fiscal",
    category: "Entreprise et Secteur",
    definition: "Vérification fiscale menée par la DGI marocaine portant sur des exercices passés. Peut entraîner des rappels d\'impôt significatifs qui écrasent le résultat publié.",
    simplyPut: "Dit autrement, V\u00e9rification fiscale men\u00e9e par la DGI marocaine portant sur des exercices pass\u00e9s. Peut entra\u00eener des rappels d'imp\u00f4t significatifs qui \u00e9crasent le r\u00e9sultat publi\u00e9.",
    subtitle: "Contrôle Fiscal (Vérification Fiscale)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, dit autrement, V\u00e9rification fiscale men\u00e9e par la DGI marocaine portant sur des exercices pass\u00e9s. Peut entra\u00eener des rappels d'imp\u00f4t significatifs qui \u00e9crasent le r\u00e9sultat publi\u00e9."
      }
    ],
    relatedSlugs: ["arpu", "ftth", "ott", "churn-rate", "termination-rates", "degroupage"],
    group: "sector"
  },
  {
    slug: "tresorerie-nette",
    term: "Tr\u00e9sorerie Nette",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Trésorerie et équivalents moins les concours bancaires courants. Capture la vraie liquidité à court terme dans le reporting financier marocain.",
    simplyPut: "Autrement dit, Tr\u00e9sorerie et \u00e9quivalents moins les concours bancaires courants. Capture la vraie liquidit\u00e9 \u00e0 court terme dans le reporting financier marocain.",
    formula: "Trésorerie et équivalents - Concours bancaires courants",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, autrement dit, Tr\u00e9sorerie et \u00e9quivalents moins les concours bancaires courants. Capture la vraie liquidit\u00e9 \u00e0 court terme dans le reporting financier marocain."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging"],
    group: "sector"
  },
  {
    slug: "emprunt-obligataire",
    term: "Emprunt Obligataire",
    category: "Endettement et Solvabilit\u00e9",
    definition: "Obligation émise par une entreprise marocaine pour lever du financement par la dette, typiquement en tranches avec des maturités de 5 à 10 ans.",
    simplyPut: "Ce que cela signifie : Obligation \u00e9mise par une entreprise marocaine pour lever du financement par la dette, typiquement en tranches avec des maturit\u00e9s de 5 \u00e0 10 ans.",
    subtitle: "Emprunt Obligataire (Émission d&#x27;Obligations d&#x27;Entreprise)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, ce que cela signifie : Obligation \u00e9mise par une entreprise marocaine pour lever du financement par la dette, typiquement en tranches avec des maturit\u00e9s de 5 \u00e0 10 ans."
      }
    ],
    relatedSlugs: ["net-debt", "net-debt-ebitda", "debt-to-equity", "interest-coverage", "current-ratio", "deleveraging"],
    group: "sector"
  },
  {
    slug: "bam",
    term: "BAM",
    category: "Concepts d'Investissement",
    definition: "La banque centrale du Maroc. Fixe le taux directeur qui influence les coûts d\'emprunt, les rendements obligataires et les valorisations boursières.",
    simplyPut: "Traduit simplement : La banque centrale du Maroc. Fixe le taux directeur qui influence les co\u00fbts d'emprunt, les rendements obligataires et les valorisations boursi\u00e8res.",
    subtitle: "Bank Al-Maghrib (Banque Centrale du Maroc)",
    sections: [
      {
        id: "de-quoi-s-agit-il",
        title: "De quoi s'agit-il",
        content: "Pour approfondir, traduit simplement : La banque centrale du Maroc. Fixe le taux directeur qui influence les co\u00fbts d'emprunt, les rendements obligataires et les valorisations boursi\u00e8res."
      }
    ],
    relatedSlugs: ["quality-score", "moat", "margin-of-safety", "competitive-advantage", "free-float", "private-equity"],
    group: "sector"
  },
];
