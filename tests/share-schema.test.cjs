const test = require('node:test');
const assert = require('node:assert/strict');
const { boardSchemaScript } = require('../social/share-schema.ts');

test('shared page JSON-LD preserves an optional free-text credit inside one script', () => {
  const url = 'https://exile-glyphs.net/s/MEABJFEDoA';
  const fields = {
    url, title: '문자판', lang: 'ko', description: '문자판 풀이',
    image: url + '/card.png', imageAlt: '문자판 이미지',
  };
  for (const author of ['', 'A </script> & "장"']) {
    const script = boardSchemaScript({ ...fields, author });
    const json = /^<script type="application\/ld\+json">([^<]+)<\/script>$/.exec(script)?.[1];
    assert.ok(json);
    const schema = JSON.parse(json);
    assert.equal(schema['@type'], 'WebPage');
    assert.equal(schema.url, url);
    assert.equal(schema.inLanguage, fields.lang);
    assert.equal(schema.primaryImageOfPage.contentUrl, fields.image);
    assert.equal(schema.creditText, author ? 'by ' + author : undefined);
  }
});
