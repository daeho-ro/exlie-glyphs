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
const edge = import("../social/board-link.js");
const shareKey = url => new URL(url).pathname.slice("/s/".length);

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
      assert.deepEqual(share.readBoardLink("#b=" + key), {ids:[word.id], lang});
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
  assert.equal(url.origin, location.origin);
  assert.equal(url.pathname, "/s/MkAAAZkBmUAA");
  assert.equal(url.hash, "");
  const hash = "#b=" + shareKey(url);
  assert.equal(hash, share.boardHash(ids, "ja"));
  assert.deepEqual(share.readBoardLink(hash), {ids, lang:"ja"});
  assert.notEqual(hash, share.boardHash(ids, "ko"));
  assert.notEqual(hash, share.boardHash(["bird", "zero", "bird", "zero"], "ja"));
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

test("large board paths expose 24 signs and retain the entire sequence in the fragment", async () => {
  const {parseShareKey} = await edge;
  const words = ["zero", "spider", "bird", "bird", "snake"];
  for (const count of [24, 2047, 2048, 2049, 12000]) {
    const ids = Array.from({length:count}, (_, i) => words[i % words.length]);
    const url = new URL(share.createBoardLink(ids, "en"));
    const key = shareKey(url), large = count > 2048;
    const preview = large ? ids.slice(0, 24) : ids;
    assert.deepEqual(parseShareKey(key), {ids:preview, lang:"en", total:count});
    assert.deepEqual(share.parseShareKey(key), parseShareKey(key));
    if (large) {
      assert.equal(key, share.boardHash(preview, "en").slice(3) + "." + count);
      assert.equal(url.hash, share.boardHash(ids, "en"));
      assert.ok(url.pathname.length < 90);
    } else {
      assert.equal(url.hash, "");
      assert.equal(key, share.boardHash(ids, "en").slice(3));
    }
    assert.deepEqual(share.readBoardLink(url.hash || "#b=" + key), {ids, lang:"en"});
  }
});

test("public share keys require canonical v3 payloads, selectable codes and a bounded prefix", async () => {
  const {parseShareKey} = await edge;
  const key = n => share.boardHash(Array(n).fill("one"), "ko").slice(3);
  const unsupported = Object.keys(codes.byId).find(id => !reader.byId.has(id));
  assert.ok(unsupported);
  const code = codes.byId[unsupported];
  const word = ("NVADQORLJPXM".indexOf(code[0]) << 12)
    | (code[1] === "C" ? 2048 : 0) | parseInt(code.slice(2), 36);
  const unsupportedKey = Buffer.from([48, word >> 8, word & 255]).toString("base64url");
  const bad = [null, "", "0", "2.QB00.ko", "2.QB00.en", "#b=" + key(1), key(1) + "/",
    key(1) + "=", key(1) + "%20", key(2049), "A".repeat(100000), unsupportedKey,
    key(23) + ".2049", key(25) + ".2049", key(24) + ".2048", key(24) + ".02049",
    key(24) + ".-2049", key(24) + ".+2049", key(24) + ".2049.1", key(24) + ".2e4",
    key(24) + ".2049\n", key(24) + ".9007199254740992", key(24) + ".99999999999999999"];
  for (const value of bad) {
    assert.equal(parseShareKey(value), null);
    assert.equal(share.parseShareKey(value), null);
  }
  assert.equal(parseShareKey(key(24) + "." + Number.MAX_SAFE_INTEGER).total, Number.MAX_SAFE_INTEGER);
  assert.throws(() => share.createBoardLink([unsupported], "ko"));
  assert.equal(share.readBoardLink("#b=" + unsupportedKey), null);
});

test("shared path and fragment must describe the same board", () => {
  const short = ["bird", "zero", "bird"];
  const key = shareKey(share.createBoardLink(short, "ja"));
  const shortHash = share.boardHash(short, "ja");
  for (const hash of ["", "#", shortHash])
    assert.deepEqual(share.readBoardAt(key, hash), {ids:short, lang:"ja"});
  assert.deepEqual(share.readBoardAt(null, shortHash), {ids:short, lang:"ja"});
  assert.equal(share.readBoardAt("", shortHash), null);
  assert.equal(share.readBoardAt(key, share.boardHash(short, "ko")), null);
  assert.equal(share.readBoardAt(key, share.boardHash(["bird", "bird", "zero"], "ja")), null);
  assert.equal(share.readBoardAt(key, "#malformed"), null);
  const ids = Array.from({length:12000}, (_, i) => short[i % 3]);
  const url = new URL(share.createBoardLink(ids, "en")), longKey = shareKey(url);
  assert.deepEqual(share.readBoardAt(longKey, url.hash), {ids, lang:"en"});
  for (const hash of ["", "#", "#b=oops", share.boardHash(ids, "ko"),
    share.boardHash(ids.slice(1), "en"), share.boardHash(["zero", ...ids.slice(1)], "en")])
    assert.equal(share.readBoardAt(longKey, hash), null);
});
