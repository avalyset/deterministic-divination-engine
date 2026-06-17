# ADR-004 — Felt-guardet resonans: ny regel kun ved reell ubrukt informasjon

- **Status:** Akseptert · implementert
- **Dato:** 2026-06-12
- **Berører:** `src/interpret.js` (`RESONANCE_RULES`, `detectResonances`)

## Kontekst
Resonans-detektoren fyrer regler basert på hvilke korrespondanse-FELT som finnes på
symbolene. Tre regler (`element_dosha_match`, `pure_element_triad`,
`deity_transit_match`) avhenger av `element`/`deity`. Pythagorean har bare
`ratio`/`polygon` — element-/deity-reglene fyrer aldri for den. Spørsmålet ved
tradisjon 2 (pythagorean): legge til en pythagorean-spesifikk resonansregel, eller
akseptere et tynnere lag?

## Beslutning
To ratio-regler (`simple_ratio`, `ratio_tension`) ble lagt til den *delte*
detektoren, **felt-guardet på `correspondences.ratio`** (verifiserbart:
`if (!ratio) return null`, linje 167 og 176) — så de fyrer KUN for tradisjoner med
ratio-feltet (pythagorean), dør stille for resten, parallelt med element-reglene.
Prinsippet: en felt-guardet regel legges til når et FELT bærer reell, ubrukt
informasjon som ellers går tapt (`ratio` bærer den konsonans/dissonans-informasjonen
`element` bærer andre steder) — IKKE for å gjøre en tradisjon symmetrisk med de andre.

Verifiserbart: en regresjonskjøring bekreftet at ratio-reglene aldri fyrer for
norse/celtic (de mangler ratio-feltet). Detektoren er felt-drevet, ikke tradisjons-
hardkodet.

## Alternativer vurdert
- **Per-tradisjon regelsett (refaktorere den delte detektoren).** Argument mot:
  detektoren er allerede felt-drevet; en ratio-regel passer inn i den eksisterende
  felt-guardede formen *uten å bøye den* — hvilket beviser at formen var generisk
  hele tiden. Ingen refaktorering trengtes.
- **Akseptere et tynt resonanslag for pythagorean (ingen ny regel).** Argument mot:
  pythagorean er ikke fattigere enn de andre — `ratio` bærer reell konsonans-info;
  å la den ligge ubrukt ville gjort tradisjonen fattig for å spare arbeid, «uten
  grunn». **Kontrast:** thoth fikk et tynt resonanslag *akseptert* (se historikk),
  fordi thoth ikke har et felt som bærer ubrukt resonans-info — tynt der er ærlig,
  ikke en mangel. Det er den skillende linjen: legg til når et felt bærer info,
  aksepter tynt når det ikke gjør det.

## Konsekvenser
- Ingen refaktorering av skillet generisk/spesifikk; detektoren forble felt-drevet.
- Arkitekturen bevist generisk mot det vanskeligste tilfellet (pythagorean, uten
  element/deity/ratio-overlapp med de andre).
