// ═══════════════════════════════════════════════════════════════
// WEATHER ENGINE — Klimatisk resonans
// Open-Meteo API → Ayurveda (ritucharya) + TCM (六邪 liù xié)
// ═══════════════════════════════════════════════════════════════

// ─── Open-Meteo (free, no API key, EU GDPR-compliant) ───
export async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,snowfall,cloud_cover,wind_speed_10m,wind_gusts_10m,weather_code,is_day`
      + `&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const c = data.current;
    return {
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      rain: c.rain,
      snow: c.snowfall,
      clouds: c.cloud_cover,
      windSpeed: c.wind_speed_10m,
      windGusts: c.wind_gusts_10m,
      weatherCode: c.weather_code,
      isDay: c.is_day,
      sunrise: data.daily?.sunrise?.[0],
      sunset: data.daily?.sunset?.[0],
      description: weatherCodeToDescription(c.weather_code),
    };
  } catch (e) {
    console.warn("Kunne ikke hente vær:", e);
    return null;
  }
}

// WMO weather codes → Norwegian descriptions
function weatherCodeToDescription(code) {
  const map = {
    0:"Klar himmel", 1:"Hovedsakelig klart", 2:"Delvis skyet", 3:"Overskyet",
    45:"Tåke", 48:"Rimtåke",
    51:"Lett yr", 53:"Moderat yr", 55:"Tett yr",
    56:"Lett underkjølt yr", 57:"Tett underkjølt yr",
    61:"Lett regn", 63:"Moderat regn", 65:"Kraftig regn",
    66:"Lett underkjølt regn", 67:"Kraftig underkjølt regn",
    71:"Lett snø", 73:"Moderat snø", 75:"Kraftig snø",
    77:"Snøkorn", 80:"Lette regnbyger", 81:"Moderate regnbyger", 82:"Kraftige regnbyger",
    85:"Lette snøbyger", 86:"Kraftige snøbyger",
    95:"Tordenvær", 96:"Torden med lett hagl", 99:"Torden med kraftig hagl",
  };
  return map[code] || "Ukjent";
}

// ═══════════════════════════════════════════════════════
// AYURVEDIC WEATHER ANALYSIS — Ritucharya (ऋतुचर्या)
// ═══════════════════════════════════════════════════════
//
// Vata aggraveres av: kulde, tørrhet, vind, vekslende vær
// Pitta aggraveres av: varme, fuktighet, sol, ild
// Kapha aggraveres av: kulde, fuktighet, tung luft, regn, snø

function analyzeAyurvedicWeather(w) {
  let vata = 0, pitta = 0, kapha = 0;

  // Temperature
  if (w.temp < 0)       { vata += 3; kapha += 2; }
  else if (w.temp < 5)  { vata += 2; kapha += 1; }
  else if (w.temp < 15) { vata += 1; }
  else if (w.temp < 25) { pitta += 1; }
  else if (w.temp < 30) { pitta += 2; }
  else                   { pitta += 3; }

  // Wind (Vata = wind itself)
  if (w.windSpeed > 40)      vata += 3;
  else if (w.windSpeed > 20) vata += 2;
  else if (w.windSpeed > 10) vata += 1;

  // Humidity
  if (w.humidity > 85)       { kapha += 3; pitta += 1; }
  else if (w.humidity > 70)  { kapha += 2; }
  else if (w.humidity < 30)  { vata += 2; }
  else if (w.humidity < 50)  { vata += 1; }

  // Precipitation
  if (w.snow > 0)            { kapha += 2; vata += 1; }
  if (w.rain > 5)            { kapha += 2; }
  else if (w.rain > 0)       { kapha += 1; }

  // Wind gusts (Vata irregularity)
  if (w.windGusts > 50) vata += 2;

  // Feels-like vs actual (large difference = Vata-provoking)
  if (Math.abs(w.temp - w.feelsLike) > 8) vata += 1;

  const dominant = vata >= pitta && vata >= kapha ? "Vata"
    : pitta >= kapha ? "Pitta" : "Kapha";

  // Dietary recommendations based on aggravated dosha
  const recommendations = {
    Vata: {
      favor: "Varme, oljete, tunge, søte, sure og salte smaker",
      avoid: "Rå mat, kalde drikker, tørr og lett mat",
      spices: "Ingefær, kanel, kardemomme, fennikel, asafoetida (hing)",
      method: "Supper, stuinger, varme drikker, ghee-rike retter",
    },
    Pitta: {
      favor: "Kjølige, tørre, søte, bitre og sammentrekkende smaker",
      avoid: "Skarpe krydder, fermentert mat, alkohol, sterk sol-eksponering",
      spices: "Koriander, fennikel, mynte, kardemomme, gurkemeie (i moderasjon)",
      method: "Rå salater, dampede grønnsaker, kjølende drikker, kokos",
    },
    Kapha: {
      favor: "Lette, tørre, varme, skarpe, bitre og sammentrekkende smaker",
      avoid: "Tung mat, meieriprodukter, søtsaker, fet mat",
      spices: "Sort pepper, cayenne, ingefær, gurkemeie, sennepsfrø, timian",
      method: "Grillet, lett dampet, kryddersterk suppe, varm te med honning",
    },
  };

  return {
    vata, pitta, kapha, dominant,
    recommendation: recommendations[dominant],
    summary: `${dominant}-provoking vær (V:${vata} P:${pitta} K:${kapha})`,
  };
}

// ═══════════════════════════════════════════════════════
// TCM WEATHER ANALYSIS — 六邪 Liù Xié (Six Evils)
// ═══════════════════════════════════════════════════════
//
// 风 Fēng (Wind)   — wind speed, gusts, sudden changes
// 寒 Hán (Cold)    — low temperature
// 暑 Shǔ (Heat)    — high temperature + humidity
// 湿 Shī (Damp)    — humidity, rain, fog
// 燥 Zào (Dry)     — low humidity, no precipitation
// 火 Huǒ (Fire)    — extreme heat, inflammation

function analyzeTCMWeather(w) {
  const factors = {
    feng: { name:"风 Fēng", meaning:"Vind", level:0, organ:"Lever", meridian:"Lever/Galleblære" },
    han:  { name:"寒 Hán", meaning:"Kulde", level:0, organ:"Nyre", meridian:"Nyre/Blære" },
    shu:  { name:"暑 Shǔ", meaning:"Sommervarme", level:0, organ:"Hjerte", meridian:"Hjerte/Tynntarm" },
    shi:  { name:"湿 Shī", meaning:"Fuktighet", level:0, organ:"Milt", meridian:"Milt/Mage" },
    zao:  { name:"燥 Zào", meaning:"Tørrhet", level:0, organ:"Lunge", meridian:"Lunge/Tykktarm" },
    huo:  { name:"火 Huǒ", meaning:"Ild/varme", level:0, organ:"Hjerte", meridian:"Perikard/Trippelvarmer" },
  };

  // Wind
  if (w.windSpeed > 40) factors.feng.level = 3;
  else if (w.windSpeed > 25) factors.feng.level = 2;
  else if (w.windSpeed > 12) factors.feng.level = 1;

  // Cold
  if (w.temp < -10) factors.han.level = 3;
  else if (w.temp < 0) factors.han.level = 2;
  else if (w.temp < 8) factors.han.level = 1;

  // Summer heat (temp + humidity combined)
  const heatIndex = w.temp + (w.humidity * 0.1);
  if (heatIndex > 35) factors.shu.level = 3;
  else if (heatIndex > 28) factors.shu.level = 2;
  else if (heatIndex > 22) factors.shu.level = 1;

  // Dampness
  if (w.humidity > 90 || w.rain > 5) factors.shi.level = 3;
  else if (w.humidity > 80 || w.rain > 1) factors.shi.level = 2;
  else if (w.humidity > 70 || w.rain > 0) factors.shi.level = 1;

  // Dryness
  if (w.humidity < 25) factors.zao.level = 3;
  else if (w.humidity < 35) factors.zao.level = 2;
  else if (w.humidity < 45 && w.rain === 0) factors.zao.level = 1;

  // Fire
  if (w.temp > 35) factors.huo.level = 3;
  else if (w.temp > 30) factors.huo.level = 2;
  else if (w.temp > 28 && w.humidity > 70) factors.huo.level = 1;

  // Find dominant factor
  const sorted = Object.entries(factors).sort((a, b) => b[1].level - a[1].level);
  const dominant = sorted[0][1];
  const active = sorted.filter(([, f]) => f.level > 0).map(([, f]) => f);

  // Dietary guidance per dominant factor
  const guidance = {
    "风 Fēng": { flavor:"辛 Xīn (skarp)", foods:"Ingefær-te, vårløk, koriander, sitrongress — sprer vind", avoid:"Rå mat og kalde drikker som lar vind trenge inn" },
    "寒 Hán":  { flavor:"辛 Xīn (skarp) + 甘 Gān (søt)", foods:"Lammegryte, ingefær, kanel, fennikelte, varm congee", avoid:"Rå grønnsaker, is, sushi — alt som introduserer mer kulde" },
    "暑 Shǔ":  { flavor:"苦 Kǔ (bitter) + 甘 Gān (søt)", foods:"Vannmelon, mungbønner, agurk, krysantemum-te, mynte", avoid:"Sterkt krydret mat, alkohol, fet mat" },
    "湿 Shī":  { flavor:"苦 Kǔ (bitter) + 辛 Xīn (skarp)", foods:"Byggsuppe, jobstårte, ingefær, sort pepper, gurkemeie", avoid:"Meieri, søtsaker, fet mat, klebrig ris — alt som skaper mer fuktighet" },
    "燥 Zào":  { flavor:"酸 Suān (syrlig) + 甘 Gān (søt)", foods:"Pærer, honning, sesamolje, hvit sopp, liljeknopp-te", avoid:"Sterkt krydret og tørrende mat, for mye kaffe" },
    "火 Huǒ":  { flavor:"苦 Kǔ (bitter) + 咸 Xián (salt)", foods:"Bittermelon, grønn te, sjøgress, selleri, vannmelon", avoid:"Alkohol, sjokolade, sterke krydder, stekt mat" },
  };

  return {
    factors,
    dominant,
    active,
    guidance: guidance[dominant.name] || guidance["湿 Shī"],
    summary: active.length > 0
      ? `${active.map(f => f.name).join(" + ")} — ${active.map(f => f.meaning.toLowerCase()).join(", ")} påvirker kroppen`
      : "Balanserte klimatiske forhold — ingen dominerende patogen faktor",
  };
}

// ═══════════════════════════════════════════════════════
// WEATHER → NOTE WEIGHTING
// ═══════════════════════════════════════════════════════

const WEATHER_NOTE_WEIGHTS = {
  // Warm/Fire → fire notes
  hot:    { "C":0.2, "D":0.3, "D#":0.15, "F":0.1 },
  // Cold → earth/water notes
  cold:   { "F#":0.2, "G#":0.2, "B":0.25, "G":0.15 },
  // Wet/Rain → water notes
  wet:    { "G":0.3, "C#":0.2, "A":0.2, "G#":0.1 },
  // Dry → air/fire notes
  dry:    { "E":0.2, "A#":0.2, "D":0.15, "F":0.1 },
  // Windy → air notes
  windy:  { "E":0.3, "A#":0.25, "D#":0.15 },
  // Snowy → ice/stillness
  snowy:  { "A#":0.15, "G#":0.2, "B":0.2, "F#":0.15 },
  // Stormy → chaos/transformation
  stormy: { "C":0.2, "C#":0.25, "A#":0.2, "D":0.15 },
  // Foggy → mystery/dreams
  foggy:  { "A":0.3, "G":0.2, "C#":0.15 },
  // Clear day → clarity/joy
  clear:  { "D":0.2, "E":0.2, "F":0.15, "D#":0.1 },
  // Night → moon/mystery
  night:  { "A":0.2, "G":0.2, "B":0.15, "C#":0.1 },
};

export function weatherToNoteWeights(w) {
  if (!w) return {};
  const weights = {};

  function apply(key) {
    const map = WEATHER_NOTE_WEIGHTS[key];
    if (map) Object.entries(map).forEach(([n, v]) => { weights[n] = (weights[n] || 0) + v; });
  }

  // Temperature
  if (w.temp > 25) apply("hot");
  else if (w.temp < 5) apply("cold");

  // Precipitation
  if (w.snow > 0) apply("snowy");
  else if (w.rain > 5) apply("stormy");
  else if (w.rain > 0) apply("wet");

  // Humidity
  if (w.humidity < 40 && w.rain === 0) apply("dry");
  else if (w.humidity > 85) apply("wet");

  // Wind
  if (w.windSpeed > 20) apply("windy");
  if (w.windGusts > 50) apply("stormy");

  // Visibility/fog
  if (w.weatherCode === 45 || w.weatherCode === 48) apply("foggy");

  // Clear sky
  if (w.weatherCode <= 1 && w.isDay) apply("clear");

  // Night
  if (!w.isDay) apply("night");

  // Thunderstorm
  if (w.weatherCode >= 95) apply("stormy");

  return weights;
}

// ═══════════════════════════════════════════════════════
// FULL WEATHER ANALYSIS
// ═══════════════════════════════════════════════════════

export function analyzeWeather(weatherData) {
  if (!weatherData) return null;
  return {
    raw: weatherData,
    ayurveda: analyzeAyurvedicWeather(weatherData),
    tcm: analyzeTCMWeather(weatherData),
    noteWeights: weatherToNoteWeights(weatherData),
  };
}

// ─── Weather emoji helper ───
export function weatherEmoji(code) {
  if (code <= 1) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}
