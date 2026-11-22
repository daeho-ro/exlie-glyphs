import {HEIGHT, MAX_CELLS, placement, WIDTH} from './card-layout.js';

const crcTable=Uint32Array.from({length:256}, (_,i)=>{
  let value=i;
  for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);
  return value;
});
function chunk(type, data) {
  const out=new Uint8Array(12+data.length), dv=new DataView(out.buffer);
  dv.setUint32(0,data.length);
  for(let i=0;i<4;i++)out[4+i]=type.charCodeAt(i);
  out.set(data,8);
  let crc=0xffffffff;
  for(let i=4;i<out.length-4;i++)crc=(crc>>>8)^crcTable[(crc^out[i])&255];
  dv.setUint32(out.length-4,crc^0xffffffff);
  return out;
}
const signature=new Uint8Array([137,80,78,71,13,10,26,10]);
const ihdr=new Uint8Array(13), dims=new DataView(ihdr.buffer);
dims.setUint32(0,WIDTH);
dims.setUint32(4,HEIGHT);
ihdr.set([8,3],8); // 8 bits per indexed pixel, one filtering byte per row.

export function createBoardRenderer(art) {
  const bytes=new Uint8Array(art), header=new DataView(art);
  const metaEnd=8+header.getUint32(0);
  const sprites=JSON.parse(new TextDecoder().decode(bytes.subarray(8,metaEnd)));
  const paletteEnd=metaEnd+header.getUint32(4);
  const rowBytes=WIDTH+1, artStart=paletteEnd+rowBytes*HEIGHT;
  const background=bytes.subarray(paletteEnd,artStart);

  function draw(pixels, key, x, y) {
    const sprite=sprites[key];
    if(!sprite) throw new RangeError('Unrecognized preview sign');
    const [,height,start]=sprite;
    let offset=artStart+start;
    for(let row=0;row<height;row++){
      const count=bytes[offset++], left=(y+row)*rowBytes+1+x;
      for(let i=0;i<count;i++){
        const dest=left+bytes[offset++], width=bytes[offset++], shade=bytes[offset++];
        pixels.fill(shade,dest,dest+width);
      }
    }
  }

  function drawCount(pixels,total,lang) {
    const digits=Array.from(String(total));
    const words=lang==='ko'?['문자',' ',...digits,'개']:lang==='ja'?['×',' ',...digits]:
      [...digits,' ',total===1?'glyph':'glyphs'];
    const width=word=>word===' '?7:sprites['label/'+word][0]+2;
    let x=1106-words.reduce((sum,word)=>sum+width(word),0);
    for(const word of words){
      if(word!==' ')draw(pixels,'label/'+word,x,91);
      x+=width(word);
    }
  }

  const fixed=[signature,chunk('IHDR',ihdr),chunk('PLTE',bytes.subarray(metaEnd,paletteEnd))];
  const end=chunk('IEND',new Uint8Array());


  return async function renderBoardPng({ids,lang='en',total=ids?.length}) {
    if(!Array.isArray(ids)||!Number.isSafeInteger(total)||total<1)throw new RangeError('Invalid preview size');
    const truncated=total>MAX_CELLS;
    const shown=truncated?MAX_CELLS-1:total;
    if(ids.length<shown)throw new RangeError('Insufficient preview signs');
    const visible=ids.slice(0,shown);
    if(truncated)visible.push('…');
    const pixels=background.slice();
    placement(visible.length).forEach(({x,y,size},i)=>draw(pixels,size+'/'+visible[i],x,y));
    drawCount(pixels,total,lang);
    const stream=new Blob([pixels]).stream().pipeThrough(new CompressionStream('deflate'));
    const compressed=new Uint8Array(await new Response(stream).arrayBuffer());
    const parts=[...fixed,chunk('IDAT',compressed),end];
    const out=new Uint8Array(parts.reduce((length,part)=>length+part.length,0));
    let cursor=0;
    for(const part of parts){out.set(part,cursor);cursor+=part.length;}
    return out;
  };
}
