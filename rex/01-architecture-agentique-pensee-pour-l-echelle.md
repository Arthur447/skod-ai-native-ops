# Une architecture agentique pensée pour l'échelle

> Six verrous pour déployer des agents IA sur un vrai codebase sans perdre le contrôle — et pourquoi je les ai bâtis avant d'écrire le premier agent.

J'ai piloté plusieurs agents IA pour mener un projet ambitieux : la refonte complète de mon SaaS, Skod — une boîte mail payante — de Drupal vers une stack TypeScript / Next.js.

La question que tout le monde se pose en ce moment est exactement celle qui m'a occupé : comment déployer l'IA sur une codebase réelle sans que ça parte en vrille ? Codebase qui gonfle, PR en rafale, code mort, dérive d'architecture, tests fantômes. La vélocité d'un agent ne vaut rien si elle produit une dette que personne ne contrôle.

Mon parti pris : ne pas chercher la vitesse d'abord, mais la robustesse et le contrôle de la qualité — et laisser la vélocité en découler. Concrètement, ça veut dire contraindre l'IA dans le SDLC : l'agent n'est pas un électron libre, c'est un contributeur soumis aux mêmes verrous mécaniques qu'un humain, en plus stricts.

Une précision qui cadre tout le reste : je travaille seul sur Skod, mais je conçois chaque mécanisme comme si l'équipe existait déjà. Parce que ce qui ne survit pas à une seconde session ne survivra pas à un second développeur. Voici les six verrous que ça donne.

## 1. Bounded contexts — l'unité de travail d'un agent

Un agent a une limite physique : sa fenêtre de contexte. Lâché sur un monolithe, on lui demande de raisonner sur ce qu'il ne peut pas tenir en mémoire. J'ai donc découpé l'application en monolithe modulaire, 8 bounded contexts (auth, pro, visitor, billing, thread, email, agent, admin). Chacun expose une surface publique et cache son implémentation dans `internal/`.

Le cloisonnement ne tient que s'il est mécanique — et c'est deux verrous, pas un. Un verrou d'adhérence : chaque import cross-module doit être déclaré dans un `contracts.json`, sinon la CI casse. Un verrou de gel : la surface publique exportée est figée ; la modifier exige une branche `architecture/*` ou une approbation explicite. Un agent ne peut pas élargir l'API d'un module en douce. À ça s'ajoute une règle ESLint maison (`skodBoundariesPlugin`) qui interdit d'importer le `internal/` d'un autre module.

## 2. Kill switches — ne jamais laisser le coût courir

Un système agentique pensé pour l'échelle pose ses kill switches dès le jour 1, jamais en rattrapage. Défense en profondeur, quatre couches : compte bancaire dédié plafonné (la digue hors-logiciel) ; plafond provider côté Anthropic, auto-reload coupé ; plafond par agent déclaré dans son `tools.yaml`, vérifié par un circuit breaker avant chaque appel ; et un plafond global.

Ce qui rend tout ça possible : la centralisation. Tous les appels passent par une seule fonction, `agentRunner.invoke()`, et une règle interdit d'importer le SDK Anthropic ailleurs. Pas d'appel sauvage, pas d'angle mort.

La preuve par l'échec — et c'est elle qui rend la leçon crédible : le 27 mai, un incident a révélé que mon « AI Factory » faisait des appels directs en contournant le tracker ; le circuit breaker ne pouvait pas se déclencher. Le design était bon, il manquait le verrou structurel qui empêche de le contourner. Corrigé dans la foulée. Une politique de coût qui n'est pas mécaniquement non-contournable n'est pas une politique de coût. (J'ai détaillé cet incident dans [un autre article](02-constitution-morale-vs-verrou-mecanique.md).)

## 3. La CI/CD comme mur de verrous

À l'échelle, le plus grand levier IA n'est pas de coder des features — c'est de blinder la qualité de sortie. J'ai transformé la CI en mur : si une règle ne passe pas, la PR est bloquée, point. Le gate-1 (mécanique) impose une dizaine de contrôles : nom de branche conforme (traçabilité ticket↔branche), adhérence et gel des contrats, audit-trail, lint + boundaries, typecheck strict (pas de `any`), couverture par fichier modifié, build, tests sans `.skip` ni `.only`, schéma Prisma. Puis le gate-2 ajoute six classes de blockers : TDD, dérive architecturale, scope, sécurité, reviewability.

Ce travail se fait avec les équipes — les verrous encodent leurs standards. Mais une fois encodés, ils ne sont plus négociables au cas par cas. C'est ça, contraindre l'IA dans le SDLC.

*Preuve : `gate-1.yml`, `gate-2-auto-reviewer.yml`, ADR 0003 (Definition of Done).*

## 4. Le TDD devient enfin systématique

Le grand débloquage des agents : les tests, qui prenaient « trop de temps » et n'étaient jamais vraiment faits, deviennent triviaux. Autant en faire un standard mécanique. Ma règle est dans la CI : couverture ≥ 90% par fichier modifié (pas un seuil global), avec une politique nette — « unit-cover domain, E2E-cover delivery ». La logique métier porte la barre unitaire ; la couche delivery est couverte par les E2E Playwright. Un fichier de domaine qui change sans test qui l'exerce → PR bloquée.

Sur l'Epic « répondre à un email à la voix », les 7 tickets ont produit 168 cas de test sur 28 fichiers — un volume qu'aucun humain n'aurait écrit à la main dans le temps imparti.

*Preuve : `check-changed-coverage.mjs`, gate-2 `tdd-violation`, Vitest + Playwright.*

## 5. Revue multi-niveaux — l'humain en dernier, parce qu'il est responsable

Avant qu'un humain ne regarde, le code passe par plusieurs filtres : self-review de l'agent dev (tests, lint, typecheck, couverture, Definition of Done remplie) ; puis l'auto-reviewer (gate-2) qui vérifie les garde-fous mécaniques et architecturaux ; puis la revue humaine (gate-3), toujours en dernier. Le merge est toujours humain. Aucun agent ne merge — l'humain est garant du code qui part en prod.

## 6. Observabilité — pouvoir rejouer ce qui a cassé

Le contrôle à l'échelle suppose qu'en cas d'incident, on puisse investiguer. Je maximise volontairement l'information sauvegardée, sur trois niveaux : les ADR documentent chaque choix (13 dans le repo) ; l'agent écrit sur le ticket GitHub comme un dev d'avant l'IA — plan, décisions, demandes de clarification, le ticket raconte l'histoire sans lire le diff ; et chaque session laisse un journal versionné (prompts, réponses, modèle, décisions), indexé par ticket. Ce n'est pas optionnel : un verrou de CI (« Loi 4 : pas de boîte noire ») bloque tout ticket qui avance sans son journal. En cas de choix défaillant, on rejoue la session.

## Du POC à l'échelle, c'est le SDLC qui contraint l'IA

Mon passage du POC à l'échelle tient en une phrase : implémenter l'IA dans les process existants de l'entreprise, et faire en sorte qu'elle soit contrainte par le SDLC — pas l'inverse. Ces six verrous ne sont pas des freins à la vélocité : ce sont les rails qui la rendent soutenable.

Le résultat : une fois l'architecture en place, la refonte a très fortement accéléré. Mais le vrai message, c'est qu'il faut bâtir les rails d'abord — ça prend des semaines, et chaque nouvelle capacité des modèles oblige à les adapter. C'est ce que j'ai fait à l'arrivée d'Opus 4.8, quand l'orchestration des agents, que je gérais à la main, est passée dans le modèle lui-même. ([Autre article](03-orchestrateur-multi-agents-opus-4-8.md).)

> À l'échelle, on ne contraint pas l'IA avec des consignes — on la contraint avec des verrous mécaniques non-contournables.
