// The code format belongs to the reader. The four characters identify the
// grammatical class, the colour modifier, and the underlying shape family.
(() => {
  'use strict';

  const prefixes = Object.freeze({
    noun: 'N', verb: 'V', adjective: 'A', adverb: 'D', pronoun: 'R',
    number: 'Q', ordinal: 'O', operator: 'L', conjunction: 'J',
    preposition: 'P', auxiliary: 'X', marker: 'M',
  });
  const classes: InflectedClass[] = ['noun', 'verb', 'adjective', 'adverb'];

  // Font family, permanent root code, bare root, attested IDs in class order.
  // A dash uses the font's family--part-of-speech ID for an inferred form.
  // Purple has a distinct visible shape, but its bare material is unknown.
  const families: [family: string, rootCode: string, root: string | null, classIds: string][] = [
    ["bird", "BD", "bird", "bird - - -"],
    ["spider", "SP", "spider", "spider - - -"],
    ["person", "PS", "person", "person - person-adj -"],
    ["fruit", "FT", "fruit", "fruit - - -"],
    ["cow", "CW", "cow", "cow - - -"],
    ["grass", "GR", "grass", "grass - - -"],
    ["snake", "SN", "snake", "snake - - -"],
    ["house", "HS", "house", "house dwell - -"],
    ["tree", "TE", "tree", "tree - - -"],
    ["arm", "AR", "arm", "arm - - -"],
    ["leg", "LG", "leg", "leg - - -"],
    ["head", "HD", "head", "head know - -"],
    ["tail", "TL", "tail", "tail - - -"],
    ["egg", "EG", "egg", "egg - - -"],
    ["road", "RD", "road", "road - - -"],
    ["here", "HR", "here", "here - - here-location"],
    ["live", "LV", "live", "life live - -"],
    ["die", "DI", "die", "death die dead -"],
    ["contest", "CT", "contest", "contest - - -"],
    ["you", "YU", "you", "you - - -"],
    ["way", "WY", "way", "way - - -"],
    ["trial", "TR", "trial", "trial - - -"],
    ["day", "DY", "day", "day - - -"],
    ["grid", "GD", "grid", "grid - grid-adj -"],
    ["number", "NM", "number", "number - number-adj -"],
    ["combine", "CB", "combine", "total combine - -"],
    ["constellation", "CN", "constellation", "constellation - - -"],
    ["shadow", "SH", "shadow", "shadow cover - -"],
    ["fire", "FR", "fire", "fire - - -"],
    ["charcoal", "CH", "charcoal", "charcoal - - -"],
    ["red", "FR", "fire", "red - - -"],
    ["blue", "SE", "sea", "blue - - -"],
    ["purple", "PU", null, "purple - - -"],
    ["sand", "SD", "sand", "sand - - -"],
    ["glass", "GL", "glass", "glass - - -"],
    ["sea", "SE", "sea", "sea - - -"],
    ["water", "WT", "water", "water - - -"],
    ["salt", "SA", "salt", "salt - - -"],
    ["clear", "GL", "glass", "clear - - -"],
    ["color", "CL", "color", "color - - -"],
    ["poison", "PN", "poison", "poison - - -"],
    ["scorpion", "SC", "scorpion", "scorpion - scorpion-adj -"],
    ["hole", "HL", "hole", "hole - - in-hole"],
    ["god", "GO", "god", "god - divine -"],
    ["sun", "SU", "sun", "sun - - -"],
    ["moon", "MO", "moon", "moon - - -"],
    ["daylight", "DL", "daylight", "daylight - - -"],
    ["night", "NT", "night", "night - - -"],
    ["hour", "HU", "hour", "hour - - -"],
    ["minute", "MN", "minute", "minute - - -"],
    ["earth", "EA", "earth", "earth - - -"],
    ["eat", "ET", "eat", "food eat edible -"],
    ["sound", "SO", "sound", "- sound - -"],
    ["make", "MK", "make", "- make - -"],
    ["have", "HV", "have", "- have - -"],
    ["become", "BC", "become", "- become - -"],
    ["cannot-negation", "NG", "cannot-negation", "- cannot-negation - -"],
    ["see", "EY", "see", "- see seeing -"],
    ["pass", "PA", "pass", "- pass - -"],
    ["win", "WN", "win", "- win - -"],
    ["subtract", "SB", "subtract", "- subtract - -"],
    ["turn", "TN", "turn", "- turn - -"],
    ["hear", "ER", "hear", "- hear - -"],
    ["small", "SM", "small", "- - small -"],
    ["below", "BL", "below", "- - lower below"],
    ["end", "ED", "end", "- - final end"],
    ["horizontal", "HZ", "horizontal", "- - horizontal -"],
    ["vertical", "VT", "vertical", "- - vertical -"],
    ["diagonal", "DG", "diagonal", "- - diagonal -"],
    ["large", "LA", "large", "- - large -"],
    ["black", "CH", "charcoal", "- - black -"],
    ["on", "UP", "on", "- - upper on"],
    ["left", "LF", "left", "- - left -"],
    ["right", "RT", "right", "- - right -"],
    ["with-spear", "SR", "with-spear", "- - - with-spear"],
    ["white", "SA", "salt", "white - - -"],
  ];

  // The independent signs have no productive set of four upper marks.
  // Ordinals use the same shape code as their corresponding cardinal.
  const independent: [id: string, pos: GlyphClass, root: string, rootCode: string][] = [
    ["can", "auxiliary", "can", "CA"],
    ["from", "preposition", "from", "FM"],
    ["two", "number", "two", "02"],
    ["zero", "number", "zero", "00"],
    ["four", "number", "four", "04"],
    ["and", "conjunction", "and", "AN"],
    ["eight", "number", "eight", "08"],
    ["plural", "marker", "plural", "PL"],
    ["unequal", "operator", "unequal", "NE"],
    ["then", "conjunction", "then", "TH"],
    ["one", "number", "one", "01"],
    ["or", "conjunction", "or", "OR"],
    ["first", "ordinal", "one", "01"],
    ["second", "ordinal", "two", "02"],
    ["sixth", "ordinal", "six", "06"],
    ["equal", "operator", "equal", "EQ"],
    ["five", "number", "five", "05"],
    ["six", "number", "six", "06"],
    ["seven", "number", "seven", "07"],
    ["three", "number", "three", "03"],
    ["nine", "number", "nine", "09"],
  ];
  const byId: Record<string, string> = Object.create(null);
  const byCode: Record<string, string> = Object.create(null);
  const descriptions: Partial<Record<string, Readonly<GlyphCodeDescription>>> = Object.create(null);

  function register(id: string, pos: GlyphClass, colour: boolean, root: string | null, rootCode: string) {
    const prefix = prefixes[pos];
    const code = prefix + (colour ? 'C' : 'B') + rootCode;
    if (!prefix || !/^[A-Z0-9]{2}$/.test(rootCode) || Object.hasOwn(byId, id) || Object.hasOwn(byCode, code)) {
      throw new Error('Duplicate or invalid glyph code for ' + id);
    }
    byId[id] = code;
    byCode[code] = id;
    descriptions[id] = Object.freeze({ pos, prefix, colour, root, rootCode });
  }

  for (const [family, rootCode, root, attestedIds] of families) {
    const ids = attestedIds.split(' ');
    classes.forEach((pos, index) => {
      const id = ids[index] === '-' ? family + '--' + pos : ids[index];
      // "You" carries the noun mark on the floor and is a pronoun in the lexicon.
      register(id, id === 'you' ? 'pronoun' : pos, family !== root, root, rootCode);
    });
  }
  for (const [id, pos, root, rootCode] of independent) register(id, pos, false, root, rootCode);
  window.ExileCodes = Object.freeze({
    version: 2, width: 4,
    byId: Object.freeze(byId), byCode: Object.freeze(byCode),
    describe: (id: string) => descriptions[id],
  });
})();
