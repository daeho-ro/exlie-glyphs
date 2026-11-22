const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeAuthor } = require('../social/board-link.js');
const { sharedBoard, shareUrl } = require('../social/share-response.js');

test('a byline fits 32 Unicode characters and normalizes consistently', () => {
  assert.equal(normalizeAuthor(null), '');
  assert.equal(normalizeAuthor(' \n \u200b '), '');
  assert.equal(normalizeAuthor(' Stella \u202e \t Jang   '), 'Stella Jang');
  assert.equal(normalizeAuthor('Cafe\u0301'), 'Café');
  assert.equal(normalizeAuthor('별'.repeat(30) + '🎶🎵🎼'), '별'.repeat(30) + '🎶🎵');
});

test('the page and its image carry the same byline and use distinct cache keys', () => {
  const key = 'MEABJFEDoBJxZOaEJWTmc0oh5gOg';
  const path = 'https://exile-glyphs.net/s/' + key;
  const name = '스텔라 & Stella <장>';
  const request = new Request(path + '?utm_source=chat&by=' + encodeURIComponent('  ' + name));
  const { author, ids } = sharedBoard({ request, params: { key } }, board => board);
  assert.equal(author, name);
  assert.equal(ids.length, 10);
  for (const suffix of ['', '/card.png']) {
    const signed = new URL(shareUrl(request, key, author, suffix));
    assert.equal(signed.searchParams.get('by'), name);
    assert.deepEqual([...signed.searchParams.keys()], ['by']);
    assert.equal(signed.pathname, '/s/' + key + suffix);
    assert.equal(shareUrl(request, key, '', suffix), path + suffix);
    assert.notEqual(signed.href, shareUrl(request, key, 'Another author', suffix));
  }
});
