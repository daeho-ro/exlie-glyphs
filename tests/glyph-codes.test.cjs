const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const project = path.resolve(__dirname, '../dist');
const context = vm.createContext({ window: {} });
for (const file of ['assets/glyph-map.js', 'assets/glyph-codes.js', 'catalog.js', 'engine.js']) {
  vm.runInContext(readFileSync(path.join(project, file), 'utf8'), context);
}
const { ExileGlyphMap, ExileComposition, ExileCodes, ExileReading, ExileCatalog } = context.window;
const { byId, byCode, describe } = ExileCodes;

test('all drawable forms and selectable words have unique four-character codes', () => {
  const ids = new Set(Object.keys(ExileGlyphMap));
  for (const [family, forms] of Object.entries(ExileComposition.forms)) {
    for (const [pos, form] of Object.entries(forms)) ids.add(form.id || family + '--' + pos);
  }
  for (const token of ExileReading.tokens) ids.add(token.id);
  assert.deepEqual(new Set(Object.keys(byId)), ids);
  assert.equal(Object.keys(byCode).length, ids.size);
  for (const id of ids) {
    const code = byId[id];
    assert.match(code, /^[NVADQORLJPXM][BC][A-Z0-9]{2}$/);
    assert.equal(byCode[code], id);
    const data = describe(id);
    assert.equal(data.prefix + (data.colour ? 'C' : 'B') + data.rootCode, code);
    assert.ok(Object.isFrozen(data));
  }
  assert.equal(ExileCodes.version, 2);
  assert.equal(ExileCodes.width, 4);
  assert.equal(byCode['00'], undefined);
  assert.equal(byCode['01'], undefined);
});

test('changes of part of speech preserve the lower root', () => {
  for (const [family, forms] of Object.entries(ExileComposition.forms)) {
    const detail = describe(family);
    for (const [pos, form] of Object.entries(forms)) {
      const id = form.id || family + '--' + pos;
      assert.equal(describe(id).rootCode, detail.rootCode);
      assert.equal(describe(id).pos, id === 'you' ? 'pronoun' : pos);
    }
  }
  assert.equal(byId.food, 'NBET');
  assert.equal(byId.eat, 'VBET');
  assert.equal(byId.edible, 'ABET');
  assert.equal(byId.zero, 'QB00');
  assert.equal(byId.one, 'QB01');
  assert.equal(byId.first, 'OB01');
  assert.equal(byId.you, 'RBYU');
});

test('only colour derivatives have C; their material, if known, has the same root code', () => {
  const families = Object.keys(ExileComposition.forms);
  const colours = families.filter(family => ExileCatalog.get(family)?.color);
  assert.deepEqual(new Set(colours), new Set(['red', 'blue', 'purple', 'clear', 'white', 'black']));
  for (const family of families) {
    const material = ExileCatalog.get(family)?.colorOf;
    for (const [pos, form] of Object.entries(ExileComposition.forms[family])) {
      const detail = describe(form.id || family + '--' + pos);
      assert.equal(detail.colour, colours.includes(family));
      if (colours.includes(family)) assert.equal(detail.root, material);
      if (material) assert.equal(detail.rootCode, describe(material).rootCode);
    }
  }
  assert.equal(byId.fire, 'NBFR');
  assert.equal(byId.red, 'NCFR');
  assert.equal(byId['red--adjective'], 'ACFR');
  assert.equal(byId.charcoal, 'NBCH');
  assert.equal(byId['charcoal--adjective'], 'ABCH');
  assert.equal(byId['black--noun'], 'NCCH');
  assert.equal(byId.black, 'ACCH');
  assert.equal(describe('purple').root, null);
  assert.equal(byId.purple, 'NCPU');
  assert.equal(byId.color, 'NBCL');
});

test('dictionary entries expose their shared bare root and forms directly in every language', () => {
  vm.runInContext(readFileSync(path.join(project, 'dictionary.js'), 'utf8'), context);
  const dictionary = context.window.ExileDictionary;
  const rootGlyph = ExileComposition.rootGlyph;
  for (const lang of ['ko', 'en', 'ja']) {
    const home = dictionary.page(lang);
    assert.match(home, /type="search"/);
    assert.match(home, /data-entry="spider"/);
    assert.doesNotMatch(home, /<details|<select|data-dx-view/);
    assert.match(dictionary.search('violet'), /data-entry="purple"/);
    assert.doesNotMatch(dictionary.search('ABDI'), /data-entry=/);
    assert.match(dictionary.search('dead'), /data-entry="dead"/);
    const detail = dictionary.detail('dead');
    assert.equal(detail.title, ExileCatalog.get('dead').labels[lang]);
    assert.ok(detail.body.includes(rootGlyph('die')));
    assert.match(detail.body, /data-entry="death"/);
    assert.match(detail.body, /data-entry="die"/);
    assert.ok(dictionary.detail('first').body.includes(rootGlyph('one')));
    assert.ok(dictionary.detail('purple').body.includes(rootGlyph('purple')));
    assert.ok(dictionary.detail('red').body.includes(rootGlyph('fire')));
    assert.match(dictionary.detail('drinking-water').body, /data-entry="edible".*data-entry="water"/s);
    dictionary.search('');
  }
  assert.notEqual(rootGlyph('spider'), context.window.ExileReading.byId.get('spider').glyph);
  assert.equal(rootGlyph('fire'), rootGlyph('red--adjective'));
  assert.notEqual(rootGlyph('purple'), rootGlyph('fire'));
});
