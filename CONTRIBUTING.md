# Bidrag til harmonic-tarot

## Repo-disiplin — kjerne-sjekkliste

Denne sjekklisten er ikke seremoni. Den er praksisen som bygde og landet v8, og den
fanget reelle feil (en innebygd lekkasje, en deploy-felle) som ellers ville passert.
Følg den.

1. **Bevis før handling.** Verifiser hvert ledd — ikke anta at forrige steg gjorde
   det den sa. «Det bygde» beviser ikke at det *virker*; «deploy lyktes» beviser ikke
   at det *serverte* er riktig. Kjør den faktiske sjekken (full kjøring, grep mot
   live-respons), ikke en stedfortreder for den.

2. **Rør aldri `main`/produksjon uten bevis.** Arbeid på branch. Mål mot en kjent god
   baseline. Når du endrer noe delt, bevis at det delte fortsatt bærer det som hviler
   på det (regresjonskjøring av alt som rører den).

3. **Frosne måleinstrumenter fryses før de måles mot.** Lekkasje-vakten
   (`test/lexicon.mjs`) er et fast mål; den vokser ikke organisk mens den brukes.
   Endrer du den, dokumentér hvorfor — et bevegelig mål skjuler regresjoner.

4. **Fravær fylles ikke med språk.** Når en kilde, en attestasjon eller en variant
   ikke finnes, skal output reflektere fraværet — ikke en plassholder som ser komplett
   ut. Gjør det gale tilfellet umulig å konstruere (ingen else-gren), ikke bare
   sjeldent. Se [ADR-003](docs/decisions/ADR-003-sourceecho-gate.md).

5. **Legg til kompleksitet kun ved reell informasjon, ikke for symmetri.** En ny regel
   eller et nytt lag rettferdiggjøres av at noe målbart ellers går tapt — ikke av at
   det ville gjort tingene jevnere. Et tynnere, ærlig lag slår et fyldigere,
   konstruert. Se [ADR-004](docs/decisions/ADR-004-field-guarded-resonance.md).

6. **Skill det beviste fra det vurderte.** Maskinen fanger det målbare (determinisme,
   lekkasjefrihet, dekning). Tonal kvalitet og autentisitet krever en menneskelig
   lesning. Ikke påstå at en automatisk test viser det den ikke kan vise.

7. **Commits er bisektbare.** Én logisk endring per commit, falsifiserbar
   commit-melding. En regresjon som dukker opp senere skal kunne spores til én commit.

8. **Skann for hemmeligheter før push.** Aldri en token i klartekst i en remote-URL
   eller i historikken. Bruk SSH eller en credential-helper, ikke en innebygd PAT.

## ADR-er

Strukturelle beslutninger dokumenteres som ADR-er i `docs/decisions/`:

- Skrevet i **fortid** (de dokumenterer en beslutning som er tatt).
- Kun **falsifiserbare** påstander — verifiserbare mot commit eller kode.
- For strukturelle valg: **«alternativer vurdert / argument mot»** er obligatorisk.
- En kjent grense skal stå eksplisitt; ikke oversell hva beslutningen oppnår.
