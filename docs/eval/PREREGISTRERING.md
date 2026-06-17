# Pre-registrering — evaluering av v8-tolkningsmotoren

- **Status:** GODKJENT — frosset ved denne commit. Tersklene begrunnet fra prinsipp,
  satt før korpus kjøres. Ingen korpus kjørt på frysings-tidspunktet.
- **Dato:** 2026-06-12
- **Binder:** commit-hash (settes ved frysing), frosset leksikon (`363c4ab`),
  eval-skript (skrives etter at dette er committet)

## Hvorfor dette dokumentet finnes, og hva som truer det

En pre-registrering binder oss til *hva* vi måler og *hvilke terskler som teller*
**før** korpuset kjøres. Den eneste verdien den har er at den ikke kan baklengs-
tilpasses til et ønsket resultat.

**Den ærlige faren, eksplisitt:** vi har allerede sett v7-mot-v8-tall fra
sammenligningen — distinkt-antall over seeds, lengder, R1/R2/R3. De ligger i minnet.
Ekte pre-registrering betyr derfor ikke bare «ikke se nye tall», men **å sette
terskler vi ikke baklengs-velger fra det vi allerede vet bestod.** En terskel satt
fordi vi husker v8 traff den, er post-hoc med riktig filnavn. Der fristelsen er
størst — variasjon, der vi vet mest om v8s faktiske tall — flagger jeg
resonnementet eksplisitt nedenfor.

**Integritetsregler (bindende):**
1. Tersklene fryses i denne fila (committet) før eval-skriptet kjøres.
2. Et negativt resultat **rapporteres som negativt** — vi fikser ikke stille og
   kjører på nytt for å skjule det. En dimensjon som stryker, stryker i rapporten.
3. Korpus-konstruksjon + seed-liste + commit-hash er faste, så tallene er
   regenererbare av en tredjepart.
4. Hver terskel skal kunne **fange en reell svakhet** hvis motoren hadde en. En
   terskel ingen tenkelig motor ville stryke på er dekorasjon, ikke en terskel.

---

## Dimensjoner

For hver: hva som måles · maskin eller menneske · terskel (begrunnet fra prinsipp) ·
hva et negativt resultat betyr.

### D1 — Determinisme `[GODKJENT]`
- **Måles:** hver korpus-lesning kjøres to ganger i samme prosess med identisk input
  (inkl. seed). Output sammenlignes byte for byte.
- **Maskinelt.**
- **Terskel: 100 % identisk.** Begrunnelse fra prinsipp: determinisme er den
  *definisjonelle* påstanden («algoritmisk, ingen AI-API, deterministisk»). Den er
  binær — én ikke-identisk lesning falsifiserer påstanden. Terskelen er ikke valgt
  fordi v8 scoret den; den er det eneste tallet påstanden tillater.
- **Negativt resultat (reelt mulig):** < 100 % betyr skjult ikke-determinisme — en
  kodevei som bruker `Math.random()` eller `new Date()` utenom seedet, eller
  usortert objekt-iterasjon. Det ville falsifisere kjernepåstanden, og rapporteres
  som det.

### D2 — Lekkasjefrihet over korpus `[GODKJENT]`
- **Måles:** `leakTest` (frosset leksikon) kjøres på **hver** lesning i korpuset —
  ikke stikkprøver. Telles: antall lesninger med ≥1 fremmed-register-treff.
- **Maskinelt** (med kjent grense, se under).
- **Terskel: 0 lekkasjer over hele korpuset.** Begrunnelse fra prinsipp: påstanden
  er at hver tradisjon holder seg i sitt eget register. Én lekkasje falsifiserer den
  for den lesningen. 0 er det «lekkasjefri» betyr — ikke et v8-tall.
- **Kjent grense (ærlig):** `leakTest` fanger *navngitte* fremmedord (leksikonets
  begreper), ikke tonal drift — en frase som «føles» norrøn uten å nevne et forbudt
  ord. «0 lekkasjer» betyr «0 navngitte-fremmedord-lekkasjer», ikke «0 register-
  blødning». Drift hører til lesere-panelet (se «Eksplisitt IKKE målt»).
- **BINDENDE for sluttrapporten:** denne grensen MÅ bæres *uendret* inn i den endelige
  eval-rapportens konklusjon. D2 grønn skal **aldri** rapporteres som «motoren er
  lekkasjefri» uten fotnoten. En maskinell sjekk av navngitte ord er bevis for det
  den måler — fravær av kjente fremmedord — ikke for noe bredere. Å la D2 grønn stå
  som «lekkasjefri» uten grensen ville være å overselge: å la en navne-sjekk passere
  for et register-renhets-bevis den ikke er. Pre-registreringen binder oss til å ikke
  gjøre det.
- **Negativt resultat (reelt mulig):** ≥1 lekkasje betyr at en tradisjons compose
  brukte et annet registers signaturord — en ekte bug. Det skjedde under utvikling
  (`proporsjon` i hay, fanget og rettet). Et *systematisk* korpus treffer input-
  kombinasjoner stikkprøvene ikke gjorde, så en ny lekkasje er et genuint mulig
  utfall.

### D3 — Register-dekning `[GODKJENT]`
- **Måles:** `registerTest` på hver lesning — bruker tradisjonen sitt eget register?
  To tall: (a) andel lesninger med ≥1 register-treff; (b) **deskriptivt:** middel
  antall register-termer per lesning.
- **Maskinelt** for (a) og (b).
- **Terskel: (a) 100 % av lesninger har ≥1 treff. (b) INGEN terskel — kun
  rapportert.** Begrunnelse: en lesning med 0 register-treff er «registerløs» — den
  navnga kort/intervaller men brukte aldri tradisjonens signaturvokabular, og kunne
  vært en hvilken som helst tradisjon. ≥1 er minimum for «denne lesningen er
  identifiserbart denne tradisjonen». For (b): det finnes *ikke* et prinsipielt
  minimum for «rik nok» — det er en kvalitetsvurdering (lesere-panelet), så å sette
  en terskel der ville vært vilkårlig eller baklengs-valgt. Vi rapporterer middelet
  uten å dømme det.
- **Negativt resultat (reelt mulig):** en lesning med 0 register-treff betyr at
  composen kan produsere registerløs output — en kodevei der alle bank-pick faller
  til generisk. Reelt mulig.

### D4 — Strukturell kompletthet `[GODKJENT]`
- **Måles:** for hver lesning, gitt dens input: emitteres hver *anvendelig*
  komponent (gloss, intervall, astro, vær, kontur, heksagram, resonans)? «Anvendelig»
  = input til stede (f.eks. vær-linje forventes kun når vær er gitt).
- **Maskinelt.**
- **Terskel: 100 % av anvendelige komponenter emittert.** Begrunnelse: påstanden er
  at motoren integrerer alle tilgjengelige signaler. Er vær gitt men ingen vær-linje
  produseres, ble et signal droppet. 100 % er det «integrerer alle signaler» betyr.
- **Negativt resultat (reelt mulig):** en manglende komponent = et droppet signal =
  ekte bug. Statisk-sjekken (på committet kode) var grønn; korpuset tester det
  *dynamisk* over input-kombinasjoner.

### D5 — Variasjon `[GODKJENT — N satt fra seed-designet]`
- **Måles:** samme trekning kjørt over N = **7** distinkte daglige seeds per
  tradisjon (seed = førstenote + dato + tradisjon; vi varierer dato-komponenten).
  Telles: antall *distinkte* outputs.
- **Hvorfor N = 7 (fra prinsipp, ikke et rundt tall):** variasjonsvinduet brukeren
  faktisk opplever er **én uke** — seedet skifter daglig via dato-komponenten, så
  syv dager gir syv datoer gir syv potensielle varianter før et mønster kan gjenta.
  N = 8 ville vært et arbitrært rundt tall; N = 7 binder testen til det semantisk
  meningsfulle spørsmålet «varierer lesningen over en uke?» — forankret i seed-
  designet, ikke valgt fordi det ser pent ut.
- **Maskinelt** for antallet; «føles variert nok» er menneske (rapportert, ikke
  terskel).
- **Terskel: distinkt ≥ 2 per tradisjon (hard pass). distinkt/7 og
  distinkt/teoretisk-maks: deskriptivt, INGEN terskel.**

  **Begrunnelse fra prinsipp — og hvorfor ikke høyere:** Det prinsipielle *minimum*
  for at en deterministisk motor «varierer» er at seedet faktisk påvirker output:
  distinkt > 1. distinkt = 1 betyr at variasjons-mekanismen er *død* — en `pick()`
  over én-element-banker, nøyaktig den «plumbing uten variasjon»-feilen vi en gang
  avviste eksplisitt. Så **≥ 2 er gulvet som skiller en levende mekanisme fra en
  død**, og det *ville* stryke en motor med degenererte banker.

  Jeg setter **bevisst ikke** terskelen på 3, 5 eller 7 — fordi jeg vet v8 traff
  7–8 på de fleste og 3 på iching, og enhver terskel i det området ville vært
  baklengs-valgt fra v8s ytelse. «Varierer den *rikt nok* over en uke?» er et ekte
  spørsmål, men det er en kvalitetsdom (som estetikk), ikke en binær jeg kan
  prinsipielt terskle uten å forankre til v8. Derfor: hard pass = mekanismen lever
  (≥ 2); rikdommen (distinkt/N, og distinkt mot teoretisk maks gitt bank-størrelsene
  ved de aktive slottene) rapporteres for leseren å bedømme.

  > Til din hardeste gjennomgang: hvis du mener det finnes et *prinsipielt* gulv
  > høyere enn 2 for «meningsfull ukentlig variasjon» — utledet fra
  > retur-frekvens og bank-struktur, ikke fra v8s tall — resonnerer vi det sammen og
  > hever terskelen. Jeg foreslår 2 fordi det er det høyeste jeg kan forsvare *uten*
  > å skjele til hva v8 scoret.

- **Negativt resultat (reelt mulig):** distinkt = 1 for en tradisjon betyr død
  variasjon — banker som ikke varierer, eller en seed som ikke når pick. Reelt mulig
  hvis en bank degenererte.

### D6 — Kombinatorisk bank-dekning `[GODKJENT]`
- **Måles:** andel av (tradisjon × intervall-kvalitet) og (tradisjon × kontur-form)
  som har en *ikke-generisk* variant (ikke fallback-strengen
  `bærer kvaliteten av …` / tom kontur). Statisk inspeksjon av bankene + korpus-
  bekreftelse at fallbacken aldri faktisk emitteres.
- **Maskinelt.**
- **Terskel: 0 % generisk-fallback** (full dekning: alle 12 kvaliteter × 8
  tradisjoner, alle 6 former × 8). Begrunnelse: påstanden er at hver tradisjon har
  full dekning. En fallback-treff = et hull, en input som gir en ikke-tradisjons-
  spesifikk frase. 0 % er det «full dekning» betyr.
- **Negativt resultat (reelt mulig):** en manglende bank-oppføring for en kvalitet/
  form = en input som faller til generisk. Reelt mulig (en glemt oppføring).

### D7 — Resonans-felt-korrekthet `[GODKJENT — beholdes]`
- **Måles:** fyrer hver felt-guardet resonansregel *kun* når feltet finnes? Over
  korpus: ratio-regler kun for pythagorean, deity-regler kun for norse/celtic,
  element-regler kun for element-tradisjoner — og aldri ellers.
- **Maskinelt.**
- **Terskel: 0 feilfyringer** (ingen regel fyrer for en tradisjon som mangler feltet
  dens guard krever). Begrunnelse: dette beviser at arkitekturen er *felt-drevet,
  ikke tradisjons-hardkodet* ([ADR-004](../decisions/ADR-004-field-guarded-resonance.md))
  — en metodisk påstand om designet, ikke bare om output.
- **Negativt resultat (reelt mulig):** en regel som fyrer der feltet mangler ville
  bety en guard-feil — arkitekturen er da ikke ren felt-drevet. Reelt mulig.

---

## Eksplisitt IKKE målt (B3 — vi later ikke som)
Disse kan ikke måles maskinelt ærlig, og påstås derfor ikke vist av denne
evalueringen:
- **Estetisk/litterær kvalitet** — en lesning kan bestå D1–D7 og likevel lese flatt.
- **Tonal autentisitet utover leksikon** — om egyptisk «føles» egyptisk forbi
  keyword-tilstedeværelse (jf. D2s kjente grense).
- **Meningsfullhet for en spørrende** — krever brukerstudie.
- **At v8 er «bedre»** i kvalitativ forstand — evalueringen viser *egenskaper*, ikke
  kvalitet.
- **Generalisering til ekte lyd-input** — korpuset er syntetiske lesninger; input-
  *formen* testes, ikke den faktiske lyd-fordelingen.

**Foreslått som eget, separat trinn (designet, ikke kjørt her):** et **lesere-panel**
— blind v7/v8(/AI-baseline)-vurdering, Likert på tradisjons-autentisitet og litterær
kvalitet, inter-rater-reliabilitet (Krippendorffs α). Den estetiske halvdelen måles
slik, eller ikke i det hele tatt — aldri ved å forkle en kodemetrikk som kvalitet.

---

## Korpus-konstruksjon (definert, IKKE kjørt)
- **Systematisk dekkende, ikke tilfeldig.** Et *covering design*: hvert dimensjons-
  verdi opptrer minst én gang per tradisjon, kombinert parvis der interaksjoner
  betyr noe. Ikke fullt kartesisk (8 × 12 × 6 × 3 × … = tusenvis; skjuler ingenting
  et dekkende sett ikke fanger).
- **Per tradisjon dekkes:** alle 12 intervall-kvaliteter (rotert som dominant par),
  alle 6 kontur-former, heksagram {changing, stabil, ingen}, vær {Vata, Pitta,
  Kapha, ingen, snø, vind}, astro {engelsk-til-stede, fraværende}, alle 12 symboler
  (hver som dominant minst én gang), celtic × 4 sesonger.
- **Estimert størrelse:** ~40–50 lesninger/tradisjon for covering-settet (~350–400
  base-lesninger) + variasjons-kjøring (×7 seeds på representative lesninger) ≈
  ~1000–1500 `generateInterpretation`-kall. Eksakt antall fastsettes av eval-skriptet
  og rapporteres.
- **Reproduserbarhet:** fast seed-liste + fast input-matrise + commit-hash + frosset
  leksikon (`363c4ab`) + eval-skriptet committet. En tredjepart regenererer nøyaktig
  tallene fra repoet.

---

## Det denne pre-registreringen forplikter oss til
Når dette er committet, og *deretter* korpuset kjøres: vi rapporterer resultatet for
hver dimensjon mot terskelen den bandt seg til — pass eller stryk — uten å justere
tersklene etterpå. En dimensjon som stryker, står som strøket i evaluerings-
rapporten. Det er hele forskjellen mellom en evaluering og selvskryt.
