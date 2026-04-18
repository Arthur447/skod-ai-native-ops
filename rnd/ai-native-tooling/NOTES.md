# R&D — AI-Native Architecture Enforcement Tooling

**Date** : 2026-04-17
**Branche** : `rnd/ai-native-tooling`

## Contexte

Dans un environnement où la majorité du code est produit par des agents IA autonomes supervisés, la review humaine ne scale pas : un agent peut générer 10 à 20 PRs par jour, un reviewer humain ne peut pas toutes les inspecter avec la même attention.

Les guidelines d'architecture textuelles dans un wiki deviennent vite obsolètes et ne sont pas consommables par un agent. Il faut **encoder les contraintes architecturales dans la CI** pour que toute violation bloque automatiquement la PR.

Cette R&D explore les outils d'enforcement machine applicables à une codebase JavaScript/TypeScript existante, appliqués sur le module `commu_inbox` de Skod comme terrain d'essai.

## Outil testé — dependency-cruiser

[`dependency-cruiser`](https://github.com/sverweij/dependency-cruiser) — linter d'architecture pour JS/TS. Il :

- Construit le graphe des imports d'une codebase
- Permet de définir des règles déclaratives (`forbidden` / `allowed`)
- S'exécute en CI ; sortie non-zéro sur violation → blocage PR
- Supporte également la génération de graphes DOT/SVG pour visualisation

## Règles définies

Voir `dep-cruiser.config.cjs`. Quatre règles : deux universelles + deux métier propres à la structure `commu_inbox`.

| Règle | Type | Effet |
|---|---|---|
| `no-circular` | universelle (error) | Interdit A → B → A |
| `no-orphans` | universelle (warn) | Signale les modules non importés |
| `hooks-only-used-by-components-or-entry` | métier (error) | Protège la pureté du dossier `hooks/` |
| `no-import-of-entry-points` | métier (error) | Protège les entry points React (`index.js`, `profile-send-message.js`) |

Les règles métier encodent une intention architecturale qui, sans enforcement, ne repose que sur la mémoire et la discipline des contributeurs — humains ou agents.

## Résultat du premier run

Cible : `web/modules/custom/commu_inbox/js/src/` (17 modules, 17 dépendances).

- **0 erreur, 1 warning**
- Le warning `no-orphans` touche `profile-send-message.js` → faux positif : c'est un entry point React monté par Drupal via `drupalSettings`, jamais importé depuis un autre fichier JS.
- Ajustement à prévoir : exclure les entry points légitimes de la règle `no-orphans`, ou les tagger explicitement.

Rapport brut : `reports/dep-cruiser.err.txt`.

## Apprentissages

- Les règles universelles (`no-circular`, `no-orphans`) sont immédiatement déployables sur n'importe quelle codebase JS/TS sans design discussion préalable.
- Les règles métier demandent un design agreement avec le tech lead owner du bounded context — c'est là que l'outil devient structurant pour l'archi AI-native.
- La définition des règles est **itérative** : premier run → faux positifs découverts → affinage progressif des exclusions.
- La valeur principale n'est pas dans la précision du linting initial, mais dans l'**inversion du réflexe** : passer de "c'est écrit dans le wiki" à "la CI bloque si tu ne respectes pas".

## Outil testé — jscpd (duplication detection)

[`jscpd`](https://github.com/kucherenko/jscpd) — détecteur de duplication multi-langage. Il :

- Parcourt une codebase et identifie les blocs de code répétés (au-delà d'un seuil de tokens/lignes)
- Supporte PHP, JS/JSX, Twig, TypeScript, et plus
- Génère un rapport JSON et console ; peut bloquer la CI si un seuil de duplication est dépassé
- Complémentaire de `dependency-cruiser` : là où dep-cruiser contrôle les **boundaries**, jscpd contrôle la **redondance**

## Config jscpd (`jscpd.config.json`)

```json
{
  "threshold": 5,
  "minLines": 8,
  "minTokens": 50,
  "format": ["php", "javascript", "jsx", "twig"]
}
```

Seuil de duplication à 5% — au-dessus, la commande sort en erreur (CI rouge).

## Résultats sur `web/modules/custom/` (875 fichiers)

| Format | Fichiers | Lignes | Clones | Duplication |
|---|---:|---:|---:|---:|
| PHP | 659 | 94 291 | 308 | **6.03 %** |
| JavaScript | 65 | 5 540 | 5 | 1.35 % |
| Twig | 151 | 6 984 | 28 | 6.07 % |
| **Total** | **875** | **106 815** | **341** | **5.79 %** |

Seuil dépassé (5.79 % > 5 %) → **la CI aurait bloqué**. C'est le pattern `enforcement machine` en action : le constat est factuel, non-négociable, ne dépend ni de la vigilance d'un reviewer ni d'une mémoire humaine.

## Cas révélateurs identifiés

### 1. Logique Stripe dupliquée entre 3 modules

- `commu_abonnement/js/stripe.subscribe.js` (23 lignes identiques à…)
- `commu_licenses/js/stripe.subscribe.js`
- `commu_commerce/js/stripe-setup-card.js` (20 lignes identiques)

Risque : un agent qui corrige un bug Stripe dans un seul des 3 modules ignore les 2 autres copies — divergence silencieuse, bug qui re-surgit en prod.

### 2. `APIClient.php` vs `APIClientTest.php` (52 lignes identiques)

Le test duplique l'implémentation. C'est du **test théâtre** : il valide que le code fait ce qu'il fait, pas ce qu'il doit faire. Particulièrement problématique en AI-native où les agents génèrent souvent l'impl + le test ensemble.

### 3. Templates Twig dupliqués

- `commu-edit-subscription.html.twig` vs `commu-edit-offer.html.twig` (14 puis 9 lignes)
- `demo-service-offers.html.twig` vs `service-offers.html.twig` (26 lignes)

Candidats à extraction en include/macro Twig partagée.

### 4. Duplication intra-fichier

- `ConsultingSubscription.php` : 9 lignes répétées dans le même fichier → extraction en méthode privée évidente
- `commu_professionnels.post_update.php` : 17 lignes dupliquées

## Apprentissages cumulés (dep-cruiser + jscpd)

- Les deux outils se **complètent** : dep-cruiser regarde la **structure** des imports, jscpd regarde le **contenu** des fichiers.
- La mise en place est **très rapide** via npx — aucune installation persistante, seuils configurables par fichier JSON/JS.
- Le plus gros gain n'est pas la détection initiale, c'est le **basculement en mode bloquant** : passer de "wiki avec rules" à "CI rouge si violé" inverse la charge de vigilance.
- Sur Skod, 5.79 % de duplication n'est pas catastrophique pour une codebase de 10 ans, mais les cas identifiés (Stripe cross-module, test-qui-duplique-l'impl) sont des dettes qu'un agent amplifierait silencieusement.

## Volet 3 — MCP server TypeScript (`mcp-servers/skod-consultations/`)

### Contexte & motivation

Les deux premiers volets (dep-cruiser, jscpd) s'attaquent à l'**enforcement structurel** du codebase. Ce troisième volet adresse une problématique orthogonale : **comment exposer l'état d'une codebase legacy à un agent LLM pendant le développement**.

Le pattern classique (agent Python interne ↔ Drupal via REST) reste pertinent pour du service-à-service qu'on contrôle des deux côtés. Mais pour brancher un **LLM-driven IDE** (Claude Code, Cursor) sur l'état de Skod, le protocole dédié c'est le **Model Context Protocol (MCP)** d'Anthropic.

**Différence structurante** :
- REST = hand-codé des deux côtés, pas d'introspection native
- MCP = schémas découvrables, un serveur consommable par N clients LLM, tool definitions directement compatibles avec le pattern `tool_use` des modèles

### Design choices

- **Stack** : TypeScript + `@modelcontextprotocol/sdk` + Zod (source de vérité typée pour les schémas)
- **Transport** : stdio. Le process est spawné par Claude Code en enfant, pas de réseau. La frontière de process est la frontière de sécurité.
- **Scope** : bounded context `commu_consultation_order` + `commu_marktplace` (domain resolution). Aligné sur le pattern "un MCP par bounded context".
- **Read-only strict** : aucun tool ne mute quoi que ce soit. Pour une mutation future → transport différent, Human-in-the-Loop, audit trail.
- **Exécution** : shell-out vers `ddev drush php:eval` via `child_process.spawn` avec un args-array (pas de shell, pas d'injection possible)

### Tools exposés

| Tool | Rôle |
|------|------|
| `list_consultations` | Liste consultations, filtre par état (draft/processing/…) |
| `get_consultation_stats` | Agrégats par état et par bundle type |
| `get_domain_info` | Métadonnées d'un domaine Skod |

### Couche sécurité (Principle of Least Privilege)

Appliquée à trois niveaux :

1. **Shell** — `spawn('ddev', [...args])` (args array), jamais `exec(string)`
2. **PHP snippet** — toujours une constante hardcodée en TS. Les filtres utilisateur arrivent via environment variables, lus côté PHP par `getenv()`. La forme de la requête n'est jamais dépendante de l'input.
3. **Zod** — tous les inputs passent par un schema strict (enum, int bounds, regex). `.parse()` rejette tout ce qui n'est pas conforme avant d'atteindre le PHP.

### Validation

- ✅ `tsc` compile sans erreur ni warning (strict mode, sourceMaps, declarations)
- ✅ Smoke test MCP : `initialize` + `tools/list` répondent correctement, les 3 tools apparaissent avec leurs schemas JSON complets
- ✅ stderr/stdout séparés : stdout = protocole JSON-RPC, stderr = logs

### Apprentissages (volet 3)

- **MCP ≠ REST** : pas un remplacement, une complémentarité. REST pour service-à-service interne, MCP pour agent-LLM-qui-veut-introspecter.
- **Zod comme source de vérité** : un seul endroit définit les types + la validation + le schéma exposé au client. Élimine la dérive contract-vs-code.
- **stdio transport** = simplicité radicale. Pas d'auth, pas de port, pas de TLS ; la sécurité est l'isolation process + les garde-fous côté code (PoLP).

### Refactor #1 — Inline PHP → custom drush command (dossier `drupal-integration/commu_mcp_consultations/`)

**Pourquoi le refactor.** Le premier jet mettait des snippets PHP hardcodés dans les fichiers TypeScript. Ça marche, ça compile, le smoke test passe. Mais en review VP Eng, trois problèmes ressortent :

1. **Duplication de logique métier** — si `commu_consultation_order` a déjà un service Drupal pour lister des consultations, mon MCP ré-implémente à côté. Divergence silencieuse garantie quand le service Drupal évolue.
2. **Non testable** — le PHP inline ne tourne qu'après bootstrap Drupal ; pas de PHPUnit possible sans stack complet.
3. **Pas de type safety à la frontière** — mon interface TS et le `echo json_encode(...)` PHP ne sont liés par aucun contrat. Si un champ est renommé côté Drupal, le TS reçoit du `null` sans erreur visible.

**Le pattern propre.** La logique Drupal vit dans un **module Drupal dédié** qui expose des **custom drush commands**. Le TS devient un *thin adapter* qui spawn drush et parse du JSON.

Structure ajoutée : `drupal-integration/commu_mcp_consultations/`

```
commu_mcp_consultations/
├── commu_mcp_consultations.info.yml        # Metadata module Drupal
├── drush.services.yml                      # Enregistrement du service drush
└── src/Commands/
    └── ConsultationMcpCommands.php         # 3 commandes drush (list, stats, domain-info)
```

Le TS devient trivial côté tools :

```typescript
// Avant (inline PHP, ~60 lignes) :
const PHP_SNIPPET = `...60 lignes de PHP...`;
return drushJson(PHP_SNIPPET, { STATE: ..., LIMIT: ... });

// Après (thin adapter, 3 lignes) :
return drushCommandJson<ConsultationSummary[]>("commu-mcp:consultations:list", {
  state: input.state,
  limit: input.limit,
});
```

**Bénéfices de la nouvelle architecture :**

- **Ownership clair** : la logique Drupal est ownée par le tech lead de `commu_consultation_order`, pas par l'équipe MCP. Si demain l'entité Consultation évolue, c'est le module Drupal qui s'adapte — le TS ne bouge pas tant que le contrat JSON tient.
- **Testable en PHPUnit** : les drush commands se testent comme n'importe quel service Drupal — fixture entity, appel de la méthode, assertion sur le JSON émis.
- **Review séparable** : tech lead PHP review le `.php`, tech lead Node review le `.ts`. Chacun sur son terrain, pas de review cross-langage.
- **Le MCP server TS devient minuscule** : `drush-client.ts` sait juste spawner drush et parser JSON. `tools/*.ts` sont des mappings 3 lignes. Maintenance divisée par 3.

### Apprentissage méta (le plus important pour l'entretien)

Le *prototype → refactor* n'est pas une faiblesse du process, c'est le process. On prototype vite pour valider le concept (MCP fonctionne avec Skod), on identifie la dette **au moment où elle commence à coûter** (difficulté à testing, duplication), on refactore avant qu'elle ne se propage. **Cycle kaizen littéral** — mesure, apprentissage, amélioration.

Narrative pour Olivier : *"Le premier commit est un prototype inline pour valider que l'intégration MCP + Drupal tient. Le deuxième commit (refactor) déplace la logique dans son bounded context parce que c'est là qu'elle appartient. Le chemin est dans le git log — ça montre aussi à une équipe qu'on assume l'itération plutôt que de poser du parfait dès le début."*

---

## Pistes suivantes (cumulées sur les 3 volets)

### Enforcement

- [ ] Affiner `no-orphans` (dep-cruiser) pour exclure les entry points légitimes
- [ ] Pour Stripe : extraire `commu_stripe_common/` ou consolider dans `commu_plugins_payment`
- [ ] Extraire les macros Twig partagées (forms edit subscription / offer)
- [ ] Étendre la démarche à `commu_react` (comparer avec `commu_inbox/js/src`)
- [ ] Brancher en CI (GitHub Actions ou équivalent) avec blocage PR sur erreur
- [ ] Évaluer les alternatives : `nx`, `turborepo`, `eslint-plugin-boundaries`, `pmd-cpd` (alternative à jscpd)
- [ ] Générer un graphe DOT/SVG de `commu_inbox` pour visualisation de la structure

### MCP

- [ ] Ajouter un tool `get_professional_stats` (bounded context professionnels)
- [ ] Tester l'intégration réelle avec Claude Code, capturer un workflow type
- [ ] Mesurer la valeur — combien de context switches en moins sur une journée
- [ ] Étudier le pattern **Resources** MCP (en complément des Tools) pour exposer des vues read-only comme des URIs
- [ ] Publier un "MCP dev toolkit Skod" consolidant plusieurs serveurs (billing, consultations, domains, orders)

---

## Comment reproduire

### dep-cruiser

```bash
npx --yes dependency-cruiser@latest \
  --config rnd/ai-native-tooling/dep-cruiser.config.cjs \
  --output-type err \
  web/modules/custom/commu_inbox/js/src
```

### jscpd

```bash
npx --yes jscpd \
  --config rnd/ai-native-tooling/jscpd.config.json \
  web/modules/custom/
```

### MCP server skod-consultations

```bash
cd rnd/ai-native-tooling/mcp-servers/skod-consultations
npm install
npm run build
# Puis configurer dans ~/.config/claude-code/mcp.json (voir README.md)
```

Aucune installation globale persistante — `npx` gère les binaires via le cache `~/.npm/_npx`, le MCP server installe ses deps dans son propre `node_modules/` (gitignoré).
