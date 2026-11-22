// The board is a sequence of sign IDs. Only an exact example has a sentence reading.
(() => {
  'use strict';
  const languages = ['ko', 'en', 'ja'];
  const font = window.ExileGlyphMap;
  const composition = window.ExileComposition;
  const tokens = window.ExileCatalog.entries.flatMap((record) => {
    if (record.meaningKnown === false || record.sequence) return [];
    const model = record.modelFrom || record.id;
    const family = composition.byId[model] || model;
    const shape =
      font[record.shapeId || record.id] ??
      composition.forms[family]?.[record.pos]?.code;
    if (!Number.isInteger(shape)) return [];
    return [{ ...record, glyph: String.fromCodePoint(shape) }];
  });
  const byId = new Map(tokens.map((word) => [word.id, word]));
  const examples = (window.ExileExamples || [])
    .map(([zone, encoded, ko, en, ja]) => ({
      zone,
      ids: encoded.split(' '),
      texts: { ko, en, ja },
    }))
    .filter((example) => example.ids.every((id) => byId.has(id)));
  const exampleFor = new Map(
    examples.map((example) => [example.ids.join('|'), example]),
  );
  function read(ids, lang = 'ko') {
    const locale = languages.includes(lang) ? lang : 'ko';
    const words = ids.map((id) => {
      const word = byId.get(id);
      if (!word) throw new RangeError('Unknown glyph');
      return { ...word, label: word.labels[locale] };
    });
    return {
      words,
      gloss: words.map((word) => word.label).join(' · '),
      example: exampleFor.get(ids.join('|')) || null,
    };
  }
  window.ExileReading = {
    tokens,
    byId,
    examples,
    languages,
    read,
  };
  window.ExileEngine = { tokens };
})();
