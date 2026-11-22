(() => {
  "use strict";

  const FONT = "ExileGlyphs";
  // Keep the small brand seal inline so exports opened from disk remain self-contained.
  const BRAND_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
  <rect x=".6" y=".6" width="46.8" height="46.8" rx="8" fill="#843e2d" stroke="#cb9471" stroke-width="1.2"/>
  <g fill="none" stroke="#fff0d0" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
    <path d="M15.5 8.5H32.5L16.5 22.5H31.5Z"/>
    <path d="M14 21.5 8.5 27.5 24 41.5 39.5 27.5 34 21.5"/>
  </g>
  <circle cx="24" cy="30" r="2.65" fill="#fff0d0"/>
</svg>`;

  function getWords(ids) {
    if (!Array.isArray(ids) || !ids.length) {
      throw new RangeError("A challenge needs at least one glyph.");
    }
    const inventory = window.ExileReading.byId;
    return ids.map(id => {
      const token = inventory.get(id);
      if (!token) throw new Error("Unknown challenge word.");
      return token;
    });
  }

  // Wire constants are permanent and independent of UI language or dictionary order.
  // The high nibble of the first byte is the format version, the low nibble is
  // the language. A glyph is a 16-bit word: 4 class bits, 1 colour bit, 11 root bits.
  const LINK_CLASSES = "NVADQORLJPXM";
  const LINK_LANGUAGES = ["ko", "en", "ja"];
  const HEADER_V3 = 0x30;
  const GLYPH_CODE = /^[NVADQORLJPXM][BC][0-9A-Z]{2}$/;
  const V2_HASH = /^#b=2\.([0-9A-Z]+)\.(ko|en|ja)(?:&s=[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12})?$/;

  function idForCode(code) {
    const id = window.ExileCodes.byCode[code];
    return window.ExileReading.byId.has(id) && window.ExileCodes.byId[id] === code ? id : null;
  }

  function base64url(bytes) {
    return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function boardHash(ids, lang = "ko") {
    if (!Array.isArray(ids) || !ids.length) throw new RangeError("A challenge needs at least one glyph.");
    const language = LINK_LANGUAGES.indexOf(lang);
    if (language < 0) throw new RangeError("Unsupported reading language.");
    let bytes = String.fromCharCode(HEADER_V3 + language);
    for (const id of ids) {
      const code = window.ExileCodes.byId[id];
      if (!GLYPH_CODE.test(code) || idForCode(code) !== id) throw new Error("Unknown challenge word.");
      const packed = (LINK_CLASSES.indexOf(code[0]) << 12)
        | (code[1] === "C" ? 0x0800 : 0)
        | parseInt(code.slice(2), 36);
      bytes += String.fromCharCode(packed >> 8, packed & 255);
    }
    return "#b=" + base64url(bytes);
  }

  function createBoardLink(ids, lang = "ko") {
    if (!["http:", "https:"].includes(location.protocol)) throw new Error("A hosted board is needed to create a link.");
    const url = new URL("/", location.origin);
    url.hash = boardHash(ids, lang);
    return url.href;
  }

  function readBoardLink(hash = location.hash) {
    if (typeof hash !== "string") return null;
    const legacy = V2_HASH.exec(hash);
    if (legacy) {
      const [, packed, lang] = legacy;
      if (packed.length % 4 !== 0) return null;
      const ids = [];
      for (let i = 0; i < packed.length; i += 4) {
        const id = idForCode(packed.slice(i, i + 4));
        if (id === null) return null;
        ids.push(id);
      }
      return {ids, lang};
    }
    const match = /^#b=([A-Za-z0-9_-]+)$/.exec(hash);
    if (!match || match[1].length % 4 === 1) return null;
    const payload = match[1];
    const bytes = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    if (bytes.length < 3 || bytes.length % 2 !== 1 || base64url(bytes) !== payload) return null;
    const lang = LINK_LANGUAGES[bytes.charCodeAt(0) - HEADER_V3];
    if (!lang) return null;
    const ids = [];
    for (let i = 1; i < bytes.length; i += 2) {
      const value = (bytes.charCodeAt(i) << 8) | bytes.charCodeAt(i + 1);
      const prefix = LINK_CLASSES[value >> 12];
      const root = value & 0x07ff;
      if (!prefix || root >= 36 * 36) return null;
      const code = prefix + (value & 0x0800 ? "C" : "B") + root.toString(36).toUpperCase().padStart(2, "0");
      const id = idForCode(code);
      if (id === null) return null;
      ids.push(id);
    }
    return {ids, lang};
  }

  async function prepareFont(words) {
    const alphabet = [...new Set(words.map(word => word.glyph))].join("");
    const faces = await document.fonts.load('100px "' + FONT + '"', alphabet);
    if (!faces.length) throw new Error("The puzzle font could not be loaded.");
  }

  async function png(ids, lang = document.documentElement.lang) {
    const words = getWords(ids);
    const cardLabels = {
      ko: ["유배지 문자 카드", "팬 메이드", "문자 " + words.length + "개"],
      en: ["Exile glyph card", "FAN-MADE", words.length + (words.length === 1 ? " GLYPH" : " GLYPHS")],
      ja: ["流刑地の文字カード", "ファンメイド", words.length + " 文字"],
    };
    const [title, credit, count] = cardLabels[lang] || cardLabels.en;
    const seal = new Image();
    seal.src = "data:image/svg+xml," + encodeURIComponent(BRAND_MARK);
    const korean = lang === "ko";
    const labelFace = korean ? '"Pretendard", system-ui, sans-serif' : "system-ui, sans-serif";
    await Promise.all([
      prepareFont(words),
      seal.decode(),
      korean && document.fonts.load('400 24px "Pretendard"', title + credit + count).catch(() => []),
    ]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image export is unavailable.");
    const rowCapacity = words.length <= 48 ? 6 : Math.ceil(Math.sqrt(words.length * 1.4));
    const width = Math.max(1200, Math.min(3072, rowCapacity * 75 + 144));
    const margin = 72;
    const fieldTop = 142;
    const rowCount = Math.ceil(words.length / rowCapacity);
    const advance = Math.min(262, (width - 2 * margin) / Math.min(words.length, rowCapacity));
    // Keep one printable image within mobile canvas bounds. Every sign gets a position.
    const maxHeight = Math.min(4096, Math.floor(8388608 / width));
    const rowBudget = (maxHeight - fieldTop - 146) / rowCount;
    const signSize = Math.min(235, advance * .94, rowBudget * .87);
    if (signSize < 14) {
      const tooDense = new RangeError("This board is too long for a legible image. Share a link instead.");
      tooDense.code = "board-too-dense";
      throw tooDense;
    }
    const rowHeight = Math.min(signSize + 35, rowBudget);
    canvas.width = width;
    canvas.height = Math.ceil(fieldTop + rowCount * rowHeight + 146);

    const stone = ctx.createRadialGradient(width * .32, 0, 0, width * .56, canvas.height * .8, width * .75);
    stone.addColorStop(0, "#41453f");
    stone.addColorStop(.54, "#2d312d");
    stone.addColorStop(1, "#191c1b");
    ctx.fillStyle = stone;
    ctx.fillRect(0, 0, width, canvas.height);
    // A sparse repeat keeps the stone texture compressible in a phone-sized PNG.
    const grain = document.createElement("canvas");
    grain.width = grain.height = 24;
    const grainCtx = grain.getContext("2d");
    grainCtx.fillStyle = "rgba(238,225,183,0.05)";
    for (const [x, y] of [[2, 4], [11, 6], [5, 14], [19, 17]]) grainCtx.fillRect(x, y, 1, 1);
    ctx.fillStyle = ctx.createPattern(grain, "repeat");
    ctx.fillRect(0, 0, width, canvas.height);

    ctx.drawImage(seal, margin, 36, 52, 52);
    ctx.fillStyle = "#efdfbe";
    ctx.font = "italic 38px Georgia, serif";
    ctx.fillText("Exile Glyphs", margin + 69, 76);
    ctx.textAlign = "right";
    ctx.fillStyle = "#c6c6b4";
    ctx.font = "24px " + labelFace;
    ctx.fillText(count, width - margin, 73);
    ctx.fillStyle = "#65695e";
    ctx.fillRect(margin, 104, width - 2 * margin, 1);

    ctx.textAlign = "center";
    ctx.font = signSize + 'px "' + FONT + '"';
    ctx.fillStyle = "#f5e9c9";
    const metrics = ctx.measureText(words[0].glyph);
    const baselineOffset = (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
    for (let row = 0; row < rowCount; row++) {
      const line = words.slice(row * rowCapacity, (row + 1) * rowCapacity);
      const start = (width - line.length * advance) / 2;
      const baseline = fieldTop + (row + .5) * rowHeight + baselineOffset;
      line.forEach((word, column) => ctx.fillText(word.glyph, start + (column + .5) * advance, baseline));
    }

    const ruleY = canvas.height - 108;
    ctx.fillStyle = "#65695e";
    ctx.fillRect(margin, ruleY, width - 2 * margin, 1);
    ctx.fillStyle = "#f4eacf";
    ctx.textAlign = "left";
    ctx.font = "500 38px " + labelFace;
    ctx.fillText(title, margin, ruleY + 65);
    ctx.fillStyle = "#c6c6b4";
    ctx.textAlign = "right";
    ctx.font = "23px " + labelFace;
    ctx.fillText(credit, width - margin, ruleY + 63);
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Image export failed."));
    }, "image/png"));
  }

  function download(blob, filename = "exile-glyphs.png") {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  window.ExileShare = {boardHash, createBoardLink, readBoardLink, png, download};
})();
