[---
name: init-tenor
description: >
  Initialiser une session TENOR/SCRIBE/GRAPHIFY.
  LECTURE OBLIGATOIRE ET PROUVÉE avant toute action.
  Un LLM qui ne prouve pas sa lecture est interdit
  d'agir sur le code.
---

# ⛔ RÈGLE FONDAMENTALE

**Tu n'as le droit de toucher à AUCUN fichier
tant que tu n'as pas produit le SCRIBE-CHECK
complet ci-dessous avec des DONNÉES RÉELLES.**

"J'ai lu" sans preuve = mensonge.
Mensonge = tu casses le code.
Tu casses le code = mission échouée.

---

# ÉTAPE 0 — DATE SYSTÈME RÉELLE

Avant tout, exécute :
```bash
date +"%Y-%m-%d %H:%M:%S %Z %z"
```

Note la date exacte. Utilise-la partout.
Ne jamais inventer ou assumer une date.

---

# ÉTAPE 1 — TENOR GLOBAL

Lire INTÉGRALEMENT :
```bash
cat /home/jack-josias/.gemini/GEMINI.md
```

PREUVE REQUISE :
Extrait les 3 invariants principaux
et la version TENOR active.
Si tu ne peux pas les citer → tu n'as pas lu.

---

# ÉTAPE 2 — GRAPHIFY (OBLIGATOIRE)

```bash
cat graphify-out/GRAPH_REPORT.md
```

Si absent :
```bash
graphify update .
cat graphify-out/GRAPH_REPORT.md
```

⛔ INTERDIT de passer à l'étape 3
   sans avoir répondu à ces questions
   depuis le fichier réel :

Questions de preuve :
1. Combien de nodes dans le graphe ?
2. Combien d'edges ?
3. Liste les 3 god-nodes actuels.
4. Quel est le blast radius
   du premier god-node ?

Si tu ne connais pas les réponses
→ tu n'as pas lu GRAPH_REPORT.md
→ relis-le maintenant

---

# ÉTAPE 3 — SCRIBE BOOTSTRAP

```bash
.agent/workflow/scribe/scribe bootstrap
```

Puis générer ton identité unique :

```bash
AGENT_TYPE="cli"
.agent/workflow/scribe/scribe whoami \
  --type "$AGENT_TYPE" --surface idle
```

Copier la ligne "Mon ID:" dans AGENT_NAME.
**Ne jamais utiliser --agent codex en dur.**

---

# ÉTAPE 4 — WORKFLOW ACK

```bash
.agent/workflow/scribe/scribe workflow read \
  --agent "$AGENT_NAME" --type "$AGENT_TYPE"

.agent/workflow/scribe/scribe workflow check \
  --agent "$AGENT_NAME"
```

⛔ Si verdict ≠ ACK_OK → STOP.
   Relire les fichiers workflow avant de continuer.

---

# ÉTAPE 5 — ÉTAT MULTI-AGENT

```bash
.agent/workflow/scribe/scribe lock status
.agent/workflow/scribe/scribe sync \
  --agent "$AGENT_NAME" --type "$AGENT_TYPE"
.agent/workflow/scribe/scribe coordination status
```

PREUVE REQUISE :
1. Le lock est-il locked ou unlocked ?
2. Qui est le last_writer ?
3. Y a-t-il des claims actifs ?
   Si oui : lesquels et sur quels fichiers ?

Si tu ne peux pas répondre → relis les sorties.

---

# ÉTAPE 6 — CONTEXTE MÉMOIRE

```bash
.agent/workflow/scribe/scribe-rag context
```

⛔ INTERDIT de passer à l'étape 7
   sans avoir répondu :

1. Combien d'entités dans le SCRIBE ?
2. Quels sont les 3 hot entries actuels ?
3. Y a-t-il des dettes actives ?
   Si oui : lesquelles ?

---

# ÉTAPE 7 — RÈGLES LOCALES

Lire dans cet ordre SANS SAUTER :

```bash
cat .agent/rules/scribe.md
cat .agent/workflow/scribe/sel/docs/AGENTS.md
cat .agent/workflow/scribe/sel/docs/scribe.md
cat .agent/workflow/scribe/sel/docs/friction-policy.md
```

PREUVE REQUISE :
Cite le mode NANO et quand l'utiliser.
Cite une règle Git non-négociable.

---

# ÉTAPE 7B — MCP CHROME DEVTOOLS

**Condition obligatoire :** si la tâche concerne navigateur, UI, visuel,
screenshot, localhost, responsive, console, réseau, canvas, ECharts, modal,
interaction frontend ou smoke visuel, lire AVANT d'agir :

```bash
cat .agent/workflow/mcp/chrome-devtools.md
```

Puis utiliser Chrome DevTools MCP en premier : `list_pages`,
`select_page`/`new_page`, `navigate_page`, `take_snapshot`,
`click`, `fill`, `type_text`, `press_key`, `evaluate_script`,
`list_console_messages`, `list_network_requests`, `take_screenshot`
selon le besoin.

⛔ Interdit par défaut : ajouter Playwright, Cypress, Puppeteer, Selenium,
`@playwright/test` ou une dépendance navigateur externe pour remplacer le
smoke MCP interne. Exception seulement si l'utilisateur le demande explicitement
ou si MCP Chrome DevTools est indisponible après preuve transport + CDP.

PREUVE REQUISE si concerné :
1. Le fichier `.agent/workflow/mcp/chrome-devtools.md` a-t-il été lu ?
2. Le MCP Chrome DevTools est-il disponible ?
3. Quelle page cible sera ouverte ou sélectionnée ?
4. Quelle validation réelle sera faite : snapshot, console, réseau, screenshot,
   pixels/canvas/ECharts ou `evaluate_script` ?
5. Pourquoi aucune dépendance browser externe n'est ajoutée ?

Si non concerné, noter explicitement : `MCP Chrome : NON CONCERNÉ`.

---

# ÉTAPE 8 — MÉMOIRE PROJET

```bash
cat AGENT-MEMOIRE_PROJECT_STATUS.scribe | head -200
```

Puis :
```bash
.agent/workflow/scribe/scribe-rag context
```

PREUVE REQUISE :
1. Quel est le dernier JOURNAL ?
2. Y a-t-il des SCARs HOT ?
   Si oui : cite le l0_abstract du premier.
3. Y a-t-il des GHOSTs avec ne_pas_reproposer ?
   Si oui : que ne faut-il jamais reproposer ?

---

# SCRIBE-CHECK OBLIGATOIRE

**Tu ne peux répondre à AUCUNE question
et toucher à AUCUN fichier
avant d'avoir produit ce bloc complet
avec des données réelles extraites des fichiers.**

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SCRIBE-CHECK TENOR V4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date session         : [date réelle du système]
Heure système        : [heure réelle]

TENOR global lu      : OUI — version [X]
                       Invariant 1 : [texte réel]
                       Invariant 2 : [texte réel]

Graphify lu          : OUI — [N] nodes [N] edges
God-nodes            : [liste réelle]
Blast radius node 1  : [valeur réelle]

Agent session        : [AGENT_NAME réel]
Lock status          : [locked/unlocked réel]
Last writer          : [valeur réelle]
Claims actifs        : [N réel] — [détails]

Agents actifs vus    : [N réel]

Mémoire projet lue   : OUI — [N] entités
Hot entries          : [liste réelle]
Dettes actives       : [liste réelle ou "Aucune"]
Dernier JOURNAL      : [ID réel]
SCARs HOT            : [liste réelle ou "Aucun"]
ne_pas_reproposer    : [liste réelle ou "Aucun"]

Mode actif           : NANO / QUICK / STANDARD / CRITICAL
Justification mode   : [pourquoi ce mode]

Workflow ack         : ACK_OK / NON
MCP Chrome lu        : OUI / NON CONCERNÉ / NON — [preuve réelle]
Validation navigateur: [snapshot/console/réseau/screenshot/evaluate_script ou N/A]
Prochaine action     : [description précise]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Si un champ contient [X] ou [valeur réelle]
→ tu n'as pas fini l'initialisation.
→ Recommence depuis l'étape concernée.**

---

# RÈGLES GIT NON-NÉGOCIABLES

⛔ JAMAIS ces commandes :
```bash
git add .
git add .agent
git add graphify-out
git add scribe-out
```

✅ TOUJOURS par chemins exacts :
```bash
git add src/components/MonFichier.tsx
git add src/hooks/monHook.ts
```

Surfaces agentiques JAMAIS committées :
- .agent/skills/init-tenor/SKILL.md
- .agent/workflow/scribe/
- graphify-out/
- scribe-out/

---

# RÈGLE AVANT TOUTE IMPLÉMENTATION

```bash
.agent/workflow/scribe/scribe-rag challenge \
  "<description précise de ce que tu vas faire>"
```

STOP   → Ne pas implémenter. Lire le BLOCK.
REVIEW → Lire les WARNs. Décider.
PROCEED → Implémenter.

**Si tu sautes cette étape
→ tu travailles en aveugle
→ tu vas casser quelque chose
→ et tu ne le sauras pas.**

---

# MODE NANO — PETITES TÂCHES

Pour toute correction < 30 min, 1 fichier :

```bash
# Préflight minimal :
.agent/workflow/scribe/scribe-rag context

# Travailler.

# Postflight si bug résolu :
# → Créer un SCAR
# Sinon : rien
```

Pas de doctor.
Pas de lock.
Pas de sync.
Pas de worktree.

---

# AUTODREAM — RÈGLE STRICTE

Proposer autodream SEULEMENT après
une vraie implémentation terminée.

JAMAIS :
- En devinant un temps mort
- Sans instruction explicite
- Sur du code non testé

```bash
.agent/workflow/scribe/scribe-rag \
  autodream --read-only
```

---

# ÉCRITURE MÉMOIRE CAUSALE

**Écrire dans le SCRIBE UNIQUEMENT si :**
- Un bug réel a été résolu → SCAR
- Une décision architecturale a été prise → GHOST
- Une règle préventive a été identifiée → VAC

**Ne jamais écrire si :**
- Rien n'a cassé
- C'était une petite correction
- Le ratio causal est bas et tu veux le remonter

Avant écriture :
```bash
.agent/workflow/scribe/scribe workflow check \
  --agent "$AGENT_NAME"
.agent/workflow/scribe/scribe doctor --suggest-fix
.agent/workflow/scribe/scribe lock acquire \
  --agent "$AGENT_NAME" \
  --type "$AGENT_TYPE" \
  --session <JOURNAL-ID>
```

Après écriture :
```bash
.agent/workflow/scribe/scribe doctor --suggest-fix
.agent/workflow/scribe/scribe sync --repair \
  --agent "$AGENT_NAME" \
  --type "$AGENT_TYPE" \
  --session <JOURNAL-ID>
.agent/workflow/scribe/scribe lock release \
  --agent "$AGENT_NAME"
```

---

# ⛔ INTERDICTIONS ABSOLUES

Ne jamais faire sans avoir produit
le SCRIBE-CHECK complet :
- Modifier un fichier applicatif
- Créer un composant
- Corriger un bug
- Refactorer du code
- Créer une branche
- Faire un commit

Ne jamais dire "c'est fait" sans avoir :
- Montré les tests qui passent
- Montré le diff exact
- Lancé git diff --check
- Vérifié que le comportement attendu est réel

Ne jamais dire "tout est OK" sans preuve.]