# Benchmark Fable 5 sur feature produit : quel niveau de gate humain pour accélérer sans perdre en qualité

> À la sortie de Fable 5, j'ai voulu le tester sur un cas réel de mon business, pas sur un kata.

Sur Skod, la feature « abonnements » : permettre aux professionnels de proposer un forfait mensuel à leurs clients. Pour donner un ordre de grandeur, le développement équivalent sur la V1 m'avait pris environ un mois.

Premier test, prompt volontairement naïf sur claude.ai/code : « ajoute la possibilité pour les pros de proposer des abonnements ». Quinze à vingt minutes plus tard : une PR de 5 530 lignes, 44 fichiers. Ça compile, les tests sont verts, l'architecture modulaire est respectée.

Et moi devant cette PR, incapable de répondre à une question de base : que se passe-t-il si le paiement échoue au renouvellement ? Combien de retries, quand, qui coupe l'accès ? Je ne le savais pas. Je n'avais pas pris ces décisions. Je ne savais même pas qu'elles existaient.

## Le vrai sujet

Ce malaise a un nom depuis quelques mois : comprehension debt — l'écart entre le code qui existe dans un système et la part de ce code qu'un humain comprend réellement. Addy Osmani a popularisé le terme en mars ; la généalogie remonte à Peter Naur (1985), pour qui le produit du développement n'est pas le code mais la théorie qui vit dans les têtes de l'équipe. Le sujet est partout en ce moment. Mais en lisant tout ce qui se publie, un constat : ce ne sont que des essais d'opinion. Personne ne mesure rien.

Alors j'ai mesuré, sur mon propre produit.

## Le dispositif

Même feature, même SHA de départ, trois approches. L'EPIC complète : 9 tickets, du modèle de données à la résiliation, en passant par les webhooks Stripe, le quota, l'upgrade avec prorata.

**Bras A — autonomie naïve.** Le prompt de deux lignes ci-dessus. C'est la baseline.

**Bras B — SDLC human-in-the-loop complet.** Construit pour l'occasion : tickets Gherkin détaillés, déclaration des modules touchés (`touches[]`) et lus (`reads[]`), note de criticité dérivée par script depuis une matrice versionnée (jamais éditée à la main — le script refuse même de calculer tant que les poids ne sont pas calibrés par un humain), mode plan forcé par hook au-dessus d'une bande de criticité, validation humaine du plan, commentaires résiduels adjudiqués, review du rapport de conformité diff-vs-plan plutôt que du diff brut, back-flow documentaire bloquant.

**Bras C — autonomie spécifiée.** Fable 5 en autonomie totale, deux commits max, interdiction de s'arrêter pour valider — mais avec un prompt qui contient toutes les spécifications techniques consolidées : la décision structurante Stripe Billing natif, la cadence de retries, les scénarios Gherkin par ticket, et cinq scénarios de test obligatoires. L'hypothèse simulée : en conditions réelles, j'aurais consolidé ce cadrage en amont via un ultraplan validé. Le bras C n'a pas eu accès au code du bras B.

L'instrument de mesure, pré-enregistré avant le premier run : cinq questions métier (échec de paiement au renouvellement, webhook livré en double, CB expirée en milieu de cycle, job exécuté deux fois, prorata d'upgrade), plus le diff des décisions entre les bras.

## Les chiffres

|  | Bras A | Bras B | Bras C |
|---|---|---|---|
| Lignes / fichiers | +5 530 / 44 | +16 915 / 133 | +9 904 / 77 |
| dont code feature | 3 992 | 7 468 | 6 189 |
| dont tests (ratio tests/feature) | 1 538 (0,39) | 8 608 (1,15) | 3 356 (0,54) |
| dont docs, ADR, runbooks | 0 | 708 | 359 |
| Temps humain | ~15 min | ~156 min visibles | ~60 min de review + spec amortie du bras B |
| Wall-clock | 15-20 min | ~25 h sur 2-3 jours | une matinée |
| Violations d'architecture | 0 | 0 | 0 |
| Oracles (tests DB réelle) | aucun | écrits et exécutés en CI | écrits, auto-certifiés verts, non exécutés |

Trois lectures.

**Un :** les trois bras respectent l'architecture. Lint de frontières, contrats de modules gelés, vérification du périmètre en CI — zéro violation partout, même sur le run naïf. Autrement dit, l'outillage statique ne discrimine plus rien : tout ce qui sépare les trois bras est sémantique, au niveau des décisions.

**Deux :** à spec égale, le code feature de B et de C est de taille et de qualité de design comparables. Le delta de volume, c'est presque entièrement des tests (×2,6) et de la doc (×2).

**Trois :** la ligne qui compte est la dernière. B a exécuté ses oracles sur une vraie base. C les a écrits — et s'est déclaré vert.

## La limite de l'autonomie totale

J'ai donc exécuté les oracles du bras C après coup, sur une vraie base Postgres. Résultat : crash sur le scénario pré-enregistré n°2 : le webhook `checkout.session.completed` livré en double. Un guard `=== null` qui ne couvre pas `undefined` sur `default_payment_method` ; TypeError au runtime, sur le chemin d'idempotence des webhooks de paiement. Une ligne de fix, 8/8 ensuite.

Une ligne. Mais le genre de ligne qui se découvre en production, un samedi soir, sur une redelivery Stripe. Et l'ironie vaut la peine d'être racontée : le bug vit dans une fonction qui s'appelle `syncBillingCustomerCard`, et qui sert à maintenir une copie locale, dans la base Skod, des informations de la carte bancaire du client — marque, quatre derniers chiffres, mois et année d'expiration. C'est précisément l'approche que le plan du bras B avait mise sur la table, puis rejetée à l'adjudication. Mon argument à l'époque : maintenir un miroir local oblige à se brancher sur les webhooks `payment_method.updated` pour suivre les renouvellements silencieux de carte (le « Card Account Updater » de Stripe peut mettre à jour la date d'expiration sans que personne ne s'en aperçoive) — et un webhook manqué = miroir périmé = client non prévenu de l'expiration. Conclusion B : on lit la carte directement chez Stripe au moment où on en a besoin. Pas de miroir, pas de désynchronisation possible. Le bras C, lui, a tranché seul pour le miroir, en silence, et a construit toute l'infrastructure que B avait refusé de construire — y compris le handler du Card Account Updater. Le commentaire dans le code est sans ambiguïté : « cache local de la carte par défaut ». Le bug n'est même pas dans la logique métier de E14-05 ; il est dans la machinerie de synchronisation que ce ticket n'aurait pas existé sans la décision de C de la créer.

Auto-certification ≠ vérification. « Écrit mais non exécuté » n'est pas une nuance de process : c'est la différence entre affirmer et prouver.

## Le ticket qui justifie tout le reste

E14-05, « rappels CB expirées ». Scopé `touches[]: mailing`, classé bande haute automatiquement — non pas par moi, mais par le script de criticité, parce que le ticket lit des données de paiement (plancher de criticité sur toute lecture billing). Mode plan forcé par hook : l'agent ne peut rien éditer tant que le plan n'est pas approuvé.

Et le plan, en confrontant la spec au repo réel, a découvert que la spec était fausse : « l'option lecture DB n'a, en l'état, aucune donnée à lire » — aucun miroir de PaymentMethod n'existait dans le code. Le ticket tel que scopé était inimplémentable. Halt. Dossier d'options argumenté (miroir DB + webhook + schéma vs lecture Stripe à la volée). J'ai tranché en vingt minutes, le périmètre a été amendé, la note de criticité re-dérivée, et toute la trace — options, argumentaire, décision, amendement — vit dans le ticket.

Le bras C, au même point de décision, a tranché seul et en silence. Son choix fonctionne. La différence entre les deux bras n'est pas la qualité du code : c'est que dans un cas, la décision est passée par une tête humaine et a une adresse ; dans l'autre, personne ne l'a vue passer.

C'est ça, la dette de compréhension. Pas du code pire. Du code orphelin.

## Ce qui meurt, ce qui survit

Il faut être honnête, et c'est le résultat que je n'attendais pas en construisant tout ce SDLC : « les gates interactives produisent du meilleur code » est mort. À spécification égale, l'autonomie produit un design équivalent, converge spontanément avec les choix humains sur une bonne partie des points laissés ouverts (création de l'abonnement par webhook uniquement, résiliation en fin de période, décrément du quota à l'envoi…), diverge sur d'autres (stratégie anti-zombie, couture d'intégration, marqueur d'idempotence) — et coûte 2,6× moins de temps humain, sans parler du wall-clock.

Si votre lecture s'arrête là : lancez tout en autonomie.

Mais relisez la condition : *à spécification égale*. La spec du bras C, je ne l'ai pas écrite de zéro un matin. La décision Stripe-natif sort d'un dossier d'arbitrage. La cadence J+2/J+4/J+8 sort d'une adjudication. L'interdiction du calcul monétaire local sort d'une leçon tirée de l'implémentation du bras B. Les cinq scénarios de test obligatoires sortent de mes questions pré-enregistrées. Le bras C n'a pas couru sans process : il a couru avec le process compilé dans son prompt.

La première fois dans un domaine, ce capital de spécification n'existe pas — et il se fabrique dans le mode interactif : c'est là que les bonnes questions émergent, que les options se confrontent au repo, que les arbitrages se prennent. Les fois suivantes, il se dépense en autonomie. Ma matrice de criticité, construite au départ pour doser les gates, sert finalement à décider de quelque chose de plus important : le régime, ticket par ticket — interactif quand on explore, autonome quand on exploite.

Et la compréhension dans tout ça ? Mon score de mémoire aux cinq questions est médiocre sur les deux bras — je me souviens d'avoir cadré les retries, pas du détail. Depuis les artefacts, 5/5 des deux côtés. Ce qui persiste, ce n'est pas le rappel des réponses : c'est la carte des questions — savoir qu'elles existent et où vivent les réponses. Et cette carte ne s'est formée que parce que c'est moi qui ai décidé : aux gates dans le bras B, en écrivant la spec dans le bras C. Le seul bras où aucune carte ne s'est formée, c'est le bras A — celui où personne n'a décidé. D'où une règle que je garde : la construction de spec se fait en mode questionnement, jamais en validation passive.

## La suite : le harnais déterministe

La conclusion opérationnelle, c'est donc : autonomie maximale sur les longues tâches, si et seulement si le harnais est structurellement non-contournable. La nuance compte. La plupart des « bonnes pratiques » publiées en ce moment ressemblent à ma constitution morale d'agent du printemps : des règles écrites en langage naturel, dans un CLAUDE.md ou une convention d'équipe. Un agent suffisamment compétent — Fable 5 l'est — sait les rationaliser. Un orchestrateur LLM aussi. Pendant cette expérience même, mon orchestrateur a court-circuité l'une de ses propres gates humaines parce que la règle vivait dans un prompt. Une règle dans un prompt n'est pas un verrou.

Ce que je construis maintenant — et qui fera l'objet du prochain article, avec son code sur Skod — c'est le harnais en version structurelle, où chaque règle a une incarnation déterministe :

1. **Spec exhaustive obligatoire** — un ticket sans `touches[]`, sans critères d'acceptation Gherkin, sans `reads[]`, ne peut pas changer de statut dans le projet. Pas une convention : une action GitHub qui refuse la transition.

2. **Mode plan forcé pour la bande haute** — pas une consigne dans l'identité de l'agent, un hook PreToolUse qui bloque toute édition tant que le plan n'est pas approuvé par un humain.

3. **ADR des décisions discrétionnaires bloquant** — toute décision « à ta discrétion » sans entrée ADR fait échouer la CI. L'humain review les décisions motivées, pas le diff brut.

4. **Oracles indépendants et exécutés** — les tests d'invariants (les 5 scénarios par EPIC) sont écrits depuis le Gherkin, idéalement par une session différente de celle qui implémente. Et « écrit mais non exécuté » est techniquement impossible : Postgres éphémère et Stripe test sont câblés en CI, on ne peut pas mocker l'oracle.

5. **TDD + mutation testing sur les modules critiques** — la couverture seule se contourne (un agent qui écrit ses propres tests écrit des tests qui passent). Le mutation testing mesure ce que les tests détectent vraiment ; un score de mutation faible sur billing tue la PR.

6. **Frontières d'architecture mécaniques** — ESLint-boundaries, contrats gelés, CODEOWNERS. Acquis ; respecté à 100 % dans les trois bras de cette expérience.

7. **Check de dérive de configuration** — la correction du système dépend d'un dashboard externe (Stripe Smart Retries OFF, emails OFF). Un script lit la config réelle de l'environnement et diffe contre le runbook. Sinon la doc dit OFF et le compte dit ON, en silence.

8. **Golden paths en job nightly contre Stripe test** — un parcours utilisateur complet rejoué chaque nuit contre les APIs réelles (en mode test). Si quelque chose s'est cassé en silence, je le sais le lendemain matin.

9. **Escalade contractuelle même en headless** — soft-locked, nouvelle dépendance, contradiction de spec : halt bloquant, pas une note en bas de PR.

10. **Main toujours verte par construction** — merge queue + required checks. Pendant cette expérience, un marqueur de conflit a atteint main malgré les gates par PR. La merge queue rejoue la CI sur la combinaison main + PR avant chaque merge — il devient mathématiquement impossible de casser main.

11. **Budget tokens et kill switch par bande de criticité** — un dérapage de coût ne dépend pas d'une bonne volonté ; un circuit breaker en amont du runner coupe.

12. **Les 5 questions pré-enregistrées comme rituel de merge** — à la clôture d'une EPIC, le superviseur essaie d'y répondre depuis les artefacts seuls, sans ouvrir le code. S'il n'y arrive pas, la documentation est trouée et la PR ne merge pas. C'est la métrique de compréhension qui manque à toute la littérature, à coût quasi nul.

Et la pièce d'orchestration au-dessus de tout ça, c'est précisément le sujet du prochain article. Pendant cette expérience, mon orchestrateur multi-agents — un LLM qui dispatche le travail aux sous-agents — a adjudiqué lui-même une décision de plan en violation de la convention HITL. Pas par négligence : parce que la règle vivait dans son prompt, et qu'un LLM peut toujours rationaliser une exception. Un graphe ne peut pas. Je migre donc l'orchestration vers LangGraph : une topologie déterministe où les nœuds humains sont des arêtes du graphe, pas des conventions textuelles. Les agents continuent de tourner en Claude Code CLI complet (full toolkit, abonnement Max, pas de job headless API) — la puissance reste dans le modèle. Seul le control plane change. La leçon que je retiens et qui structure les deux articles : la capability descend dans le modèle, le control plane n'y descend jamais. C'est l'opposé du « pas de prompt, du déterministe » devenu cliché : ce n'est pas tout l'agent qu'on rend déterministe — c'est ce qui l'entoure.

## Limites

n=1 : une feature, un produit, un opérateur. Le bras B a fini sur Opus 4.8 pour cause de rate limits Fable 5 — confound de modèle assumé (et donnée en soi : le coût du mode interactif inclut le quota). La spec du bras C est amortie par le bras B : son vrai coût « première fois » n'est pas mesuré ici. Les minutes humaines sont auto-déclarées. Et le but n'était pas de livrer une feature prod-ready mais de comparer des méthodes de travail : en entreprise, chaque étape serait plus rigoureuse et les temps plus élevés.

---

> Générer 5 500 lignes en quinze minutes, c'est désormais la partie facile. Savoir qui a décidé quoi dedans — c'est ça, le métier, maintenant.
