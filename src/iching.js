// ═══════════════════════════════════════════════════
// I CHING ENGINE — Audio → Hexagram via 3-coin method
// ═══════════════════════════════════════════════════

// Trigram building blocks
const TRIGRAMS = {
  "111": { name:"Qián", meaning:"Himmelen", nature:"Kreativ kraft", symbol:"☰" },
  "000": { name:"Kūn", meaning:"Jorden", nature:"Mottakende kraft", symbol:"☷" },
  "100": { name:"Zhèn", meaning:"Torden", nature:"Bevegelse", symbol:"☳" },
  "010": { name:"Kǎn", meaning:"Vann", nature:"Dyp fare", symbol:"☵" },
  "001": { name:"Gèn", meaning:"Fjell", nature:"Stillstand", symbol:"☶" },
  "011": { name:"Xùn", meaning:"Vind", nature:"Gjennomtrengende", symbol:"☴" },
  "101": { name:"Lí", meaning:"Ild", nature:"Tilknytning", symbol:"☲" },
  "110": { name:"Duì", meaning:"Sjø", nature:"Glede", symbol:"☱" },
};

// All 64 hexagrams: [lower trigram, upper trigram]
// Lines are numbered bottom-to-top: line 1 (bottom) to line 6 (top)
// Binary: lower trigram = lines 1-3, upper = lines 4-6
const HEXAGRAMS = [
  { num:1,  lines:"111111", name:"Qián", norsk:"Det skapende", keyword:"Ren kreativ kraft", meaning:"Himmelen over himmelen. All energi er tilgjengelig. Handle modig og rettferdig." },
  { num:2,  lines:"000000", name:"Kūn", norsk:"Det mottakende", keyword:"Jordisk mottagelighet", meaning:"Jorden over jorden. Vær mottakelig. Styrke gjennom tilpasning og tålmodighet." },
  { num:3,  lines:"100010", name:"Zhūn", norsk:"Begynnelsens vanskeligheter", keyword:"Fødselsveer", meaning:"Vann over torden. Begynnelsen er kaotisk. Hold ut — det nye tar form." },
  { num:4,  lines:"010001", name:"Méng", norsk:"Ungdommelig dårskap", keyword:"Lærlingens vei", meaning:"Fjell over vann. Søk veiledning. Still spørsmålet én gang og lytt." },
  { num:5,  lines:"111010", name:"Xū", norsk:"Venting", keyword:"Tålmodig næring", meaning:"Vann over himmelen. Vent aktivt. Nær deg selv mens du venter." },
  { num:6,  lines:"010111", name:"Sòng", norsk:"Konflikt", keyword:"Indre strid", meaning:"Himmelen over vann. Indre motsetning. Søk megling, ikke seier." },
  { num:7,  lines:"010000", name:"Shī", norsk:"Hæren", keyword:"Disiplinert kraft", meaning:"Jorden over vann. Organiser kreftene dine. Lederskap gjennom integritet." },
  { num:8,  lines:"000010", name:"Bǐ", norsk:"Samhold", keyword:"Forening", meaning:"Vann over jorden. Søk allianser. Samarbeid overvinner isolasjon." },
  { num:9,  lines:"111011", name:"Xiǎo Chù", norsk:"Det lille temmende", keyword:"Myk innflytelse", meaning:"Vind over himmelen. Subtil påvirkning virker. Ikke press — overtall." },
  { num:10, lines:"110111", name:"Lǚ", norsk:"Opptreden", keyword:"Forsiktig fremferd", meaning:"Himmelen over sjø. Gå varsomt. Respekt og ydmykhet åpner veien." },
  { num:11, lines:"111000", name:"Tài", norsk:"Fred", keyword:"Stor harmoni", meaning:"Jorden over himmelen. Himmelen stiger, jorden synker — de møtes. Blomstringstid." },
  { num:12, lines:"000111", name:"Pǐ", norsk:"Stillstand", keyword:"Stagnasjon", meaning:"Himmelen over jorden. De fjerner seg. Trekk deg tilbake og bevar din integritet." },
  { num:13, lines:"101111", name:"Tóng Rén", norsk:"Fellesskap", keyword:"Kameratskap", meaning:"Himmelen over ild. Felles visjon forener. Vær åpen og rettferdig." },
  { num:14, lines:"111101", name:"Dà Yǒu", norsk:"Stor besittelse", keyword:"Overflod", meaning:"Ild over himmelen. Stor rikdom. Del gavmildt og forbli ydmyk." },
  { num:15, lines:"001000", name:"Qiān", norsk:"Beskjedenhet", keyword:"Ydmykhet", meaning:"Jorden over fjell. Fjellet bøyer seg under jorden. Sann storhet er beskjeden." },
  { num:16, lines:"000100", name:"Yù", norsk:"Entusiasme", keyword:"Harmonisk begeistring", meaning:"Torden over jorden. Musikk og bevegelse. La inspirasjonen flyte fritt." },
  { num:17, lines:"100110", name:"Suí", norsk:"Følge", keyword:"Tilpasning", meaning:"Sjø over torden. Følg strømmen. Tilpass deg uten å miste deg selv." },
  { num:18, lines:"011001", name:"Gǔ", norsk:"Arbeid på det fordervede", keyword:"Reparasjon", meaning:"Fjell over vind. Noe er råttent. Rydd opp med mot og omhu." },
  { num:19, lines:"110000", name:"Lín", norsk:"Tilnærmelse", keyword:"Vekst", meaning:"Jorden over sjø. Vekst nærmer seg. Vær raus og tålmodig." },
  { num:20, lines:"000011", name:"Guān", norsk:"Betraktning", keyword:"Observasjon", meaning:"Vind over jorden. Observer fra høyden. Se det store bildet." },
  { num:21, lines:"100101", name:"Shì Kè", norsk:"Gjennombitende", keyword:"Rettferdighet", meaning:"Ild over torden. Skjær gjennom hindringer. Rettferdig handling kreves." },
  { num:22, lines:"101001", name:"Bì", norsk:"Ynde", keyword:"Skjønnhet", meaning:"Fjell over ild. Form og innhold i harmoni. Estetikk har verdi." },
  { num:23, lines:"000001", name:"Bō", norsk:"Oppløsning", keyword:"Forfall", meaning:"Fjell over jorden. Fundamentet smuldrer. Aksepter og vent på ny begynnelse." },
  { num:24, lines:"100000", name:"Fù", norsk:"Tilbakevending", keyword:"Fornyelse", meaning:"Jorden over torden. Det første lyset vender tilbake. En ny syklus begynner." },
  { num:25, lines:"100111", name:"Wú Wàng", norsk:"Uskyld", keyword:"Spontanitet", meaning:"Himmelen over torden. Handle uten baktanker. Naturlig godhet." },
  { num:26, lines:"111001", name:"Dà Chù", norsk:"Det store temmende", keyword:"Oppsamlet kraft", meaning:"Fjell over himmelen. Stor kraft holdes tilbake. Vent på rett øyeblikk." },
  { num:27, lines:"100001", name:"Yí", norsk:"Næring", keyword:"Munnens visdom", meaning:"Fjell over torden. Hva nærer du? Vær bevisst på hva du konsumerer." },
  { num:28, lines:"011110", name:"Dà Guò", norsk:"Overvekt", keyword:"Kritisk masse", meaning:"Sjø over vind. Bjelken bøyer seg. Ekstraordinære tiltak kreves." },
  { num:29, lines:"010010", name:"Kǎn", norsk:"Det dype vannet", keyword:"Gjentatt fare", meaning:"Vann over vann. Dobbel fare. Hold deg tro mot ditt indre lys." },
  { num:30, lines:"101101", name:"Lí", norsk:"Det flammende", keyword:"Klarhet", meaning:"Ild over ild. Dobbel illuminasjon. Klarhet og tilknytning." },
  { num:31, lines:"001110", name:"Xián", norsk:"Tiltrekning", keyword:"Gjensidig resonans", meaning:"Sjø over fjell. Gjensidig tiltrekning. Åpne hjertet." },
  { num:32, lines:"011100", name:"Héng", norsk:"Varighet", keyword:"Utholdenhet", meaning:"Torden over vind. Det som varer. Bevar konsistens i forandring." },
  { num:33, lines:"001111", name:"Dùn", norsk:"Tilbaketrekning", keyword:"Strategisk retrett", meaning:"Himmelen over fjell. Trekk deg tilbake med verdighet. Timing er alt." },
  { num:34, lines:"111100", name:"Dà Zhuàng", norsk:"Stor kraft", keyword:"Mektig energi", meaning:"Torden over himmelen. Enorm kraft. Bruk den rettferdig." },
  { num:35, lines:"000101", name:"Jìn", norsk:"Fremgang", keyword:"Soloppgang", meaning:"Ild over jorden. Solen stiger. Fremgang gjennom klarhet og godhet." },
  { num:36, lines:"101000", name:"Míng Yí", norsk:"Formørket lys", keyword:"Skjult visdom", meaning:"Jorden over ild. Lyset er skjult. Beskytt din indre flamme." },
  { num:37, lines:"101011", name:"Jiā Rén", norsk:"Familien", keyword:"Indre orden", meaning:"Vind over ild. Familien som mikrokosmos. Begynn med deg selv." },
  { num:38, lines:"110101", name:"Kuí", norsk:"Motsetning", keyword:"Kreativ polaritet", meaning:"Ild over sjø. Motsetninger som ikke kan forenes. Finn det felles." },
  { num:39, lines:"001010", name:"Jiǎn", norsk:"Hindring", keyword:"Blokkert vei", meaning:"Vann over fjell. Veien er blokkert. Vendhindringe til visdom." },
  { num:40, lines:"010100", name:"Xiè", norsk:"Befrielse", keyword:"Løsrivelse", meaning:"Torden over vann. Stormen løser spenningen. La det gå." },
  { num:41, lines:"110001", name:"Sǔn", norsk:"Forminskning", keyword:"Forenkling", meaning:"Fjell over sjø. Mindre er mer. Forenkle for å finne essensen." },
  { num:42, lines:"100011", name:"Yì", norsk:"Økning", keyword:"Vekst og gavmildhet", meaning:"Vind over torden. Tiden for vekst. Del og du vil motta." },
  { num:43, lines:"111110", name:"Guài", norsk:"Gjennombrudd", keyword:"Resolutt handling", meaning:"Sjø over himmelen. Sannheten bryter frem. Vær bestemt men ikke brutal." },
  { num:44, lines:"011111", name:"Gòu", norsk:"Møtet", keyword:"Uventet kontakt", meaning:"Himmelen over vind. Et uventet møte. Vær oppmerksom på hva som nærmer seg." },
  { num:45, lines:"000110", name:"Cuì", norsk:"Samling", keyword:"Forsamling", meaning:"Sjø over jorden. Folk samles. Forbered deg på det kollektive." },
  { num:46, lines:"011000", name:"Shēng", norsk:"Oppstigning", keyword:"Gradvis vekst", meaning:"Jorden over vind. Steg for steg oppover. Tålmodig innsats lønner seg." },
  { num:47, lines:"010110", name:"Kùn", norsk:"Utmattelse", keyword:"Begrensning", meaning:"Sjø over vann. Uttømt. Bevar indre styrke når ytre ressurser svikter." },
  { num:48, lines:"011010", name:"Jǐng", norsk:"Brønnen", keyword:"Kilden", meaning:"Vann over vind. Den uuttømmelige kilden. Gå dypt, ikke bredt." },
  { num:49, lines:"101110", name:"Gé", norsk:"Revolusjon", keyword:"Radikal forandring", meaning:"Sjø over ild. Ild og vann møtes. Tiden for fundamental endring." },
  { num:50, lines:"011101", name:"Dǐng", norsk:"Kjelegryte", keyword:"Transformerende næring", meaning:"Ild over vind. Alkymi. Rå ingredienser transformeres til næring." },
  { num:51, lines:"100100", name:"Zhèn", norsk:"Torden", keyword:"Sjokk og oppvåkning", meaning:"Torden over torden. Dobbelt sjokk vekker deg. Frykt blir til respekt." },
  { num:52, lines:"001001", name:"Gèn", norsk:"Stillhet", keyword:"Meditasjon", meaning:"Fjell over fjell. Total stillhet. Stopp tankene. Vær tilstede." },
  { num:53, lines:"001011", name:"Jiàn", norsk:"Gradvis fremgang", keyword:"Organisk utvikling", meaning:"Vind over fjell. Treet vokser sakte på fjellet. Naturlig tempo." },
  { num:54, lines:"110100", name:"Guī Mèi", norsk:"Den unge kvinnen", keyword:"Underordning", meaning:"Torden over sjø. Kjenn din rolle. Aksepter posisjonen og vent." },
  { num:55, lines:"101100", name:"Fēng", norsk:"Overflod", keyword:"Fylde og høydepunkt", meaning:"Torden over ild. Maksimal fylde. Nyt, men vit at alt endres." },
  { num:56, lines:"001101", name:"Lǚ", norsk:"Den reisende", keyword:"Vandring", meaning:"Ild over fjell. På reise. Vær ydmyk og oppmerksom som gjest." },
  { num:57, lines:"011011", name:"Xùn", norsk:"Det milde", keyword:"Gjennomtrengende vind", meaning:"Vind over vind. Myk utholdenhet trenger gjennom alt. Subtil kraft." },
  { num:58, lines:"110110", name:"Duì", norsk:"Det gledefulle", keyword:"Ren glede", meaning:"Sjø over sjø. Dobbel glede. Sann glede kommer fra indre fred." },
  { num:59, lines:"010011", name:"Huàn", norsk:"Oppløsning", keyword:"Spredning", meaning:"Vind over vann. Det faste løses opp. La rigiditet fare." },
  { num:60, lines:"110010", name:"Jié", norsk:"Begrensning", keyword:"Nødvendig grense", meaning:"Vann over sjø. Sett grenser. Frihet innenfor struktur." },
  { num:61, lines:"110011", name:"Zhōng Fú", norsk:"Indre sannhet", keyword:"Dyp tillit", meaning:"Vind over sjø. Indre sannhet berører andre. Vær autentisk." },
  { num:62, lines:"001100", name:"Xiǎo Guò", norsk:"Lite overskudd", keyword:"Beskjedne skritt", meaning:"Torden over fjell. Fuglen synger. Små handlinger, ikke store ambisjoner." },
  { num:63, lines:"101010", name:"Jì Jì", norsk:"Etter fullendelsen", keyword:"Allerede fullført", meaning:"Vann over ild. Perfekt balanse — midlertidig. Vær årvåken i suksess." },
  { num:64, lines:"010101", name:"Wèi Jì", norsk:"Før fullendelsen", keyword:"Nesten der", meaning:"Ild over vann. Nesten fullført. Det siste steget krever mest oppmerksomhet." },
];

// ─── Audio → Hexagram (3-coin method) ───
// Splits recording into 6 windows. For each:
//   3 "coins" from audio parameters → sum 6-9
//   6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing)
export function audioToHexagram(history) {
  if (history.length < 12) return null;

  const windowSize = Math.floor(history.length / 6);
  const allFreqs = history.map(h => h.freq);
  const allRms = history.map(h => h.rms);
  const medianFreq = sortedMedian(allFreqs);
  const medianRms = sortedMedian(allRms);

  const lines = [];
  for (let i = 0; i < 6; i++) {
    const start = i * windowSize;
    const end = start + windowSize;
    const window = history.slice(start, end);

    // Coin 1: Pitch — above median = 3 (yang/heads), below = 2 (yin/tails)
    const avgFreq = window.reduce((s, h) => s + h.freq, 0) / window.length;
    const coin1 = avgFreq >= medianFreq ? 3 : 2;

    // Coin 2: Volume — above median = 3, below = 2
    const avgRms = window.reduce((s, h) => s + h.rms, 0) / window.length;
    const coin2 = avgRms >= medianRms ? 3 : 2;

    // Coin 3: Stability — low variance = 3 (yang/stable), high = 2 (yin/unstable)
    const freqs = window.map(h => h.freq);
    const mean = freqs.reduce((a, b) => a + b, 0) / freqs.length;
    const variance = freqs.reduce((s, f) => s + (f - mean) ** 2, 0) / freqs.length;
    const cv = Math.sqrt(variance) / (mean || 1); // coefficient of variation
    const coin3 = cv < 0.15 ? 3 : 2; // stable if CV < 15%

    const value = coin1 + coin2 + coin3; // 6, 7, 8, or 9
    lines.push({
      value,
      yang: value === 7 || value === 9,
      changing: value === 6 || value === 9,
      symbol: value === 9 ? "⚊○" : value === 7 ? "⚊" : value === 8 ? "⚋" : "⚋×",
    });
  }

  // Build primary hexagram binary (bottom to top = lines[0] to lines[5])
  const primaryBin = lines.map(l => l.yang ? "1" : "0").join("");
  const primary = HEXAGRAMS.find(h => h.lines === primaryBin) || HEXAGRAMS[0];

  // Build relating hexagram (changed lines flip)
  const hasChanging = lines.some(l => l.changing);
  let relating = null;
  if (hasChanging) {
    const relatingBin = lines.map(l => {
      if (l.changing) return l.yang ? "0" : "1"; // flip
      return l.yang ? "1" : "0";
    }).join("");
    relating = HEXAGRAMS.find(h => h.lines === relatingBin);
  }

  // Trigrams
  const lowerBin = primaryBin.slice(0, 3);
  const upperBin = primaryBin.slice(3, 6);
  const lowerTri = TRIGRAMS[lowerBin] || TRIGRAMS["000"];
  const upperTri = TRIGRAMS[upperBin] || TRIGRAMS["111"];

  // Changing lines text
  const changingLines = lines
    .map((l, i) => l.changing ? i + 1 : null)
    .filter(Boolean);

  return {
    lines,
    primary,
    relating,
    lowerTrigram: lowerTri,
    upperTrigram: upperTri,
    changingLines,
    hasChanging,
  };
}

function sortedMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// For tradition map — simplified: map 12 notes to 12 key hexagrams
export const ICHING_NOTE_MAP = {
  C:   { color:"#D50000", symbol:"☰", title:`1. Qián — Det skapende`,    subtitle:"Himmelen · Kreativ kraft",  detail:"Yang", keyword:"Ren skapende energi, handlekraft" },
  "C#":{ color:"#C51162", symbol:"☵", title:`29. Kǎn — Det dype vannet`, subtitle:"Vann · Gjentatt fare",      detail:"Yin",  keyword:"Mot i møte med fare" },
  D:   { color:"#FF6D00", symbol:"☲", title:`30. Lí — Det flammende`,    subtitle:"Ild · Klarhet",             detail:"Yang", keyword:"Illuminasjon og tilknytning" },
  "D#":{ color:"#F9A825", symbol:"☳", title:`51. Zhèn — Torden`,         subtitle:"Torden · Oppvåkning",       detail:"Yang", keyword:"Sjokk som vekker bevissthet" },
  E:   { color:"#FDD835", symbol:"☴", title:`57. Xùn — Det milde`,       subtitle:"Vind · Gjennomtrengende",   detail:"Yin",  keyword:"Subtil vedvarende kraft" },
  F:   { color:"#00C853", symbol:"☷", title:`2. Kūn — Det mottakende`,   subtitle:"Jorden · Mottagelighet",    detail:"Yin",  keyword:"Styrke gjennom tilpasning" },
  "F#":{ color:"#00897B", symbol:"☶", title:`52. Gèn — Stillhet`,        subtitle:"Fjell · Meditasjon",        detail:"Yin",  keyword:"Total stillhet og nærvær" },
  G:   { color:"#1565C0", symbol:"☱", title:`58. Duì — Det gledefulle`,  subtitle:"Sjø · Ren glede",           detail:"Yin",  keyword:"Sann glede fra indre fred" },
  "G#":{ color:"#283593", symbol:"☵", title:`48. Jǐng — Brønnen`,        subtitle:"Vann · Kilden",             detail:"Yin",  keyword:"Den uuttømmelige kilden" },
  A:   { color:"#6A1B9A", symbol:"☴", title:`59. Huàn — Oppløsning`,     subtitle:"Vind · Spredning",          detail:"Yin",  keyword:"La rigiditet fare" },
  "A#":{ color:"#8E24AA", symbol:"☲", title:`49. Gé — Revolusjon`,       subtitle:"Sjø over ild · Omveltning", detail:"Yang", keyword:"Radikal nødvendig forandring" },
  B:   { color:"#AD1457", symbol:"☰", title:`11. Tài — Fred`,            subtitle:"Jorden over himmelen",      detail:"Yang", keyword:"Stor harmoni, blomstringstid" },
};

export { HEXAGRAMS, TRIGRAMS };
