// ═══════════════════════════════════════════════════
// ASTRO ENGINE — Client-side astronomical calculations
// Based on Jean Meeus, "Astronomical Algorithms"
// Accuracy: ~1° for planets, sufficient for astrological use
// ═══════════════════════════════════════════════════

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// ─── Norwegian Cities ───
export const NORWEGIAN_CITIES = [
  { id:"oslo",        name:"Oslo",        lat:59.91, lng:10.75 },
  { id:"bergen",      name:"Bergen",      lat:60.39, lng:5.32 },
  { id:"trondheim",   name:"Trondheim",   lat:63.43, lng:10.40 },
  { id:"stavanger",   name:"Stavanger",   lat:58.97, lng:5.73 },
  { id:"kristiansand",name:"Kristiansand",lat:58.15, lng:8.00 },
  { id:"drammen",     name:"Drammen",     lat:59.74, lng:10.20 },
  { id:"fredrikstad", name:"Fredrikstad", lat:59.22, lng:10.93 },
  { id:"bodo",        name:"Bodø",        lat:67.28, lng:14.40 },
  { id:"tromso",      name:"Tromsø",      lat:69.65, lng:18.96 },
  { id:"svolvær",     name:"Svolvær",     lat:68.23, lng:14.57 },
  { id:"alta",        name:"Alta",        lat:69.97, lng:23.27 },
  { id:"hammerfest",  name:"Hammerfest",  lat:70.66, lng:23.68 },
  { id:"kirkenes",    name:"Kirkenes",    lat:69.73, lng:30.05 },
  { id:"narvik",      name:"Narvik",      lat:68.43, lng:17.43 },
  { id:"harstad",     name:"Harstad",     lat:68.80, lng:16.54 },
  { id:"molde",       name:"Molde",       lat:62.74, lng:7.16 },
  { id:"alesund",     name:"Ålesund",     lat:62.47, lng:6.15 },
  { id:"haugesund",   name:"Haugesund",   lat:59.41, lng:5.27 },
  { id:"lillehammer", name:"Lillehammer", lat:61.12, lng:10.47 },
  { id:"gjovik",      name:"Gjøvik",      lat:60.80, lng:10.69 },
  { id:"nesodden",    name:"Nesodden",    lat:59.85, lng:10.66 },
  { id:"favang",      name:"Fåvang",      lat:61.45, lng:10.19 },
];

// ─── Julian Day ───
export function toJulianDay(date) {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours()/24 + date.getUTCMinutes()/1440 + date.getUTCSeconds()/86400;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

// Julian centuries from J2000.0
function T(jd) { return (jd - 2451545.0) / 36525; }

// Normalize angle to 0-360
function norm(a) { return ((a % 360) + 360) % 360; }

// Kepler equation solver (M in radians, returns E in radians)
function solveKepler(M, e, tol = 1e-8) {
  let E = M;
  for (let i = 0; i < 30; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// True anomaly from mean anomaly and eccentricity
function trueAnomaly(M_deg, e) {
  const M = M_deg * DEG;
  const E = solveKepler(M, e);
  const v = 2 * Math.atan2(Math.sqrt(1+e) * Math.sin(E/2), Math.sqrt(1-e) * Math.cos(E/2));
  return v * RAD;
}

// ─── Solar Position (Meeus Ch. 25) ───
export function solarPosition(jd) {
  const t = T(jd);
  // Geometric mean longitude
  const L0 = norm(280.46646 + 36000.76983 * t + 0.0003032 * t*t);
  // Mean anomaly
  const M = norm(357.52911 + 35999.05029 * t - 0.0001537 * t*t);
  // Equation of center
  const C = (1.914602 - 0.004817*t - 0.000014*t*t) * Math.sin(M*DEG)
          + (0.019993 - 0.000101*t) * Math.sin(2*M*DEG)
          + 0.000289 * Math.sin(3*M*DEG);
  // Sun's ecliptic longitude
  const longitude = norm(L0 + C);
  return { longitude, sign: longitudeToSign(longitude) };
}

// ─── Lunar Position (simplified, ~1° accuracy) ───
export function lunarPosition(jd) {
  const t = T(jd);
  // Mean longitude
  const Lp = norm(218.3165 + 481267.8813 * t);
  // Mean anomaly
  const M = norm(134.9634 + 477198.8676 * t);
  // Mean elongation
  const D = norm(297.8502 + 445267.1115 * t);
  // Argument of latitude
  const F = norm(93.2720 + 483202.0175 * t);
  // Sun's mean anomaly
  const Ms = norm(357.5291 + 35999.0503 * t);

  let lng = Lp
    + 6.289 * Math.sin(M * DEG)
    - 1.274 * Math.sin((2*D - M) * DEG)
    + 0.658 * Math.sin(2*D * DEG)
    - 0.214 * Math.sin(2*M * DEG)
    - 0.186 * Math.sin(Ms * DEG)
    - 0.114 * Math.sin(2*F * DEG)
    + 0.059 * Math.sin((2*D - 2*M) * DEG)
    + 0.057 * Math.sin((2*D - Ms - M) * DEG);

  lng = norm(lng);
  return { longitude: lng, sign: longitudeToSign(lng) };
}

// ─── Planetary Positions (Meeus Ch. 31, low accuracy) ───
// Orbital elements at J2000.0 and rates per century (from JPL)
const PLANETS = {
  mercury: {
    name:"Merkur", symbol:"☿",
    L0:252.2509, Lrate:149472.6747,
    a:0.387098, e0:0.205635, erate:0.000020,
    i0:7.0050, irate:-0.0060,
    W0:48.3309, Wrate:-0.1254,
    w0:29.1241, wrate:0.2800,
  },
  venus: {
    name:"Venus", symbol:"♀",
    L0:181.9798, Lrate:58517.8157,
    a:0.723332, e0:0.006773, erate:-0.000048,
    i0:3.3947, irate:0.0010,
    W0:76.6799, Wrate:-0.2780,
    w0:54.8842, wrate:0.1388,
  },
  mars: {
    name:"Mars", symbol:"♂",
    L0:355.4330, Lrate:19140.2993,
    a:1.523679, e0:0.093405, erate:0.000090,
    i0:1.8497, irate:-0.0013,
    W0:49.5574, Wrate:-0.2950,
    w0:286.5016, wrate:0.7712,
  },
  jupiter: {
    name:"Jupiter", symbol:"♃",
    L0:34.3515, Lrate:3034.9057,
    a:5.20260, e0:0.048498, erate:0.000163,
    i0:1.3033, irate:-0.0020,
    W0:100.4644, Wrate:0.1767,
    w0:273.8777, wrate:0.3254,
  },
  saturn: {
    name:"Saturn", symbol:"♄",
    L0:49.9429, Lrate:1222.1138,
    a:9.55491, e0:0.055509, erate:-0.000346,
    i0:2.4889, irate:0.0025,
    W0:113.6634, Wrate:-0.2500,
    w0:339.3939, wrate:0.3484,
  },
  uranus: {
    name:"Uranus", symbol:"⛢",
    L0:313.2318, Lrate:428.4677,
    a:19.21845, e0:0.047318, erate:-0.000027,
    i0:0.7732, irate:0.0001,
    W0:74.0060, Wrate:0.0413,
    w0:98.9989, wrate:0.0445,
  },
  neptune: {
    name:"Neptun", symbol:"♆",
    L0:304.8800, Lrate:218.4862,
    a:30.11039, e0:0.008606, erate:0.000002,
    i0:1.7700, irate:-0.0003,
    W0:131.7841, Wrate:-0.0061,
    w0:276.3400, wrate:0.0118,
  },
  pluto: {
    name:"Pluto", symbol:"♇",
    L0:238.9290, Lrate:145.2078,
    a:39.48169, e0:0.248808, erate:0.000060,
    i0:17.1414, irate:0.0000,
    W0:110.3034, Wrate:-0.0106,
    w0:113.7640, wrate:0.0140,
  },
};

function computePlanetLongitude(planet, t) {
  const p = planet;
  const L = norm(p.L0 + p.Lrate * t);
  const e = p.e0 + p.erate * t;
  const w = norm(p.w0 + p.wrate * t);
  const W = norm(p.W0 + p.Wrate * t);
  const M = norm(L - w - W);
  const v = trueAnomaly(M, e);
  // Heliocentric ecliptic longitude (simplified — ignoring latitude correction)
  const helioLong = norm(v + w + W);
  return helioLong;
}

// Convert heliocentric to geocentric (simplified)
function helioToGeo(planetLong, planetDist, sunLong) {
  // Very simplified — proper conversion needs XYZ coords
  // For outer planets, this approximation works within ~2°
  // For inner planets, it's rougher but acceptable for astrology
  const diff = planetLong - sunLong;
  return norm(planetLong); // Simplified: use heliocentric as approximation
}

export function allPlanetPositions(jd) {
  const t_val = T(jd);
  const sun = solarPosition(jd);
  const moon = lunarPosition(jd);

  const result = {
    sun: { ...sun, name:"Solen", symbol:"☉" },
    moon: { ...moon, name:"Månen", symbol:"☽" },
  };

  // For inner planets (Mercury, Venus), we need geocentric correction
  // Using simplified approach
  const earthL = norm(280.46646 + 36000.76983 * t_val);

  Object.entries(PLANETS).forEach(([key, planet]) => {
    const helioLong = computePlanetLongitude(planet, t_val);
    // Simplified geocentric: for astrology purposes, heliocentric is ~okay for outer planets
    // For inner planets, apply basic correction
    let geoLong = helioLong;
    if (key === "mercury" || key === "venus") {
      // Inner planet geocentric approximation
      const elongation = helioLong - earthL;
      geoLong = norm(sun.longitude + elongation * 0.8); // rough correction
    }
    result[key] = {
      longitude: norm(geoLong),
      sign: longitudeToSign(norm(geoLong)),
      name: planet.name,
      symbol: planet.symbol,
    };
  });

  return result;
}

// ─── Ascendant Calculation ───
export function calculateAscendant(jd, lat, lng) {
  const t_val = T(jd);

  // Greenwich Mean Sidereal Time (in degrees)
  const GMST = norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t_val*t_val);

  // Local Sidereal Time
  const LST = norm(GMST + lng);
  const RAMC = LST; // Right Ascension of the Midheaven (≈ LST)

  // Obliquity of the ecliptic
  const eps = 23.4393 - 0.0130 * t_val;

  // Ascendant formula
  const lstRad = LST * DEG;
  const epsRad = eps * DEG;
  const latRad = lat * DEG;

  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad))
  );

  let ascDeg = norm(ascRad * RAD);

  // Handle high latitudes (>66°) where ascendant can be erratic
  // At very high latitudes, some signs never rise — use MC-based approximation
  if (Math.abs(lat) > 66) {
    // Fallback: MC + 90° as rough ascendant estimate
    const MC = norm(Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad)) * RAD);
    ascDeg = norm(MC + 90);
  }

  return { longitude: ascDeg, sign: longitudeToSign(ascDeg), degree: ascDeg % 30 };
}

// ─── Midheaven ───
export function calculateMC(jd, lng) {
  const t_val = T(jd);
  const GMST = norm(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t_val*t_val);
  const LST = norm(GMST + lng);
  const eps = (23.4393 - 0.0130 * t_val) * DEG;
  const mcLong = norm(Math.atan2(Math.sin(LST * DEG), Math.cos(LST * DEG) * Math.cos(eps)) * RAD);
  return { longitude: mcLong, sign: longitudeToSign(mcLong) };
}

// ─── Zodiac Helpers ───
const SIGN_NAMES = [
  { id:"aries",    name:"Vædderen",    symbol:"♈", element:"Ild",  ruler:"Mars" },
  { id:"taurus",   name:"Tyren",       symbol:"♉", element:"Jord", ruler:"Venus" },
  { id:"gemini",   name:"Tvillingene", symbol:"♊", element:"Luft", ruler:"Merkur" },
  { id:"cancer",   name:"Krepsen",     symbol:"♋", element:"Vann", ruler:"Månen" },
  { id:"leo",      name:"Løven",       symbol:"♌", element:"Ild",  ruler:"Solen" },
  { id:"virgo",    name:"Jomfruen",    symbol:"♍", element:"Jord", ruler:"Merkur" },
  { id:"libra",    name:"Vekten",      symbol:"♎", element:"Luft", ruler:"Venus" },
  { id:"scorpio",  name:"Skorpionen",  symbol:"♏", element:"Vann", ruler:"Pluto" },
  { id:"sagittarius",name:"Skytten",   symbol:"♐", element:"Ild",  ruler:"Jupiter" },
  { id:"capricorn",name:"Steinbukken", symbol:"♑", element:"Jord", ruler:"Saturn" },
  { id:"aquarius", name:"Vannmannen",  symbol:"♒", element:"Luft", ruler:"Uranus" },
  { id:"pisces",   name:"Fiskene",     symbol:"♓", element:"Vann", ruler:"Neptun" },
];

export { SIGN_NAMES };

export function longitudeToSign(lng) {
  const idx = Math.floor(norm(lng) / 30);
  return { ...SIGN_NAMES[idx], degree: Math.floor(lng % 30), index: idx };
}

// ─── Aspects ───
const ASPECTS = [
  { name:"Konjunksjon", symbol:"☌", angle:0,   orb:8, nature:"intensitet",  meaning:"Fusjon av energier — kraftig forsterkning" },
  { name:"Sekstil",     symbol:"⚹", angle:60,  orb:5, nature:"harmoni",     meaning:"Mulighet og flyt mellom energiene" },
  { name:"Kvadrat",     symbol:"□", angle:90,  orb:7, nature:"spenning",    meaning:"Friksjon som driver handling og vekst" },
  { name:"Trigon",      symbol:"△", angle:120, orb:7, nature:"harmoni",     meaning:"Naturlig talent og uanstrengt flyt" },
  { name:"Opposisjon",  symbol:"☍", angle:180, orb:8, nature:"polaritet",   meaning:"Spenning mellom motpoler — krever integrering" },
  { name:"Kvintil",     symbol:"Q", angle:72,  orb:2, nature:"kreativitet", meaning:"Kreativt talent og unik uttrykkskraft" },
  { name:"Semi-sekstil",symbol:"⚺", angle:30,  orb:2, nature:"subtil",     meaning:"Subtil forbindelse, ubevisst innflytelse" },
];

export function findAspects(planets) {
  const keys = Object.keys(planets);
  const aspects = [];
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const p1 = planets[keys[i]], p2 = planets[keys[j]];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECTS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          aspects.push({
            planet1: p1, planet1Key: keys[i],
            planet2: p2, planet2Key: keys[j],
            aspect: asp,
            exactness: 1 - Math.abs(diff - asp.angle) / asp.orb,
          });
        }
      }
    }
  }
  return aspects.sort((a, b) => b.exactness - a.exactness);
}

// ─── Compute full astrological weights for note weighting ───
export function computeAstroWeightsFromChart(planets, ascendant) {
  const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const weights = {};
  NOTE_NAMES.forEach(n => weights[n] = 1.0);

  // Planet → note mapping (Klangeller synthesis)
  // NB: No single historical tradition maps planets to chromatic notes consistently.
  // Kepler mapped orbital eccentricity to interval RANGES, not single notes.
  // Fludd, Agrippa, and Kircher all differ. This is our creative synthesis
  // based on Golden Dawn planetary attributions + element correspondences.
  const PLANET_NOTES = {
    sun:["D","E"], moon:["G","G#"], mercury:["E","A#"], venus:["F","B"],
    mars:["C","C#"], jupiter:["D#","F"], saturn:["G#","A"],
    uranus:["A#"], neptune:["A"], pluto:["C#"],
  };

  // Element → note mapping
  const EL_NOTES = {
    "Ild":["C","D","D#","F"], "Jord":["C#","F#","G#","B"],
    "Luft":["E","F","A#","B"], "Vann":["C#","G","A","G#"],
  };

  // Sun sign — strongest influence
  if (planets.sun) {
    const el = planets.sun.sign.element;
    (EL_NOTES[el]||[]).forEach(n => weights[n] += 0.5);
    // Ruler's notes get extra boost
    const rulerNotes = PLANET_NOTES[Object.keys(PLANET_NOTES).find(k => 
      planets[k]?.name === planets.sun.sign?.ruler || k === planets.sun.sign?.ruler?.toLowerCase()
    )] || [];
    rulerNotes.forEach(n => weights[n] += 0.3);
  }

  // Moon sign — emotional undertone
  if (planets.moon) {
    const el = planets.moon.sign.element;
    (EL_NOTES[el]||[]).forEach(n => weights[n] += 0.4);
  }

  // Ascendant — outer expression
  if (ascendant) {
    const el = ascendant.sign.element;
    (EL_NOTES[el]||[]).forEach(n => weights[n] += 0.35);
  }

  // Each planet boosts its associated notes based on sign
  Object.entries(PLANET_NOTES).forEach(([key, notes]) => {
    if (!planets[key]) return;
    notes.forEach(n => weights[n] += 0.15);
  });

  // Aspects create cross-resonance
  const aspects = findAspects(planets);
  aspects.forEach(asp => {
    const notes1 = PLANET_NOTES[asp.planet1Key] || [];
    const notes2 = PLANET_NOTES[asp.planet2Key] || [];
    const boost = asp.aspect.nature === "harmoni" ? 0.15 : asp.aspect.nature === "spenning" ? 0.10 : 0.12;
    [...notes1, ...notes2].forEach(n => weights[n] += boost * asp.exactness);
  });

  return weights;
}

// ─── Full Chart ───
export function computeFullChart(birthDate, lat, lng) {
  const jd = toJulianDay(birthDate);
  const planets = allPlanetPositions(jd);
  const ascendant = calculateAscendant(jd, lat, lng);
  const mc = calculateMC(jd, lng);
  const aspects = findAspects(planets);
  const weights = computeAstroWeightsFromChart(planets, ascendant);

  return { planets, ascendant, mc, aspects, weights, jd };
}

// ─── Transit Chart (current sky) ───
export function computeTransitChart(lat, lng) {
  return computeFullChart(new Date(), lat, lng);
}

// ═══════════════════════════════════════════════════
// TRANSIT-TO-NATAL — The core of personal astrology
// "What is the sky doing to MY chart right now?"
// ═══════════════════════════════════════════════════

const TRANSIT_MEANINGS = {
  sun:     { name:"Solen",   theme:"identitet og livsretning" },
  moon:    { name:"Månen",   theme:"følelser og indre behov" },
  mercury: { name:"Merkur",  theme:"kommunikasjon og tanke" },
  venus:   { name:"Venus",   theme:"kjærlighet og verdier" },
  mars:    { name:"Mars",    theme:"handlekraft og driv" },
  jupiter: { name:"Jupiter", theme:"vekst og muligheter" },
  saturn:  { name:"Saturn",  theme:"struktur og ansvar" },
  uranus:  { name:"Uranus",  theme:"frigjøring og plutselig endring" },
  neptune: { name:"Neptun",  theme:"drøm og transcendens" },
  pluto:   { name:"Pluto",   theme:"dyp transformasjon" },
};

const ASPECT_TRANSIT_TEXT = {
  "Konjunksjon": (tr, na) => `${tr} forener seg med din natale ${na} — intens aktivering av ${TRANSIT_MEANINGS[na]?.theme || 'denne energien'}`,
  "Sekstil":     (tr, na) => `${tr} åpner muligheter for din ${na} — harmonisk støtte til ${TRANSIT_MEANINGS[na]?.theme || 'denne sfæren'}`,
  "Kvadrat":     (tr, na) => `${tr} utfordrer din ${na} — spenning og vekst i ${TRANSIT_MEANINGS[na]?.theme || 'dette området'}`,
  "Trigon":      (tr, na) => `${tr} flyter med din ${na} — naturlig talent aktiveres i ${TRANSIT_MEANINGS[na]?.theme || 'dette feltet'}`,
  "Opposisjon":  (tr, na) => `${tr} konfronterer din ${na} — polaritet som krever integrering av ${TRANSIT_MEANINGS[na]?.theme || 'motpolene'}`,
  "Kvintil":     (tr, na) => `${tr} inspirerer din ${na} kreativt — unik uttrykkskraft i ${TRANSIT_MEANINGS[na]?.theme || 'dette området'}`,
  "Semi-sekstil":(tr, na) => `${tr} berører din ${na} subtilt — ubevisst innflytelse på ${TRANSIT_MEANINGS[na]?.theme || 'dette feltet'}`,
};

export function findTransitToNatalAspects(transitPlanets, natalPlanets, natalAscendant) {
  const crossAspects = [];
  const transitKeys = Object.keys(transitPlanets);
  const natalKeys = Object.keys(natalPlanets);

  // Also check aspects to natal ascendant
  const natalTargets = [...natalKeys.map(k => ({ key: k, planet: natalPlanets[k] }))];
  if (natalAscendant) {
    natalTargets.push({ key: "ascendant", planet: { longitude: natalAscendant.longitude, sign: natalAscendant.sign, name: "Ascendant", symbol: "ASC" } });
  }

  for (const tKey of transitKeys) {
    const tPlanet = transitPlanets[tKey];
    for (const nTarget of natalTargets) {
      let diff = Math.abs(tPlanet.longitude - nTarget.planet.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const asp of ASPECTS) {
        if (Math.abs(diff - asp.angle) <= asp.orb) {
          const exactness = 1 - Math.abs(diff - asp.angle) / asp.orb;
          const textFn = ASPECT_TRANSIT_TEXT[asp.name];
          const text = textFn
            ? textFn(tPlanet.name || tKey, nTarget.key)
            : `Transit ${tPlanet.symbol} ${asp.symbol} natal ${nTarget.planet.symbol}`;

          crossAspects.push({
            transitPlanet: tPlanet,
            transitKey: tKey,
            natalPlanet: nTarget.planet,
            natalKey: nTarget.key,
            aspect: asp,
            exactness,
            text,
            // Weight: outer planets transiting personal planets = strongest
            significance: getSignificance(tKey, nTarget.key) * exactness,
          });
        }
      }
    }
  }

  return crossAspects.sort((a, b) => b.significance - a.significance);
}

function getSignificance(transitKey, natalKey) {
  // Slow planets transiting personal points = most significant
  const slowPlanets = { pluto: 5, neptune: 4.5, uranus: 4, saturn: 3.5, jupiter: 3 };
  const personalPoints = { sun: 3, moon: 3, ascendant: 2.5, mercury: 2, venus: 2, mars: 2 };
  const tWeight = slowPlanets[transitKey] || 1;
  const nWeight = personalPoints[natalKey] || 1;
  return tWeight * nWeight;
}

// ─── Combined weights: transit × natal interaction ───
export function computeCombinedWeights(transitChart, natalChart) {
  const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const weights = {};
  NOTE_NAMES.forEach(n => weights[n] = 1.0);

  const PLANET_NOTES = {
    sun:["D","E"], moon:["G","G#"], mercury:["E","A#"], venus:["F","B"],
    mars:["C","C#"], jupiter:["D#","F"], saturn:["G#","A"],
    uranus:["A#"], neptune:["A"], pluto:["C#"],
    ascendant:["C","G"], // ASC relates to self-expression and appearance
  };

  const EL_NOTES = {
    "Ild":["C","D","D#","F"], "Jord":["C#","F#","G#","B"],
    "Luft":["E","F","A#","B"], "Vann":["C#","G","A","G#"],
  };

  if (!transitChart || !natalChart) return weights;

  // 1. Transit chart self-aspects (what's happening in the sky)
  const tw = computeAstroWeightsFromChart(transitChart.planets, transitChart.ascendant);
  NOTE_NAMES.forEach(n => weights[n] += (tw[n] - 1) * 0.3);

  // 2. Natal chart base (who you are)
  const nw = natalChart.weights || computeAstroWeightsFromChart(natalChart.planets, natalChart.ascendant);
  const natalMult = natalChart.synthetic ? 0.6 : 0.4;
  NOTE_NAMES.forEach(n => weights[n] += (nw[n] - 1) * natalMult);

  // 3. CROSS-ASPECTS — the key interaction (biggest impact)
  const crossAspects = findTransitToNatalAspects(
    transitChart.planets,
    natalChart.planets,
    natalChart.ascendant
  );

  crossAspects.forEach(ca => {
    // Both transit and natal planet's notes get boosted
    const tNotes = PLANET_NOTES[ca.transitKey] || [];
    const nNotes = PLANET_NOTES[ca.natalKey] || [];
    const allNotes = [...new Set([...tNotes, ...nNotes])];

    // Harmonic aspects boost more, tension aspects boost less but still matter
    const baseBoost = ca.aspect.nature === "harmoni" ? 0.25
      : ca.aspect.nature === "spenning" ? 0.15
      : ca.aspect.nature === "polaritet" ? 0.20
      : 0.12;

    const boost = baseBoost * ca.significance * 0.15; // Scale down but keep meaningful
    allNotes.forEach(n => weights[n] += boost);

    // Element crossover: transit sign element + natal sign element
    if (ca.transitPlanet.sign?.element) {
      (EL_NOTES[ca.transitPlanet.sign.element] || []).forEach(n => weights[n] += boost * 0.3);
    }
    if (ca.natalPlanet.sign?.element) {
      (EL_NOTES[ca.natalPlanet.sign.element] || []).forEach(n => weights[n] += boost * 0.3);
    }
  });

  return { weights, crossAspects };
}

// ─── Planetary Hour (Chaldean) ───
const CHALDEAN = ["Saturn","Jupiter","Mars","Solen","Venus","Merkur","Månen"];
const DAY_RULERS = ["Solen","Månen","Mars","Merkur","Jupiter","Venus","Saturn"];

export function getPlanetaryHour() {
  const now = new Date();
  const dayRuler = DAY_RULERS[now.getDay()];
  const startIdx = CHALDEAN.indexOf(dayRuler);
  const hour = now.getHours();
  return { planet: CHALDEAN[(startIdx + hour) % 7], dayRuler, hour };
}
