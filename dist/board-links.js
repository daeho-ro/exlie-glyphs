// Classic script for the file-based reader, also imported by the Pages Functions.
(() => {
  'use strict';
  const classes = 'NVADQORLJPXM';
  const languages = ['ko', 'en', 'ja'];
  const version = 0x30;
  const pathLimit = 2048;
  const previewSize = 24;
  const payloadLength = count => Math.ceil((1 + 2 * count) * 4 / 3);
  const v2Hash = /^#b=2\.([0-9A-Z]+)\.(ko|en|ja)(?:&s=[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-4[a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12})?$/;
  const base64url = bytes => btoa(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  function normalizeAuthor(value) {
    if (typeof value !== 'string') return '';
    const name = value.normalize('NFC')
      .replace(/[\u0000-\u0008\u000e-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ud800-\udfff]/gu, '')
      .replace(/\s+/gu, ' ').trim();
    return Array.from(name).slice(0, 32).join('').trimEnd();
  }

  function create(entries) {
    const byId = new Map(entries);
    const byCode = new Map(Array.from(byId, ([id, code]) => [code, id]));

    // The version and language share one byte. Each word takes two bytes for
    // its grammatical class, colour bit and permanent base-36 root number.
    function encode(ids, lang) {
      if (!Array.isArray(ids) || !ids.length) throw new RangeError('A board needs at least one glyph.');
      const language = languages.indexOf(lang);
      if (language < 0) throw new RangeError('Unsupported reading language.');
      let bytes = String.fromCharCode(version + language);
      for (const id of ids) {
        const code = byId.get(id);
        if (!code) throw new RangeError('Unknown board glyph.');
        const packed = (classes.indexOf(code[0]) << 12)
          | (code[1] === 'C' ? 0x0800 : 0) | parseInt(code.slice(2), 36);
        bytes += String.fromCharCode(packed >> 8, packed & 255);
      }
      return base64url(bytes);
    }

    function decode(payload) {
      if (payload.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/.test(payload)) return null;
      const bytes = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      if (bytes.length < 3 || bytes.length % 2 !== 1 || base64url(bytes) !== payload) return null;
      const lang = languages[bytes.charCodeAt(0) - version];
      if (!lang) return null;
      const ids = [];
      for (let i = 1; i < bytes.length; i += 2) {
        const packed = (bytes.charCodeAt(i) << 8) | bytes.charCodeAt(i + 1);
        const prefix = classes[packed >> 12], root = packed & 0x07ff;
        if (!prefix || root >= 36 * 36) return null;
        const code = prefix + (packed & 0x0800 ? 'C' : 'B') + root.toString(36).toUpperCase().padStart(2, '0');
        const id = byCode.get(code);
        if (!id) return null;
        ids.push(id);
      }
      return {ids, lang};
    }

    function readHash(hash) {
      if (typeof hash !== 'string' || !hash.startsWith('#b=')) return null;
      const old = v2Hash.exec(hash);
      if (!old) return decode(hash.slice(3));
      const [, packed, lang] = old;
      if (packed.length % 4 !== 0) return null;
      const ids = [];
      for (let i = 0; i < packed.length; i += 4) {
        const id = byCode.get(packed.slice(i, i + 4));
        if (!id) return null;
        ids.push(id);
      }
      return {ids, lang};
    }

    function sharePath(ids, lang = 'ko') {
      const payload = encode(ids, lang);
      if (ids.length <= pathLimit) return '/s/' + payload;
      const prefix = encode(ids.slice(0, previewSize), lang);
      return '/s/' + prefix + '.' + ids.length + '#b=' + payload;
    }

    function parseShareKey(key) {
      if (typeof key !== 'string' || !key.length || key.length > payloadLength(pathLimit)) return null;
      const dot = key.indexOf('.');
      if (dot < 0) {
        const board = decode(key);
        return board ? {...board, total: board.ids.length} : null;
      }
      // Bounds are checked before decoding any request-controlled data.
      if (dot !== payloadLength(previewSize)) return null;
      const suffix = key.slice(dot + 1);
      if (!/^[1-9][0-9]{0,15}$/.test(suffix)) return null;
      const total = Number(suffix);
      if (!Number.isSafeInteger(total) || total <= pathLimit || String(total) !== suffix) return null;
      const board = decode(key.slice(0, dot));
      return board && board.ids.length === previewSize ? {...board, total} : null;
    }

    function readBoardAt(key, hash) {
      if (key == null) return readHash(hash);
      const preview = parseShareKey(key);
      if (!preview) return null;
      if (hash === '' || hash === '#' || hash == null) {
        return preview.ids.length === preview.total ? {ids: preview.ids, lang: preview.lang} : null;
      }
      const board = readHash(hash);
      if (!board || board.lang !== preview.lang || board.ids.length !== preview.total) return null;
      return preview.ids.every((id, i) => id === board.ids[i]) ? board : null;
    }

    return {boardHash: (ids, lang = 'ko') => '#b=' + encode(ids, lang), readHash, sharePath, parseShareKey, readBoardAt};
  }

  globalThis.ExileBoardLinks = Object.freeze({create, normalizeAuthor});
})();
