# ADR-007 — Å fryse metoden som eget verk: argument mot, og hva frysen tør påstå

- **Status:** Argument ført — **frys ikke utført i denne runden.** Beslutning om selve
  DOI-frysen tas som egen, gated runde.
- **Dato:** 2026-06-17
- **Berører:** det offentlige metode-snapshotet (dette repoet), en framtidig DOI-frys
- **Forutsetter:** [ADR-006](ADR-006-historikk-rens.md) (rent snapshot, beslutning B),
  [FASE3-BETINGELSER Port 3](../eval/FASE3-BETINGELSER.md) (lesere-panelet)

## Kontekst

Metoden er bygget ferdig: åtte tradisjoner i hvert sitt register, et frosset
måleinstrument, og en maskinell evaluering som består sine pre-registrerte terskler med
ett ærlig rapportert og åpent rettet negativt funn. Spørsmålet som nå presser seg på er
ikke *kan vi fryse* — det er teknisk trivielt — men *bør metoden fryses som eget verk nå,
og i så fall hva tør frysen påstå*. Denne ADR-en fører argumentet **mot** før noen frys,
slik at en eventuell frys skjer med øynene åpne, ikke som et ledd som glir inn fordi
snapshotet tilfeldigvis er rent.

## Beslutningen som veies

Å deponere dette snapshotet som et sitérbart verk (DOI) der **metoden** — motor +
instrument + maskinell eval — er det fryste objektet, eksplisitt avgrenset fra enhver
kvalitets-påstand.

## Argument MOT å fryse nå (ført ærlig, ikke for å avvises)

1. **Lesere-panelet finnes ikke.** Det maskinelle beviser determinisme, lekkasjefrihet
   over korpus, register-dekning og felt-disiplin — det beviser **ikke** at teksten
   *leses* som autentisk i sin tradisjon. En frys nå deponerer en metode hvis litterære
   verdi er **umålt**. Risikoen: et senere blind-panel kan vise at output er tonalt
   flat eller fremmed på måter intet forbudt-ord-instrument fanger, og da står en
   DOI-frys av en metode hvis egen forutsetning (at registrene *virker* som stemmer)
   ikke er etterprøvd.

2. **«Ferdig» er en påstand instrumentet ikke kan bære.** At de harde tersklene er
   grønne betyr at motoren er *konsistent og disiplinert*, ikke at den er *god*. Å fryse
   nå risikerer å la grønt smitte over til en uuttalt kvalitets-påstand — nettopp den
   `RESULTAT-v2` og README advarer mot. Frysen kan i seg selv bli kilden til den
   sammenblandingen den forsøker å unngå.

3. **Frys er irreversibelt utad (E1).** En DOI kan ikke trekkes tilbake. Hver svakhet i
   instrumentet vi ennå ikke har sett — en tredje blindsone à la Ma'at — blir permanent
   en del av det siterte verket. Det taler for å vente til instrumentet har overlevd mer
   enn ett korpus.

## Argument FOR å fryse nå — og hvorfor det veier tyngre når frysen er riktig avgrenset

Mot dette står faren for **scope-glidning i motsatt retning:** å holde en *ferdig
metode* som gissel for et *annet, større arbeid*. Lesere-panelet er ikke en mangel ved
metoden — det er et selvstendig empirisk studium (v7/v8, Likert, inter-rater) som vil
*sitere* metoden som sitt materiale. Å nekte å fryse metoden før panelet er kjørt, er å
forveksle to verk:

- Metoden er **det som måles**. Den er ferdig, deterministisk, og dens egenskaper er
  dokumentert med pre-registrering og bevart negativ-rapport. Det er en komplett,
  sitérbar artefakt på egne premisser.
- Panelet er **en måling av den**. Det trenger et frosset, sitérbart mål for å
  overhodet være meningsfullt — du kan ikke pre-registrere en evaluering mot et objekt
  som fortsatt flyter.

Argument-mot-punktene over rammer alle **kvalitets-påstanden**, ikke **metode-frysen**.
De er gyldige *hvis* frysen påstår godhet — og ugyldige hvis den ikke gjør det. Det gir
betingelsen, ikke utsettelsen.

## Den skillende observasjonen

Hvert mot-argument forutsetter at frysen sier mer enn «her er metoden, deterministisk og
målt på disse aksene». Fjern den implisitte kvalitets-påstanden, og motstanden faller:
en frys som **eksplisitt avgrenser seg** fra litterær kvalitet kan ikke undermineres av
et panel den aldri foregrep. Risiko 1–3 nøytraliseres ikke ved å vente, men ved å si
mindre.

## Beslutning

**Metoden kan fryses som eget verk — men frysen tør kun påstå metode-egenskaper, aldri
kvalitet — og selve frysen er sin egen gated runde, ikke et ledd her.** Konkret:

- En framtidig DOI-frys deponerer motor + instrument + eval som **metode**, med
  README/PROVENANS/`RESULTAT-v2` som allerede skiller egenskap fra kvalitet. Avgrensningen
  er ikke en fotnote — den er det som gjør frysen forsvarlig.
- **Lesere-panelet er ikke en betingelse for metode-frysen.** Det er et separat verk som
  vil sitere frysen. Å koble dem ville være scope-glidning: å holde et ferdig verk
  hostage for et annet.
- **Denne runden fryser ikke.** Snapshotet bygges og verifiseres selvstendig (eval kjører
  i et ferskt repo); frys + DOI gjøres bevisst senere, med full-historikk-scrub
  (Port 2) som første steg, etter eksplisitt go.

**Konsekvens:** det rene snapshotet eksisterer nå som et komplett, etterprøvbart verk
uten å være fryst. Frysen er et lite, veldefinert steg unna — bevisst holdt som eget
valg, ikke noe som glapp inn fordi alt annet var klart.
