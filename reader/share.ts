(() => {
  "use strict";

  const FONT = "ExileGlyphs";
  const script = typeof document === "undefined" ? null : document.currentScript;
  const assetBase = script && "src" in script ? script.src : null;

  function getWords(ids: readonly string[]): ReadingToken[] {
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

  let linkCodec: BoardLinkCodec | undefined;
  function links() {
    return linkCodec ??= globalThis.ExileBoardLinks.create(
      window.ExileReading.tokens.map(({id}) => [id, window.ExileCodes.byId[id]])
    );
  }
  const parseShareKey = (key: unknown) => links().parseShareKey(key);
  const readBoardAt = (key: unknown, hash = location.hash) => links().readBoardAt(key, hash);

  function createBoardLink(ids: readonly string[], lang: ReaderLocale = "ko", author = "") {
    const { siteOrigin, authorPath } = globalThis.ExileBoardLinks;
    return new URL(links().sharePath(ids, lang) + authorPath(author), siteOrigin).href;
  }

  async function prepareFont(words: ReadingToken[]) {
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
  function textLines(ctx: CanvasRenderingContext2D, text: string, width: number) {
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

  function stoneBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
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

  function cardLayout(
    ctx: CanvasRenderingContext2D, words: ReadingToken[], locale: ReaderLocale,
    showReading: boolean, sentence: string, byline: string,
  ) {
    const columns = Math.min(words.length, words.length <= 48 ? 6 : Math.ceil(Math.sqrt(words.length * 1.4)));
    const width = Math.max(1200, Math.min(3072, columns * 75 + 144));
    const margin = 72, top = 136;
    const pitch = Math.min(252, (width - 2 * margin) / columns);
    const maxHeight = Math.min(4096, Math.floor(8388608 / width));
    const numRows = Math.ceil(words.length / columns);
    const sentenceSize = 32, sentenceStep = 44;
    ctx.font = '500 ' + sentenceSize + 'px ' + labelFace;
    const sentenceLines = sentence ? textLines(ctx, sentence, width - 2 * margin) : [];
    const bottom = 48 + (byline ? 40 : 0) + (sentenceLines.length ? 20 + sentenceLines.length * sentenceStep : 0);
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
      const linesByWord = new Map<string, string[]>();
      const rows = [];
      let height = top;
      for (let index = 0; index < words.length; index += columns) {
        const row = words.slice(index, index + columns);
        let labelRows = 0;
        if (showReading) for (const word of row) {
          if (!linesByWord.has(word.id)) {
            linesByWord.set(word.id, textLines(ctx, word.labels[locale], pitch * .91));
          }
          labelRows = Math.max(labelRows, linesByWord.get(word.id)!.length);
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
    throw Object.assign(new RangeError("This board is too long for a legible image. Share a link instead."), {
      code: "board-too-dense",
    });
  }

  async function png(ids: readonly string[], lang = document.documentElement.lang, showReading = false, author = "") {
    const words = getWords(ids);
    const reader = window.ExileReading;
    const locale = reader.languages.find(language => language === lang) ?? "en";
    const name = author ? globalThis.ExileBoardLinks.normalizeAuthor(author) : "";
    const byline = name ? "by " + name : "";
    const sentence = showReading ? (reader.read(ids, locale).example?.texts[locale] ?? "") : "";
    const count = {ko:"문자 " + words.length + "개", en:words.length + (words.length === 1 ? " glyph" : " glyphs"), ja:words.length + " 文字"}[locale];
    const labels = showReading ? [...new Set(words.map(word => word.labels[locale]))].join(" ") : "";
    const [brand] = await Promise.all([
      brandImage(),
      prepareFont(words),
      document.fonts.load('500 32px "Pretendard"', [count, labels, sentence || "", byline].join(" ")),
    ]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image export is unavailable.");
    const card = cardLayout(ctx, words, locale, showReading, sentence, byline);
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
          card.linesByWord.get(word.id)!.forEach((line, n) => {
            ctx.fillText(line, left + (i + .5) * card.pitch, row.y + card.size + card.labelGap + n * card.labelStep);
          });
        });
      }
    }
    ctx.fillStyle = "#ffedc8";
    ctx.font = "500 " + card.sentenceSize + "px " + labelFace;
    ctx.textBaseline = "top";
    card.sentenceLines.forEach((line, n) => ctx.fillText(line, card.width / 2, card.sentenceTop + n * card.sentenceStep));
    if (byline) {
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#cfccb9";
      ctx.font = "500 24px " + labelFace;
      ctx.fillText(byline, card.width - card.margin, card.height - 34, card.width - 2 * card.margin);
    }
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error("Image export failed."));
    }, "image/png"));
  }

  function download(blob: Blob, filename = "exile-glyphs.png") {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  window.ExileShare = {createBoardLink, parseShareKey, readBoardAt, png, download};
})();
