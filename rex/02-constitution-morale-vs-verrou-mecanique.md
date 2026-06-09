# Une constitution morale parfaite ne vaut pas un verrou mécanique

> Ce qu'un run d'agent hors-scope m'a appris sur le scale AI-native.

Le 27 mai, mon usine à agents a généré 1 537 lignes de TypeScript. Tests compris, proprement écrites, seize exports déclarés. Le problème : sur un module qui n'existe plus.

Je migre une plateforme de Drupal vers TypeScript. Après plusieurs pivots, j'ai réduit le scope à ce qui est réellement utilisé aujourd'hui. Tout est écrit noir sur blanc dans un document de parité qui liste chaque feature legacy avec sa disposition : MIGRATE, OUT, REVIEW. Le module des abonnements ? Marqué OUT. Hors-scope. Personne ne devait y toucher.

L'agent l'a migré quand même. Pipeline complet — Analyst, Architect, Developer — sur un module condamné. 1 537 lignes de code mort.

## Le détail qui rend l'histoire intéressante

L'agent avait la règle. Mot pour mot, dans son fichier d'identité :

> "You only implement a parity-audit item with disposition MIGRATE. If the requested feature is marked OUT, halt and report instead of writing code."

La clause halt-on-OUT était là. Explicite. L'agent avait une constitution morale parfaite. Et il a quand même écrit le code.

Pourquoi ? Parce que la règle vivait dans l'identité texte de l'agent, pas dans le graphe d'orchestration. Concrètement : un opérateur humain — moi, en l'occurrence — qui lance le pipeline en lui passant directement le module à migrer court-circuite la règle. Le graphe n'a jamais lu le document de parité. Il a fait confiance à l'agent pour s'auto-réguler. Et l'agent, sollicité directement, a exécuté.

C'est là que j'ai compris un truc que je formulerais comme ça : l'identité texte d'un agent n'est pas un verrou.

Un agent peut avoir la constitution la plus rigoureuse du monde. Tant que la validation n'est pas mécanique — un nœud dans le graphe qui dit stop avant même que l'agent réfléchisse — il existe toujours un chemin pour la contourner. L'instruction en langage naturel n'est pas binaire. Elle est interprétable. Et tout ce qui est interprétable peut être mal interprété, ou simplement court-circuité par un appel direct.

## La remédiation n'a pas été de mieux écrire l'agent

Ça n'aurait rien changé. On a ajouté un verrou déterministe : un nœud validator, placé avant l'Analyst, qui lit le document de parité et s'arrête net — exception levée — si la disposition n'est pas MIGRATE. Plus d'interprétation. Une règle quantifiable, mesurable, qui ne laisse aucune place au doute. Si le module est OUT, le pipeline ne démarre pas. Point.

## La leçon dépasse mon cas

Soyons clairs : ce n'est pas un scoop. Gartner en a fait un « guardrail stack », l'OWASP appelle ça excessive agency, et la plupart des gens qui mettent sérieusement des agents en prod en 2026 sont arrivés à la même conclusion — la frontière entre raisonnement et action doit être verrouillée mécaniquement, pas confiée au modèle. Le principe est connu. Là où je veux être utile, c'est sur le comment concret, et sur ce que ça coûte quand on s'en aperçoit trop tard.

Parce que la leçon, elle, tient en une phrase : on verrouille avant de lancer la machine, pas après.

J'avais construit l'usine à agents avant ses propres garde-fous. Le réflexe classique — « on durcira après le premier vrai run ». Le premier run a coûté 1 537 lignes mortes et une faille de gouvernance. Pas dramatique ici, zéro impact prod. Mais la prochaine fois, ça peut être un appel LLM qui fait exploser un budget, ou un module sensible touché par erreur.

Je ne crois donc pas à la délégation aux agents fondée sur la confiance dans leur bon comportement. Je crois à une philosophie de scale fondée sur les verrous : tout ce qui peut être anticipé est verrouillé mécaniquement avant le lancement. Et à chaque incident, on renforce — on ajoute le verrou qui aurait empêché ce qui vient de se passer, et on le codifie en règle pour la suite.

Le « pas de prompt, du déterministe » est en train de devenir un lieu commun. Cette boucle de durcissement continu, elle, l'est beaucoup moins — et c'est elle qui fait la différence entre une démo qui impressionne le temps d'un run et une usine qui tient sur six mois.

Ce n'est pas de la défiance envers les agents. C'est l'inverse. C'est exactement ce qui me permet de leur déléguer de plus en plus, parce que je sais que le substrat ne les laissera pas déraper. La capacité d'un agent n'est utile que si l'usine autour de lui est non-contournable.

Une constitution morale, c'est bien. Un verrou mécanique, c'est ce qui tient.

---

*Incident documenté dans mon repo : escalation log du 27/05/2026, remédiation P1.1 (nœud validator halt-on-OUT), PR #86.*
