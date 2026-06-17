// ═══════════════════════════════════════════
// MELODISK KONTUR — Tidsdimensjonen
// Uses raw Hz frequencies for direction detection (not quantized notes)
// ═══════════════════════════════════════════

const NOTE_MIDI = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };

export function analyzeContour(history) {
  if (!history || history.length < 20) return null;

  // Sample at regular intervals (~60 data points)
  const step = Math.max(1, Math.floor(history.length / 60));
  const sampled = history.filter((_, i) => i % step === 0);

  // Use RAW Hz frequencies for direction analysis (not quantized notes!)
  // This is critical — quantized notes collapse continuous pitch variation
  const freqs = sampled.map(h => h.freq);
  const notes = sampled.map(h => NOTE_MIDI[h.note]);

  // ─── Direction analysis using Hz (continuous values) ───
  const threshold = 5; // Hz — must differ by ≥5 Hz to count as movement
  let ascending = 0, descending = 0, static_ = 0;
  for (let i = 1; i < freqs.length; i++) {
    const diff = freqs[i] - freqs[i - 1];
    if (diff > threshold) ascending++;
    else if (diff < -threshold) descending++;
    else static_++;
  }
  const total = freqs.length - 1;
  const ascRatio = ascending / total;
  const descRatio = descending / total;
  const staticRatio = static_ / total;

  // ─── Contour shape using Hz ───
  const firstHalf = freqs.slice(0, Math.floor(freqs.length / 2));
  const secondHalf = freqs.slice(Math.floor(freqs.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const overallDiff = (avgSecond - avgFirst) / avgFirst; // Proportional change

  // ─── Range in Hz ───
  const minFreq = Math.min(...freqs);
  const maxFreq = Math.max(...freqs);
  const rangeHz = maxFreq - minFreq;
  const rangeSemitones = 12 * Math.log2((maxFreq || 1) / (minFreq || 1));

  // ─── Volatility using Hz ───
  let totalJump = 0;
  for (let i = 1; i < freqs.length; i++) {
    totalJump += Math.abs(freqs[i] - freqs[i - 1]);
  }
  const avgJumpHz = totalJump / total;
  // Convert to semitones for threshold comparisons
  const avgJumpSemitones = 12 * Math.log2(1 + avgJumpHz / (avgFirst || 440));

  // ─── Note range for quantized display ───
  const minNote = Math.min(...notes);
  const maxNote = Math.max(...notes);
  const noteRange = maxNote - minNote;

  // ─── Pattern detection (using Hz-based metrics) ───
  let shape, meaning, tradition;

  if (staticRatio > 0.75 && rangeSemitones < 2) {
    shape = "Drone";
    meaning = "Stemmens drone — en meditativ grunnfrekvens som forankrer. I indisk musikkteori tilsvarer dette tanpura-dronen: en uforanderlig tone som alt annet forholder seg til. Stillhet i bevegelse.";
    tradition = { raga: "Sa — grunntonen, uforanderlig", gregorian: "Recitasjonstone — liturgisk resitasjon på én tone", chinese: "宫 Gōng — senterets tone, keiserens stabilitet" };
  } else if (overallDiff > 0.05 && ascRatio > descRatio * 1.3) {
    shape = "Stigende";
    meaning = "En oppadgående bevegelse — aspirasjon, vekst, transcendens. I gregoriansk tradisjon er den stigende melodien bønnens løfting mot himmelen. I raga-teori: ārohana, den oppstigende skalaen som bygger energi og spenning.";
    tradition = { raga: "Ārohana — den stigende frasen, purvanga (første halvdel)", gregorian: "Ascensus — melodisk stigning, åndelig løftelse", chinese: "徵 Zhǐ — ildens tone, stigende energi mot syd" };
  } else if (overallDiff < -0.05 && descRatio > ascRatio * 1.3) {
    shape = "Fallende";
    meaning = "En nedadgående bevegelse — aksept, ro, integrering. I raga-teori er avarohana (den synkende skalaen) der melodiens emosjonelle dybde utfolder seg — følelsens rike ligger i nedstigningen. I gregoriansk tradisjon: descensus, Guds nedstigning til mennesket.";
    tradition = { raga: "Avarohana — den synkende frasen, uttaranga (andre halvdel)", gregorian: "Descensus — melodisk fall, inkarnasjon og jordnærhet", chinese: "羽 Yǔ — vannets tone, synkende energi mot nord" };
  } else if (avgJumpSemitones > 3) {
    shape = "Springende";
    meaning = "Store sprang mellom toner — dramatikk, kontrast, indre dialog mellom motpoler. I raga-teori: vakra gamaka — ornamentering gjennom dristige sprang. I gregoriansk sang: saltus, det forbudte spranget som uttrykker ekstraordinær følelse.";
    tradition = { raga: "Vakra — den uventede retningsendringen, ornamentalt sprang", gregorian: "Saltus — det melodiske spranget, ekspressiv frihet", chinese: "角 Jué — treets tone, uforutsigbar vekst" };
  } else if (rangeSemitones < 5 && avgJumpSemitones < 1.5) {
    shape = "Bølgende";
    meaning = "Myk bølgebevegelse innenfor et smalt register — meditativ, pustende, syklisk. I indisk tradisjon: meend, den uavbrutte glidningen mellom toner. I gregoriansk tradisjon: neumenes bølgende notasjon, åndedraget gjort til melodi.";
    tradition = { raga: "Meend — den kontinuerlige glidningen, gamakas sjel", gregorian: "Neuma — åndedraget, den mykeste melodibevegelsen", chinese: "商 Shāng — metallets tone, høstens bølger" };
  } else {
    shape = "Fortellende";
    meaning = "En kompleks bue med stigning, klimaks og fall — en narrativ. Stemmen forteller en historie. I raga-teori: ālāp-jor-jhālā — den tredelte improvisasjonsstrukturen der utforskning, oppbygging og klimaks utfolder seg.";
    tradition = { raga: "Ālāp-Jor-Jhālā — den tredelte narrativen", gregorian: "Antifon — den dialogiske formen, kall og respons", chinese: "Samspill av alle fem toner — den fullstendige fortelling" };
  }

  // ─── Contour points for visualization (using Hz, normalized 0-1) ───
  const contourPoints = sampled.map((h, i) => ({
    x: i / (sampled.length - 1),
    y: 1 - (h.freq - minFreq) / (rangeHz || 1),
    note: h.note,
  }));

  return {
    shape,
    meaning,
    tradition,
    stats: { ascending: ascRatio, descending: descRatio, static: staticRatio, rangeSemitones, avgJumpSemitones, overallDiff },
    contourPoints,
  };
}
