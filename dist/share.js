(() => {
  "use strict";

  const FONT = "ExileGlyphs";
  const assetBase = typeof document !== "undefined" ? document.currentScript?.src : null;

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

  async function brandImage() {
    const symbol = document.getElementById("brand-symbol");
    const image = new Image();
    if (symbol) {
      // Serialize the header's own mark, keeping a local-file canvas origin-clean.
      const svg = new XMLSerializer().serializeToString(symbol);
      image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    } else if (assetBase && location.protocol !== "file:") {
      image.src = new URL("assets/inscription.svg", assetBase).href;
    } else {
      return null;
    }
    await image.decode();
    return image;
  }

  const labelFace = '"Pretendard", system-ui, sans-serif';
  function textLines(ctx, text, width) {
    const lines = [];
    let line = "";
    for (const word of text.split(/\s+/u)) {
      const joined = line ? line + " " + word : word;
      if (ctx.measureText(joined).width <= width) {
        line = joined;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function stoneBackground(ctx, width, height) {
    // Use the .plate gradient at 110deg and its two perpendicular grid lines.
    const dx = Math.sin(110 * Math.PI / 180), dy = -Math.cos(110 * Math.PI / 180);
    const span = (width * dx + height * dy) / 2;
    const stone = ctx.createLinearGradient(width / 2 - dx * span, height / 2 - dy * span,
      width / 2 + dx * span, height / 2 + dy * span);
    stone.addColorStop(0, "#0f1d1b");
    stone.addColorStop(.6, "#22312b");
    stone.addColorStop(1, "#18251e");
    ctx.fillStyle = stone;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * .5, height * 1.1);
    ctx.scale(width / 2, height * 1.1);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2 * .72);
    glow.addColorStop(0, "rgba(152,130,86,.119)");
    glow.addColorStop(1, "rgba(152,130,86,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-1, -1, 2, 1);
    ctx.restore();

    const scale = Math.min(3, width / 400), step = 32 * scale;
    ctx.fillStyle = "rgba(167,138,93,.064)";
    for (let x = 0; x < width; x += step) ctx.fillRect(x, 0, scale, height);
    for (let y = 0; y < height; y += step) ctx.fillRect(0, y, width, scale);
  }

  function cardLayout(ctx, words, locale, showReading, sentence) {
    const columns = Math.min(words.length, words.length <= 48 ? 6 : Math.ceil(Math.sqrt(words.length * 1.4)));
    const width = Math.max(1200, Math.min(3072, columns * 75 + 144));
    const margin = 72, top = 136;
    const pitch = Math.min(252, (width - 2 * margin) / columns);
    const maxHeight = Math.min(4096, Math.floor(8388608 / width));
    const numRows = Math.ceil(words.length / columns);
    const sentenceSize = 32, sentenceStep = 44;
    ctx.font = '500 ' + sentenceSize + 'px ' + labelFace;
    const sentenceLines = sentence ? textLines(ctx, sentence, width - 2 * margin) : [];
    const bottom = 48 + (sentenceLines.length ? 20 + sentenceLines.length * sentenceStep : 0);
    const available = maxHeight - top - bottom;
    const widest = Math.min(220, pitch * .87);
    let maxLabelSize = 34;
    if (showReading && locale === "en") {
      // Fit Latin words before wrapping a phrase onto another line.
      ctx.font = "500 34px " + labelFace;
      const terms = new Set(words.flatMap(word => word.labels.en.split(/\s+/)));
      for (const term of terms) {
        const termWidth = ctx.measureText(term).width;
        if (termWidth > 0) maxLabelSize = Math.min(maxLabelSize, 34 * pitch * .90 / termWidth);
      }
    }
    let size = Math.min(widest, available / numRows);
    while (size >= 14) {
      const labelSize = Math.max(10, Math.min(maxLabelSize, size * .21));
      const labelStep = Math.ceil(labelSize * 1.35);
      const rowGap = Math.max(6, size * .16);
      const labelGap = Math.max(4, size * .08);
      ctx.font = "500 " + labelSize + "px " + labelFace;
      const linesByWord = new Map();
      const rows = [];
      let height = top;
      for (let index = 0; index < words.length; index += columns) {
        const row = words.slice(index, index + columns);
        let labelRows = 0;
        if (showReading) for (const word of row) {
          if (!linesByWord.has(word.id)) {
            linesByWord.set(word.id, textLines(ctx, word.labels[locale], pitch * .91));
          }
          labelRows = Math.max(labelRows, linesByWord.get(word.id).length);
        }
        rows.push({words:row, y:height});
        height += size + (labelRows ? labelGap + labelRows * labelStep : 0) + rowGap;
      }
      if (height + bottom <= maxHeight) {
        return {width, height:Math.ceil(height + bottom), size, pitch, rows, labelGap,
          labelSize, labelStep, linesByWord, sentenceLines, sentenceStep, sentenceSize, sentenceTop:height + 20, margin};
      }
      if (size === 14) break;
      size = Math.max(14, size * Math.min(.97, available / (height - top)));
    }
    const error = new RangeError("This board is too long for a legible image. Share a link instead.");
    error.code = "board-too-dense";
    throw error;
  }

  async function png(ids, lang = document.documentElement.lang, showReading = false) {
    const words = getWords(ids);
    const reader = window.ExileReading;
    const locale = reader.languages.includes(lang) ? lang : "ko";
    const sentence = showReading ? reader.read(ids, locale).example?.texts[locale] : "";
    const count = {ko:"문자 " + words.length + "개", en:words.length + (words.length === 1 ? " glyph" : " glyphs"), ja:words.length + " 文字"}[locale];
    const labels = showReading ? [...new Set(words.map(word => word.labels[locale]))].join(" ") : "";
    const [brand] = await Promise.all([
      brandImage(),
      prepareFont(words),
      document.fonts.load('500 32px "Pretendard"', [count, labels, sentence || ""].join(" ")),
    ]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image export is unavailable.");
    const card = cardLayout(ctx, words, locale, showReading, sentence);
    canvas.width = card.width;
    canvas.height = card.height;
    stoneBackground(ctx, card.width, card.height);

    if (brand) ctx.drawImage(brand, card.margin, 36, 48, 48);
    ctx.fillStyle = "#f5e5c8";
    ctx.font = "italic 34px Georgia, serif";
    ctx.fillText("Exile Glyphs", card.margin + (brand ? 60 : 0), 71);
    ctx.textAlign = "right";
    ctx.fillStyle = "#cfccb9";
    ctx.font = "500 24px " + labelFace;
    ctx.fillText(count, card.width - card.margin, 68);

    ctx.textAlign = "center";
    ctx.font = card.size + 'px "' + FONT + '"';
    const metrics = ctx.measureText(words[0].glyph);
    const ascent = metrics.fontBoundingBoxAscent ?? card.size * .8;
    const descent = metrics.fontBoundingBoxDescent ?? card.size * .2;
    const baseline = (card.size + ascent - descent) / 2;
    for (const row of card.rows) {
      const left = (card.width - row.words.length * card.pitch) / 2;
      ctx.font = card.size + 'px "' + FONT + '"';
      ctx.fillStyle = "#efdbaf";
      ctx.textBaseline = "alphabetic";
      row.words.forEach((word, i) => {
        ctx.fillText(word.glyph, left + (i + .5) * card.pitch, row.y + baseline);
      });
      if (showReading) {
        ctx.fillStyle = "#f5e5c8";
        ctx.font = "500 " + card.labelSize + "px " + labelFace;
        ctx.textBaseline = "top";
        row.words.forEach((word, i) => {
          card.linesByWord.get(word.id).forEach((line, n) => {
            ctx.fillText(line, left + (i + .5) * card.pitch, row.y + card.size + card.labelGap + n * card.labelStep);
          });
        });
      }
    }
    ctx.fillStyle = "#ffedc8";
    ctx.font = "500 " + card.sentenceSize + "px " + labelFace;
    ctx.textBaseline = "top";
    card.sentenceLines.forEach((line, n) => ctx.fillText(line, card.width / 2, card.sentenceTop + n * card.sentenceStep));
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
