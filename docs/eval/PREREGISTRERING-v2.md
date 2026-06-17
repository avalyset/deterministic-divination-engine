# Pre-registrering v2 — evaluering av v8-tolkningsmotoren

- **Status:** GODKJENT — frosset ved denne commit, FØR re-kjøring. Erstatter v1
  (`1b2d573`) for re-kjøringen, men **opphever den ikke**: v1 og `RESULTAT-v1.md`
  (`1b5e030`) står som permanent spor av at v1-instrumentet var ufullstendig.
- **Dato:** 2026-06-12
- **Binder:** denne commit-hash, korrigert leksikon (`test/lexicon.mjs` v2),
  eval-skript (`test/eval-corpus.mjs`, med ny D2-supplement)

## Hvorfor v2 finnes
v1s D2 strøk (`RESULTAT-v1.md`): to navngitte fremmedord lekket — norse «sfærenes»,
thoth «Ma'at». Diagnosen avdekket **to forskjellige klasser**, og v2 retter dem
forskjellig, etter et etterprøvbart kriterium.

### Kriteriet (skrevet ned — det er ikke en magefølelse)
> **Deler to tradisjoner symbolet ved mytologisk arv?** → det er *instrument*
> (leksikon-gap): symbolet tilhører flere og kan ikke fryses til én tradisjons
> eksklusive vokter uten falske lekkasje-alarmer.
> **Grep én tradisjon bare etter en annens ord?** → det er *motor* (bank-fiks):
> ingen delt arv, bare et lånt ord som omformuleres uten innholdstap.

ADR-002 anvendte dette implisitt og utelot tre delte signaler (tarot-kortnavn hay/
thoth, «heksagram» alle, dosha-ord). Den **misset to**. Korpuset fant den ene som
faktisk fyrte.

## Hva v2 endret (mot v1)

1. **«sfærenes» — MOTOR-fiks** (`fe335b6`). Ingen delt arv: sfærenes harmoni er
   Pythagoras' egen akse, norrøn har ikke mytologisk krav på den. Den norrøne banken
   (`NORSE_IV_VOICE["Kvint — Harmonia"]` v2) grep bare et lånt ord. Omformulert til
   «de ni verdeners reneste samklang» (Yggdrasils ni verdener — norrøns eget kosmos-
   bilde, null innholdstap). Leksikonet er **urørt** for dette — vi endret motoren.

2. **«Ma'at» — INSTRUMENT-korreksjon** (lexicon v2). Delt ved arv: Ma'at er passordet
   ved Duat-porten (egyptisk), og Crowleys Justering = Ma'ats vekt (Thelema arvet
   rettferds-aksen). «Maat»/«Ma'at» **utelatt** fra egyptisks eksklusive liste — samme
   klasse som tarot-kortnavn og «heksagram». Dataene (thoth `adjustment.canonicalMeaning`)
   er korrekte og **ikke** endret.

## Prisen (dokumentert, ikke gjemt)
Å utelate «Ma'at» fra egyptisks eksklusive liste **svekker egyptisks vakt med ett
ord**: ingen tradisjons `leakTest` flagger nå «Ma'at». Det åpner en **ny blindsone** —
en *tredje* tradisjon (ikke-egyptisk, ikke-thoth) kunne nå produsere «Ma'at»
uoppdaget.

## Ny verifikasjon (bindende for v2-kjøringen)
**D2-supplement — Ma'at tredje-tradisjon-sjekk:** skann alle 8 tradisjoners korpus-
output for «Ma'at». Forventet: kun **egyptian** og **thoth** (de to som eier symbolet
ved arv) emitterer det. **Krav: ingen tredje tradisjon gjør det.** Blindsonen skal
*bekreftes tom*, ikke antas tom. Hvis en tredje tradisjon fyrer «Ma'at», har vi byttet
en fanget lekkasje mot en uoppdaget — verre enn problemet vi løste, og v2 stryker.

## Dimensjoner og terskler
**Uendret fra v1** (D1 100 % · D2 0 navngitte-fremmedord · D3a 100 % ≥1 / D3b deskr. ·
D4 100 % · D5 ≥2/N=7 / distinkt deskr. · D6 0 % fallback · D7 0 feilfyringer), pluss
D2-supplementet over. Motor-fiksen kan i prinsippet røre norse D1/D5 — **verifiseres
uendret** i re-kjøringen.

## Forpliktelse (uendret fra v1)
Resultatet rapporteres mot terskel — pass eller stryk — uten å justere terskler
etterpå. Hvis D2 nå er grønn, betyr det noe *fordi* v1 viste at den kunne stryke, og
instrumentet ble rettet **åpent** (`RESULTAT-v1.md` står), ikke i stillhet.
