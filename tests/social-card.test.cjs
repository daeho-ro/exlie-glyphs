const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.join(__dirname, '..');
const renderer = Promise.all([
  import('../social/card-raster.js'),
  fs.readFile(path.join(root, 'social/assets/board-art.bin')),
  fs.readFile(path.join(root, 'social/assets/author-glyphs.bin')),
]).then(([{createBoardRenderer}, data, authors]) => createBoardRenderer(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  authors.buffer.slice(authors.byteOffset, authors.byteOffset + authors.byteLength),
));

function pixels(png) {
  const bytes = Buffer.from(png);
  assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
  const chunks = [];
  for(let offset=8;offset<bytes.length;){
    const length=bytes.readUInt32BE(offset);
    if(bytes.toString('ascii',offset+4,offset+8)==='IDAT')chunks.push(bytes.subarray(offset+8,offset+8+length));
    offset+=length+12;
  }
  return zlib.inflateSync(Buffer.concat(chunks));
}

test('PNG retains empty slots and repeated signs in their original positions', async () => {
  const render=await renderer;
  const {placement} = await import('../social/card-layout.js');
  const image=pixels(await render({ids:['zero','spider','zero','spider'],lang:'ko'}));
  const masks=placement(4).map(({x,y,size})=>{
    const rows=[];
    for(let j=0;j<size;j++)rows.push(image.subarray((j+y)*1201+1+x,(j+y)*1201+1+x+size));
    return Buffer.concat(rows);
  });
  assert.ok(masks[0].every(pixel=>pixel===0));
  assert.deepEqual(masks[0],masks[2]);
  assert.deepEqual(masks[1],masks[3]);
  assert.ok(masks[1].some(pixel=>pixel>0));
});

test('long previews display the first 23 signs, ellipsis and the full, localized count', async () => {
  const render=await renderer;
  const ids=Array(24).fill('bird');
  const long=(overrides={})=>render({ids,total:1000,...overrides});
  // The last visible position always contains the ellipsis, even if a full board was passed.
  assert.deepEqual(await long(),await long({ids:[...ids.slice(0,23),'spider']}));
  assert.notDeepEqual(await long(),await long({ids:['zero',...ids.slice(1)]}));
  assert.notDeepEqual(await long(),await long({total:1001}));
  assert.deepEqual(await long(),await long({lang:'en'}));
  assert.notDeepEqual(await long({lang:'ko'}),await long({lang:'ja'}));
  await assert.rejects(long({ids:ids.slice(0,22)}),RangeError);
  await assert.rejects(render({ids:['missing']}),RangeError);
});

test('an optional author appears only in the footer of the PNG', async () => {
  const render = await renderer;
  const board = {ids: ['bird', 'zero', 'bird'], lang: 'ko'};
  const original = await render(board);
  assert.deepEqual(await render({...board, author: ''}), original);
  assert.deepEqual(await render({...board, author: '  '}), original);
  const baseline = pixels(original);
  const bylineTop = 535 * 1201;
  const bylineBottom = 583 * 1201;
  for (const author of ['Stella Jang', '스텔라장', '山田さん', 'Élodie']) {
    const image = pixels(await render({...board, author}));
    assert.deepEqual(image.subarray(0, bylineTop), baseline.subarray(0, bylineTop));
    assert.deepEqual(image.subarray(bylineBottom), baseline.subarray(bylineBottom));
    assert.notDeepEqual(image.subarray(bylineTop, bylineBottom), baseline.subarray(bylineTop, bylineBottom));
    // Changing a single letter in each script changes its visible ink.
    const replacement = Array.from(author).slice(0, -1).join('') + '□';
    assert.notDeepEqual(image, pixels(await render({...board, author: replacement})));
  }
  assert.deepEqual(await render({...board, author: 'Élodie'}), await render({...board, author: 'E\u0301lodie'}));
});

test('the widest supported names fit inside both footer margins', async () => {
  const render = await renderer;
  const board = {ids: ['bird']};
  const plain = pixels(await render(board));
  const wide = pixels(await render({...board, author: '㎯'.repeat(32)}));
  let left = 1200, right = 0;
  for (let i = 0; i < plain.length; i++) {
    if (plain[i] === wide[i]) continue;
    const x = i % 1201 - 1;
    const y = Math.floor(i / 1201);
    assert.ok(x >= 90 && x < 1106 && y >= 535 && y < 583, `Unexpected ink at ${x}, ${y}`);
    left = Math.min(left, x);
    right = Math.max(right, x);
  }
  assert.ok(right - left > 900, 'The whole name should run across the footer');
});
