# Provenans — hvordan dette snapshotet forholder seg til utviklingen

Dette repoet er et **rent snapshot av metoden**, ikke utviklingshistorikken. Det ble
opprettet med ren git-historikk fra første commit. Den rå, bisektbare
utviklingsstigen — alle de mellomliggende commitene mens motoren ble bygget tradisjon
for tradisjon — lever i et **privat utviklingsrepo**, urørt, som ubrutt arbeidshistorikk
([ADR-006](docs/decisions/ADR-006-historikk-rens.md), beslutning B).

Det reiser ett spørsmål en leser med rette stiller: *hvis den synlige git-stigen ikke er
her, hva borger for at metoden ble utviklet med den disiplinen den hevder?* Svaret er at
beviset ikke ligger i hashene — det ligger i **innholdet i dette repoet selv**, og kan
etterprøves uten tilgang til noe privat.

## Order-proof forankret i innhold (ikke i private hasher)

Tre påstander om disiplin bæres av artefakter du har foran deg:

1. **Tersklene eksisterte før tallene.** `docs/eval/PREREGISTRERING.md` (og `-v2`)
   begrunner hver terskel **fra prinsipp** — hvorfor 100 % determinisme, hvorfor
   ≥2 distinkte over N=7, hvorfor 0 navngitte-fremmedord — uten å referere til hva
   motoren faktisk scoret. Dokumentet er et *argument*, ikke en rapport. En leser ser at
   begrunnelsene er prinsipielle, ikke baklengs-tilpasset.

2. **Et negativt funn ble beholdt, ikke visket ut.** `docs/eval/RESULTAT-v1.md` står
   permanent og registrerer at lekkasje-testen **strøk** første gang: to delte-signal-gap
   («sfærenes» lånt inn i norrøn bank; «Ma'at» delt egyptisk↔thoth ved mytologisk arv).
   `RESULTAT-v2.md` registrerer den åpne rettingen. At en «v1 strøk»-rapport i det hele
   tatt finnes — ikke overskrevet av v2 — er i seg selv innholds-beviset på ærlig
   rapportering. Et baklengs-pyntet verk ville ikke båret sin egen stryk-protokoll.

3. **Måleinstrumentet dokumenterer sin egen pris.** `test/lexicon.mjs` bærer en
   inline-kommentar som forklarer hvorfor «Ma'at» ble tatt ut av egyptisks eksklusive
   vakt, hvilken blindsone det åpnet, og at v2-kjøringen **måtte** bekrefte at ingen
   tredje tradisjon slapp ordet gjennom. Disiplinen er skrevet inn i instrumentet, ikke
   bare hevdet om det.

Disse tre kan kryssleses mot hverandre og mot koden i dette repoet alene. De er
**konsistente uten ekstern referanse** — det er det som menes med order-proof forankret
i innhold.

## Hashene i dokumentene — hva de er, og hva de ikke er

`RESULTAT-v1/v2.md` og pre-registreringene siterer konkrete git-hasher
(f.eks. pre-reg «før tallene»). Disse hashene lever i det **private**
utviklingsrepoet. De er **provenens-pekere**, ikke det offentlige beviset: en leser av
dette snapshotet trenger dem ikke for å verifisere disiplinen — innholdet over står på
egne ben. De er bevart i dokumentene fordi de utgjør den ekte, tidsstemplede rekkefølgen
*i det private repoet*, der den fortsatt kan revideres av den som har tilgang.

Grunnen til at historikken ikke ble omskrevet og flyttet hit: `git filter-repo` ville
brutt nettopp disse rekkefølge-siteringene ved å endre hver hash nedstrøms av et tidlig
treff. Det rene snapshotet bevarer dem som *pekere*; det private repoet bevarer dem som
*levende historikk*. Begrunnelsen er gjort eksplisitt i
[ADR-006](docs/decisions/ADR-006-historikk-rens.md).

## Hva som er, og ikke er, fryst

Dette snapshotet fryser **metoden** — motorens arkitektur, det frosne instrumentet og
den maskinelle evalueringen — ikke en kvalitets-påstand. Det maskinelle beviser
egenskaper (determinisme, lekkasjefrihet over korpus, register-dekning, felt-disiplin),
ikke estetisk kvalitet. Den vurderingen hører til et blind lesere-panel som er *designet*
i pre-registreringen men **ikke kjørt** — et eget arbeid som kan sitere denne frysen som
sitt utgangspunkt, ikke noe denne frysen påstår.

Når en offentlig DOI-frys gjøres (egen runde), blir **deposit-DOI-en** (innhold +
tidsstempel) frysebeviset for det offentlige verket, slik ADR-006 fastslår — ikke en
git-hash som måtte bevares uendret.
