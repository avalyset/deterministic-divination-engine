// ═══════════════════════════════════════════════════════════════
// TRADITION_LEXICON — FROSSET lekkasje-/register-vakt for de 8 tradisjonene.
// Bygget FØR noen skjelett-tradisjon skrives. Skal IKKE vokse organisk
// underveis: hver per-tradisjon-commit testes mot nøyaktig denne faste lista.
//
// Test-eksklusivt: importeres kun av testskript, aldri av src/ (ingen død
// data i prod-bundelen).
//
// DESIGN-INVARIANTER (ellers er vakten hullete):
//  1. Hvert begrep er UNIKT for én tradisjon. Et begrep i to leksika ville
//     gi falske lekkasje-treff. (Selvvalidert nederst: parvis disjunkt.)
//  2. DELTE SIGNALER er UTELATT fra alle leksika, fordi de forekommer i
//     hver tradisjons output og ikke skiller noen:
//       - ordet "heksagram" + heksagram-NAVN (Kūn, Tài …) — heksagram-linja
//         veves inn i ALLE tradisjoner.
//       - tarot-kortnavn (Keiseren, Døden …) — DELT mellom hay og thoth.
//       - generiske element-/retningsord (ild, luft, vann, jord, harmoni,
//         balanse) — universelle.
//  3. Korte begreper (<4 tegn: Ra, Sia, Qi, yin, Tao) matches som HELE ord
//     (eksakt token), aldri delstreng — ellers ville "Ra" matchet "bRAgi".
//     Lengre begreper (≥4) matches som prefiks, så bøyninger fanges
//     ("Niflheim"→"Niflheims", "rune"→"runen", "galdr"→"galdren").
// ═══════════════════════════════════════════════════════════════

export const TRADITION_LEXICON = {
  norse: [
    "Odin","Æser","Æsene","galdr","Yggdrasil","rune","Midgard","Asgard",
    "Bifrost","Niflheim","Muspelheim","Jotunheim","Vanaheim","mjød",
    "Sunna","Máni","Tyr","Bragi","Mjølner","Norne","Urds","Sleipner",
    "Ginnungagap","jotun","skald","Hlidskjalf","Freya","Frigg","runehall",
  ],
  celtic: [
    "Ogham","nemeton","nemetón","Annwn","Avalon","druide","druidisk",
    "druidens","Beltane","Lughnasadh","Samhain","Imbolc","årshjul","bard",
    "keltisk",
  ],
  egyptian: [
    // v2: "Maat"/"Ma'at" UTELATT — delt signal egyptisk↔thoth ved mytologisk arv
    // (Ma'at er passordet ved Duat-porten; Crowleys Justering = Ma'ats vekt). Samme
    // klasse som tarot-kortnavn (hay/thoth) og "heksagram" (alle). PRIS: egyptisks
    // eksklusive vakt mister ett ord — v2-kjøringen MÅ bekrefte at ingen TREDJE
    // tradisjon (ikke-egyptisk, ikke-thoth) slipper "Ma'at" gjennom uoppdaget.
    "neter","neteru","Duat","Ra","Khonsu","Osiris","Isis",
    "Sia","Heka","Anubis","Sekhmet","Hathor","Heliopolis","Memphis",
    "Abydos","ankh","Ammit","Atum","Ptah","Nilen","farao",
  ],
  thoth: [
    "Sefira","Sefiroth","Sephira","Sefirot","Kether","Chokmah","Binah",
    "Chesed","Geburah","Tiphareth","Netzach","Yesod","Malkuth","Abyss",
    "Abysset","Da'ath","Thelema","Babalon","Qabalah","Livets Tre","Ain Soph",
  ],
  pythagorean: [
    "proporsjon","sfærenes","sfæremusikk","monad","monaden","tetrad",
    "pentad","hexad","heptad","ogdoad","ennead","dekad","tetraktys",
    "heltallsforhold","polygon",
  ],
  hay: [
    "palett","bølgelengde","komplementær","kromatisk","fargehjul",
    "spektrum","monokrom","akvarell","pigment","fargetone","fargeskala",
  ],
  elemental: [
    "salamander","sylf","sylfe","undine","gnome","akasha","akashisk",
  ],
  iching: [
    "yin","yang","trigram","Tao","Qi","taiji","Wu Ji","yijing","dao",
  ],
};

// ─── Matching ────────────────────────────────────────────────────
function matchTerm(output, term) {
  const lo = output.toLowerCase();
  const t = term.toLowerCase();
  if (/[\s']/.test(t)) return lo.includes(t);            // flerords/apostrof → delstreng
  const tokens = lo.match(/[\p{L}]+/gu) || [];
  if (t.length < 4) return tokens.includes(t);            // kort → eksakt token
  return tokens.some(w => w.startsWith(t));               // ≥4 → prefiks (fanger bøyninger)
}

function hits(output, terms) {
  return terms.filter(t => matchTerm(output, t));
}

// Begrep fra ANDRE tradisjoners register som lekker inn i denne. Tom = bestått.
export function leakTest(tradition, output) {
  const foreign = Object.entries(TRADITION_LEXICON)
    .filter(([t]) => t !== tradition)
    .flatMap(([, terms]) => terms);
  return [...new Set(hits(output, foreign))];
}

// Begrep fra denne tradisjonens EGET register som faktisk brukes. Ikke-tom = bestått.
export function registerTest(tradition, output) {
  return [...new Set(hits(output, TRADITION_LEXICON[tradition]))];
}

// ─── Selvvalidering (kjøres når fila kjøres direkte) ─────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const { generateInterpretation } = await import(new URL("../src/interpret.js", import.meta.url));

  console.log("═══ FROSSET TRADITION_LEXICON ═══\n");
  let total = 0;
  for (const [trad, terms] of Object.entries(TRADITION_LEXICON)) {
    total += terms.length;
    console.log(`  ${trad.padEnd(12)} (${String(terms.length).padStart(2)}): ${terms.join(", ")}`);
  }
  console.log(`\n  totalt ${total} begreper over 8 tradisjoner\n`);

  // INV 1: parvis disjunkt (ingen begrep i to leksika)
  console.log("── INV 1: leksika parvis disjunkt ──");
  const seen = new Map(); let dup = 0;
  for (const [trad, terms] of Object.entries(TRADITION_LEXICON))
    for (const t of terms.map(x => x.toLowerCase())) {
      if (seen.has(t)) { console.log(`  ✗ "${t}" i både ${seen.get(t)} og ${trad}`); dup++; }
      else seen.set(t, trad);
    }
  console.log(dup ? `  ✗ ${dup} kollisjon(er)` : "  ✓ ingen kollisjoner — alle begreper unike");

  // INV 2: kjent-god referanse (norrøn) MÅ bestå begge tester mot frossen vakt.
  console.log("\n── INV 2: norrøn referanse mot vakten ──");
  const reading = {
    top3: [ {note:"C",data:{title:"Fehu"}}, {note:"D",data:{title:"Thurisaz"}}, {note:"E",data:{title:"Raidho"}} ],
    intervals: [ {quality:"Kvint — Harmonia"}, {quality:"Fundament"}, {quality:"Glede"} ],
    crossAspects: [ {text:"Mars trine Moon", transitKey:"mars", aspect:{nature:"harmoni",name:"trine"}, significance:0.7} ],
  };
  const weather = { ayurveda:{dominant:"Pitta"}, raw:{windSpeed:0,snow:0} };
  const hexagram = { primary:{num:1,name:"Det skapende",meaning:"ren skaperkraft"} };
  const out = generateInterpretation("norse", reading, weather, hexagram, { shape:"Drone" });
  console.log("  norrøn output:\n    " + out.replace(/\. /g, ".\n    "));
  const leak = leakTest("norse", out);
  const reg = registerTest("norse", out);
  console.log(`\n  leakTest(norse)     → ${leak.length ? "✗ LEKKASJE: " + leak.join(", ") : "✓ ∅ (ingen fremmedord)"}`);
  console.log(`  registerTest(norse) → ${reg.length ? "✓ bruker eget register: " + reg.join(", ") : "✗ TOM (intetsigende)"}`);

  const ok = !dup && leak.length === 0 && reg.length > 0;
  console.log("\n── RESULTAT ──");
  console.log("  Leksikonet er konsistent og validert mot referansen: " + (ok ? "JA ✓" : "NEI ✗"));
  process.exit(ok ? 0 : 1);
}
