// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE SOURCE v8 — Symbol-sentrisk kunnskapslag
// v8: Hardkodet fra v7 TRADITIONS-data, shape-kompatibel med
//     kommende correspondences.json eksport fra Rust-databasen.
// v9: Bytt EMBEDDED til fetch('/correspondences.json') + cache.
//     Signaturen endrer seg ikke.
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Attestation
 * @property {string} sourceSlug
 * @property {string|null} originalQuote
 * @property {string|null} translation
 * @property {"direct"|"cognate"|"reconstructed"} confidence
 */

/**
 * @typedef {Object} Symbol
 * @property {string} slug
 * @property {string} name
 * @property {string|null} nativeScript
 * @property {string[]} keywords
 * @property {string[]} semanticFields       - tagged: "deity:odin", "concept:wisdom"
 * @property {Object} correspondences        - direct attestable fields
 * @property {string} canonicalMeaning
 * @property {Attestation[]} attestations    - [] in v8, filled when DB lands
 * @property {"embedded"|"database"} _source
 */

// ───────────────────────────────────────────────────────────────
// NOTE → SLUG maps. Eneste sted som binder v7s note-baserte
// spread til slug-verdenen. Når databasen lander, er dette også
// det eneste stedet som trenger oppdatering hvis tradisjonens
// note-mapping endres.
// ───────────────────────────────────────────────────────────────

const NOTE_TO_SLUG = {
  hay: {
    C:"the_emperor", "C#":"death", D:"strength", "D#":"temperance",
    E:"the_lovers", F:"the_empress", "F#":"the_hermit", G:"the_chariot",
    "G#":"the_world", A:"the_moon", "A#":"the_star", B:"the_high_priestess"
  },
  thoth: {
    C:"the_emperor", "C#":"death", D:"lust", "D#":"art",
    E:"the_lovers", F:"the_empress", "F#":"the_hermit", G:"the_chariot",
    "G#":"adjustment", A:"the_moon", "A#":"the_star", B:"the_priestess"
  },
  norse: {
    C:"fehu", "C#":"uruz", D:"thurisaz", "D#":"ansuz",
    E:"raidho", F:"kenaz", "F#":"gebo", G:"wunjo",
    "G#":"hagalaz", A:"nauthiz", "A#":"isa", B:"jera"
  },
  egyptian: {
    C:"ra", "C#":"sekhmet", D:"horus", "D#":"hathor",
    E:"thoth", F:"osiris", "F#":"isis", G:"nut",
    "G#":"anubis", A:"nephthys", "A#":"set", B:"maat"
  },
  celtic: {
    C:"beith", "C#":"luis", D:"fearn", "D#":"saille",
    E:"nuin", F:"huath", "F#":"duir", G:"tinne",
    "G#":"coll", A:"quert", "A#":"muin", B:"gort"
  },
  pythagorean: {
    C:"unison", "C#":"minor_second", D:"major_second", "D#":"minor_third",
    E:"major_third", F:"perfect_fourth", "F#":"tritone", G:"perfect_fifth",
    "G#":"minor_sixth", A:"major_sixth", "A#":"minor_seventh", B:"major_seventh"
  },
  elemental: {
    C:"fire", "C#":"fire_water", D:"fire_air", "D#":"fire_earth",
    E:"air", F:"air_earth", "F#":"earth", G:"water",
    "G#":"water_earth", A:"water_air", "A#":"aether", B:"earth_water"
  },
  iching: {
    // I Ching note-mapping er dynamisk (ICHING_NOTE_MAP i kodebasen),
    // bygget fra trigram-kombinasjoner. Slug genereres fra heksagram-
    // nummer ved lookup-tid for denne tradisjonen.
  },
};

// ───────────────────────────────────────────────────────────────
// EMBEDDED symbol-data. Migrert fra v7 TRADITIONS[*].map.
// Kanonisk source-of-truth fram til databasen eksporterer JSON.
// ───────────────────────────────────────────────────────────────

const EMBEDDED = {

  // ═════ NORRØN (referanse-tradisjon, full utfylling) ═════
  norse: {
    fehu: {
      slug:"fehu", name:"Fehu", nativeScript:"ᚠ",
      keywords:["overflod","livskraft","rikdom","kveg"],
      semanticFields:["deity:freyja","realm:vanaheim","element:fire",
                      "concept:wealth","concept:movable_property"],
      correspondences:{element:"fire",deity:"freyja",realm:"vanaheim"},
      canonicalMeaning:"Kveg, rikdom — det som beveger seg og gir næring.",
      attestations:[]
    },
    uruz: {
      slug:"uruz", name:"Uruz", nativeScript:"ᚢ",
      keywords:["rå kraft","utholdenhet","uroksen"],
      semanticFields:["deity:thor","realm:jotunheim","element:earth",
                      "concept:primal_strength","animal:aurochs"],
      correspondences:{element:"earth",deity:"thor",realm:"jotunheim"},
      canonicalMeaning:"Den ville oksen — ubendig opprinnelig kraft.",
      attestations:[]
    },
    thurisaz: {
      slug:"thurisaz", name:"Thurisaz", nativeScript:"ᚦ",
      keywords:["forsvar","gjennombrudd","tornen"],
      semanticFields:["deity:thor","realm:muspelheim","element:fire",
                      "being:jotun","concept:reactive_force"],
      correspondences:{element:"fire",deity:"thor",realm:"muspelheim"},
      canonicalMeaning:"Tornen som beskytter og sårer — reaktiv kraft.",
      attestations:[]
    },
    ansuz: {
      slug:"ansuz", name:"Ansuz", nativeScript:"ᚨ",
      keywords:["visdom","inspirasjon","Odins rune","guddommelig tale"],
      semanticFields:["deity:odin","realm:asgard","element:air",
                      "concept:wisdom","concept:divine_speech",
                      "concept:inspiration"],
      correspondences:{element:"air",deity:"odin",realm:"asgard"},
      canonicalMeaning:"Åsenes rune — visdom, inspirasjon, guddommelig uttalelse.",
      attestations:[]
    },
    raidho: {
      slug:"raidho", name:"Raidho", nativeScript:"ᚱ",
      keywords:["reise","bevegelse","kosmisk orden"],
      semanticFields:["deity:odin","realm:bifrost","element:air",
                      "concept:journey","concept:cosmic_order"],
      correspondences:{element:"air",deity:"odin",realm:"bifrost"},
      canonicalMeaning:"Reisen over Bifrost — bevegelse etter kosmisk orden.",
      attestations:[]
    },
    kenaz: {
      slug:"kenaz", name:"Kenaz", nativeScript:"ᚲ",
      keywords:["kunnskap","illuminasjon","fakkelen"],
      semanticFields:["deity:heimdall","realm:alfheim","element:fire",
                      "concept:knowledge","concept:illumination"],
      correspondences:{element:"fire",deity:"heimdall",realm:"alfheim"},
      canonicalMeaning:"Fakkelen i mørket — kunnskap som lyser opp.",
      attestations:[]
    },
    gebo: {
      slug:"gebo", name:"Gebo", nativeScript:"ᚷ",
      keywords:["gave","gjensidighet","balanse"],
      semanticFields:["deity:odin","realm:midgard","element:air",
                      "concept:gift","concept:reciprocity"],
      correspondences:{element:"air",deity:"odin",realm:"midgard"},
      canonicalMeaning:"Gaven som binder giver og mottaker.",
      attestations:[]
    },
    wunjo: {
      slug:"wunjo", name:"Wunjo", nativeScript:"ᚹ",
      keywords:["glede","harmoni","velvære"],
      semanticFields:["deity:frigg","realm:vanaheim","element:water",
                      "concept:joy","concept:harmony"],
      correspondences:{element:"water",deity:"frigg",realm:"vanaheim"},
      canonicalMeaning:"Glede og harmoni — trivsel i flokken.",
      attestations:[]
    },
    hagalaz: {
      slug:"hagalaz", name:"Hagalaz", nativeScript:"ᚺ",
      keywords:["destruktiv fornyelse","hagl","brudd"],
      semanticFields:["deity:hel","realm:niflheim","element:ice",
                      "concept:destruction","concept:renewal",
                      "phenomenon:hail"],
      correspondences:{element:"ice",deity:"hel",realm:"niflheim"},
      canonicalMeaning:"Haglet som ødelegger og renser — nødvendig brudd.",
      attestations:[]
    },
    nauthiz: {
      slug:"nauthiz", name:"Nauthiz", nativeScript:"ᚾ",
      keywords:["nød","motstand","overlevelse"],
      semanticFields:["deity:skuld","realm:helheim","element:fire",
                      "concept:need","concept:constraint"],
      correspondences:{element:"fire",deity:"skuld",realm:"helheim"},
      canonicalMeaning:"Nøden som skjerper — motstand som tvinger vekst.",
      attestations:[]
    },
    isa: {
      slug:"isa", name:"Isa", nativeScript:"ᛁ",
      keywords:["is","stillstand","klarhet"],
      semanticFields:["deity:verdandi","realm:niflheim","element:ice",
                      "concept:stillness","concept:clarity"],
      correspondences:{element:"ice",deity:"verdandi",realm:"niflheim"},
      canonicalMeaning:"Isen som holder alt fast — stillhet og klarhet.",
      attestations:[]
    },
    jera: {
      slug:"jera", name:"Jera", nativeScript:"ᛃ",
      keywords:["syklus","innhøsting","tålmodighet"],
      semanticFields:["deity:freyr","realm:midgard","element:earth",
                      "concept:cycle","concept:harvest"],
      correspondences:{element:"earth",deity:"freyr",realm:"midgard"},
      canonicalMeaning:"Årssyklusen — det man sår høster man i sin tid.",
      attestations:[]
    },
  },

  // ═════ HAY KROMATISK ═════
  hay: {
    the_emperor:      { slug:"the_emperor", name:"Keiseren", nativeScript:"IV",
      keywords:["vilje","kraft"], semanticFields:["planet:mars","sign:aries","element:fire"],
      correspondences:{planet:"mars",sign:"aries",element:"fire"},
      canonicalMeaning:"Suveren vilje — strukturens far.", attestations:[] },
    death:            { slug:"death", name:"Døden", nativeScript:"XIII",
      keywords:["transformasjon"], semanticFields:["planet:pluto","sign:scorpio","element:water"],
      correspondences:{planet:"pluto",sign:"scorpio",element:"water"},
      canonicalMeaning:"Transformasjon — det gamle viker for det nye.", attestations:[] },
    strength:         { slug:"strength", name:"Styrke", nativeScript:"VIII",
      keywords:["mot","lidenskap"], semanticFields:["planet:sun","sign:leo","element:fire"],
      correspondences:{planet:"sun",sign:"leo",element:"fire"},
      canonicalMeaning:"Indre mot — lidenskap temmet.", attestations:[] },
    temperance:       { slug:"temperance", name:"Måtehold", nativeScript:"XIV",
      keywords:["ekspansjon","balanse"], semanticFields:["planet:jupiter","sign:sagittarius","element:fire"],
      correspondences:{planet:"jupiter",sign:"sagittarius",element:"fire"},
      canonicalMeaning:"Ekspansjon med måte — buen spennes varsomt.", attestations:[] },
    the_lovers:       { slug:"the_lovers", name:"Elskerne", nativeScript:"VI",
      keywords:["kommunikasjon","valg"], semanticFields:["planet:mercury","sign:gemini","element:air"],
      correspondences:{planet:"mercury",sign:"gemini",element:"air"},
      canonicalMeaning:"To blir til samtale — valg som bygger bånd.", attestations:[] },
    the_empress:      { slug:"the_empress", name:"Keiserinnen", nativeScript:"III",
      keywords:["harmoni","skjønnhet"], semanticFields:["planet:venus","sign:libra","element:air"],
      correspondences:{planet:"venus",sign:"libra",element:"air"},
      canonicalMeaning:"Fruktbar harmoni — skjønnhet som fødes.", attestations:[] },
    the_hermit:       { slug:"the_hermit", name:"Eremitten", nativeScript:"IX",
      keywords:["introspeksjon"], semanticFields:["planet:earth","sign:virgo","element:earth"],
      correspondences:{planet:"earth",sign:"virgo",element:"earth"},
      canonicalMeaning:"Lanternen lyser innover — visdom i stillhet.", attestations:[] },
    the_chariot:      { slug:"the_chariot", name:"Vognen", nativeScript:"VII",
      keywords:["intuisjon","flyt"], semanticFields:["planet:moon","sign:cancer","element:water"],
      correspondences:{planet:"moon",sign:"cancer",element:"water"},
      canonicalMeaning:"Viljens retning — flyt som styrer.", attestations:[] },
    the_world:        { slug:"the_world", name:"Verden", nativeScript:"XXI",
      keywords:["struktur","fullføring"], semanticFields:["planet:saturn","sign:capricorn","element:earth"],
      correspondences:{planet:"saturn",sign:"capricorn",element:"earth"},
      canonicalMeaning:"Sirkelen lukker seg — fullbyrdelse.", attestations:[] },
    the_moon:         { slug:"the_moon", name:"Månen", nativeScript:"XVIII",
      keywords:["drøm","visjon"], semanticFields:["planet:neptune","sign:pisces","element:water"],
      correspondences:{planet:"neptune",sign:"pisces",element:"water"},
      canonicalMeaning:"Drømmens landskap — visjon gjennom slør.", attestations:[] },
    the_star:         { slug:"the_star", name:"Stjernen", nativeScript:"XVII",
      keywords:["revolusjon","frihet"], semanticFields:["planet:uranus","sign:aquarius","element:air"],
      correspondences:{planet:"uranus",sign:"aquarius",element:"air"},
      canonicalMeaning:"Håpet som bryter natten — frihet utover.", attestations:[] },
    the_high_priestess:{slug:"the_high_priestess", name:"Yppersteprestinnen", nativeScript:"II",
      keywords:["mysterium","visdom"], semanticFields:["planet:venus","sign:taurus","element:earth"],
      correspondences:{planet:"venus",sign:"taurus",element:"earth"},
      canonicalMeaning:"Sløret mellom verdener — stille visdom.", attestations:[] },
  },

  // ═════ THOTH / THELEMA ═════
  thoth: {
    the_emperor:  { slug:"the_emperor", name:"Keiseren", nativeScript:"IV",
      keywords:["suverenitet","Tzaddi","Hé"], semanticFields:["sephira:chokmah","sign:aries","letter:he"],
      correspondences:{sephira:"chokmah",sign:"aries",letter:"he"},
      canonicalMeaning:"Suverenitet over selvet — viljens fiksering.", attestations:[] },
    death:        { slug:"death", name:"Død", nativeScript:"XIII",
      keywords:["putrefaksjon","Nun"], semanticFields:["sephira:tiphareth","sign:scorpio","letter:nun"],
      correspondences:{sephira:"tiphareth",sign:"scorpio",letter:"nun"},
      canonicalMeaning:"Forråtnelse som forutsetning for fornyelse.", attestations:[] },
    lust:         { slug:"lust", name:"Lyst", nativeScript:"XI",
      keywords:["Babalon","hellig begjær","Teth"], semanticFields:["sephira:chesed","sign:leo","letter:teth"],
      correspondences:{sephira:"chesed",sign:"leo",letter:"teth"},
      canonicalMeaning:"Babalon på udyret — det hellige begjæret som skaper.", attestations:[] },
    art:          { slug:"art", name:"Kunst", nativeScript:"XIV",
      keywords:["solve et coagula","Samekh"], semanticFields:["sephira:tiphareth","sign:sagittarius","letter:samekh"],
      correspondences:{sephira:"tiphareth",sign:"sagittarius",letter:"samekh"},
      canonicalMeaning:"Alkymisk forening — solve et coagula.", attestations:[] },
    the_lovers:   { slug:"the_lovers", name:"Elskerne", nativeScript:"VI",
      keywords:["mystisk bryllup","Zayin"], semanticFields:["sephira:binah","sign:gemini","letter:zayin"],
      correspondences:{sephira:"binah",sign:"gemini",letter:"zayin"},
      canonicalMeaning:"Den mystiske bryllupsnatten — forening av motsetninger.", attestations:[] },
    the_empress:  { slug:"the_empress", name:"Keiserinnen", nativeScript:"III",
      keywords:["universell kjærlighet","Daleth"], semanticFields:["sephira:chokmah","planet:venus","letter:daleth"],
      correspondences:{sephira:"chokmah",planet:"venus",letter:"daleth"},
      canonicalMeaning:"Den store moderen — universell kjærlighet som dør.", attestations:[] },
    the_hermit:   { slug:"the_hermit", name:"Eremitten", nativeScript:"IX",
      keywords:["skjult frø","Yod"], semanticFields:["sephira:chesed","sign:virgo","letter:yod"],
      correspondences:{sephira:"chesed",sign:"virgo",letter:"yod"},
      canonicalMeaning:"Det skjulte frøet av lys — Yod som begynnelse.", attestations:[] },
    the_chariot:  { slug:"the_chariot", name:"Vognen", nativeScript:"VII",
      keywords:["hellig gral","Cheth"], semanticFields:["sephira:binah","sign:cancer","letter:cheth"],
      correspondences:{sephira:"binah",sign:"cancer",letter:"cheth"},
      canonicalMeaning:"Gralbæreren — hellig beholder i bevegelse.", attestations:[] },
    adjustment:   { slug:"adjustment", name:"Justering", nativeScript:"VIII",
      keywords:["kosmisk balanse","Lamed"], semanticFields:["sephira:geburah","sign:libra","letter:lamed"],
      correspondences:{sephira:"geburah",sign:"libra",letter:"lamed"},
      canonicalMeaning:"Ma'ats vekt — kosmisk balanse, skjærende rettferdighet.", attestations:[] },
    the_moon:     { slug:"the_moon", name:"Månen", nativeScript:"XVIII",
      keywords:["illuminasjon i mørket","Qoph"], semanticFields:["sephira:netzach","sign:pisces","letter:qoph"],
      correspondences:{sephira:"netzach",sign:"pisces",letter:"qoph"},
      canonicalMeaning:"Bakryggen av natten — illuminasjon gjennom mørket.", attestations:[] },
    the_star:     { slug:"the_star", name:"Stjernen", nativeScript:"XVII",
      keywords:["Nuit","Hé"], semanticFields:["sephira:chokmah","sign:aquarius","letter:he"],
      correspondences:{sephira:"chokmah",sign:"aquarius",letter:"he"},
      canonicalMeaning:"Nuit — hver mann og hver kvinne er en stjerne.", attestations:[] },
    the_priestess:{ slug:"the_priestess", name:"Prestinnen", nativeScript:"II",
      keywords:["stien over Abysset","Gimel"], semanticFields:["sephira:kether","planet:moon","letter:gimel"],
      correspondences:{sephira:"kether",planet:"moon",letter:"gimel"},
      canonicalMeaning:"Stien over Abysset — det rene mediet.", attestations:[] },
  },

  // ═════ EGYPTISK ═════
  egyptian: {
    ra:       { slug:"ra", name:"Ra", nativeScript:"☉",
      keywords:["suverenitet","morgenrøde"], semanticFields:["concept:sovereignty","element:fire","place:heliopolis"],
      correspondences:{element:"fire",celestialBody:"sun",place:"heliopolis"},
      canonicalMeaning:"Solguden — suverenitet og morgenrøde.", attestations:[] },
    sekhmet:  { slug:"sekhmet", name:"Sekhmet", nativeScript:"🦁",
      keywords:["raseri","renselse"], semanticFields:["concept:destruction","element:fire","place:memphis"],
      correspondences:{element:"fire",place:"memphis"},
      canonicalMeaning:"Løvinnen — raseri som renser.", attestations:[] },
    horus:    { slug:"horus", name:"Horus", nativeScript:"🦅",
      keywords:["klarsyn","rettferdighet"], semanticFields:["concept:kingship","element:air","place:edfu"],
      correspondences:{element:"air",place:"edfu"},
      canonicalMeaning:"Falken — klarsyn, kongemakt.", attestations:[] },
    hathor:   { slug:"hathor", name:"Hathor", nativeScript:"♀",
      keywords:["dans","musikk","fruktbarhet"], semanticFields:["concept:joy","element:earth","place:dendera"],
      correspondences:{element:"earth",place:"dendera"},
      canonicalMeaning:"Kjærligheten — dans, musikk, fruktbarhet.", attestations:[] },
    thoth:    { slug:"thoth", name:"Thoth", nativeScript:"☿",
      keywords:["kunnskap","magi","skrift"], semanticFields:["concept:wisdom","element:air","place:hermopolis"],
      correspondences:{element:"air",place:"hermopolis"},
      canonicalMeaning:"Skriveren — visdom og magi.", attestations:[] },
    osiris:   { slug:"osiris", name:"Osiris", nativeScript:"♻",
      keywords:["fornyelse","evighet"], semanticFields:["concept:rebirth","element:water","place:abydos"],
      correspondences:{element:"water",place:"abydos"},
      canonicalMeaning:"Gjenfødelsesguden — evighet gjennom underverdenen.", attestations:[] },
    isis:     { slug:"isis", name:"Isis", nativeScript:"✦",
      keywords:["beskyttelse","mysterier"], semanticFields:["concept:magic","element:water","place:philae"],
      correspondences:{element:"water",place:"philae"},
      canonicalMeaning:"Magien selv — helbredelsens mor.", attestations:[] },
    nut:      { slug:"nut", name:"Nut", nativeScript:"✶",
      keywords:["uendelighet","stjerner"], semanticFields:["concept:cosmos","element:air"],
      correspondences:{element:"air"},
      canonicalMeaning:"Himmelen selv — uendelighetens bue.", attestations:[] },
    anubis:   { slug:"anubis", name:"Anubis", nativeScript:"☥",
      keywords:["veiledning","sannhet"], semanticFields:["concept:transition","element:earth","place:duat"],
      correspondences:{element:"earth",place:"duat"},
      canonicalMeaning:"Veiviseren i Duat — overgangenes gud.", attestations:[] },
    nephthys: { slug:"nephthys", name:"Nephthys", nativeScript:"☾",
      keywords:["det skjulte","transcendens"], semanticFields:["concept:hidden","element:water","place:duat"],
      correspondences:{element:"water",place:"duat"},
      canonicalMeaning:"Skyggesøsteren — det skjulte, drømmens side.", attestations:[] },
    set:      { slug:"set", name:"Set", nativeScript:"⚡",
      keywords:["kaos","nødvendig ødeleggelse"], semanticFields:["concept:chaos","element:fire","place:ombos"],
      correspondences:{element:"fire",place:"ombos"},
      canonicalMeaning:"Stormguden — nødvendig kaos, ørkenens vilje.", attestations:[] },
    maat:     { slug:"maat", name:"Ma'at", nativeScript:"⚖",
      keywords:["kosmisk orden","rettferd"], semanticFields:["concept:cosmic_order","element:air","place:duat"],
      correspondences:{element:"air",place:"duat"},
      canonicalMeaning:"Sannheten selv — fjæren hjerter veies mot.", attestations:[] },
  },

  // ═════ KELTISK / OGHAM ═════
  celtic: {
    beith:  { slug:"beith", name:"Beith", nativeScript:"ᚁ",
      keywords:["renselse","ny start"], semanticFields:["tree:birch","festival:imbolc","deity:brigid"],
      correspondences:{tree:"birch",festival:"imbolc",deity:"brigid"},
      canonicalMeaning:"Bjørken — renselse og begynnelse.", attestations:[] },
    luis:   { slug:"luis", name:"Luis", nativeScript:"ᚂ",
      keywords:["visjon","vern"], semanticFields:["tree:rowan","deity:brigantia","season:spring"],
      correspondences:{tree:"rowan",season:"spring"},
      canonicalMeaning:"Rognen — visjon og beskyttelse.", attestations:[] },
    fearn:  { slug:"fearn", name:"Fearn", nativeScript:"ᚃ",
      keywords:["orakel","mot"], semanticFields:["tree:alder","deity:bran","festival:beltane"],
      correspondences:{tree:"alder",deity:"bran"},
      canonicalMeaning:"Or — orakelets mot, veiledning.", attestations:[] },
    saille: { slug:"saille", name:"Saille", nativeScript:"ᚄ",
      keywords:["drøm","månesyklus"], semanticFields:["tree:willow","element:water","deity:cerridwen"],
      correspondences:{tree:"willow",element:"water",deity:"cerridwen"},
      canonicalMeaning:"Pil — måneintuisjon, drømmens flyt.", attestations:[] },
    nuin:   { slug:"nuin", name:"Nuin", nativeScript:"ᚅ",
      keywords:["forbindelse","verdenstre"], semanticFields:["tree:ash","element:air","deity:gwydion"],
      correspondences:{tree:"ash",element:"air",deity:"gwydion"},
      canonicalMeaning:"Asken — verdenstreet, forbindelse mellom lag.", attestations:[] },
    huath:  { slug:"huath", name:"Huath", nativeScript:"ᚆ",
      keywords:["fertilitet","portal"], semanticFields:["tree:hawthorn","festival:beltane","deity:olwen"],
      correspondences:{tree:"hawthorn",festival:"beltane"},
      canonicalMeaning:"Hagtornen — lidenskap og portalen over.", attestations:[] },
    duir:   { slug:"duir", name:"Duir", nativeScript:"ᚇ",
      keywords:["styrke","kongemakt"], semanticFields:["tree:oak","deity:dagda","realm:annwn"],
      correspondences:{tree:"oak",deity:"dagda",realm:"annwn"},
      canonicalMeaning:"Eiken — kongelig styrke, portal til Annwn.", attestations:[] },
    tinne:  { slug:"tinne", name:"Tinne", nativeScript:"ᚈ",
      keywords:["balanse","rettferd"], semanticFields:["tree:holly","deity:lugh","festival:lughnasadh"],
      correspondences:{tree:"holly",deity:"lugh",festival:"lughnasadh"},
      canonicalMeaning:"Kristtornen — krigerens balanse, rettferd.", attestations:[] },
    coll:   { slug:"coll", name:"Coll", nativeScript:"ᚉ",
      keywords:["poesi","inspirasjon"], semanticFields:["tree:hazel","deity:fionn","concept:wisdom"],
      correspondences:{tree:"hazel",deity:"fionn"},
      canonicalMeaning:"Hasselen — kunnskapens frukt, poetisk inspirasjon.", attestations:[] },
    quert:  { slug:"quert", name:"Quert", nativeScript:"ᚊ",
      keywords:["udødelighet","andre verden"], semanticFields:["tree:apple","deity:morgan","realm:avalon"],
      correspondences:{tree:"apple",realm:"avalon"},
      canonicalMeaning:"Eplet — Avalons frukt, den andre verden.", attestations:[] },
    muin:   { slug:"muin", name:"Muin", nativeScript:"ᚋ",
      keywords:["profeti","indre stemme"], semanticFields:["tree:vine","deity:mabon","festival:autumn_equinox"],
      correspondences:{tree:"vine",deity:"mabon"},
      canonicalMeaning:"Vinranken — profetisk rus, indre stemme.", attestations:[] },
    gort:   { slug:"gort", name:"Gort", nativeScript:"ᚌ",
      keywords:["spiral","dødsportal"], semanticFields:["tree:ivy","deity:cernunnos","festival:samhain"],
      correspondences:{tree:"ivy",deity:"cernunnos",festival:"samhain"},
      canonicalMeaning:"Eføyen — labyrintens spiral, portalen ned.", attestations:[] },
  },

  // ═════ PYTHAGOREAN ═════
  pythagorean: {
    unison:         { slug:"unison", name:"Unison", nativeScript:"1:1",
      keywords:["enhet","perfekt resonans"], semanticFields:["concept:unity","ratio:1:1","number:monad"],
      correspondences:{ratio:"1:1",polygon:"monad"},
      canonicalMeaning:"Monaden — perfekt resonans, det udelte.", attestations:[] },
    minor_second:   { slug:"minor_second", name:"Liten sekund", nativeScript:"16:15",
      keywords:["dissonans","motstand"], semanticFields:["concept:dissonance","ratio:16:15"],
      correspondences:{ratio:"16:15"},
      canonicalMeaning:"Den minste spenningen — sprekken hvor lyset slipper inn.", attestations:[] },
    major_second:   { slug:"major_second", name:"Stor sekund", nativeScript:"9:8",
      keywords:["retning","fremgang"], semanticFields:["concept:direction","ratio:9:8","number:dyad"],
      correspondences:{ratio:"9:8",polygon:"dyad"},
      canonicalMeaning:"Dyaden — bevegelse, steget fremover.", attestations:[] },
    minor_third:    { slug:"minor_third", name:"Liten ters", nativeScript:"6:5",
      keywords:["dybde","moll"], semanticFields:["concept:melancholy","ratio:6:5","number:triad"],
      correspondences:{ratio:"6:5",polygon:"triad"},
      canonicalMeaning:"Triaden i moll — emosjonell dybde.", attestations:[] },
    major_third:    { slug:"major_third", name:"Stor ters", nativeScript:"5:4",
      keywords:["glede","åpenhet"], semanticFields:["concept:joy","ratio:5:4","number:tetrad"],
      correspondences:{ratio:"5:4",polygon:"tetrad"},
      canonicalMeaning:"Tetraden — dur-tersens åpne glede.", attestations:[] },
    perfect_fourth: { slug:"perfect_fourth", name:"Perfekt kvart", nativeScript:"4:3",
      keywords:["fundament","hjemkomst"], semanticFields:["concept:foundation","ratio:4:3","number:pentad"],
      correspondences:{ratio:"4:3",polygon:"pentad"},
      canonicalMeaning:"Pentaden — fundamentets trygghet.", attestations:[] },
    tritone:        { slug:"tritone", name:"Tritonus", nativeScript:"45:32",
      keywords:["portal","terskel"], semanticFields:["concept:threshold","ratio:45:32"],
      correspondences:{ratio:"45:32"},
      canonicalMeaning:"Portalen — terskel mellom verdener.", attestations:[] },
    perfect_fifth:  { slug:"perfect_fifth", name:"Perfekt kvint", nativeScript:"3:2",
      keywords:["balanse","harmonia"], semanticFields:["concept:balance","ratio:3:2","number:hexad"],
      correspondences:{ratio:"3:2",polygon:"hexad"},
      canonicalMeaning:"Hexaden — kvinten, himmelens mest hellige intervall.", attestations:[] },
    minor_sixth:    { slug:"minor_sixth", name:"Liten sekst", nativeScript:"8:5",
      keywords:["nostalgi","skjønnhet i smerte"], semanticFields:["concept:longing","ratio:8:5","number:heptad"],
      correspondences:{ratio:"8:5",polygon:"heptad"},
      canonicalMeaning:"Heptaden — skjønnheten i avstand.", attestations:[] },
    major_sixth:    { slug:"major_sixth", name:"Stor sekst", nativeScript:"5:3",
      keywords:["generøsitet","varme"], semanticFields:["concept:generosity","ratio:5:3","number:ogdoad"],
      correspondences:{ratio:"5:3",polygon:"ogdoad"},
      canonicalMeaning:"Ogdoaden — varmens aksepterende gest.", attestations:[] },
    minor_seventh:  { slug:"minor_seventh", name:"Liten septim", nativeScript:"16:9",
      keywords:["uløst","forventning"], semanticFields:["concept:tension","ratio:16:9","number:ennead"],
      correspondences:{ratio:"16:9",polygon:"ennead"},
      canonicalMeaning:"Enneaden — det uløste, krever bevegelse.", attestations:[] },
    major_seventh:  { slug:"major_seventh", name:"Stor septim", nativeScript:"15:8",
      keywords:["transcendens","spirituell"], semanticFields:["concept:transcendence","ratio:15:8","number:dekad"],
      correspondences:{ratio:"15:8",polygon:"dekad"},
      canonicalMeaning:"Dekaden — ett halvt steg fra fullendelse.", attestations:[] },
  },

  // ═════ ELEMENTÆR ═════
  elemental: {
    fire:        { slug:"fire", name:"Ild", nativeScript:"🔥",
      keywords:["handling","transformasjon"], semanticFields:["element:fire","direction:south","being:salamander"],
      correspondences:{element:"fire",direction:"south"},
      canonicalMeaning:"Den rene ilden — handling og transformasjon.", attestations:[] },
    fire_water:  { slug:"fire_water", name:"Ild-Vann", nativeScript:"🌋",
      keywords:["emosjonell intensitet","damp"], semanticFields:["element:fire","element:water","phenomenon:volcano"],
      correspondences:{elements:["fire","water"]},
      canonicalMeaning:"Vulkanen — følelsens kokende intensitet.", attestations:[] },
    fire_air:    { slug:"fire_air", name:"Ild-Luft", nativeScript:"☀️",
      keywords:["inspirasjon","lys"], semanticFields:["element:fire","element:air","being:phoenix"],
      correspondences:{elements:["fire","air"]},
      canonicalMeaning:"Føniksen — inspirasjonens lys.", attestations:[] },
    fire_earth:  { slug:"fire_earth", name:"Ild-Jord", nativeScript:"🌾",
      keywords:["manifestasjon"], semanticFields:["element:fire","element:earth","phenomenon:magma"],
      correspondences:{elements:["fire","earth"]},
      canonicalMeaning:"Magmaen — ildens kropp, manifestasjonskraft.", attestations:[] },
    air:         { slug:"air", name:"Luft", nativeScript:"💨",
      keywords:["kommunikasjon"], semanticFields:["element:air","direction:east","being:sylph"],
      correspondences:{element:"air",direction:"east"},
      canonicalMeaning:"Den rene luften — kommunikasjon, pust.", attestations:[] },
    air_earth:   { slug:"air_earth", name:"Luft-Jord", nativeScript:"🌿",
      keywords:["vekst","pust"], semanticFields:["element:air","element:earth","concept:growth"],
      correspondences:{elements:["air","earth"]},
      canonicalMeaning:"Pusten som gir vekst — frøets første ånde.", attestations:[] },
    earth:       { slug:"earth", name:"Jord", nativeScript:"🌍",
      keywords:["stabilitet"], semanticFields:["element:earth","direction:north","being:gnome"],
      correspondences:{element:"earth",direction:"north"},
      canonicalMeaning:"Den rene jorden — stabilitet, forankring.", attestations:[] },
    water:       { slug:"water", name:"Vann", nativeScript:"🌊",
      keywords:["intuisjon"], semanticFields:["element:water","direction:west","being:undine"],
      correspondences:{element:"water",direction:"west"},
      canonicalMeaning:"Det rene vannet — intuisjon, flyt.", attestations:[] },
    water_earth: { slug:"water_earth", name:"Vann-Jord", nativeScript:"🧊",
      keywords:["stillhet","krystall"], semanticFields:["element:water","element:earth","phenomenon:ice"],
      correspondences:{elements:["water","earth"]},
      canonicalMeaning:"Krystallen — vannets stillhet bundet i form.", attestations:[] },
    water_air:   { slug:"water_air", name:"Vann-Luft", nativeScript:"🌙",
      keywords:["mystikk","tåke"], semanticFields:["element:water","element:air","phenomenon:mist"],
      correspondences:{elements:["water","air"]},
      canonicalMeaning:"Tåken — vannets pust, mystikkens slør.", attestations:[] },
    aether:      { slug:"aether", name:"Eter", nativeScript:"⚡",
      keywords:["akasha","det femte"], semanticFields:["element:aether","concept:akasha"],
      correspondences:{element:"aether"},
      canonicalMeaning:"Det femte elementet — akasha, som binder.", attestations:[] },
    earth_water: { slug:"earth_water", name:"Jord-Vann", nativeScript:"🌑",
      keywords:["gjenfødelse","myr"], semanticFields:["element:earth","element:water","phenomenon:bog"],
      correspondences:{elements:["earth","water"]},
      canonicalMeaning:"Myren — jordens vann, gjenfødelsens dyp.", attestations:[] },
  },

  // ═════ I CHING (generert fra heksagram via lookupHexagramSymbol) ═════
  iching: {
    // Tom. Se lookupHexagramSymbol() nedenfor.
  },
};

// ───────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────

export function noteToSlug(tradition, note) {
  return NOTE_TO_SLUG[tradition]?.[note] || null;
}

export function lookupSymbol(tradition, slug) {
  if (!slug) return null;
  const entry = EMBEDDED[tradition]?.[slug];
  if (!entry) return null;
  return { ...entry, _source: "embedded" };
}

export function lookupTriad(tradition, slugs) {
  return slugs.map(s => lookupSymbol(tradition, s));
  // Returnerer array med null-slots hvor slug mangler.
  // Motoren håndterer null via fallback til card.data.title.
}

/**
 * For I Ching, symboler er dynamiske (heksagram 1-64).
 * Kalles av buildContext når hexagram-objektet er tilgjengelig.
 */
export function lookupHexagramSymbol(hexagram) {
  if (!hexagram?.primary) return null;
  const p = hexagram.primary;
  return {
    slug: `hex_${p.num}`,
    name: p.name,
    nativeScript: null,
    keywords: [p.meaning],
    semanticFields: [`hexagram:${p.num}`, `trigram:${p.upperTrigram}`, `trigram:${p.lowerTrigram}`],
    correspondences: { upperTrigram: p.upperTrigram, lowerTrigram: p.lowerTrigram },
    canonicalMeaning: p.interpretation || p.meaning,
    attestations: [],
    _source: "embedded",
  };
}

// ── Confidence-helpers brukt av GEN[tradition] ──

export function confidenceVoice(confidence) {
  switch (confidence) {
    case "direct":        return { verb: "sier", hedge: "" };
    case "cognate":       return { verb: "gir ekko av", hedge: "beslektet med" };
    case "reconstructed": return { verb: null, hedge: null };
    default:              return { verb: "antyder", hedge: "" };
  }
}

export function canCite(attestation) {
  return attestation?.confidence !== "reconstructed"
         && Boolean(attestation?.originalQuote);
}
