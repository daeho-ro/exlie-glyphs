const test = require("node:test");
const assert = require("node:assert/strict");
global.window = {};
global.location = new URL("https://example.test/");
for (const name of ["assets/glyph-map", "assets/glyph-codes", "catalog", "examples", "engine", "share"]) {
  require("../dist/" + name + ".js");
}

const reader = window.ExileReading;
const share = window.ExileShare;
const codes = window.ExileCodes;

test("every selectable sign round-trips through its permanent code in all reading languages", () => {
  for (const word of reader.tokens) {
    const code = codes.byId[word.id];
    assert.match(code, /^[A-Z][BC][A-Z0-9]{2}$/);
    assert.equal(codes.byCode[code], word.id);
    for (const lang of reader.languages) {
      const {hash} = new URL(share.createBoardLink([word.id], lang));
      assert.deepEqual(share.readBoardLink(hash), {ids:[word.id], lang});
      assert.equal(reader.read([word.id],lang).words[0].label, word.labels[lang]);
    }
  }
});

test("only exact example sequences display an authored sentence", () => {
  for (const example of reader.examples) {
    assert.ok(example.ids.length > 0);
    for (const lang of reader.languages) {
      const value = reader.read(example.ids, lang);
      assert.deepEqual(value.words.map(word => word.id), example.ids);
      assert.equal(value.example.texts[lang], example.texts[lang]);
    }
  }
  const custom = ["spider","see","snake"];
  const reading = reader.read(custom,"ko");
  assert.equal(reading.example,null);
  assert.equal(reading.gloss,"거미 · 보다 · 뱀");
  assert.equal(reader.read(["purple--adjective","spider"],"en").gloss,"purple · spider");
});

test("new board links are deterministic, compact, and preserve every glyph and the language", () => {
  const ids = ["zero", "bird", "bird", "zero"];
  const url = new URL(share.createBoardLink(ids, "ja"));
  assert.equal(url.href, share.createBoardLink([...ids], "ja"));
  assert.equal(url.search, "");
  assert.equal(url.hash, "#b=MkAAAZkBmUAA");
  assert.equal(url.hash, share.boardHash(ids, "ja"));
  assert.deepEqual(share.readBoardLink(url.hash), {ids, lang:"ja"});
  assert.notEqual(url.hash, share.boardHash(ids, "ko"));
  assert.notEqual(url.hash, share.boardHash(["bird", "zero", "bird", "zero"], "ja"));
  const long = Array.from({length:12000}, (_, i) => ids[i % ids.length]);
  assert.deepEqual(share.readBoardLink(share.boardHash(long, "en")), {ids:long, lang:"en"});
  assert.throws(() => share.boardHash([], "ko"));
  assert.throws(() => share.boardHash(["unknown"], "ko"));
  assert.throws(() => share.boardHash(ids, "fr"));
});

test("previously shared v2 boards can be opened and canonicalized without their optional UUID", () => {
  const old = "#b=2.ABSMNBPSMBPLVBDIABLANBPSDBSR.ko";
  const result = {ids:["small", "person", "plural", "die", "large", "person", "with-spear"], lang:"ko"};
  for (const hash of [old, old + "&s=00000000-0000-4000-8000-000000000001"]) {
    const data = share.readBoardLink(hash);
    assert.deepEqual(data, result);
    assert.equal(share.boardHash(data.ids, data.lang), "#b=MCQGA6CzmRHmIv4DoDQL");
  }
});

test("share decoding rejects incomplete, ambiguous and unknown payloads", () => {
  const bytes = (...values) => "#b=" + Buffer.from(values).toString("base64url");
  const broken = [
    "#p=1.W10", "#b=1.0001.ko", "#b=2.00.en", "#b=2.NB??.ko", "#b=2.QB00.fr",
    "#b=2.QB00.ko&s=bad", "#b=", "#b=a", "#b=MCQ=", "#b=MAA%3D", "#b=MAAA&extra",
    bytes(0x30), bytes(0x30, 0x40), bytes(0x33, 0x40, 0x00), bytes(0x00, 0x40, 0x00),
    bytes(0x30, 0xf0, 0), bytes(0x30, 0x07, 0xff), bytes(0x30, 0x00, 0),
  ];
  const canonical = share.boardHash(["bird", "zero"], "ko");
  // Two-byte base64 tails have two unused bits. An alternate spelling is invalid.
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const tail = alphabet.indexOf(canonical.at(-1));
  broken.push(canonical.slice(0, -1) + alphabet[tail | 1]);
  for (const value of broken) assert.equal(share.readBoardLink(value), null, value);
});
