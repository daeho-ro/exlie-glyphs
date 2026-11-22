const test = require("node:test");
const assert = require("node:assert/strict");
global.window = {};
global.location = new URL("https://example.test/");
for (const name of ["assets/glyph-map", "assets/glyph-codes", "catalog", "examples", "engine", "board-links", "share"]) {
  require("../dist/" + name + ".js");
}

const reader = window.ExileReading;
const share = window.ExileShare;
const codes = window.ExileCodes;
const edge = import("../social/board-link.ts");
const shareKey = url => new URL(url).pathname.split("/")[2];

test("the browser and edge decode every selectable sign in all reading languages", async () => {
  const {parseShareKey} = await edge;
  const {selectableCodes, signCodepoints} = await import("../social/selectable-codes.js");
  assert.deepEqual(Object.keys(selectableCodes).sort(), reader.tokens.map(t => t.id).sort());
  for (const word of reader.tokens) {
    const code = codes.byId[word.id];
    assert.equal(signCodepoints[word.id], word.glyph.codePointAt(0));
    assert.match(code, /^[A-Z][BC][A-Z0-9]{2}$/);
    assert.equal(codes.byCode[code], word.id);
    for (const lang of reader.languages) {
      const key = shareKey(share.createBoardLink([word.id], lang));
      assert.equal(selectableCodes[word.id], code);
      assert.deepEqual(parseShareKey(key), {ids:[word.id], lang, total:1});
      assert.deepEqual(share.parseShareKey(key), parseShareKey(key));
      assert.deepEqual(share.readBoardAt(key, ""), {ids:[word.id], lang});
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

test("existing compact share keys keep their original bytes on every origin", () => {
  const ids = ["zero", "bird", "bird", "zero"];
  assert.equal(share.createBoardLink(ids, "ja"), "https://exile-glyphs.net/s/MkAAAZkBmUAA");
  for (const key of ["MEABJFEDoA", "MEABJFEDoBJxZOaEJWTmc0oh5gOg"]) {
    const board = share.readBoardAt(key, "");
    assert.ok(board);
    assert.equal(share.createBoardLink(board.ids, board.lang), "https://exile-glyphs.net/s/" + key);
  }
  assert.notEqual(share.createBoardLink(ids, "ko"), share.createBoardLink(ids, "ja"));
  assert.notEqual(share.createBoardLink(ids, "ko"), share.createBoardLink([...ids].reverse().concat("zero"), "ko"));
  assert.throws(() => share.createBoardLink([], "ko"));
  assert.throws(() => share.createBoardLink(["unknown"], "ko"));
  assert.throws(() => share.createBoardLink(ids, "fr"));
});

test("names occupy one path segment on hosted and standalone boards", () => {
  const ids = ["bird", "zero"];
  const {authorPath,readAuthor} = globalThis.ExileBoardLinks;
  const base = share.createBoardLink(ids, "ko");
  for (const name of ["Stella Jang", "Stella + Roy", "한/글", "?", "#", "%", ".", "..", "🎉"]) {
    const url = new URL(share.createBoardLink(ids, "ko", name));
    assert.equal(url.href, base + authorPath(name));
    assert.equal(url.pathname.split("/").length, 5);
    assert.equal(url.search + url.hash, "");
    assert.equal(readAuthor(url), name);
    assert.equal(readAuthor(url.href + "/card.png"), name);
  }
  assert.equal(share.createBoardLink(ids, "ko", "  Stella   Jang + Roy  "), base + "/by/Stella+Jang+%2B+Roy");
  assert.equal(share.createBoardLink(ids, "ko", "  "), base);
  assert.equal(readAuthor(base + "?by=Old"), "");
});

test("long paths fully restore the board on the edge and in the browser, without a fragment", async () => {
  const {parseShareKey} = await edge;
  const sequence = ["zero", "spider", "bird", "bird", "snake"];
  for (const count of [24, 2047, 2048, 2049, 12000, 32768]) {
    const ids = Array.from({length:count}, (_, i) => sequence[i % sequence.length]);
    const url = new URL(share.createBoardLink(ids, "en", "A B"));
    const key = shareKey(url);
    assert.equal(url.search + url.hash, "");
    assert.equal(url.pathname, "/s/" + key + "/by/A+B");
    assert.equal(Buffer.from(key, "base64url")[0], count > 2048 ? 0x41 : 0x31);
    if (count > 2048) assert.ok(key.length < 100, "Repeating long boards stay compact");
    assert.deepEqual(parseShareKey(key), {ids, lang:"en", total:count});
    assert.deepEqual(share.parseShareKey(key), parseShareKey(key));
    assert.deepEqual(share.readBoardAt(key, ""), {ids, lang:"en"});
  }
  let seed = 42;
  const random = Array.from({length:9000}, () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return reader.tokens[(seed >>> 0) % reader.tokens.length].id;
  });
  const limitError = {code:"board-link-too-long"};
  assert.throws(() => share.createBoardLink(random), limitError);
  assert.throws(() => share.createBoardLink(Array(32769).fill("zero")), limitError);
  const fits = random.slice(0, 4096);
  const key = shareKey(share.createBoardLink(fits, "ja"));
  assert.deepEqual(share.readBoardAt(key, ""), {ids:fits, lang:"ja"});
});

test("retired fragment links and incomplete or invalid paths cannot reopen or expand a board", async () => {
  const {parseShareKey} = await edge;
  const payload = (...bytes) => Buffer.from(bytes).toString("base64url");
  const key = shareKey(share.createBoardLink(["bird", "zero"], "ko"));
  const broken = [
    null, "", "ME", key + "=", key + "/", key + "%20", key + ".2049", "A".repeat(15001),
    payload(0x43, 0, 0), payload(0x30, 0x40), payload(0x30, 0xff, 0xff),
    payload(0x30, 0x07, 0xff), payload(0x40, 0xff, 0xff), payload(0x40, 0x40, 0x00),
    payload(0x40, 0x40, 0, 0xff, 0xff, 0, 0, 8, 1),
    payload(0x40, 0x40, 0, 0xff, 0xff, 0, 2, 8, 1),
    payload(0x40, 0x40, 0, 0xff, 0xff, 0, 1, 0x80, 0),
  ];
  const raw = Buffer.alloc(1 + 2049 * 2);
  raw[0] = 0x30;
  for (let i = 1; i < raw.length; i += 2) raw[i] = 0x40;
  broken.push(raw.toString("base64url"));
  for (const payload of broken) {
    assert.equal(share.parseShareKey(payload), null);
    assert.equal(parseShareKey(payload), null);
  }
  for (const hash of ["#b=" + key, "#b=2.QB00NBBDNBBDQB00.ko", "#b=2.QB00NBBDNBBDQB00.ko&s=00000000-0000-4000-8000-000000000001"]) {
    assert.equal(share.readBoardAt(null, hash), null);
    assert.equal(share.readBoardAt(key, hash), null);
  }
});
