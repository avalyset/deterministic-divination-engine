# ADR-005 — Deploy traff preview, ikke produksjon (rotårsak til april-feilen)

- **Status:** Akseptert · implementert
- **Dato:** 2026-06-12
- **Berører:** `package.json` (`deploy`-script)

## Kontekst
`package.json`s deploy-script var hardkodet til `--branch main`. Prosjektets
Cloudflare Pages **produksjonsbranch er `production`**. Wrangler behandler
`--branch main`-deploys som **Preview**, ikke Production. Custom domains
(`klangeller.no`, `www.klangeller.no`) mapper til produksjons-deployet — så et
preview-deploy når aldri brukeren.

## Beslutning
Deploy-scriptet ble rettet fra `--branch main` til `--branch production`
(verifiserbart: commit `215627c` endrer nøyaktig én linje i `package.json`), og
**committet FØR re-deploy**, slik at landingen brukte det fiksede scriptet og
beviste at den varige kommandoen treffer produksjon.

Verifiserbart: landings-deployet (`73c1fce9`) var `Environment: Production`;
`klangeller.no` live serverer v8-bundelen (`index-Ifrb29iu.js`), bekreftet ved
innholds-grep (`tetraktys`, `salamanderen`, `Ma'ats vekt`, `attestations` til
stede; v7-fraser fraværende).

## Hvordan den ble fanget
Landingen ble delt i to: **del 1** beviste at den *bygde* bundelen var v8; **del 2**
beviste at det *serverte* var v8. Del 2s live-grep mot `klangeller.no` fant at
domenet fortsatt serverte den gamle bundelen mens deploy-en rapporterte «Success».
Bare grepen mot live-responsen — ikke «deploy lyktes» — avslørte det.

## Rotårsak til april
Dette ble tidligere feildiagnostisert som «noen glemte å kjøre installeren imellom».
Den ekte årsaken er det hardkodede `--branch main` i deploy-scriptet: det treffer
Preview hver gang, ikke Production. April var ikke en menneskelig glipp — det var en
latent bug i deploy-kommandoen som ville bite hver gang til den ble fikset.

## Alternativer vurdert
- **Engangs manuell `--branch production`-deploy, fiks scriptet senere.** Argument
  mot: en manuell engangskommando ville landet v8 riktig, men latt fellen stå for
  neste deploy — nøyaktig situasjonen som ga april. Å fikse kilden OG lande med den
  fiksede kilden i ett verifisert steg beviser at den varige kommandoen virker.
- **Fikse scriptet etter deploy.** Argument mot: samme — det etterlater et gap der
  neste `npm run deploy` kunne gjenta feilen.

## Konsekvenser
- `npm run deploy` treffer nå produksjon. Den latente buggen er lukket i kilden.
- Verifiseringsdisiplinen — bevis det *serverte* innholdet, ikke deploy-rapporten —
  er praksisen som fanget den, og er nedfelt i [CONTRIBUTING](../../CONTRIBUTING.md).
