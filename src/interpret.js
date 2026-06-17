// ═══════════════════════════════════════════════════════════════
// TOLKNINGSMOTOR v8 — Vevd narrativ syntese
//
// Arkitektur: tradisjons-agnostisk buildContext + detectResonances,
// tradisjons-spesifikk GEN[tradition].compose.
//
// v8: Norrøn er full referanse-implementasjon. Andre tradisjoner
//     har skjelett med ctx.sentiment-fallback + tradisjons-vokabular.
//     Utfylles iterativt etter testing.
// ═══════════════════════════════════════════════════════════════

import {
  lookupSymbol, lookupTriad, lookupHexagramSymbol,
  noteToSlug, confidenceVoice, canCite
} from "./knowledgeSource.js";

// ───────────────────────────────────────────────────────────────
// 1. SENTIMENT (fra v7 ic()) — beholdes som ctx.sentiment
// ───────────────────────────────────────────────────────────────

function ic(intervals) {
  const con = ["Enhet","Glede","Varme","Fundament","Kvint — Harmonia"];
  const dis = ["Friksjon","Spenning","Djevelens intervall","Melankoli"];
  const c = intervals.filter(iv => con.includes(iv.quality)).length;
  const d = intervals.filter(iv => dis.includes(iv.quality)).length;
  if (c >= 2) return { tone:"harmoni",  desc:"dyp harmoni" };
  if (d >= 2) return { tone:"spenning", desc:"kreativ spenning" };
  return       { tone:"dialog",   desc:"kompleks dialog" };
}

// ───────────────────────────────────────────────────────────────
// 2. CONTEXT BUILDER
// ───────────────────────────────────────────────────────────────

export function buildContext(tradition, reading, weatherAnalysis, hexagram, contour) {
  const { top3, intervals, crossAspects } = reading;
  if (!top3?.length) return null;

  // Slå opp symbol-data for hver av de tre kortene.
  // NB: I Ching har per-tone symboler via card.data (ikke via heksagram —
  // heksagrammet er et separat signal vevd inn via ctx.hexagram).
  const symbols = top3.map(card => {
    const slug = noteToSlug(tradition, card.note);
    const symbol = slug ? lookupSymbol(tradition, slug) : null;
    return { card, symbol };
  });

  // intervals[] er alltid [0→1, 0→2, 1→2] (se App.jsx:1694)
  const pairs = intervals.length >= 3 ? {
    ab: { interval: intervals[0], a: symbols[0], b: symbols[1] },
    ac: { interval: intervals[1], a: symbols[0], b: symbols[2] },
    bc: { interval: intervals[2], a: symbols[1], b: symbols[2] },
  } : null;

  return {
    tradition,
    symbols,
    pairs,
    intervals,
    sentiment: ic(intervals),
    crossAspects: crossAspects || [],
    weather: weatherAnalysis || null,
    hexagram: hexagram || null,
    contour: contour || null,
  };
}

// ───────────────────────────────────────────────────────────────
// 3. RESONANS-DETEKTOR
// ───────────────────────────────────────────────────────────────

const DEITY_PLANET = {
  // Norrøn
  odin:"mercury", thor:"mars", freyja:"venus", freyr:"venus",
  tyr:"mars", frigg:"venus", heimdall:"mercury",
  hel:"pluto", skuld:"saturn", verdandi:"saturn",
  // Keltisk
  brigid:"venus", lugh:"sun", cernunnos:"saturn", dagda:"jupiter",
  morgan:"moon", cerridwen:"moon", mabon:"sun",
  // Egyptisk (via correspondences)
  ra:"sun", thoth_god:"mercury", isis:"moon", osiris:"pluto",
  hathor:"venus", sekhmet:"mars", horus:"sun", set:"mars",
};

const RESONANCE_RULES = [
  // Element i dominant symbol matcher dosha i været
  {
    id: "element_dosha_match",
    test: (ctx) => {
      const el = ctx.symbols[0]?.symbol?.correspondences?.element;
      const dosha = ctx.weather?.ayurveda?.dominant;
      if (!el || !dosha) return null;
      const match =
        (el === "fire"  && dosha === "Pitta") ||
        (el === "water" && dosha === "Kapha") ||
        (el === "air"   && dosha === "Vata")  ||
        (el === "earth" && dosha === "Kapha") ||
        (el === "ice"   && dosha === "Vata");
      return match ? { element: el, dosha } : null;
    },
  },

  // Contour-shape sync med intervall-harmoni
  {
    id: "contour_interval_sync",
    test: (ctx) => {
      if (!ctx.contour || !ctx.pairs) return null;
      const shape = ctx.contour.shape;
      const consonant = ["Kvint — Harmonia","Fundament","Enhet","Varme","Glede"];
      const harmonicPairs = Object.values(ctx.pairs)
        .filter(p => consonant.includes(p.interval.quality)).length;
      if (shape === "Stigende" && harmonicPairs >= 2)
        return { shape, kind: "ascending_harmonic" };
      if (shape === "Fallende" && harmonicPairs >= 2)
        return { shape, kind: "descending_harmonic" };
      return null;
    },
  },

  // Deity-korrespondanse i dominant symbol matcher sterkt transit-aspekt
  // NB: krever significance >= 0.5 for å unngå falske positiver på svake aspekter
  {
    id: "deity_transit_match",
    test: (ctx) => {
      const deity = ctx.symbols[0]?.symbol?.correspondences?.deity;
      const ca = ctx.crossAspects[0];
      if (!deity || !ca || ca.significance < 0.5) return null;
      if (DEITY_PLANET[deity] === ca.transitKey)
        return { deity, planet: ca.transitKey, aspect: ca.aspect.name };
      return null;
    },
  },

  // Alle tre symboler deler samme element → ren melding
  {
    id: "pure_element_triad",
    test: (ctx) => {
      const els = ctx.symbols.map(s => s.symbol?.correspondences?.element).filter(Boolean);
      if (els.length < 3) return null;
      const uniq = [...new Set(els)];
      return uniq.length === 1 ? { element: uniq[0] } : null;
    },
  },

  // Heksagram og dominant intervall bruker overlappende vokabular
  {
    id: "hexagram_interval_echo",
    test: (ctx) => {
      if (!ctx.hexagram?.primary || !ctx.pairs) return null;
      const q = ctx.pairs.ab.interval.quality;
      const hexName = ctx.hexagram.primary.name;
      if (q === "Bevegelse" && /bevegelse|fremgang|progress/i.test(hexName))
        return { hex: ctx.hexagram.primary.num, kind: "movement" };
      if (q === "Fundament" && /fundament|grunnlag|grounding/i.test(hexName))
        return { hex: ctx.hexagram.primary.num, kind: "foundation" };
      return null;
    },
  },

  // ── Ratio-regler (FELT-GUARDET på correspondences.ratio — fyrer KUN for
  //    tradisjoner med ratio-felt, dvs. pythagorean. Samme mønster som
  //    element-reglene over: dør stille for tradisjoner uten feltet). ──
  {
    id: "simple_ratio",
    test: (ctx) => {
      const ratio = ctx.symbols[0]?.symbol?.correspondences?.ratio;
      if (!ratio) return null;
      const SIMPLE = ["1:1", "2:1", "3:2", "4:3", "5:4", "5:3"];
      return SIMPLE.includes(ratio) ? { ratio, kind: "consonant" } : null;
    },
  },
  {
    id: "ratio_tension",
    test: (ctx) => {
      const ratio = ctx.symbols[0]?.symbol?.correspondences?.ratio;
      if (!ratio) return null;
      const COMPLEX = ["45:32", "16:15", "16:9", "15:8", "8:5"];
      return COMPLEX.includes(ratio) ? { ratio, kind: "dissonant" } : null;
    },
  },
];

export function detectResonances(ctx) {
  if (!ctx) return [];
  return RESONANCE_RULES
    .map(rule => {
      const match = rule.test(ctx);
      return match ? { id: rule.id, ...match } : null;
    })
    .filter(Boolean);
}

// ───────────────────────────────────────────────────────────────
// 4. HELPERS (delt på tvers av GEN-grener)
// ───────────────────────────────────────────────────────────────

function nm(s) {
  // Symbol-navn med fallback til v7 card.data.title
  if (s?.symbol?.name) return s.symbol.name;
  const t = s?.card?.data?.title || "";
  return t.split("—")[0].trim() || t;
}

function kw(s) {
  return s?.symbol?.keywords?.[0]
      || s?.card?.data?.keyword?.toLowerCase()
      || "";
}

// Flankør-glose (R2): navn + kort keyword fra symbolets egne data (samme kilde
// v7 brukte). Gloss-ordet er per definisjon i tradisjonens eget register.
function flankGloss(s) {
  const k = kw(s);
  return k ? `${nm(s)}, ${k}` : nm(s);
}

// Hexagram-essens (R1): bruk keyword (kort), fall tilbake til meaning, og strip
// ALLTID etterstilt punktum så hexagram-linja aldri får dobbelt punktum.
function hexWord(primary, fallback) {
  return ((primary && (primary.keyword || primary.meaning)) || fallback).replace(/\.\s*$/, "");
}

function meaning(s) {
  return s?.symbol?.canonicalMeaning
      || s?.card?.data?.keyword
      || "";
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function lowerFirst(s) { return s ? s[0].toLowerCase() + s.slice(1) : s; }

function norwegianElement(e) {
  return { fire:"ild", water:"vann", air:"luft", earth:"jord", ice:"is", aether:"eter" }[e] || e;
}

// ─── Sanitiser rå astrotekst (engelske ord → norsk) — reintrodusert fra v7 ───
function san(txt) {
  if (!txt) return "";
  return txt
    .replace(/\bmoon\b/gi, "Månen").replace(/\bmon\b/gi, "Månen")
    .replace(/\bsun\b/gi, "Solen").replace(/\bearth\b/gi, "Jorden")
    .replace(/\bascendant\b/gi, "ascendanten")
    .replace(/\s{2,}/g, " ").trim();
}

// ─── Seeded random + pick (deterministisk per note+dag) — reintrodusert fra v7 ───
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  h = h ^ (h >>> 16); h = Math.imul(h, 0x45d9f3b) | 0; h = h ^ (h >>> 16);
  return (h >>> 0) / 0xFFFFFFFF;
}
function pick(arr, seed) {
  if (!arr?.length) return arr?.[0] ?? null;
  return arr[Math.floor(seededRand(seed) * arr.length)];
}

// ─── Sesong — reintrodusert fra v7 (brukes av celtic-grenen) ───
function getSeason() {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'vår';
  if (m >= 5 && m <= 7) return 'sommer';
  if (m >= 8 && m <= 10) return 'høst';
  return 'vinter';
}

// ─── Kildeekko: citeringsgate ────────────────────────────────────
// Returnerer ET STRUKTURERT objekt (felt atskilt) eller null — aldri "",
// aldri en plassholder. canCite er den eneste gaten: fravær av en
// siterbar attestasjon ⇒ null ⇒ kallstedet legger ingenting til.
// originalQuote og translation holdes som SEPARATE verdier her; de
// konkateneres aldri i denne funksjonen. (2049/Dickins-hensyn.)
export function sourceEcho(symbol) {
  const atts = symbol?.attestations ?? [];
  const att = atts.find(a => canCite(a));   // ikke-rekonstruert OG originalQuote finnes
  if (!att) return null;                      // ingen kilde = stillhet
  const voice = confidenceVoice(att.confidence);
  return {
    name: symbol.name,
    verb: voice.verb,                         // "sier" | "gir ekko av" | "antyder"
    hedge: voice.hedge,                       // "" | "beslektet med"
    originalQuote: att.originalQuote,         // ATSKILT
    translation: att.translation ?? null,     // ATSKILT — kan utelates uten å røre originalQuote
    confidence: att.confidence,
  };
}

// Det ENESTE stedet de to feltene blir til én streng. Her — og bare her —
// kan translation droppes senere uten å berøre originalQuote.
// Defensiv: mangler verb (rekonstruert som mot formodning slapp gjennom),
// rendres ingenting.
export function renderEcho(echo) {
  if (!echo || !echo.verb || !echo.originalQuote) return null;
  const hedge = echo.hedge ? `${echo.hedge} ` : "";
  const tail = echo.translation ? ` (${echo.translation})` : "";
  return `${echo.name} ${echo.verb} ${hedge}«${echo.originalQuote}»${tail}`.replace(/\s{2,}/g, " ");
}

// ───────────────────────────────────────────────────────────────
// 5. TRADISJONS-STEMMER
// ───────────────────────────────────────────────────────────────

// ─── Norrøne variant-banker (variant 1 = v8-original, øvrige i samme register) ───
// Valgt med pick(variants, seed + suffiks); de to intervall-kallene (ab/bc)
// de-korreleres via ulikt seed-suffiks slik v7 gjorde (seed vs seed+"2").
const NORSE_IV_VOICE = {
  "Kvint — Harmonia":    ["synger av kosmisk balanse, som harpestrenger stemt av Bragi", "hviler i de ni verdeners reneste samklang — Æsenes egen kvint"],
  "Djevelens intervall": ["river portalen åpen — Ginnungagap gaper", "skjærer som Surts sverd gjennom de ni verdener"],
  "Fundament":           ["står som Yggdrasils stamme", "hviler i Midgards dype grunnfjell"],
  "Melankoli":           ["gråter med Freyas tårer", "synger moll gjennom Hels stille sletter"],
  "Friksjon":            ["knirker som is mot is", "gnistrer som Mjølner mot jotunstein"],
  "Bevegelse":           ["tar et galdr-skritt", "vandrer videre langs Bifrosts bue"],
  "Enhet":               ["smelter til én tone", "blir én klang — Yggdrasils korde i hvile"],
  "Glede":               ["ler som Braga ved mjødhornet", "stråler som Asgards mjød-haller ved kveld"],
  "Varme":               ["bærer ildens generøsitet", "omfavner hallen med Muspelheims milde glød"],
  "Spenning":            ["strammes som buestrengen før skuddet", "henger uløst som Nornenes spente tråd"],
  "Lengsel":             ["lengter mot noe bortenfor", "strekker seg mot Vanaheim over havet"],
  "Transcendens":        ["rekker ett halvt steg mot fullendelse", "nærmer seg Odins høysete, ett skritt unna"],
};

const NORSE_CONTOUR = {
  Stigende:    ["Stemmen din steg gjennom opptaket — en galdr som bygger kraft.", "Oppstigende galdr: Bifrost i lyd, fra Midgards jord mot Asgards høyder."],
  Fallende:    ["Stemmen falt som Odins blikk fra Hlidskjalf — visdom ned i mennesket.", "Fallende galdr: nedstigning gjennom Yggdrasils grener mot Hels stille rike."],
  Drone:       ["Stemmen holdt seg på én drone — tanpuraens stillhet, runens indre tone.", "En galdr-drone: Yggdrasils korde, forankret og uforanderlig som Mimer ved brønnen."],
  Springende:  ["Store sprang — Sleipners åtte bein over verdener.", "Stemmen sprang som Odin mellom de ni verdener — kontrast og dramatikk."],
  Bølgende:    ["Myk bølging — havfruens galdr, rolig og uavbrutt.", "Bølgende galdr: havets rytme mot Midgards kyst, frem og tilbake."],
  Fortellende: ["Stemmen fortalte — en kveding med oppgang, midte og fall.", "En fullstendig saga i lyd: skaldens kunst med begynnelse, midte og klimaks."],
};

// ─── Keltiske variant-banker (eget register: Ogham-trær, nemeton, årshjul,
// Annwn/Avalon, druide — aldri galdr/runer/Odin). Struktur kopiert fra norrøn,
// strenger ikke. ───
// MØNSTER-NOTAT: "stedet der lesningen foregår" er en VARIERT pool (definite
// form, så den passer "over/i/gjennom X"), ikke én fast streng. De 6 neste
// tradisjonene skal arve dette mønsteret — egen sted-pool per register —
// ikke en fast "Duat"/"Livets Tre" gjentatt 5 ganger.
const CELTIC_PLACE = ["lunden", "nemetonen", "krattet", "lysningen", "steinringen", "den hellige kilden"];

const CELTIC_IV_VOICE = {
  "Kvint — Harmonia":    ["synger som nemetonens hellige stillhet", "klinger rent som kilden i den dype skogen"],
  "Fundament":           ["står som eikens dype rot", "hviler i den gamle skogens grunn"],
  "Enhet":               ["fletter seg sammen som røtter under jord", "blir én stamme, ett tre i krattet"],
  "Varme":               ["bærer Beltane-ildens varme", "gløder som midtsommerbålet i skogkanten"],
  "Glede":               ["blomstrer som hagtornen i mai", "ler som bekken gjennom druidens skog"],
  "Bevegelse":           ["vandrer skogens sti videre", "følger årshjulet ett hakk rundt"],
  "Melankoli":           ["sørger som vinden gjennom Samhain-løvet", "bærer Annwns tåke i moll"],
  "Lengsel":             ["strekker seg mot Avalon over vannet", "lengter som eplet mot den andre verden"],
  "Spenning":            ["dirrer der sløret til Annwn er tynt", "står spent som buen i grenseskogen"],
  "Friksjon":            ["gnistrer som flint mot druidens stein", "river som tornekrattet i utkanten"],
  "Djevelens intervall": ["åpner porten til Annwn på vidt gap", "skjærer gjennom sløret mellom verdener"],
  "Transcendens":        ["nærmer seg Avalons port, ett tre unna", "rekker mot nemetonens innerste mysterium"],
};

const CELTIC_CONTOUR = {
  Stigende:    ["Stemmen steg som sevjen i eika om våren — oppover mot lyset.", "Stigende: greinene søker oppover mens røttene holder fast i jorden."],
  Fallende:    ["Stemmen falt som løvet ved Samhain — ned mot røttenes mørke visdom.", "Fallende: vann som finner sin vei ned mot Annwns underjordiske elver."],
  Drone:       ["Stemmen holdt nemetonens grunntone — én hellig frekvens der alt kretser.", "En drone som eikens laveste sus, uforanderlig i den stille skogen."],
  Springende:  ["Store sprang som hjortens flukt mellom skogens lysninger.", "Stemmen sprang over Annwns terskler — fra verden til verden."],
  Bølgende:    ["Myk bølging som elven gjennom det irske landskapet — aldri rett, alltid kurvet.", "Bølgende som årshjulets evige runde, frem og tilbake."],
  Fortellende: ["Stemmen fortalte en druidisk fortelling — fra bjørk til eføy, hele Ogham-rekken.", "En fortelling med oppgang, midte og fall, som årshjulet selv."],
};

// ─── Pythagoreiske banker (eget register: proporsjon, sfærenes harmoni,
// monad/tetrad/tetraktys, heltallsforhold — ingen guder, ingen steder, ingen
// årshjul). Struktur kopiert fra celtic, strenger ikke. ───
// SIRKULARITET: symbolet navngis som POLYGON/forhold (hexaden, 3:2), aldri som
// intervallnavn — og intervallet uttrykkes proporsjonelt. De to navnerommene
// overlapper derfor aldri.
function pyNorsk(polygon) {
  return {
    monad:"monaden", dyad:"dyaden", triad:"triaden", tetrad:"tetraden",
    pentad:"pentaden", hexad:"hexaden", heptad:"heptaden", ogdoad:"ogdoaden",
    ennead:"enneaden", dekad:"dekaden",
  }[polygon] || null;
}

// "Stedet" her er konseptuelt rom, ikke fysisk — arv av pool-vanen fra celtic.
const PYTH_PLACE = ["sfærenes rom", "tetraktysen", "tallenes orden", "proporsjonenes felt", "det udeltes sentrum", "monokordens streng"];

const PYTH_IV_VOICE = {
  "Kvint — Harmonia":    ["møtes i det reneste heltallsforholdet, 3:2", "klinger sammen som sfærenes helligste proporsjon"],
  "Fundament":           ["hviler i 4:3, tallenes faste grunn", "står som en enkel, bærende proporsjon"],
  "Enhet":               ["smelter til 1:1, monadens udelte resonans", "blir ett tall, én udelt klang"],
  "Varme":               ["forenes i 5:3, en raus proporsjon", "bæres av et mildt, sammensatt forhold"],
  "Glede":               ["lyser i 5:4, en åpen og klar proporsjon", "stiger i et lyst heltallsforhold"],
  "Bevegelse":           ["skrider fram i 9:8, steget mellom tallene", "driver framover som en voksende proporsjon"],
  "Melankoli":           ["dveler i 6:5, et dypere og tyngre forhold", "synker mot en mørkere proporsjon"],
  "Lengsel":             ["strekker seg gjennom 8:5, skjønnhet i avstand", "lengter langs et uoppløst forhold"],
  "Spenning":            ["holder 16:9 uløst, et tall som krever videre", "strammes i en sammensatt, ventende proporsjon"],
  "Friksjon":            ["gnistrer i 16:15, den minste sprekken mellom tall", "river i et trangt, nært forhold"],
  "Djevelens intervall": ["sprekker i 45:32, proporsjonen som aldri går opp", "åpner et forhold uten enkel oppløsning"],
  "Transcendens":        ["nærmer seg 15:8, ett steg fra helheten", "rekker mot fullendelsens tall"],
};

const PYTH_CONTOUR = {
  Stigende:    ["Stemmen steg gjennom sfærenes oppadgående rekke — mot de høyere tallene.", "Stigende: proporsjonen vokser, fra grunntall mot oktavens helhet."],
  Fallende:    ["Stemmen falt gjennom proporsjonene — ned mot monadens grunntall.", "Fallende: tallene synker mot kilden, mot det udeltes ro."],
  Drone:       ["Stemmen holdt monokordens grunntone — ett tall, uforanderlig.", "En drone på monadens frekvens — sfærenes første prinsipp i hvile."],
  Springende:  ["Store sprang mellom fjerne proporsjoner — tallenes plutselige geometri.", "Stemmen sprang mellom usammenhengende forhold, som punkter i tetraktysen."],
  Bølgende:    ["Myk bølging mellom nære heltallsforhold — proporsjonenes oscillasjon.", "Bølgende som det pytagoreiske komma, frem og tilbake mellom tallene."],
  Fortellende: ["Stemmen fortalte tallenes orden — fra monaden til dekaden og tilbake.", "En fullstendig proporsjonell fortelling, hele tetraktysen gjennomløpt."],
};

// ─── Egyptiske banker (eget register: neteru, Duat, Ma'ats vekt, Sia/Hu/Heka,
// hjerteveiingen, Nilen — aldri galdr/Ogham/sefiroth/proporsjon). Struktur
// kopiert fra celtic/pythagorean, strenger ikke. ───
// Gudene ligger i symbol-NAVN (slug), ikke i et deity-felt — derfor brukes de i
// glossen, ikke i en deity-transit-resonans som aldri kan fyre.
const EGYPT_PLACE = ["Duat", "dødsriket", "Ma'ats sal", "det doble landet", "Heliopolis", "Amentis stille rike"];
const EGYPT_SKY = { sun:"Ra", moon:"Khonsu" };  // veldokumenterte; resten via Nut-rammen + san()

const EGYPT_IV_VOICE = {
  "Kvint — Harmonia":    ["hviler i Ma'ats fullkomne vekt", "klinger som Sia og Hu i samklang"],
  "Fundament":           ["står som Djed-pilaren, Osiris' ryggrad", "hviler på det doble landets grunn"],
  "Enhet":               ["smelter sammen som Atum før skapelsen", "blir én neter, udelt i urvannet Nun"],
  "Varme":               ["bærer Ra-solens generøse glød", "omfavner som Hathors moderlige favn"],
  "Glede":               ["danser som Hathor ved sistrumets klang", "lyser som morgenrøden over Heliopolis"],
  "Bevegelse":           ["seiler videre på Ra-barken", "skrider som prosesjonen langs Nilen"],
  "Melankoli":           ["sørger som Isis over Osiris' kropp", "bærer klagesangen gjennom dødsriket"],
  "Lengsel":             ["strekker seg mot Aaru, sivmarkenes paradis", "lengter som ba-fuglen mot sin kropp"],
  "Spenning":            ["holder uveid, mens hjertet venter på Ma'ats fjær", "strammes som buen i Sekhmets vrede"],
  "Friksjon":            ["gnistrer som Set og Horus i strid", "river som ørkenvinden mot tempelmuren"],
  "Djevelens intervall": ["åpner Ammits gap ved veiingen", "river sløret mot Duats tolvte time"],
  "Transcendens":        ["nærmer seg Akh, den lysende udødelige", "rekker mot Nuts stjernehvelv"],
};

const EGYPT_CONTOUR = {
  Stigende:    ["Stemmen steg med Ra mot middagshimmelen — kraften løftet fra Duat.", "Oppstigende som Nut løfter morgensolen — fra nadir mot zenit."],
  Fallende:    ["Stemmen falt med Ra inn i nattbåtens reise — ned gjennom Duats timer.", "Fallende som Osiris' nedstigning — fallet som blir gjenfødelse."],
  Drone:       ["Stemmen holdt Atums urtone — verden i hvile før skapelsen.", "En drone som Ptahs hjerte i Memphis — ideen ennå uuttalt."],
  Springende:  ["Store sprang som Ba-fuglen mellom levende og død.", "Stemmen sprang som Horus' øye over de to landene."],
  Bølgende:    ["Myk bølging som Nilens flom og fall — årets pust.", "Bølgende som Hapi bærer vannet, syklisk og uten ende."],
  Fortellende: ["Stemmen fortalte Amduat — alle nattens tolv timer i én sang.", "En fullstendig Duat-reise: utforskning, fare, gjenfødelse."],
};

// ─── Thoth/Thelema-banker (eget register: Sefiroth, Livets Tre, hebraiske
// bokstaver, Vilje/Thelema, Abyss, pilarene — aldri galdr/Ogham/neteru/farge).
// VIKTIG: sign deles med hay, men taler QABALISTISK her (sti/bokstav/port),
// aldri som palett/farge. Struktur kopiert fra de andre, strenger ikke. ───
const THOTH_PLACE = ["Livets Tre", "Abysset", "Tiphareths sfære", "Da'aths port", "den supernale triade", "pilarenes mellomrom"];
const THOTH_SEPHIRA = { sun:"Tiphareth", moon:"Yesod", mercury:"Hod", venus:"Netzach", mars:"Geburah", jupiter:"Chesed", saturn:"Binah", uranus:"Chokmah", neptune:"Kether", pluto:"Da'ath" };
const THOTH_SIGN = { aries:"Væren", taurus:"Tyren", gemini:"Tvillingene", cancer:"Krepsen", leo:"Løven", virgo:"Jomfruen", libra:"Vekten", scorpio:"Skorpionen", sagittarius:"Skytten", capricorn:"Steinbukken", aquarius:"Vannmannen", pisces:"Fiskene" };
const THOTH_PLANET_NO = { venus:"Venus", moon:"Månen", sun:"Solen" };

const THOTH_IV_VOICE = {
  "Kvint — Harmonia":    ["finner midtpilarens likevekt", "forenes som nåde og strenghet i Tiphareth"],
  "Fundament":           ["hviler i Yesods grunnvoll", "står som Malkuth, riket ved Treets fot"],
  "Enhet":               ["smelter mot Kether, den udelte krone", "blir ett i Ain Soph, det grenseløse lys"],
  "Varme":               ["bærer Cheseds nåde og overflod", "stråler med Tiphareths indre sol"],
  "Glede":               ["lyser i Netzachs seier", "danser som Viljen frigjort på stien"],
  "Bevegelse":           ["skrider langs stien som Hermes' stav", "vandrer fra sefira til sefira oppover Treet"],
  "Melankoli":           ["dveler i Binahs sorg, den store moder", "bærer Saturns tyngde mot Abysset"],
  "Lengsel":             ["strekker seg mot Kether over Abysset", "lengter som den lavere mot den høyere Vilje"],
  "Spenning":            ["holder Geburahs strenghet mot Cheseds nåde", "strammes mellom pilarene, ute av likevekt"],
  "Friksjon":            ["gnistrer som lynet ned Treet", "river mot Da'aths tomme port"],
  "Djevelens intervall": ["åpner Abysset der Da'ath gaper", "splitter pilarene, ingen sti holder"],
  "Transcendens":        ["nærmer seg Kether, ett trinn fra kronen", "rekker mot det supernale lyset"],
};

const THOTH_CONTOUR = {
  Stigende:    ["Stemmen steg langs Livets Tre — fra Malkuth mot Kether, Viljens oppstigning.", "Oppadgående: lynets vei vendt om, sjelen tilbake mot lyset."],
  Fallende:    ["Stemmen falt som lynet fra Kether — manifestasjonen ned til Malkuth.", "Fallende: nedstigning gjennom sefiroth, ånd som blir form."],
  Drone:       ["Stemmen holdt Ain Soph-tonen — Vilje uten objekt, rent potensial.", "En Kether-drone: ingen form, bare værens første gnist."],
  Springende:  ["Store sprang mellom sefiroth — Viljens plutselige hopp over stiene.", "Stemmen sprang som lyn mellom Da'ath og Tiphareth."],
  Bølgende:    ["Myk bølging mellom pilarene — nåde og strenghet i pendel.", "Bølgende som slangen som klatrer Treet, sti for sti."],
  Fortellende: ["Stemmen fortalte de toogtyve stiene — hele Treet fra Malkuth til Kether.", "En fullstendig magisk fortelling, lynet og slangen i ett."],
};

// ─── Hay-banker (eget register: farge som HARMONI og struktur — komplementærer,
// fargehjulets proporsjon, spekteret. Hays kjerneinnsikt: samme proporsjon som
// gir musikalsk konsonans gir visuell. ALDRI bare fargekoder, ALDRI Golden Dawns
// farge-på-Livets-Tre — thoths kabbalistisk-koloristiske apparat holdes ute. ───
const HAY_PLACE = ["paletten", "fargehjulet", "spekteret", "lerretet", "prismet", "det kromatiske feltet"];
// sign/planet → farge, rammet via hjul/spektrum (Hays struktur), ikke som sti-farge.
const HAY_SIGN_TONE = {
  aries:"Væren i glødende rødt", taurus:"Tyren i jordgrønt", gemini:"Tvillingene i lysegult",
  cancer:"Krepsen i sølvgrått", leo:"Løven i gyllent", virgo:"Jomfruen i duset oker",
  libra:"Vekten i klart grønt", scorpio:"Skorpionen i dyprødt", sagittarius:"Skytten i purpur",
  capricorn:"Steinbukken i kullgrått", aquarius:"Vannmannen i elektrisk blått", pisces:"Fiskene i havblått",
};
const HAY_PLANET_COL = {
  mars:"rødt", venus:"grønt", mercury:"oransjegult", sun:"gull", moon:"sølv",
  jupiter:"dypblått", saturn:"indigo", pluto:"mørkt rødbrunt", neptune:"sjøgrønt",
  uranus:"elektrisk turkis", earth:"mosegrønt",
};

const HAY_IV_VOICE = {
  "Kvint — Harmonia":    ["møtes som komplementærfarger i fullkommen balanse", "klinger som de reneste fargene side om side på hjulet"],
  "Fundament":           ["hviler i en jordet, mettet grunntone", "står som fargehjulets faste akse"],
  "Enhet":               ["smelter til én ren bølgelengde", "blir hvitt lys, alle farger udelt i prismet"],
  "Varme":               ["gløder i varme, beslektede toner", "bærer paletten mot gull og oransje"],
  "Glede":               ["lyser i en lett, åpen durfarge", "stiger mot klare, høye nyanser"],
  "Bevegelse":           ["skrider ett steg langs spekteret", "glir fra nyanse til nyanse på hjulet"],
  "Melankoli":           ["dveler i kjølige blå og indigo", "synker mot mettede, mørke toner"],
  "Lengsel":             ["strekker seg mot en fjern komplementær", "lengter som fiolett mot sitt motstykke"],
  "Spenning":            ["vibrerer som to nesten like nyanser i konflikt", "holder en uløst kontrast på lerretet"],
  "Friksjon":            ["gnistrer som komplementærer presset for tett sammen", "skurrer der to bølgelengder kolliderer"],
  "Djevelens intervall": ["river paletten i to uforenlige halvdeler", "splitter spekteret der ingen harmoni holder"],
  "Transcendens":        ["nærmer seg det rene hvite lyset, alle farger i ett", "rekker mot spekterets ytterste klarhet"],
};

const HAY_CONTOUR = {
  Stigende:    ["Stemmen steg mot lysere toner — paletten klarner mot hvitt.", "Oppadgående: fra dype pigmenter mot lysende, høye nyanser."],
  Fallende:    ["Stemmen falt mot dypere farger — ned i mettet indigo og mørke.", "Fallende: paletten synker fra lys mot de tunge, dype tonene."],
  Drone:       ["Stemmen holdt én farge — en monokrom, meditativ grunntone.", "En drone-farge: én bølgelengde, hel og ufortynnet."],
  Springende:  ["Store sprang mellom fjerne komplementærer — maksimal kontrast.", "Stemmen sprang over fargehjulet, fra rødt til blått i ett kast."],
  Bølgende:    ["Myk bølging mellom beslektede nyanser — akvarellens glidning.", "Bølgende som en gradient, ingen hard kant mellom fargene."],
  Fortellende: ["Stemmen fortalte hele spekteret — fra grunntonen gjennom alle farger og hjem.", "En fullstendig komposisjon: hele paletten gjennomløpt, fra rødt til fiolett."],
};

// ─── Elementær-banker (eget register: Paracelsus' elementånder salamander/sylf/
// undine/gnome + akasha, de fire+ himmelretningene, de sammensatte overgangene).
// FAREN her er IKKE fremmedord — det er INTETSIGENHET: at stemmen blir den
// nøytrale element-grunnstammen alle de andre deler. Ansiktet kommer fra
// vesenene og retningene, ikke fra "ild/vann/jord" alene. ───
const ELEM_BEING = { fire:"salamanderen", water:"undinen", air:"sylfen", earth:"gnomen", aether:"akasha" };
const ELEM_DIR = { south:"sør", east:"øst", north:"nord", west:"vest" };
const ELEM_PLACE = ["de fire hjørnene", "sirkelens sentrum", "elementenes port", "åndenes krets", "det femte punktet", "verdenshjørnenes møte"];

const ELEM_IV_VOICE = {
  "Kvint — Harmonia":    ["finner likevekt som de fire i sirkelens sentrum", "klinger rent der ånd møter ånd i balanse"],
  "Fundament":           ["hviler i gnomens dype jord", "står fast som nord, elementenes anker"],
  "Enhet":               ["smelter til akasha, det femte som binder", "blir ett element, udelt i kilden"],
  "Varme":               ["gløder i salamanderens favn", "bærer ildens generøsitet fra sør"],
  "Glede":               ["danser som sylfen i østavind", "lyser som luft og ild i flukt"],
  "Bevegelse":           ["driver fram som vinden fra øst", "skrider et steg rundt sirkelen"],
  "Melankoli":           ["dveler i undinens dype vann", "synker mot vest, mot kveldens element"],
  "Lengsel":             ["strekker seg som vannet mot havet", "lengter som flammen mot luften den trenger"],
  "Spenning":            ["holder ild mot vann, damp uten utløsning", "strammes der to elementer ikke vil forenes"],
  "Friksjon":            ["gnistrer der ild slår mot jord", "skurrer som sylf mot gnome, luft mot stein"],
  "Djevelens intervall": ["river sirkelen der ild og vann står i krig", "splitter de fire, ingen retning holder"],
  "Transcendens":        ["nærmer seg akasha, elementene oppløst i det femte", "rekker mot sentrum der alle fire stilner"],
};

const ELEM_CONTOUR = {
  Stigende:    ["Stemmen steg som ild og luft i oppstigning — salamander og sylf mot høyden.", "Oppadgående: flammen og vinden løfter seg fra jorden mot eteren."],
  Fallende:    ["Stemmen falt som vann mot jord — undinen søker det laveste punkt.", "Fallende: tyngden trekker alt ned mot gnomens grunn."],
  Drone:       ["Stemmen holdt akasha-dronen — det femte element i absolutt ro.", "En drone som jordens egen resonans, gnomen i dvale."],
  Springende:  ["Store sprang mellom elementene — ild til vann, luft til jord i kast.", "Stemmen sprang fra hjørne til hjørne av sirkelen."],
  Bølgende:    ["Myk bølging som vann i undinens rolige dans.", "Bølgende som luftens sakte sirkulasjon, sylfen som glir."],
  Fortellende: ["Stemmen fortalte elementenes syklus — ild, luft, vann, jord og hjem.", "En fullstendig runde om sirkelen, alle fire og det femte."],
};

// ─── I Ching-banker (eget register: yin/yang, trigram, Tao, linjenes bevegelse,
// de åtte trigram-naturene). HEKSAGRAMMET ER SENTRUM — disse er UNDERORDNET;
// forandringen (changingLines → relating) bæres i compose-kroppen, ikke her.
// Heksagram-NAVN er delt signal, ikke i leksikonet. ───
const ICHING_PLACE = ["forandringens felt", "de åtte retningers hjul", "Taos strøm", "linjenes vev", "orakelets dyp", "yin og yangs møte"];

const ICHING_IV_VOICE = {
  "Kvint — Harmonia":    ["flyter sammen som yin og yang i likevekt", "klinger som fred mellom himmel og jord"],
  "Fundament":           ["hviler i jordens mottakende ro", "står fast som den nederste, ubevegelige linje"],
  "Enhet":               ["smelter til taiji, det udelte før yin og yang", "blir én ubrutt linje, ren yang"],
  "Varme":               ["åpner seg sjenerøst som ildens tilknytning", "bærer en mild, nærende yang-glød"],
  "Glede":               ["ler som sjøens stille glede", "stiger som lett yang gjennom linjene"],
  "Bevegelse":           ["driver fram som tordenens første rørelse", "skrider et trinn videre i forvandlingen"],
  "Melankoli":           ["dveler i det dype vannets fare", "synker som yin mot sin dypeste ro"],
  "Lengsel":             ["strekker seg mot linjen som ennå ikke har snudd", "lengter som yin mot yangen den mangler"],
  "Spenning":            ["holder en linje uavklart, mellom skifte og ro", "strammes der yin og yang ikke vil vike"],
  "Friksjon":            ["gnistrer som vinden som trenger gjennom", "skurrer der to trigrammer ikke forenes"],
  "Djevelens intervall": ["river tegnet der alle linjer vil snu", "splitter Tao, ingen retning holder"],
  "Transcendens":        ["nærmer seg Wu Ji, det formløse før forandring", "rekker mot den stille akse alt dreier om"],
};

const ICHING_CONTOUR = {
  Stigende:    ["Stemmen steg som yang som vokser linje for linje — tålmodig oppstigning.", "Oppadgående: de nedre linjene løfter seg mot himmelen."],
  Fallende:    ["Stemmen falt som yin som synker — befrielse gjennom nedstigning.", "Fallende: de øvre linjene gir etter, mottakelig ro."],
  Drone:       ["Stemmen holdt seg stille som jordens ro — intet forandres.", "En drone: Wu Ji, det formløse før yin og yang skilles."],
  Springende:  ["Store sprang som mange linjer som snur på én gang — brå forvandling.", "Stemmen sprang mellom trigrammene, fra himmel til jord."],
  Bølgende:    ["Myk bølging som yin og yang i naturlig veksling — varig syklus.", "Bølgende som Taos strøm, frem og tilbake uten ende."],
  Fortellende: ["Stemmen fortalte alle seks linjer — tegnets fulle bevegelse.", "En fullstendig forvandling: fra første linje til sjette, og hjem."],
};

const GEN = {

  // ═══════════════════════════════════════════════════════════
  // NORRØN — REFERANSE-IMPLEMENTASJON
  // ═══════════════════════════════════════════════════════════
  norse: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc, ac } = ctx.pairs || {};
      const parts = [];

      // ── Åpning: navngi alle tre, situer i runehallen ──
      parts.push(
        `Stemmen din rister ${nm(s1)}, ${meaning(s1).replace(/\.$/, "").toLowerCase()}, ` +
        `flankert av ${flankGloss(s2)}, og ${flankGloss(s3)}. ${this._triadGloss(s1, s2, s3)}`
      );

      // ── Kildeekko for dominantsymbolet — KUN hvis en attestasjon kan siteres.
      //    Ingen else: fravær av kilde = ingenting legges til. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par eksplisitt ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi vevd inn ──
      if (ctx.crossAspects[0]) {
        parts.push(this._astroPhrase(ctx.crossAspects[0]));
      }

      // ── Vær som galdr-kontekst ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather);
        if (w) parts.push(w);
      }

      // ── Contour som galdr-form ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram bekrefter ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, bekrefter: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "noe rystes løs"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    _triadGloss(s1, s2, s3) {
      const els = [s1, s2, s3]
        .map(s => s.symbol?.correspondences?.element)
        .filter(Boolean);
      const uniq = [...new Set(els)];
      if (uniq.length === 1 && els.length === 3) {
        return `Tre runer i ${norwegianElement(uniq[0])} — en ren melding.`;
      }
      if (uniq.length === 3) {
        return `Tre elementer møtes ved Urds brønn: ${uniq.map(norwegianElement).join(", ")}.`;
      }
      // Fallback når en eller flere mangler element
      const names = [nm(s1), nm(s2), nm(s3)].join(", ");
      return `${names} tegner en hall der kreftene forhandler.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = NORSE_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca) {
      const NORSE_PLANET = {
        sun:"Sunna", moon:"Máni", mercury:"Odins bud",
        venus:"Freya", mars:"Tyr", jupiter:"Thor",
        saturn:"Urd", uranus:"den uventede kraft",
        neptune:"Ægir", pluto:"Hel",
      };
      const p = NORSE_PLANET[ca.transitKey] || ca.transitPlanet?.name || "himmelen";
      const verb = ca.aspect.nature === "harmoni" ? "nikker" :
                   ca.aspect.nature === "spenning" ? "utfordrer" : "møter";
      return `${p} ${verb} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      if (snow > 0) return "Niflheims snø faller over lesningen — isen hører med.";
      if (wind > 15 && dosha === "Vata")
        return "Nordavinden bærer Vata-kulde — galdren løftes av luft.";
      if (dosha === "Pitta")
        return "Varmen ute nærer Muspelheims flamme i stemmen.";
      if (dosha === "Kapha")
        return "Fuktighet og tyngde i luften — Midgards jord puster langsomt.";
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = NORSE_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r) {
      switch (r.id) {
        case "element_dosha_match":
          return `${capitalize(norwegianElement(r.element))} i runen møter ${r.dosha} i været — lesningen er dobbelt forsterket.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning speiler intervallenes harmoni — alt peker samme vei."
            : "Stemmens fall bærer intervallenes ro — hvile som aksept.";
        case "deity_transit_match":
          return `Gudenes planet står i himmelen mens runen synger — ${r.deity} er nær.`;
        case "pure_element_triad":
          return `Alle tre runer deler samme element — meldingen er ren og uten motstand.`;
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet bruker samme verb — inner og ytre stemmer samstemt.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // SKJELETT-GRENER
  // Bruker ctx.sentiment som fallback + tradisjons-vokabular.
  // Utfylles iterativt til full referanse-kvalitet.
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // HAY — full referanse (tradisjon 5). Farge som HARMONI/struktur, ikke
  // koder. Element-resonansene fyrer (hay har element) → hay-fargede.
  // sign tales som FARGE (motsatt av thoth), men holdt i Hays fargehjul-
  // struktur, ikke Golden Dawns farge-på-Tre.
  // ═══════════════════════════════════════════════════════════
  hay: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const parts = [];

      // ── Åpning ──
      parts.push(
        `Stemmen din komponerer ${nm(s1)}, ${meaning(s1).replace(/\.$/, "").toLowerCase()}, ` +
        `mot ${flankGloss(s2)}, og ${flankGloss(s3)}. ${this._triadGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Stjernetegn som FARGE (her SKAL fargen tale), via hjulet ──
      parts.push(`Fargen slår an: ${this._colorTone(s1)}.`);

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi: planeten som farge (ingen sefira-kraft, ingen gud) ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær → farge/lys-bilder ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som bevegelse over spekteret ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder over ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "en nyanse skifter"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    _place(seed) {
      return pick(HAY_PLACE, seed || "");
    },

    // sign → farge, rammet i fargehjulet (Hays struktur), ikke som sti-farge.
    _colorTone(s) {
      const c = s.symbol?.correspondences || {};
      const tone = HAY_SIGN_TONE[c.sign];
      return tone
        ? `${tone}, der nyansen finner sin plass på hjulet`
        : "en ren tone, lavt på paletten";
    },

    _triadGloss(s1, s2, s3, seed) {
      const els = [s1, s2, s3].map(s => s.symbol?.correspondences?.element).filter(Boolean);
      const uniq = [...new Set(els)];
      if (uniq.length === 1 && els.length === 3)
        return `Tre kort i ${norwegianElement(uniq[0])} — én sammenhengende fargefamilie over ${this._place(seed + "tre")}.`;
      if (uniq.length === 3)
        return `Tre elementer, tre fargeområder møtes på ${this._place(seed + "tre")}: ${uniq.map(norwegianElement).join(", ")}.`;
      const names = [nm(s1), nm(s2), nm(s3)].join(", ");
      return `${names} spenner ut en palett over ${this._place(seed + "tre")}.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = HAY_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const col = HAY_PLANET_COL[ca.transitKey];
      const sted = this._place(seed + "astro");
      const verb = ca.aspect.nature === "harmoni" ? "harmonerer" :
                   ca.aspect.nature === "spenning" ? "skurrer" : "blander seg";
      return col
        ? `Planetens farge, ${col}, ${verb} på ${sted} — ${lowerFirst(san(ca.text))}.`
        : `En farge ${verb} på ${sted} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Lyset blekner over ${sted} — alt trekker mot kjølig hvitt.`;
      if (wind > 15 && dosha === "Vata") return "Vinden sprer pigmentene — fargene løses opp i bevegelse.";
      if (dosha === "Pitta") return `Varme toner metter ${sted} — rødt og gull intensiveres.`;
      if (dosha === "Kapha") return `Tunge, mettede farger siger over ${sted} — paletten mørkner.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = HAY_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      switch (r.id) {
        case "element_dosha_match":
          return `${capitalize(norwegianElement(r.element))}-tonen i kortet møter ${r.dosha} i været — farge og temperatur forsterker hverandre.`;
        case "pure_element_triad":
          return `Alle tre kort i samme element — én ren fargefamilie, harmonien uten brudd.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger paletten mot lyset — alt klarner samstemt."
            : "Stemmens fall følger fargen mot dybden — ro i de mørke tonene.";
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet svarer til hverandre — samme forhold i tone som i farge.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // THOTH/THELEMA — full referanse (tradisjon 4). Ingen element/deity/ratio,
  // så resonanslaget hviler på contour + hexagram (THOTH-farget).
  // sign deles med hay, men tales QABALISTISK (sti/bokstav), aldri som farge.
  // ═══════════════════════════════════════════════════════════
  thoth: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const parts = [];

      // ── Åpning: situer på Livets Tre via sefira ──
      const sef1 = s1.symbol?.correspondences?.sephira;
      parts.push(
        `Viljen din reiser ${nm(s1)}, ${meaning(s1).replace(/\.$/, "").toLowerCase()}, ` +
        `${sef1 ? `i ${capitalize(sef1)} på Livets Tre` : "langs stiene"}, ` +
        `flankert av ${flankGloss(s2)}, og ${flankGloss(s3)}. ${this._triadGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Stjernetegn/planet som STI + bokstav (qabalistisk, ALDRI farge) ──
      parts.push(`Stien åpner seg: ${this._signPath(s1)}.`);

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi: planet som sefira-kraft (qabalistisk, ingen farge) ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær → qabalistiske bilder ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som sti-form ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder gjennom ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "et tegn rører seg på stien"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    _place(seed) {
      return pick(THOTH_PLACE, seed || "");
    },

    // sign/planet → sti + hebraisk bokstav. ALDRI farge/palett.
    _signPath(s) {
      const c = s.symbol?.correspondences || {};
      const letter = c.letter ? capitalize(c.letter) : null;
      if (c.sign)
        return `${THOTH_SIGN[c.sign] || c.sign} tegner stien${letter ? ` ${letter}` : ""} på Livets Tre`;
      if (c.planet)
        return `${THOTH_PLANET_NO[c.planet] || c.planet} hviler på stien${letter ? ` ${letter}` : ""}`;
      return letter ? `bokstaven ${letter} danner porten` : "stien ligger åpen";
    },

    _triadGloss(s1, s2, s3, seed) {
      const sefs = [s1, s2, s3].map(s => s.symbol?.correspondences?.sephira).filter(Boolean);
      const uniq = [...new Set(sefs)];
      if (uniq.length === 1 && sefs.length === 3)
        return `Tre kort i samme sefira, ${capitalize(uniq[0])} — én konsentrert Vilje i ${this._place(seed + "tre")}.`;
      if (uniq.length === 3)
        return `Tre sefiroth tegner en triade på Treet: ${uniq.map(capitalize).join(", ")}.`;
      const names = [nm(s1), nm(s2), nm(s3)].join(", ");
      return `${names} reiser en sti gjennom ${this._place(seed + "tre")}.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = THOTH_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const sef = THOTH_SEPHIRA[ca.transitKey];
      const verb = ca.aspect.nature === "harmoni" ? "flyter fritt" :
                   ca.aspect.nature === "spenning" ? "strammer stien" : "forhandler";
      return sef
        ? `Kraften i ${sef} ${verb} — ${lowerFirst(san(ca.text))}.`
        : `En kraft langs stiene ${verb} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Stillhet senker seg over ${sted} — Binahs frost stanser stiene.`;
      if (wind > 15 && dosha === "Vata") return "Et lyn farer ned Treet — Geburahs kraft river gjennom luften.";
      if (dosha === "Pitta") return `Cheseds nåde gløder over ${sted} — varmen utvider stiene.`;
      if (dosha === "Kapha") return `Tyngde over ${sted} — Malkuths materie siger mot jorden.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = THOTH_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      switch (r.id) {
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger lynets vei opp Treet — Viljen søker kronen."
            : "Stemmens fall følger manifestasjonen ned — ånd som blir form i Malkuth.";
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet bærer samme tegn — som over Abysset, så under.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // EGYPTISK — full referanse (tradisjon 3). Element-resonanser fyrer
  // (egyptisk har element), men i egyptiske bilder. Gudene i glossen,
  // ikke i en deity-transit-resonans (correspondences har ingen deity).
  // ═══════════════════════════════════════════════════════════
  egyptian: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const parts = [];

      // ── Åpning: gudene navngis her (i slug/name), ikke i en resonans ──
      parts.push(
        `Stemmen kaller fram ${nm(s1)}, ${meaning(s1).replace(/\.$/, "").toLowerCase()}, ` +
        `fulgt av ${flankGloss(s2)}, og ${flankGloss(s3)}. ${this._triadGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi: Nut-rammen (san-fallback, ingen deity-transit) ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær → egyptiske bilder ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som Duat-form ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder gjennom ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "et tegn rører seg i mørket"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    _place(seed) {
      return pick(EGYPT_PLACE, seed || "");
    },

    _triadGloss(s1, s2, s3, seed) {
      const els = [s1, s2, s3].map(s => s.symbol?.correspondences?.element).filter(Boolean);
      const uniq = [...new Set(els)];
      if (uniq.length === 1 && els.length === 3)
        return `Tre neteru i ${norwegianElement(uniq[0])} — én samstemt kraft i ${this._place(seed + "tre")}.`;
      if (uniq.length === 3)
        return `Tre elementer møtes ved Ma'ats vekt: ${uniq.map(norwegianElement).join(", ")}.`;
      const names = [nm(s1), nm(s2), nm(s3)].join(", ");
      return `${names} samles i ${this._place(seed + "tre")}, der maktene veies.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = EGYPT_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const body = EGYPT_SKY[ca.transitKey];
      const sted = this._place(seed + "astro");
      const verb = ca.aspect.nature === "harmoni" ? "stiger i fred" :
                   ca.aspect.nature === "spenning" ? "uroer Ma'at" : "vandrer";
      return body
        ? `${body} ${verb} over ${sted} — ${lowerFirst(san(ca.text))}.`
        : `Nut hvelver seg over ${sted} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Sjelden kulde over ${sted} — selv ørkenen tier.`;
      if (wind > 15 && dosha === "Vata") return "Ørkenvinden farer over det doble landet — Set rører støvet.";
      if (dosha === "Pitta") return `Ra-solen brenner over ${sted} — heten skjerper alt.`;
      if (dosha === "Kapha") return `Nilens flom ligger tung over ${sted} — slammet nærer jorden.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = EGYPT_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      const sted = this._place((seed || "") + "res" + r.id);
      switch (r.id) {
        case "element_dosha_match":
          return `${capitalize(norwegianElement(r.element))} i neteren møter ${r.dosha} i været — Ma'ats vekt slår dobbelt ut.`;
        case "pure_element_triad":
          return `Alle tre neteru deler samme element — budskapet veier rent på Ma'ats vekt.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger Ra-barkens oppgang — alt søker lyset."
            : `Stemmens fall følger nattbåtens ferd — hvile i dypet av ${sted}.`;
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet bærer samme tegn — som i himmelen, så i Duat.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // KELTISK — full referanse (tradisjon 1). Struktur som norrøn,
  // eget Ogham-/lund-/årshjul-register. Sesong-fletten bevart.
  // ═══════════════════════════════════════════════════════════
  celtic: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const festival = { vår:"Beltane", sommer:"Lughnasadh", høst:"Samhain", vinter:"Imbolc" }[getSeason()];
      const parts = [];

      // ── Åpning: sesong-flettet, situert i Ogham-skogen ──
      parts.push(
        `I ${festival}-energiens Ogham-skog vekker stemmen din ${nm(s1)}, ` +
        `${meaning(s1).replace(/\.$/, "").toLowerCase()}, omkranset av ${flankGloss(s2)}, og ${flankGloss(s3)}. ` +
        `${this._treeGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi (san-fallback, ALDRI NORSE_PLANET) ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær som skog-kontekst ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som skog-form ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder gjennom ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "noe rører seg i skogen"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    // Sted-pool: velg deterministisk per seed+suffiks. Ingen enkelt lesning
    // skal gjenta samme sted-ord mer enn ~2 ganger.
    _place(seed) {
      return pick(CELTIC_PLACE, seed || "");
    },

    _treeGloss(s1, s2, s3, seed) {
      const els = [s1, s2, s3].map(s => s.symbol?.correspondences?.element).filter(Boolean);
      const uniq = [...new Set(els)];
      if (uniq.length === 1 && els.length === 3)
        return `Tre trær i ${norwegianElement(uniq[0])} — ${this._place(seed + "tre")} står samstemt.`;
      if (uniq.length === 3)
        return `Tre elementer møtes i ${this._place(seed + "tre")}: ${uniq.map(norwegianElement).join(", ")}.`;
      const names = [nm(s1), nm(s2), nm(s3)].join(", ");
      return `${names} reiser et nett av stier gjennom ${this._place(seed + "tre")}.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = CELTIC_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const verb = ca.aspect.nature === "harmoni" ? "smiler" :
                   ca.aspect.nature === "spenning" ? "uroer" : "rører";
      return `Himmelen over ${this._place(seed + "astro")} ${verb} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Snø legger seg stille over ${sted} — alt hviler under det hvite.`;
      if (wind > 15 && dosha === "Vata") return "Vinden farer gjennom Ogham-stavene — løvet hvisker.";
      if (dosha === "Pitta") return `Solvarmen ligger tung over ${sted} — sevjen stiger i trærne.`;
      if (dosha === "Kapha") return `Tåke og fukt over ${sted} — de gamle trærne puster langsomt.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = CELTIC_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      const sted = this._place((seed || "") + "res" + r.id);
      switch (r.id) {
        case "element_dosha_match":
          return `${capitalize(norwegianElement(r.element))} i treet møter ${r.dosha} i været — ${sted} er dobbelt vekket.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger treets vekst — alt søker samme lys."
            : "Stemmens fall følger løvets ro — hvile mot røttene.";
        case "deity_transit_match":
          return `Skogens ånd og himmelens tegn står samstemt — ${r.deity} er nær i ${sted}.`;
        case "pure_element_triad":
          return `Alle tre trær deler samme element — ${sted}s melding er ren.`;
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet bærer samme tegn — ytre og indre verden samstemt.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PYTHAGOREAN — full referanse (tradisjon 2, stresstesten).
  // Symbol = polygon/forhold (aldri intervallnavn → ingen sirkularitet).
  // Ingen guder, ingen steder (sted = konseptuelt rom), intet årshjul.
  // ═══════════════════════════════════════════════════════════
  pythagorean: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const parts = [];

      // ── Åpning: symbol navngitt som tall/polygon, ikke som intervall ──
      // Ratioen legges til KUN når symbolet har polygon (da er _pyName polygon-
      // navnet); for de polygon-løse bærer _pyName allerede "forholdet {ratio}",
      // så vi unngår "forholdet 45:32, forholdet 45:32".
      const r1 = s1.symbol?.correspondences?.ratio;
      const r1show = pyNorsk(s1.symbol?.correspondences?.polygon) && r1 ? `, forholdet ${r1}` : "";
      parts.push(
        `Stemmen slår an ${this._pyName(s1)}${r1show} — ${kw(s1)}, ` +
        `satt mot ${this._pyName(s2)}, ${kw(s2)}, og ${this._pyName(s3)}, ${kw(s3)}. ${this._triadGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall = proporsjonelt SPENN mellom to symboler (intet intervallnavn) ──
      if (ab) {
        let pairLine = `Spennet mellom ${this._pyName(s1)} og ${this._pyName(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${this._pyName(s2)} og ${this._pyName(s3)} ` +
                      `${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi: sfærenes musikk (san-fallback, ALDRI gudenavn) ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær → tall/proporsjons-bilder ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som proporsjons-form ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder gjennom ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "et tall skifter"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    // Symbolet som POLYGON (bestemt form) eller "forholdet {ratio}" — aldri
    // intervallnavnet. Dette gjør sirkulariteten strukturelt umulig.
    _pyName(s) {
      const c = s?.symbol?.correspondences || {};
      return pyNorsk(c.polygon) || (c.ratio ? `forholdet ${c.ratio}` : (s?.symbol?.name || "?"));
    },

    _place(seed) {
      return pick(PYTH_PLACE, seed || "");
    },

    _triadGloss(s1, s2, s3, seed) {
      const polys = [s1, s2, s3].map(s => pyNorsk(s.symbol?.correspondences?.polygon)).filter(Boolean);
      if (polys.length === 3)
        return `Tre tall — ${polys.join(", ")} — danner en figur i ${this._place(seed + "tre")}.`;
      return `Tre forhold spenner ut ${this._place(seed + "tre")}.`;
    },

    _intervalVoice(iv, seed) {
      const variants = PYTH_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const verb = ca.aspect.nature === "harmoni" ? "stemmer" :
                   ca.aspect.nature === "spenning" ? "skurrer" : "veksler";
      return `Himmelens proporsjon ${verb} gjennom ${this._place(seed + "astro")} — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Stillhet legger seg over ${sted} — tallene hviler i frost.`;
      if (wind > 15 && dosha === "Vata") return "Uro i luften forskyver proporsjonene — den rene rekken brytes.";
      if (dosha === "Pitta") return `Varmen skjerper forholdene i ${sted} — proporsjonene glør.`;
      if (dosha === "Kapha") return `Tyngde over ${sted} — de sammensatte forholdene siger.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = PYTH_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      const sted = this._place((seed || "") + "res" + r.id);
      switch (r.id) {
        case "simple_ratio":
          return `Forholdet ${r.ratio} er enkelt og rent — konsonansen bærer hele ${sted}.`;
        case "ratio_tension":
          return `Forholdet ${r.ratio} går ikke opp — en spenning som driver tallene videre.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger proporsjonenes orden — alt søker den samme renhet."
            : "Stemmens fall følger tallenes ro — hvile i det enkle forholdet.";
        case "hexagram_interval_echo":
          return "Heksagrammet og proporsjonen bærer samme tall — ytre og indre orden samstemt.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ELEMENTÆR — full referanse (tradisjon 6). Faren er INTETSIGENHET:
  // den eier element-grunnstammen alle deler. Ansiktet kommer fra
  // elementåndene (salamander/sylf/undine/gnome/akasha), retningene, og de
  // sammensatte symbolene (overgang/blanding) — ikke fra "ild/vann" alene.
  // ═══════════════════════════════════════════════════════════
  elemental: {
    compose(ctx, resonances) {
      const [s1, s2, s3] = ctx.symbols;
      const { ab, bc } = ctx.pairs || {};
      const parts = [];

      // ── Åpning ──
      parts.push(
        `Stemmen din samler ${nm(s1)}, ${meaning(s1).replace(/\.$/, "").toLowerCase()}, ` +
        `med ${flankGloss(s2)}, og ${flankGloss(s3)}. ${this._triadGloss(s1, s2, s3, ctx.seed)}`
      );

      // ── Ånd + retning for dominantsymbolet (ANSIKTET) ──
      parts.push(`${capitalize(this._spirit(s1))}.`);

      // ── Kildeekko — KUN hvis en attestasjon kan siteres. Ingen else. ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── Intervall-par ──
      if (ab) {
        let pairLine = `${this._intervalNoun(ab.interval.quality)} mellom ${nm(s1)} og ${nm(s2)} ` +
                       `${this._intervalVoice(ab.interval, ctx.seed)}`;
        if (bc) {
          pairLine += `, mens ${lowerFirst(this._intervalNoun(bc.interval.quality))} ` +
                      `mellom ${nm(s2)} og ${nm(s3)} ${this._intervalVoice(bc.interval, ctx.seed + "2")}.`;
        } else {
          pairLine += ".";
        }
        parts.push(pairLine);
      }

      // ── Astrologi: planeten som elementånd ──
      if (ctx.crossAspects[0]) parts.push(this._astroPhrase(ctx.crossAspects[0], ctx.seed));

      // ── Vær → elementånd-bilder ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }

      // ── Contour som elementbevegelse ──
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }

      // ── Heksagram gjenlyder ──
      if (ctx.hexagram?.primary) {
        parts.push(
          `Heksagram ${ctx.hexagram.primary.num}, ${ctx.hexagram.primary.name}, ` +
          `gjenlyder gjennom ${this._place(ctx.seed + "hex")}: ` +
          `${lowerFirst(hexWord(ctx.hexagram.primary, "et element rører seg"))}.`
        );
      }

      // ── Resonanser som ✦-setninger ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    _place(seed) {
      return pick(ELEM_PLACE, seed || "");
    },

    // Ånd + retning, eller overgang for de sammensatte. Dette gir ansiktet.
    _spirit(s) {
      const c = s.symbol?.correspondences || {};
      if (c.element === "aether") return "akasha, det femte — bindeleddet i sentrum, uten retning";
      if (c.element)
        return `${ELEM_BEING[c.element]} rører seg i ${ELEM_DIR[c.direction] || "kretsen"} — ${norwegianElement(c.element)}ens ånd`;
      if (c.elements && c.elements.length >= 2) {
        const [a, b] = c.elements;
        return `der ${norwegianElement(a)} og ${norwegianElement(b)} møtes — ${ELEM_BEING[a]} og ${ELEM_BEING[b]} i overgang`;
      }
      return "elementene søker sin form";
    },

    _triadGloss(s1, s2, s3, seed) {
      const all = [s1, s2, s3].flatMap(s => {
        const c = s.symbol?.correspondences || {};
        return c.element ? [c.element] : (c.elements || []);
      });
      const uniq = [...new Set(all)];
      if (uniq.length === 1)
        return `Alt samler seg i ${norwegianElement(uniq[0])} — én ånd råder i ${this._place(seed + "tre")}.`;
      if (uniq.length >= 4)
        return `Alle elementene møtes i ${this._place(seed + "tre")} — de fire ånder og det femte.`;
      return `${uniq.map(norwegianElement).join(", ")} flettes i ${this._place(seed + "tre")}, åndene i samtale.`;
    },

    _intervalNoun(q) {
      return {
        "Kvint — Harmonia":    "Kvinten",
        "Fundament":           "Kvarten",
        "Enhet":               "Enheten",
        "Varme":               "Den store seksten",
        "Glede":               "Dur-tersen",
        "Bevegelse":           "Sekunden",
        "Melankoli":           "Moll-tersen",
        "Lengsel":             "Den lille seksten",
        "Spenning":            "Septimen",
        "Friksjon":            "Limmaen",
        "Djevelens intervall": "Tritonus",
        "Transcendens":        "Stor septim",
      }[q] || "Intervallet";
    },

    _intervalVoice(iv, seed) {
      const variants = ELEM_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _astroPhrase(ca, seed) {
      const PL_BEING = {
        mars:"salamanderen", sun:"salamanderen", moon:"undinen", neptune:"undinen", pluto:"undinen",
        mercury:"sylfen", jupiter:"sylfen", uranus:"sylfen", venus:"gnomen", earth:"gnomen", saturn:"gnomen",
      };
      const being = PL_BEING[ca.transitKey];
      const verb = ca.aspect.nature === "harmoni" ? "styrker" :
                   ca.aspect.nature === "spenning" ? "uroer" : "rører";
      return being
        ? `Himmelen ${verb} ${being} — ${lowerFirst(san(ca.text))}.`
        : `Himmelen ${verb} elementene — ${lowerFirst(san(ca.text))}.`;
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      const sted = this._place(seed + "veir");
      if (snow > 0) return `Kulden binder vannet til is — undinen sover i ${sted}.`;
      if (wind > 15 && dosha === "Vata") return "Vinden river gjennom åndenes krets — sylfen farer fri.";
      if (dosha === "Pitta") return `Heten vekker salamanderen — ilden løftes over ${sted}.`;
      if (dosha === "Kapha") return `Fukt og tyngde siger — undinen og gnomen rår over ${sted}.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = ELEM_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      switch (r.id) {
        case "element_dosha_match":
          return `${capitalize(ELEM_BEING[r.element] || norwegianElement(r.element))} svarer når ${r.dosha} råder i været — elementets ånd er dobbelt nær.`;
        case "pure_element_triad":
          return `Alle tre i samme element — én ånd råder uten motstand.`;
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger ild og luft oppover — åndene søker eteren."
            : "Stemmens fall følger vann og jord nedover — ro i de tunge elementene.";
        case "hexagram_interval_echo":
          return "Heksagrammet og intervallet bærer samme element — som i tegnet, så i åndene.";
        default: return null;
      }
    },
  },

  // ═══════════════════════════════════════════════════════════
  // I CHING — full referanse (tradisjon 7). FIGUR/GRUNN INVERTERT:
  // heksagrammet er SENTRUM (åpning, bærende), de tre tonene er GRUNN
  // (demotert kontekst). Forandringen (changingLines → relating) er
  // sentrum i sentrum. hasChanging=false er stabil ro — ekte svar, ikke
  // tomrom (speiler sourceEcho-prinsippet). Ingen buildContext-endring.
  // ═══════════════════════════════════════════════════════════
  iching: {
    compose(ctx, resonances) {
      const h = ctx.hexagram;
      const hex = h?.primary;
      const [s1, s2, s3] = ctx.symbols;
      const { ab } = ctx.pairs || {};
      const parts = [];

      // ── SENTRUM: trigram-struktur + heksagram-identitet ──
      if (hex) {
        const up = h.upperTrigram, lo = h.lowerTrigram;
        const trig = (up?.meaning && lo?.meaning) ? `${up.meaning} over ${lo.meaning}` : "linjene reiser seg";
        parts.push(`Trigrammene står som ${trig}: Heksagram ${hex.num}, ${hex.norsk || hex.name}.`);

        // ── SENTRUM I SENTRUM: forandringen ──
        parts.push(this._change(h));

        // ── Orakelets råd (meaning uten trigram-setningen) ──
        const advice = (hex.meaning || "").split(". ").slice(1).join(". ").trim();
        if (advice) parts.push(advice);
      } else {
        parts.push("Tonene kaster linjene, men intet fast tegn reiser seg ennå.");
      }

      // ── Kildeekko (symbol null for iching → uansett taus) ──
      const echo = renderEcho(sourceEcho(s1.symbol));
      if (echo) parts.push(echo);

      // ── GRUNN: de tre tonene demotert til kontekst (linje-kastet) ──
      const tones = [s1, s2, s3].map(s => (s.card?.data?.detail || "").toLowerCase()).filter(Boolean);
      parts.push(
        `De tre tonene du sang kastet linjene${tones.length === 3 ? ` — ${tones.join(", ")}` : ""}, og dette tegnet reiste seg.`
      );
      if (ab) parts.push(`Mellom tonene: ${this._intervalVoice(ab.interval, ctx.seed)}.`);

      // ── Vær / contour, lett ──
      if (ctx.weather) {
        const w = this._weatherPhrase(ctx.weather, ctx.seed);
        if (w) parts.push(w);
      }
      if (ctx.contour) {
        const c = this._contourPhrase(ctx.contour, ctx.seed);
        if (c) parts.push(c);
      }
      if (ctx.crossAspects[0]) {
        parts.push(`Også himmelen utenfor er i bevegelse: ${lowerFirst(san(ctx.crossAspects[0].text))}.`);
      }

      // ── Resonanser (underordnet) ──
      resonances.forEach(r => {
        const line = this._resonanceLine(r, ctx.seed);
        if (line) parts.push(`✦ ${line}`);
      });

      return parts.join(" ");
    },

    // Forandringen — sentrum i sentrum. Bevegelse hvis hasChanging, ellers
    // ekte stillhet (ikke et beklaget tomrom).
    _change(h) {
      if (h.hasChanging && h.relating) {
        const ln = h.changingLines?.length
          ? `Linje ${h.changingLines.join(", ")}`
          : "Linjene";
        return `${ln} er i bevegelse: ${h.primary.norsk || h.primary.name} blir til ${h.relating.norsk || h.relating.name} — ${(h.relating.keyword || "det som kommer").toLowerCase()}.`;
      }
      return "Ingen linjer beveger seg — tegnet står stabilt, et øyeblikk i ro. Dette er svaret: å være, ikke å bli til.";
    },

    _place(seed) {
      return pick(ICHING_PLACE, seed || "");
    },

    _intervalVoice(iv, seed) {
      const variants = ICHING_IV_VOICE[iv.quality];
      if (!variants) return `bærer kvaliteten av ${iv.quality.toLowerCase()}`;
      return pick(variants, (seed || "") + iv.quality);
    },

    _weatherPhrase(w, seed) {
      const dosha = w.ayurveda?.dominant;
      const wind = w.raw?.windSpeed || 0;
      const snow = w.raw?.snow || 0;
      if (snow > 0) return "Frost og stillhet — yin råder, alt trekker innover.";
      if (wind > 15 && dosha === "Vata") return "Vinden rører linjene — det gjennomtrengende trekker forbi.";
      if (dosha === "Pitta") return "Varme nærer yang — bevegelsen tiltar i linjene.";
      if (dosha === "Kapha") return `Tyngde og fukt — yin siger over ${this._place(seed + "veir")}, tiden er for å vente.`;
      return "";
    },

    _contourPhrase(co, seed) {
      const variants = ICHING_CONTOUR[co.shape];
      if (!variants) return "";
      return pick(variants, (seed || "") + "kontur");
    },

    _resonanceLine(r, seed) {
      switch (r.id) {
        case "contour_interval_sync":
          return r.kind === "ascending_harmonic"
            ? "Stemmens stigning følger yang oppover — linjene søker himmelen."
            : "Stemmens fall følger yin nedover — ro i de nedre linjene.";
        case "hexagram_interval_echo":
          return "Tonenes spenn og tegnet bærer samme bevegelse — ytre og indre forandring samstemt.";
        default: return null;
      }
    },
  },
};

/**
 * Generisk skjelett-komposisjon brukt av ikke-norrøne grener.
 * Bruker ctx.sentiment som hovedsignal + tradisjons-fraser.
 * Fylles inn med full poetikk i senere iterasjoner.
 */
// ───────────────────────────────────────────────────────────────
// 6. HOVEDINNGANG
// ───────────────────────────────────────────────────────────────

export function generateInterpretation(tradition, reading, weatherAnalysis, hexagram, contour) {
  const ctx = buildContext(tradition, reading, weatherAnalysis, hexagram, contour);
  if (!ctx) return null;
  // Seed: førstenote + dato + tradisjon (eksakt v7-formel) → deterministisk
  // per trekning per dag, ny variant ved ny dag eller annet førstekort.
  ctx.seed = (reading.top3?.[0]?.note || "C") + new Date().toDateString() + tradition;
  const resonances = detectResonances(ctx);
  const gen = GEN[tradition];
  if (!gen) return null;
  return gen.compose(ctx, resonances);
}
