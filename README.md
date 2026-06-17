# Deterministic Divination Engine

En **deterministisk, algoritmisk** tolkningsmotor som mapper stemme-utledet input
(dominante toner, intervaller, melodisk kontur) gjennom **8 esoteriske tradisjoner** til
narrativ orakeltekst — justert av sanntids-astronomi, værdata og et I Ching-heksagram
kastet fra lyden. **Ingen språkmodell, ingen ekstern AI-API, ingen ikke-reproduserbar
generering:** samme input gir samme output.

Dette repoet er **metoden som eget verk** — motoren, dens datalag, dens frosne
måleinstrument og den maskinelle evalueringen, skilt ut fra applikasjonen som bruker den
([Klangeller](https://klangeller.no), EcoDeco AS). UI, pitch-deteksjon og deling hører
til appen og er bevisst *utelatt* her; dette er kjernen man kan måle, etterprøve og
sitere.

## Hva som gjør den interessant (metodevinkelen)

Generativ orakeltekst lages vanligvis i dag av en språkmodell. Denne motoren gjør det
**uten** — den komponerer fra felt-styrte regler og per-tradisjon-banker over et frosset
vokabular. Det gir tre egenskaper en LLM-pipeline ikke gir gratis, og som her er
**maskinelt målt** (se `docs/eval/`):

- **Determinisme** — samme (toner, dato, tradisjon) → samme tekst, bit for bit.
- **Register-disiplin** — hver tradisjon holder seg i sitt eget vokabular, målt mot en
  **frosset lekkasje-vakt** (`test/lexicon.mjs`) som ble bygget *før* tradisjonene ble
  skrevet, ikke tilpasset dem i etterkant.
- **Felt-drevet arkitektur** — resonans-reglene fyrer kun når de korrespondanse-feltene
  de gjelder faktisk er til stede; verifisert mot 0 feilfyringer.

Personvern følger av determinismen: all generering er lokal og ren beregning. I appen
sendes ingen persondata ut (kun anonyme værforespørsler til Open-Meteo, EU, ingen
API-nøkkel).

## Arkitektur

Genereringen lever i to lag — skillet er bevisst
([ADR-001](docs/decisions/ADR-001-data-voice-separation.md)):

- **`src/knowledgeSource.js`** — symbol- og korrespondansedata + oppslags-API
  (data-laget).
- **`src/interpret.js`** — narrativ komposisjon per tradisjon, importerer *kun*
  data-laget (stemme-laget).

Støttemoduler (rene, uten UI-avhengighet) leverer motorens input:
`src/astro.js` (Meeus-astronomi), `src/weather.js` (Open-Meteo → ayurvedisk dosha),
`src/contour.js` (melodisk kontur), `src/iching.js` (heksagram-kast).

De åtte tradisjonene: **norrøn, keltisk, egyptisk, thelemisk (Thoth), pythagoreisk,
elementær, fargeharmonisk (Hay), I Ching** — hver med eget narrativt register.

Tre invarianter holder motoren ærlig:
- **Frosset leksikon** ([ADR-002](docs/decisions/ADR-002-frozen-lexicon.md)) — vakten
  vokser ikke organisk; hver tradisjon testes mot nøyaktig den faste lista.
- **Kildeport** ([ADR-003](docs/decisions/ADR-003-sourceecho-gate.md)) — sitatlaget er
  taust ved fravær av attestert kilde (ingen oppdiktet autoritet).
- **Felt-styrt resonans** ([ADR-004](docs/decisions/ADR-004-field-guarded-resonance.md))
  — regler fyrer kun på tilstedeværende felt.

## Evaluering

Tersklene ble **pre-registrert fra prinsipp** (`docs/eval/PREREGISTRERING.md`), ikke
baklengs-valgt fra hva motoren tilfeldigvis scoret. Korpuset (128 lesninger, 8 × 16,
pluss sesongvariasjon) kjøres mot dem:

```bash
node test/eval-corpus.mjs      # eller: npm run eval
node test/lexicon.mjs          # selvvalidering av den frosne vakten
```

Resultatene er rapportert **ærlig, med negative funn beholdt**:
`docs/eval/RESULTAT-v1.md` står permanent som beviset på at lekkasje-testen *kunne*
stryke — og gjorde det (to delte-signal-gap), åpent rettet i v2
(`docs/eval/RESULTAT-v2.md`).

**Hva grønt betyr og ikke:** evalueringen beviser *egenskaper* (determinisme,
lekkasjefrihet over korpus, register-dekning, felt-disiplin) — **ikke** estetisk eller
litterær kvalitet. En kvalitets-påstand krever et blind lesere-panel; det er designet i
pre-registreringen, men ikke kjørt. Ingen kvalitets-påstand uten det.

## Beslutnings- og provenens-logg

Arkitektur- og prosessbeslutninger ligger som ADR-er i
[`docs/decisions/`](docs/decisions/) — skrevet med falsifiserbare påstander og
alternativer vurdert. [PROVENANS.md](PROVENANS.md) forklarer hvordan dette rene
snapshotet forholder seg til utviklingshistorikken.

## Kjøre

```bash
npm run eval       # kjør evalueringskorpuset mot de pre-registrerte tersklene
npm run lexicon    # selvvalider den frosne lekkasje-vakten
```

Motoren importeres direkte: `import { generateInterpretation } from "./src/interpret.js"`.
Ingen byggesteg, ingen avhengigheter utover Node (ESM).

## Forfatter

Eirik Botten Nicolaysen — EcoDeco AS.
ORCID: *(legges til ved DOI-frys)*

## Lisens

MIT — © 2026 **EcoDeco AS**. Se [LICENSE](LICENSE).
