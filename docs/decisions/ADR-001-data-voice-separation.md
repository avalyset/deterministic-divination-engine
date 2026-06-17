# ADR-001 — Symboldata skilt fra narrativ stemme (`knowledgeSource.js`)

- **Status:** Akseptert · implementert
- **Dato:** 2026-06-12
- **Berører:** `src/knowledgeSource.js`, `src/interpret.js`

## Kontekst
v7 holdt symboldata (korrespondanser per tradisjon) inline i tolkningsmotoren,
sammen med den narrative genereringen. v8 trengte i tillegg et kilde-/attestasjons-
lag (sitat, oversettelse, konfidens) per symbol. Dataene var dessuten tiltenkt å
komme fra en ekstern kilde (Rust-database → `correspondences.json`) i en senere fase.

## Beslutning
Symbol- og korrespondansedata ble lagt i `src/knowledgeSource.js` (574 linjer):
et `EMBEDDED`-lag + et oppslags-API (`noteToSlug`, `lookupSymbol`, `lookupTriad`,
`lookupHexagramSymbol`, `confidenceVoice`, `canCite`). Den narrative komposisjonen
ble i `src/interpret.js`, som importerer fra `./knowledgeSource.js` (verifiserbart:
`interpret.js` linje 15, `} from "./knowledgeSource.js";`).

## Alternativer vurdert
- **Beholde data inline i `interpret.js` (som v7).** Argument mot: dataene er
  tiltenkt å erstattes av `fetch('/correspondences.json')` i v9, med uendret
  signatur (dokumentert i `knowledgeSource.js`-headeren). Inline-data ville gjort
  det byttet til en omskriving av motoren i stedet for en enfils-endring. Dataene
  brukes dessuten på tvers av flere hensyn (oppslag, attestasjon, sitering); å
  koble dem til én tradisjons stemme ville blokkert gjenbruk.

## Konsekvenser
- v9 kan bytte `EMBEDDED` mot ekstern JSON uten å røre `interpret.js`.
- Attestasjons-/citeringslaget (se [ADR-003](ADR-003-sourceecho-gate.md)) leser
  fra datalaget uniformt, uavhengig av tradisjon.
