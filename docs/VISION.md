# Skod — Vision

> **One line**: Skod is the Calendly for paid email responses.

Put a Skod link in your LinkedIn, Twitter, email signature, or
linktree. Anyone clicks the link, pays your configured price, and
sends you a message. You reply from your normal Gmail or Outlook
inbox — no new platform to learn, no new interface to check. Skod
handles payment capture, SLA enforcement (refund on timeout), and
reply detection. You keep the money when you answer.

## Who Skod is for

Anyone **legally able to invoice** — experts, freelancers,
consultants, creators, influencers, auto-entrepreneurs — who has
**scarce attention** and **ongoing inbound demand**. The value Skod
captures is the money people were already willing to pay for your
response, but that your email inbox was silently giving away for free.

### Archetypes

**Arthur, 35, AI infrastructure expert.** Receives daily DMs and
emails asking for help setting up AI-native infra. Can't reply for
free, certainly not within 48 hours. Sets a price that matches his
expertise and the demand. Replies from his normal email when time
allows; earns on each response.

**Maître Martin, 40, avocate fiscaliste.** Used to answer free DMs
and emails from her community — legal questions from clients,
prospects, friends-of-friends. Skod lets her invoice her time
without the overhead of a full consultation booking. Her inbound
volume did not change; her revenue did.

**Christelle, 28, beauty influencer.** 200k followers, hundreds of
DMs per day she physically cannot read. Her Skod link in her
Instagram bio lets fans pay ~€15 to guarantee a private response
within 3 days. A small percentage of her audience pays — but in
absolute numbers it matters, and the rest is filtered out cleanly.

The common thread across all three: **scarce attention + existing
inbound demand**. Skod is not a discovery tool. Its users already
have audiences. Skod captures value from the traffic they already
have.

## The wedge

Competitors in adjacent spaces all force users onto their own
platform: Clarity.fm, Cameo, Intro, paid-newsletter DM features,
legal-tech booking platforms. The expert has to create a profile,
learn a UI, check it regularly.

Skod does not move the workflow. The expert **never leaves their
existing email client**. The Skod link lives where links already
live (bios, signatures, linktrees). Replies happen in Gmail/Outlook.
The only Skod UI the expert ever sees is the initial setup of their
link + price + SLA.

This is structurally the **Calendly pattern**: embeddable link,
lives in your existing web presence, handles the transaction layer,
never becomes the destination. Calendly replaced platform-based
scheduling tools by removing the need to be on a platform. Skod
applies the same pattern to paid messaging.

## Primary positioning (north star at 3 years)

**Monetization infrastructure, not marketplace.** Analog companies:
Calendly, Stripe, Substack, Gumroad. You do not go to these
platforms to find someone; you use them because someone you already
knew sent you there.

Ties to the architecture:
[`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md),
[`ADR 0007 — Landing Page Manager`](adr/0007-landing-page-manager-architecture.md),
[`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md).

## Scale ambition at 3 years

- **1,000 active pros** with a live Skod link
- **~1 paid message per pro per week** (~52,000 transactions/year)
- **Commission model** — 10-20 % of each message price
- **Premium layer** — white-label subscription (custom domain,
  branding) + paid options: human concierge, AI pre-filled
  responses, agent-assisted replies
- **Target revenue** — ~€15,000 MRR ≈ €180,000 ARR at year 3

This is explicitly a **capital-efficient micro-SaaS profile**, not
a VC-rocket ambition. Whether this figure is a ceiling or a 3-year
milestone on a larger trajectory is a Strategy-layer question (level
2 of the cascade, upcoming in
[`docs/STRATEGY.md`](STRATEGY.md)).

## What Skod is NOT

- **Not a marketplace to find experts.** Possible extension at 3+
  years; not the north star now.
- **Not a Gmail replacement.** Skod stays as a link + webhook on
  top of existing email. An integrated inbox view could be
  technically explored as a differentiator, but only if cheap to
  build.
- **Not a video / call / webinar platform.** The current codebase
  includes `appel`, `visioconference`, `webinar`, `projet`,
  `produit_digital` types inherited from an earlier product scope.
  At the 3-year horizon, Skod is strictly **paid private message
  only** — legacy types will be deprecated and removed from the
  codebase as a dedicated cleanup chantier.
- **Not generic B2C.** Users must be legally able to invoice
  (freelancers, auto-entrepreneurs, regulated professionals,
  registered structures). Not for random individuals.
- **Not multi-country at 3 years.** France + French-speaking
  regions organically. International expansion is a year-3+
  question.
- **Not a content platform.** No newsletters, no broadcast, no
  podcast, no paid articles. Skod is strictly **1:1 private paid
  messaging**.

## Optionality kept on the table

Roads deliberately not taken today, but worth revisiting if the
business calls for it:

- Discovery marketplace layer on top of the monetization base
  (possible year-3+ move)
- Integrated unified inbox view (if technically cheap)
- International expansion (year-3+)
- Premium services ladder: human concierge → AI pre-filled
  responses → agent-assisted replies (already suggested as
  revenue-expansion paths)

## See also

- [`docs/META-PLAN.md`](META-PLAN.md) — this doc sits at level 1 of
  the vision cascade
- [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) — how we deliver
  this vision operationally (level 3)
- [`docs/ROADMAP-ai-native-organization.md`](ROADMAP-ai-native-organization.md) —
  the sequence of work (level 5)
- [`docs/STRATEGY.md`](STRATEGY.md) — how we get from today to this
  vision (level 2, upcoming)
