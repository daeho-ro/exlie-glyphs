const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAuthor } = require('../social/board-link.js');
const { sharedBoard, shareUrl } = require('../social/share-response.js');

const { onRequest: shareMiddleware } = require('../functions/s/_middleware.js');
const key = 'MEABJFEDoA';
const origin = 'https://exile-glyphs.net';
const base = '/s/' + key;

test('a byline fits 32 Unicode characters and normalizes consistently', () => {
  assert.equal(normalizeAuthor(null), '');
  assert.equal(normalizeAuthor(' \n \u200b '), '');
  assert.equal(normalizeAuthor(' Stella \u202e \t Jang   '), 'Stella Jang');
  assert.equal(normalizeAuthor('Cafe\u0301'), 'Café');
  assert.equal(normalizeAuthor('별'.repeat(30) + '🎶🎵🎼'), '별'.repeat(30) + '🎶🎵');
});

function get(path, params, respond = board => board) {
  const request = new Request(origin + path);
  return shareMiddleware({ request, next: () => sharedBoard({ request, params }, respond) });
}

test('a named page and its image share a byline and a canonical cache key', () => {
  for (const name of ['Stella Jang', '스텔라 & Stella <장>', 'A+B / 50%']) {
    const authorPath = globalThis.ExileBoardLinks.authorPath(name);
    if (name === 'Stella Jang') assert.equal(authorPath, '/by/Stella+Jang');
    for (const suffix of ['', '/card.png']) {
      const path = base + authorPath + suffix;
      const { author, ids } = get(path, { key, author: name });
      assert.equal(author, name);
      assert.deepEqual(ids, ['one', 'upper', 'person']);
      const request = new Request(origin + path);
      assert.equal(shareUrl(request, key, author, suffix), origin + path);
      assert.notEqual(shareUrl(request, key, 'Another author', suffix), origin + path);
      assert.equal(shareUrl(request, key, '', suffix), origin + base + suffix);
      assert.equal(get(base + suffix, { key }).author, '');
    }
  }
});

test('every share request carrying a query ends before lookup or rendering', () => {
  for (const prefix of [base, base + '/by/Stella+Jang', '/s/unknown/path']) {
    for (const suffix of ['', '/card.png']) {
      for (const query of ['?by=Stella+Jang', '?utm_source=chat', '?']) {
        const request = new Request(origin + prefix + suffix + query);
        const result = shareMiddleware({ request, next: () => assert.fail('continued') });
        assertGone(result);
      }
    }
  }
});

test('previously issued full paths open, including uncompressed repeated glyphs', () => {
  const repeated = Buffer.from('30' + '4001'.repeat(5), 'hex').toString('base64url');
  for (const [key, count] of [['MEABJFEDoA', 3], ['MEABJFEDoBJxZOaEJWTmc0oh5gOg', 10], [repeated, 5]]) {
    for (const authorPath of ['', '/by/Stella+Jang']) {
      for (const suffix of ['', '/card.png']) {
        const board = get('/s/' + key + authorPath + suffix, { key });
        assert.equal(board.ids.length, count);
        assert.equal(board.author, authorPath ? 'Stella Jang' : '');
      }
    }
  }
});

test('long fragment-dependent previews are gone and malformed keys still return 404', () => {
  const prefix = Buffer.from('30' + '4001'.repeat(24), 'hex').toString('base64url');
  const key = prefix + '.2049';
  for (const suffix of ['', '/card.png', '/by/Stella+Jang', '/by/Stella+Jang/card.png']) {
    assertGone(get('/s/' + key + suffix, { key }));
  }
  for (const unknown of ['wrong', 'Mbad', 'M', prefix + '.2048', prefix + '.bad']) {
    assert.equal(get('/s/' + unknown, { key: unknown }).status, 404);
  }
});

test('expired documents explain the outcome and offer a link home', async () => {
  for (const [preference, lang, copy] of [
    ['en;q=0.5, ko-KR', 'ko', '만료된 공유 링크입니다'],
    ['ja-JP, en;q=0.8', 'ja', 'この共有リンクは期限切れです'],
    ['de-DE', 'en', 'This share link has expired'],
  ]) {
    const request = new Request(origin + base + '?by=name', { headers: { 'Accept-Language': preference } });
    const result = shareMiddleware({ request, next: () => assert.fail('continued') });
    assertGone(result);
    assert.equal(result.headers.get('Content-Language'), lang);
    const html = await result.text();
    assert.ok(html.includes(copy) && html.includes('<a href="/">'));
    assert.doesNotMatch(html, /refresh|<script/i);
  }
  for (const [suffix, method] of [['/card.png', 'GET'], ['', 'HEAD']]) {
    const request = new Request(origin + base + suffix + '?by=name', { method });
    const result = shareMiddleware({ request, next: () => assert.fail('continued') });
    assertGone(result);
    assert.equal(await result.text(), '');
  }
});

function assertGone(response) {
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(response.headers.get('Location'), null);
}
