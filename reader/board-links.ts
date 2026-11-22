// Shared by the static reader and the Pages preview functions.
(() => {
  'use strict';
  const siteOrigin = 'https://exile-glyphs.net';
  const classes = 'NVADQORLJPXM';
  const languages: ReaderLocale[] = ['ko', 'en', 'ja'];
  const shortVersion = 0x30, longVersion = 0x40;
  const shortLimit = 2048;
  // Leave room for the origin, a percent-encoded credit and the image suffix.
  const maxKeyLength = 15000;
  const maxGlyphs = 32768;
  const repeat = 0xffff;
  const base64url = (bytes: string) => btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const wordBytes = (word: number) => String.fromCharCode(word >> 8, word & 255);
  const readWord = (bytes: string, i: number) => (bytes.charCodeAt(i) << 8) | bytes.charCodeAt(i + 1);

  function normalizeAuthor(value: unknown) {
    if (typeof value !== 'string') return '';
    const name = value.normalize('NFC')
      .replace(/[\u0000-\u0008\u000e-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ud800-\udfff]/gu, '')
      .replace(/\s+/gu, ' ').trim();
    return Array.from(name).slice(0, 32).join('').trimEnd();
  }

  function authorPath(author: unknown) {
    const name = normalizeAuthor(author);
    if (!name) return '';
    // A trailing encoded space keeps dot-only names from becoming URL navigation.
    const segment = name === '.' || name === '..' ? name + '+' : encodeURIComponent(name).replace(/%20/g, '+');
    return '/by/' + segment;
  }

  function readAuthor(url: string | URL) {
    try {
      const path = new URL(url, siteOrigin).pathname;
      const match = /^\/s\/[A-Za-z0-9_-]+\/by\/([^/]+)(?:\/card\.png)?$/.exec(path);
      return match ? normalizeAuthor(decodeURIComponent(match[1].replace(/\+/g, ' '))) : '';
    } catch {
      return '';
    }
  }

  function tooLong() {
    return Object.assign(new RangeError('The board exceeds the share-link limit.'), {code: 'board-link-too-long'});
  }

  // A literal is one two-byte glyph. An unused glyph value starts a three-word
  // instruction: repeat <distance> <length>, including overlapping repeats.
  function encode(words: number[], language: number) {
    if (words.length <= shortLimit) {
      return base64url(String.fromCharCode(shortVersion + language) + words.map(wordBytes).join(''));
    }
    let bytes = String.fromCharCode(longVersion + language);
    const seen = new Map<number, number>();
    const seed = (i: number) => words[i] * 0x100000000 + words[i + 1] * 0x10000 + words[i + 2];
    for (let i = 0; i < words.length;) {
      const prior = i + 3 < words.length ? seen.get(seed(i)) : undefined;
      let count = 0;
      if (prior !== undefined) {
        while (i + count < words.length && words[prior + count] === words[i + count]) count++;
      }
      if (prior !== undefined && count >= 4) {
        bytes += wordBytes(repeat) + wordBytes(i - prior) + wordBytes(count);
      } else {
        bytes += wordBytes(words[i]);
        count = 1;
      }
      const end = i + count;
      for (; i < end; i++) {
        if (i + 2 < words.length) seen.set(seed(i), i);
      }
    }
    return base64url(bytes);
  }

  function create(entries: Iterable<readonly [id: string, code: string]>): BoardLinkCodec {
    const byId = new Map<string, number>();
    const byWord = new Map<number, string>();
    for (const [id, code] of entries) {
      const word = (classes.indexOf(code[0]) << 12) | (code[1] === 'C' ? 0x0800 : 0) | parseInt(code.slice(2), 36);
      byId.set(id, word);
      byWord.set(word, id);
    }

    function sharePath(ids: readonly string[], lang: ReaderLocale = 'ko') {
      if (!Array.isArray(ids) || !ids.length) throw new RangeError('A board needs at least one glyph.');
      if (ids.length > maxGlyphs) throw tooLong();
      const language = languages.indexOf(lang);
      if (language < 0) throw new RangeError('Unsupported reading language.');
      const words = ids.map(id => {
        const word = byId.get(id);
        if (word === undefined) throw new RangeError('Unknown board glyph.');
        return word;
      });
      const key = encode(words, language);
      if (key.length > maxKeyLength) throw tooLong();
      return '/s/' + key;
    }

    function parseShareKey(key: unknown): SharedBoard | null {
      if (typeof key !== 'string' || key.length < 4 || key.length > maxKeyLength ||
          key.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(key)) return null;
      const bytes = atob(key.replace(/-/g, '+').replace(/_/g, '/'));
      const header = bytes.charCodeAt(0);
      const long = header >= longVersion;
      const language = header - (long ? longVersion : shortVersion);
      if (!languages[language] || bytes.length % 2 !== 1) return null;
      if (!long && (bytes.length - 1) / 2 > shortLimit) return null;
      const words: number[] = [];
      for (let i = 1; i < bytes.length; i += 2) {
        const word = readWord(bytes, i);
        if (long && word === repeat) {
          if (i + 5 >= bytes.length) return null;
          const distance = readWord(bytes, i + 2), count = readWord(bytes, i + 4);
          if (!distance || distance > words.length || count < 4 || words.length + count > maxGlyphs) return null;
          for (let j = 0; j < count; j++) words.push(words[words.length - distance]);
          i += 4;
        } else {
          if (!byWord.has(word) || words.length >= maxGlyphs) return null;
          words.push(word);
        }
      }
      // Accept only one spelling, including base64 tail bits and repeat instructions.
      if (encode(words, language) !== key) return null;
      // Every literal and previous repeated word has passed the lookup above.
      return {ids: words.map(word => byWord.get(word)!), lang: languages[language], total: words.length};
    }

    function readBoardAt(key: unknown, hash = ''): BoardContents | null {
      if (hash) return null;
      const board = parseShareKey(key);
      return board ? {ids: board.ids, lang: board.lang} : null;
    }

    return {sharePath, parseShareKey, readBoardAt};
  }

  globalThis.ExileBoardLinks = Object.freeze({siteOrigin, create, normalizeAuthor, authorPath, readAuthor});
})();
