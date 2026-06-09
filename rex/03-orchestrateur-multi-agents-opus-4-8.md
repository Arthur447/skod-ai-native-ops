# J'ai supprimé mon orchestrateur multi-agents. Le modèle le fait mieux que moi.

> Comment Opus 4.8 a rendu obsolète des semaines de travail — et où ça a déplacé ma vraie valeur.

Quand on décide de faire tourner une équipe d'agents IA sur un vrai codebase, le premier réflexe — le mien comme celui de la plupart des équipes en 2025 — c'est de construire la couche d'orchestration soi-même.

C'est ce que j'ai fait. Sur Skod, j'avais monté une « AI Factory » : un graphe LangGraph avec un nœud analyste connecté au modèle, une gate d'interruption, des contrats de contexte, un hub de validation humaine asynchrone, des notifications Slack pour les gates en attente, des boucles de feedback. À côté, CrewAI pilotait un agent reviewer dédié. Le tout documenté dans un handoff d'orchestration de 629 lignes.

L'objectif était celui qu'on se fixe tous : orchestrer une équipe d'agents avec des statuts, de la sauvegarde de contexte, des gates humaines, un circuit breaker de coût. Une vraie infra. Et elle marchait. Jusqu'à ce qu'elle me coûte cher.

## Le jour où l'infra maison a montré sa limite

Le 27 mai, ma factory a tourné sur un module hors-scope et a généré environ 1 500 lignes de code mort. La règle qui aurait dû l'en empêcher existait pourtant — écrite, mot pour mot, dans l'identité de l'agent. Mais une identité texte n'est pas un verrou. (J'ai raconté [cet incident en détail ailleurs](02-constitution-morale-vs-verrou-mecanique.md) ; c'est le point de départ de tout ce qui suit.)

Alors j'ai durci. Validateur mécanique, déduplication des gates, tracking de coût au bord du graphe. Et plus je durcissais mon orchestrateur maison, plus une question revenait : est-ce que je suis en train de réécrire, en moins bien, ce que le modèle va bientôt savoir faire nativement ?

## La bascule : l'orchestration descend dans le modèle

La réponse est arrivée un matin, café à la main, pendant ma veille : Opus 4.8 venait de sortir. Le soir même, je lui confiais une Epic entière.

Ce que j'observe avec cette génération de modèle, c'est que l'orchestration multi-agents — fan-out parallèle, sous-agents isolés, gestion du contexte, reprise — n'est plus une couche que je dois maintenir à côté de Claude Code. C'est Claude Code lui-même qui l'assure.

Du coup, la bonne question n'était plus « comment je câble le graphe ? » mais « qu'est-ce que je délègue ? ». Et ma réponse a été d'élargir le périmètre : au lieu de donner un ticket à Claude Code, je lui donne une Epic.

J'ai construit deux commandes pour ça. `/new-feature` transforme un brief produit en langage naturel en une Epic structurée : un ticket parent, des sous-tickets (une User Story = un worktree shippable), les labels, et surtout le DAG de dépendances. Chaque ticket passe par un validateur déterministe avant création — pas de champ inventé. `/run-tickets` collecte les tickets prêts, respecte le DAG (un ticket n'est lancé que quand tous ses bloqueurs sont mergés), puis fait le fan-out : chaque batch dispatché à des sous-agents isolés, un worktree par ticket, plafonné à 5 en parallèle. Entre chaque couche du DAG, le merge reste humain.

Un arbitrage que je revendique : tout tourne dans un Claude Code CLI complet sur l'abonnement Max, jamais en job headless via clé API. Le réflexe « AI-native », c'est de wirer un bot autonome qui facture l'API. Je l'ai refusé — je veux la puissance du CLI complet à coût d'abonnement fixe. Mon orchestrateur n'est qu'une session que je lance.

## La preuve par l'usage

Je l'ai testé sur une vraie feature : permettre de poser ou répondre à un email par message vocal — enregistrement, transcription, texte livré dans l'email. Pas un jouet : du full-stack, transverse à cinq contextes métier. `/new-feature` a découpé l'Epic en 7 tickets avec leur DAG ; `/run-tickets` les a développés en 4 rounds successifs, chacun sur son worktree, avec ma validation entre les couches. Tout mergé le même jour.

Sur le papier, ça produit un chiffre qui devrait m'inquiéter : plus de 8 000 lignes ajoutées en une journée. Et il devrait m'inquiéter — en 2026, du code en volume n'est pas une performance, c'est une dette potentielle et une surface à reviewer. Ce qui compte, ce n'est pas le volume. C'est ce qui a empêché ce volume de devenir du chaos : le DAG qui force l'ordre des dépendances, un worktree isolé par ticket, une gate humaine entre chaque couche, et ma review finale en local — pas juste un CI vert, mais la vérification que la feature tournait vraiment.

## Ce qui change vraiment

Le gain n'est pas « l'IA code vite » — ça, on le savait. Le gain, c'est le déplacement de la couche que je maintiens.

Avant, je maintenais l'orchestrateur et je faisais la review. Deux charges. Aujourd'hui, l'orchestration est dans le modèle, et je ne garde que les deux choses qui restent irréductiblement à moi : le cadrage en entrée (la découpe, le DAG, le scope, la parité) et la review + validation fonctionnelle en sortie. L'IA est un exécuteur, pas un approbateur.

C'est la leçon que je retiens pour n'importe quelle équipe qui scale son ops IA-native : quand le modèle absorbe l'orchestration, votre valeur remonte aux deux bouts — cadrer l'entrée, garder la main sur la sortie. Le milieu, c'est le modèle qui le tient désormais. Et il le tient mieux que mon graphe maison — qui, lui, m'avait coûté 1 500 lignes mortes pour me l'apprendre.

> J'ai passé des semaines à construire l'orchestrateur multi-agents. Opus 4.8 l'a rendu obsolète en une release. Ma valeur n'a pas disparu — elle a remonté aux deux bouts : cadrer l'entrée, garder la main sur la sortie.
