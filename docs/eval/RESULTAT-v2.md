# Evalueringsresultat v2 — covering-korpus mot pre-reg v2

- **Dato:** 2026-06-12
- **Testet mot:** `docs/eval/PREREGISTRERING-v2.md` (re-frosset `03cb2d3`, FØR denne kjøringen)
- **Motor:** `fe335b6` (sfærenes motor-fiks) · **Lexicon:** v2 (Ma'at som delt signal)
- **Eval-skript:** `test/eval-corpus.mjs`
- **Samlet: ALLE HARDE TERSKLER BESTÅTT ✓** (D1, D2, D2-supplement, D3a, D4, D5, D6, D7)

## Resultat per dimensjon

| Dim | Terskel | v1 | v2 | Status |
|---|---|---|---|---|
| **D1 Determinisme** | 100 % | 128/128 | **128/128** | BESTÅTT ✓ |
| **D2 Lekkasjefrihet** | 0 navngitte-fremmedord | **2/128 (strøk)** | **0/128** | BESTÅTT ✓ |
| **D2-supp Ma'at** *(v2)* | kun egyptian+thoth | — | **[egyptian, thoth]** | BESTÅTT ✓ |
| **D3a Register ≥1** | 100 % | 128/128 | 128/128 | BESTÅTT ✓ |
| D3b Register-rikdom | *(deskriptivt)* | 4.77 | 4.67 termer/lesning | — |
| **D4 Strukturell** | 100 % | 32/32 | 32/32 | BESTÅTT ✓ |
| **D5 Variasjon** | ≥2 / N=7 | alle ≥2 | alle ≥2 | BESTÅTT ✓ |
| **D6 Bank-dekning** | 0 % fallback | 0/128 | 0/128 + statisk 12/12 | BESTÅTT ✓ |
| **D7 Resonans-felt** | 0 feilfyringer | 0/65 | 0/65 | BESTÅTT ✓ |

**D5 distinkt/7:** norse 5 · celtic/egyptian/thoth/pyth/elemental/hay 7 · iching 4.
**Uendret fra v1** — motor-fiksen rørte ikke norse-variasjonen (verifisert).

## De to fiksene — bekreftet virket
1. **«sfærenes» (motor):** borte fra all korpus-output. D2-lekkasje 1 lukket. Og —
   det du leste etter — **norse D1 fortsatt 128/128 og D5 fortsatt 5/7**: bank-
   omformuleringen endret hverken determinisme eller variasjons-antall.
2. **«Ma'at» (instrument):** ikke lenger flagget for thoth (delt ved arv, korrekt).

## Den nye blindsonen — bekreftet TOM
lexicon-v2 svekket egyptisks vakt med ett ord. Den nye blindsonen — at en *tredje*
tradisjon kunne emittere «Ma'at» uoppdaget — er **verifisert tom, ikke antatt tom:**
korpus-skann viser at «Ma'at» emitteres av **egyptian og thoth alene** (de to som eier
symbolet ved arv). Ingen tredje tradisjon. Vi byttet ikke en fanget lekkasje mot en
uoppdaget.

## Hva v2-grønt betyr (og ikke)
- D2 grønn **betyr noe** fordi v1 (`1b5e030`) står i historikken som beviset på at den
  *kunne* stryke — og gjorde det. Instrumentet ble rettet **åpent**: `RESULTAT-v1.md`
  er permanent, ikke overskrevet.
- **D2-grensen bæres uendret:** D2 grønn = «0 navngitte-fremmedord-lekkasjer», IKKE
  «motoren er lekkasjefri». Tonal drift (en frase som «føles» fremmed uten et forbudt
  ord) er ikke målt her — den hører til lesere-panelet (eget trinn, ikke kjørt).
- De seks andre dimensjonene består mot uendrede terskler. Det betyr noe fordi D2
  *kunne* stryke, og én gang gjorde.

## Sporbarhet (rekkefølge i git, ikke påstand)
```
1b2d573  pre-reg v1 (terskler fra prinsipp)
1b5e030  eval v1 — D2 STRØKET (2 delte-signal-gap)
fe335b6  motor-fiks sfærenes
03cb2d3  re-frys pre-reg v2 + lexicon-v2 + D2-supplement  ← FØR re-kjøring
[denne]  eval v2 — alle harde terskler bestått
```
En tredjepart ser i historikken at hver terskel (v1 og v2) eksisterte før sine tall,
og at v1s strøk ble rettet åpent, ikke gjemt.
