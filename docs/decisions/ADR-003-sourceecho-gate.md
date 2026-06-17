# ADR-003 — `sourceEcho`-citeringsgate uten else-gren

- **Status:** Akseptert · implementert
- **Dato:** 2026-06-12
- **Berører:** `src/interpret.js` (`sourceEcho`, `renderEcho`), `src/knowledgeSource.js` (`canCite`, `confidenceVoice`)

## Kontekst
v8 koblet inn sitering av kilde-attestasjoner (`originalQuote`, `translation`,
`confidence`). I v8 er alle attestasjoner tomme — de fylles når databasen lander.
Risikoen: en gate som «fyller inn» fravær med en plassholder eller en generisk
sitatfrase ville bygget nøyaktig mekanismen kildevernet skulle hindre — å
improvisere et sitat der ingen kilde finnes. Dette er også et opphavsretts-hensyn:
Dickins-oversettelser er vernet i Norge til 2049.

## Beslutning
`sourceEcho(symbol)` returnerer et strukturert objekt eller `null`. `canCite` er
den eneste gaten (`if (!att) return null` — verifiserbart linje 276). Kallstedet er
`const echo = renderEcho(sourceEcho(s1.symbol)); if (echo) parts.push(echo);` med
**ingen else-gren** (verifiserbart: `if (echo) parts.push(echo)` uten else, i hver
standard-compose). Fravær av en siterbar attestasjon ⇒ `null` ⇒ ingenting
emitteres. Det finnes ingen kodevei som syntetiserer siterende språk.

**2049-skillet:** `originalQuote` (det frie kvadet) og `translation` (den vernede
oversettelsen) holdes som *atskilte verdier* gjennom `sourceEcho` ut til
`renderEcho` (verifiserbart linje 282–283, «ATSKILT»), aldri konkatenert for tidlig.
Translation kan derfor utelates uten å røre originalQuote.

## Alternativer vurdert
- **En gate med else-gren** som emitterer en plassholder («kilden sier …») når
  attestasjon mangler. Argument mot: en tom else «for øyeblikket» blir fylt senere
  av noen som synes output ser bar ut. En kodevei som ikke eksisterer kan ikke
  fylles. Taushet ved konstruksjon, ikke ved etterfiltrering.

## Konsekvenser
- Med tomme attestasjoner er output verifiserbart taus: ingen anførselstegn, ingen
  siterende verb. Testet over korpus.
- Når databasen lander med attestasjoner, gradderer `confidenceVoice` dem:
  `direct → «sier»`, `cognate → «gir ekko av»` + hedge, `reconstructed → aldri
  sitert ordrett` (gaten stenger for rekonstruert tross at en quote finnes).
