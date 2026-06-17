# ADR-002 — Lekkasje-leksikonet frosset før første tradisjon

- **Status:** Akseptert · implementert
- **Dato:** 2026-06-12
- **Berører:** `test/lexicon.mjs`

## Kontekst
Hver tradisjons stemme måtte holde seg i sitt eget register; egyptisk skulle ikke
kunne låne norrønt vokabular, og vice versa. En lekkasje-detektor var nødvendig for
å måle dette over alle åtte tradisjoner.

## Beslutning
`TRADITION_LEXICON` (130 kuraterte signaturbegreper over 8 tradisjoner) + test-
hjelperne `leakTest`/`registerTest` ble skrevet og **frosset som et eget steg
FØR den første tradisjonen ble skrevet**. Verifiserbart i git-historikken:
commit `363c4ab` («frys TRADITION_LEXICON …») kommer før `63d13e5` («celtic …
tradisjon 1/7»). Frosset = fast målestokk, ikke en liste som vokste organisk
etter hvert som lekkasjer ble oppdaget.

Dokumenterte design-invarianter i leksikonet: delte signaler utelatt fra alle
leksika (ordet «heksagram», tarot-kortnavn delt mellom hay/thoth, dosha-ord);
korte begreper (<4 tegn) matches som hele ord (så `Ra` ikke matcher `bRagi`);
leksika parvis disjunkte (selvvalidert).

## Alternativer vurdert
- **La leksikonet vokse organisk** — legge til begreper når lekkasjer dukker opp
  under tradisjons-skrivingen. Argument mot: et leksikon i bevegelse tester mot et
  bevegelig mål. Hver ny tradisjon kunne stilltiende svekket vakten for de
  foregående — hvis «X er greit for tradisjon Y også» legges til, fanges ikke
  lenger X-lekkasjen for tradisjon Z. Et frosset leksikon tvinger den riktige
  løsningen: to tradisjoner som deler et begrep må skilles av *ordene*, ikke ved å
  slakke vakten. (Konkret: `proporsjon` ble frosset til pythagorean; da hay-
  komposisjonen naturlig nådde etter ordet, fanget `leakTest` det — et bevegelig
  leksikon ville tillatt det i begge. Se [ADR-004](ADR-004-field-guarded-resonance.md)
  for samme felt-drevne prinsipp i resonanslaget.)

## Konsekvenser
- Leksikonet er et forhåndsregistrert måleinstrument; hver av de sju tradisjonene
  ble testet mot nøyaktig samme faste vakt.
- **Kjent grense:** vakten fanger navngitte fremmedord, ikke tonal drift — en frase
  som «føles» norrøn uten å nevne et forbudt ord. Den vurderingen krever en
  menneskelig lesning og er ikke automatisert.
