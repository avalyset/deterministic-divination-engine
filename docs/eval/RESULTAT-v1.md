# Evalueringsresultat v1 — covering-korpus mot pre-reg `1b2d573`

- **Dato:** 2026-06-12
- **Testet mot:** `docs/eval/PREREGISTRERING.md` (frosset `1b2d573`)
- **Eval-skript:** `test/eval-corpus.mjs`
- **Samlet: MINST ÉN STRØKET (D2).** Rapportert som strøket per B3 — ikke fikset og
  rekjørt i stillhet.

## Korpus
Covering-design: hvert dimensjons-verdi ≥1 per tradisjon (12 noter × 12 kvaliteter,
kontur/hex/vær/astro rotert) + 4 kant-tilfeller per tradisjon. **128 base-lesninger**
(8 × 16) + celtic 4 sesonger. 256 determinisme-kjøringer, 56 variasjons-kjøringer.
Faste datoer/seeds → reproduserbart.

## Resultat per dimensjon

| Dim | Terskel | Resultat | Status |
|---|---|---|---|
| **D1 Determinisme** | 100 % identisk | 128/128 | **BESTÅTT ✓** |
| **D2 Lekkasjefrihet** | 0 navngitte-fremmedord | **2 / 128** | **STRØKET ✗** |
| **D3a Register ≥1** | 100 % | 128/128 | **BESTÅTT ✓** |
| **D3b Register-rikdom** | *(deskriptivt, ingen terskel)* | middel 4.77 termer/lesning | — |
| **D4 Strukturell** | 100 % | 32/32 komponent-toggler endret output | **BESTÅTT ✓** |
| **D5 Variasjon** | ≥ 2 / N=7 | alle ≥ 2 (se under) | **BESTÅTT ✓** |
| **D6 Bank-dekning** | 0 % fallback | 0 / 128 + statisk 12/12 alle banker | **BESTÅTT ✓** |
| **D7 Resonans-felt** | 0 feilfyringer | 0 / 65 regelfyringer | **BESTÅTT ✓** |

**D5 distinkt/7 (deskriptivt):** norse 5 · celtic 7 · egyptian 7 · thoth 7 ·
pythagorean 7 · elemental 7 · hay 7 · **iching 4**. Alle ≥ 2 (hard pass). iching
lavest — konsistent med at ichings variasjon ligger i det faste heksagram-sentrumet,
ikke periferien (dokumentert som bevisst valg, R3). Terskelen er ≥ 2; tallene
rapporteres uten å dømmes.

## D2 — strøket: de to lekkasjene (diagnostisert, IKKE fikset)

Ingen er en eval-skript-feil; `leakTest` fungerer korrekt og ordene er faktisk i
outputen.

1. **norse «sfærenes»** — fra `NORSE_IV_VOICE["Kvint — Harmonia"]` variant 2 («hviler
   i sfærenes reneste samklang — Æsenes egen kvint», `interpret.js:307`). «sfærenes»
   er pythagoreans frosne register-ord. **Ekte motor/bank-lekkasje:** den norrøne
   banken grep etter pythagoreans signaturord. Motor-fiksbar (omformuler banken;
   re-kjøring mot *samme* frosne leksikon er da legitim — vi endrer motoren, ikke
   instrumentet).

2. **thoth «Ma'at»** — fra `adjustment.canonicalMeaning` («Ma'ats vekt — kosmisk
   balanse …», surfaces via thoth-åpningens gloss). Thelemas Justering-kort *er*
   Ma'at (Crowleys ikonografi — historisk korrekt data). «Ma'at» er egyptisk frosne
   register-ord, men genuint **delt** mellom egyptisk og thoth — samme klasse som
   tarot-kortnavn delt hay/thoth, som ADR-002 korrekt utelot. **Leksikon-design-gap:**
   en delt signal frysingen ikke fanget. Ikke en ren motor-bug.

## Hva dette beviser (og hva det ikke gjør)
- Det systematiske korpuset fanget to lekkasjer stikkprøvene og ADR-002s
  leksikon-validering gikk glipp av (valideringslesningen traff aldri seedet som
  henter «sfærenes»-varianten). Det er B3 i praksis: et negativt funn mot en frosset
  terskel, rapportert som negativt.
- **D2-grensen båret med:** D2 grønn ville uansett bare betydd «0 navngitte-fremmedord»,
  ikke «lekkasjefri». Her er D2 *ikke* grønn — to navngitte fremmedord lekket.
- De seks andre dimensjonene består mot sine pre-registrerte terskler. Det betyr noe
  *fordi* D2 kunne stryke og gjorde det.

## Beslutning som gjenstår (Eirik + cc, ikke avgjort her)
- **Lekkasje 1 (sfærenes):** motor-fiks (omformuler norrøn bank), re-kjør mot samme
  frosne leksikon.
- **Lekkasje 2 (Ma'at):** enten motor/data-fiks (omformuler — taper korrekt Thelema-
  innhold), ELLER erkjenn at «Ma'at» er en delt signal og korriger leksikonet — som
  da må re-fryses som en *ny* pre-registrering (v2) med full åpenhet om at v1s D2 strøk.
  Å stille-patche det frosne leksikonet for å gjøre D2 grønn er post-hoc og gjøres ikke.
