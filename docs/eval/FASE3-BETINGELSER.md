# Fase 3 — harde porter før offentliggjøring

Dette dokumentet finnes for at betingelsene under skal **stå skrevet, ikke huskes**.
De møter oss som porter når Fase 3 åpnes — uansett hvilken instans som da er i tråden.

> Merk: dette dokumentet beskriver purge-målene *generisk* og navngir dem ikke
> verbatim — meta-dokumentet om embargo-veggen respekterer selv veggen. De konkrete
> strengene finnes ved å gjøre en full-historikk-scrub (Port 2) mot stopp-lista.

## PORT 1 (OBLIGATORISK) — historikk-rens før offentlig frys/repo

**Tilstand nå:** repoet er **privat backup**. HEAD er renset — test-importstiene er
relativisert, så det lokale snapshot-mappenavnet og macOS-brukernavnet er ute av HEAD.
**Men** de tidligere absolutte stiene står fortsatt i **git-historikken** på remote,
fra commits før relativiseringen.

**Hvorfor det er greit NÅ (C4-vurdering):** det som lekker i historikken er et lokalt
mappenavn + et brukernavn — *ikke* en credential (kategorisk forskjellig fra en gyldig
nøkkel, som måtte roteres), og *ikke* innhold fra noe embargoert spor. Det lekker bare
at en lokal mappe heter noe. Repoet er privat, på egen konto. Alvoret er lavt nok til
at historikk-omskriving ikke svarer seg for et privat backup.

**Hvorfor det IKKE er greit ved Fase 3 (E1):** i det øyeblikket vi nærmer oss en
offentlig DOI-frys eller et offentlig repo, endrer regnestykket seg fullstendig. Da er
enhver stopp-liste-term i enhver blob en **permanent, offentlig lekkasje**. E1 krever
at sealed materiale er ute av HEAD **OG historikk** før offentliggjøring.

**Kravet (gjøres som bevisst C2/C3-operasjon med argument-mot og porter):**
- Kjør `git filter-repo` (eller tilsvarende) over **alle refs** for å fjerne
  mappenavnet + brukernavnet fra hele historikken.
- Force-push den rensede historikken (repoet er allerede pushet, så omskriving krever
  force).
- Verifiser med en full-historikk-scrub (Port 2) — bekreft tomt over alle commits,
  ikke bare HEAD.
- Dette er en irreversibel, utadvendt operasjon — egen ADR med argument-mot, kjøres
  ikke uten eksplisitt go.

## PORT 2 — full-historikk-scrub som første steg i Fase 3

Før noe offentliggjøres: en scrub som dekker **hele historikken** (`--all`), ikke bare
de nye filene siden forrige push. Mønstrene fra stopp-lista kjøres **eksplisitt per ref
med byte-bevis** (jf. B2 — en loop som ordsplitter feil gir falsk grønn; «tomt treff»
og «leste aldri» ser identiske ut uten byte-tallet).

## PORT 3 — lesere-panelet (det maskinelle beviser ikke kvalitet)

Eval-arbeidet (`RESULTAT-v2.md`) beviser egenskaper (determinisme, lekkasjefrihet over
korpus, register-dekning, felt-drevet arkitektur) — **ikke** estetisk/litterær
kvalitet eller tonal autentisitet utover leksikon. Før en artikkel påstår noe om
kvalitet, kreves et blind lesere-panel (v7/v8, Likert, inter-rater-reliabilitet). Det
er designet i pre-registreringen, men **ikke kjørt**. Ingen kvalitets-påstand uten det.

---

*Disse portene er harde. De åpnes med eksplisitt go, hver som sin egen verifiserte
operasjon — ikke som et ledd som antas utført.*
