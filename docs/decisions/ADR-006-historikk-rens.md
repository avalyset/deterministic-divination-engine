# ADR-006 — Historikk-rens før offentlig frys: filter-repo vs ferskt repo

- **Status:** Akseptert — **Beslutning: B** (ferskt rent snapshot, privat repo urørt). Ingen historikk omskrevet.
- **Dato:** 2026-06-12
- **Berører:** hele git-historikken (alle refs), `avalyset/harmonic-tarot`
- **Forutsetter:** [FASE3-BETINGELSER Port 1](../eval/FASE3-BETINGELSER.md)

## Kontekst — recon-omfanget (read-only, byte-bevist)

Søk over **alle refs** (innhold via pickaxe + commit-meldinger):

- Det **lokale snapshot-mappenavnet + macOS-brukernavnet** lever i **2 blobs**, i
  absolutte importstier i to *test-filer*: `test/lexicon.mjs` (introdusert `363c4ab`)
  og `test/eval-corpus.mjs` (`1b5e030`). Fjernet fra HEAD i `7e1dd92`.
- **Ingen kildekode, ingen docs** bærer det.
- **Ingen** høyalvors embargo-spornavn (de fra stopp-lista) finnes *noe sted* i
  historikken — verken innhold eller meldinger. Null treff.
- HEAD er **rent** for alle stopp-termer (verifisert).

Det som ligger i historikken er altså et **mappenavn + et brukernavn** — *ikke* en
credential (kategorisk forskjellig fra den roterte nøkkelen), *ikke* embargoert
innhold. Lavt alvor mens repoet er privat; en permanent offentlig lekkasje hvis fryst
uten rens (E1).

## Beslutningen som skal tas
Hvordan oppfylle C4/E1 før en offentlig frys av **metoden** (motor + maskinell eval)
som eget verk.

## Alternativ A — `git filter-repo` på det eksisterende repoet
Fjerner termen fra alle blobs over alle refs, force-push.

**Argument MOT:**
- **Bryter hash-siteringene vi bygde metodevinkelen på.** `filter-repo` endrer *alle*
  commit-hasher nedstrøms av det tidligste treffet (`363c4ab` — tidlig i v8-stigen).
  ADR-ene, `PREREGISTRERING.md`/`-v2.md` og `RESULTAT-v1/v2.md` **siterer konkrete
  hasher** som sine falsifiserbare anker — særlig pre-registreringens «`1b2d573` før
  tallene», beviset på at tersklene eksisterte før korpuset. Etter en rewrite peker
  hver slik sitering på en **død hash**. Selve order-proofen vi bygde får sin
  referensielle integritet skadet.
- **Treffer begge branches** (`363c4ab` er på v8-ferdigstilling *og* main via merge).
- **Force-push** omskriver remote-historikk irreversibelt.
- **Kost/nytte:** vi ofrer den bisektbare, ADR-koherente, hash-siterte historikken —
  det vi brukte hele løypa på — for å fjerne et *mappenavn* som ikke er en credential.

## Alternativ B — ferskt rent repo for det offentlige verket; privat repo urørt
Et nytt repo (eller Zenodo-snapshot) med metode-snapshotet: motor + ADR-er + eval, med
ren historikk fra start. `avalyset/harmonic-tarot` (privat) beholder hele den rå
stigen som arbeidshistorikk, urørt.

**Argument MOT (ærlig — B er ikke gratis):**
- Den synlige bisektbare stigen finnes ikke i det *offentlige* verket (men dens verdi
  — beslutnings-provenens — ligger i ADR-ene som *innhold*, ikke i hasher).
- Hash-siteringene i ADR/pre-reg peker da på det **private** repoets hasher, som en
  leser av det offentlige verket ikke kan verifisere uten tilgang til det private.
- To repoer å holde styr på.

## Den skillende observasjonen
**Begge** alternativer rører hash-siteringene: A *bryter* dem in-place; B *flytter* dem
til det private repoet. Så valget hviler på hva frysens integritet skal stå på:
- **in-repo git-historikk** → da er A nærliggende, men prisen er at order-proofen selv
  brytes.
- **et deposit-DOI (Zenodo o.l.)** der artefaktens *innhold + tidsstempel* er beviset,
  og git-hashene er provenens-pekere til det private utviklingsrepoet → da er B ren:
  det offentlige er et snapshot, og det private holder den ubrutte stigen + de ekte
  tidsstemplede hashene som order-proof.

## Anbefaling (til Eiriks avgjørelse — ikke avgjort her)
**Lean B**, fordi: (a) det eneste i historikken er et lavalvors mappenavn/brukernavn,
ikke embargoert innhold eller en credential; (b) `filter-repo` ville skadet nettopp
order-proof-hash-siteringene vi ville bevart for det offentlige verket; (c) et ferskt
rent snapshot + privat repo som ubrutt provenens oppfyller C4/E1 **uten** å omskrive
noe. DOI-en blir frysebeviset; det private repoet holder den ekte rekkefølgen.

**Åpent spørsmål som avgjør A vs B:** trenger det offentlige verket den *synlige* git-
stigen, eller er ADR-dokumentert provenens + det private repoet som backing
tilstrekkelig? Det svaret velger veien.

## Beslutning — B
Det offentlige verket trenger ikke den synlige rå-stigen; provenansen ligger i ADR-ene
(innhold) og i det private repoet (ubrutt stige). Derfor: **ferskt rent offentlig
snapshot, privat repo urørt.** Begrunnelse:

- **B bevarer order-proof-hashene.** Anker-hashene (pre-registreringen før tallene, og
  hver dimensjons commit-rekkefølge) lever videre uendret i det private repoet. A ville
  drept dem ved å omskrive alt nedstrøms av et tidlig treff — og det er nettopp de
  hashene metodevinkelen hviler på.
- **Alvoret rettferdiggjør ikke A.** Det eneste i historikken er et lavalvors
  mappenavn + brukernavn i to test-blobs — null embargoert innhold, null spornavn,
  ingen credential. `filter-repo`s referensielle skade står ikke i forhold til det.
- **B forankrer i DOI, ikke i rå hash (D1).** Frysebeviset for det offentlige verket
  blir deposit-DOI-en (innhold + tidsstempel), ikke en git-hash som måtte bevares
  uendret. Hashene blir provenens-pekere til det private utviklingsrepoet.
- **C4/E1 oppfylt uten omskriving.** Det offentlige snapshotet er rent fra første
  commit; det skitne arbeidstreet forblir privat og urørt. Ingen force-push, ingen
  brutt historikk.

**Konsekvens / neste port:** snapshotet bygges som sin egen, nøye operasjon (egen
runde): hva inkluderes, hvordan provenansen dokumenteres uten å eksponere rå private
hasher, og en full scrub med byte-bevis FØR frys. Det glir ikke inn fra dette valget.

