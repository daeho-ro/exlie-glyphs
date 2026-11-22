/* Local shape matching for a single, approximately straight line of glyphs. */
(() => {
  "use strict";
  type Span = [number, number];
  interface InkBox { x0: number; x1: number; y0: number; y1: number; n: number }
  interface Component extends InkBox { x: number; y: number; pixels: Int32Array }
  type Features = NonNullable<ReturnType<typeof feature>>;
  interface Template { id: string; features: Features; tip: number | null }
  interface HorizontalRow { h: number; baseline: number; weight: number; geometry: OcrLine }
  const SIZE = 40;
  const nextFrame = () => new Promise<void>(resolve => setTimeout(resolve, 0));
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  function surface(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    return canvas;
  }
  function sizeOf(img: OcrImage): [number, number] {
    if ('naturalWidth' in img) return [img.naturalWidth || img.width, img.naturalHeight || img.height];
    if ('videoWidth' in img) return [img.videoWidth || img.width, img.videoHeight || img.height];
    return [img.width, img.height];
  }
  function context2d(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    if (!ctx) throw new Error('A 2D canvas is required to read glyphs');
    return ctx;
  }

  function maskOf(canvas: HTMLCanvasElement, opposite=false) {
    const w = canvas.width, h = canvas.height, n = w * h;
    const data = context2d(canvas).getImageData(0,0,w,h).data;
    const gray = new Uint8Array(n), histogram = new Uint32Array(256);
    let samples=0;
    for (let i=0; i<n; i++) {
      if(data[4*i+3]<250) continue;
      gray[i] = (data[4*i]*77 + data[4*i+1]*150 + data[4*i+2]*29) >> 8;
      histogram[gray[i]]++; samples++;
    }
    let median=0, total=0;
    while (median<255 && total+histogram[median]<samples/2) total+=histogram[median++];
    // Ink can be much lighter than a medium-grey card. Compare both tails
    // with the dominant background instead of assuming all dark paper is black.
    let low=0,high=255,lowTail=0,highTail=0;
    while(low<median&&lowTail+histogram[low]<samples*.008)lowTail+=histogram[low++];
    while(high>median&&highTail+histogram[high]<samples*.008)highTail+=histogram[high--];
    const dark=median-low,light=high-median;
    const lightInk=light>Math.max(28,dark*1.55)||(!(dark>Math.max(28,light*1.55))&&median<80);
    const invert=opposite?!lightInk:lightInk;
    const stride=w+1, sum=new Uint32Array((h+1)*stride);
    const coverage=samples===n?null:new Uint32Array(sum.length);
    for (let y=0;y<h;y++) {
      let row=0, valid=0;
      for (let x=0;x<w;x++) {
        const i=y*w+x;
        if(data[4*i+3]>=250) {if (invert) gray[i]=255-gray[i];row+=gray[i];valid++;}
        const index=(y+1)*stride+x+1;
        sum[index]=sum[index-stride]+row;
        if(coverage) coverage[index]=coverage[index-stride]+valid;
      }
    }
    const bits=new Uint8Array(n), r=clamp(Math.round(Math.min(w,h)*0.13),7,23);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
      if(coverage&&data[(y*w+x)*4+3]<250) continue;
      const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w,x+r+1),y1=Math.min(h,y+r+1);
      const a=y0*stride+x0,b=y0*stride+x1,c=y1*stride+x0,d=y1*stride+x1;
      const pixels=coverage?coverage[d]-coverage[c]-coverage[b]+coverage[a]:(x1-x0)*(y1-y0);
      const mean=(sum[d]-sum[c]-sum[b]+sum[a])/pixels;
      bits[y*w+x]=mean-gray[y*w+x] > Math.max(13,mean*.095) ? 1 : 0;
    }
    return bits;
  }

  function connected(bits: Uint8Array, w: number, h: number): Component[] {
    const seen=new Uint8Array(bits.length), q=new Int32Array(bits.length), groups=[];
    for (let start=0;start<bits.length;start++) {
      if (!bits[start] || seen[start]) continue;
      let end=1, x0=w,y0=h,x1=0,y1=0,sx=0,sy=0;
      seen[start]=1; q[0]=start;
      for (let p=0;p<end;p++) {
        const i=q[p], x=i%w, y=Math.floor(i/w);
        x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);sx+=x;sy+=y;
        for (let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++) for (let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++) {
          const j=yy*w+xx;
          if (bits[j] && !seen[j]) {seen[j]=1;q[end++]=j;}
        }
      }
      groups.push({x0,x1,y0,y1,x:sx/end,y:sy/end,n:end,pixels:q.slice(0,end)});
    }
    return groups;
  }
  function clean(bits: Uint8Array, w: number, h: number) {
    const kept=new Uint8Array(bits.length);
    for (const c of connected(bits,w,h)) {
      const cw=c.x1-c.x0+1,ch=c.y1-c.y0+1;
      const crossesStrip=c.y0===0&&c.y1===h-1;
      if (c.n<Math.max(3,h*h*.0005) || cw>h*1.9 || (ch>.97*h && cw>h*.65) || (crossesStrip&&cw<h*.12)) continue;
      for (const i of c.pixels) kept[i]=1;
    }
    return kept;
  }
  function bounds(bits: Uint8Array, w: number, h: number,xa=0,xb=w,ya=0,yb=h) {
    let x0=xb,y0=yb,x1=-1,y1=-1,n=0;
    for (let y=ya;y<yb;y++) for (let x=xa;x<xb;x++) if (bits[y*w+x]) {
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);n++;
    }
    return n ? {x0,x1,y0,y1,n} : null;
  }
  function emptyFrame(bits: Uint8Array, stride: number, box: InkBox) {
    const w=box.x1-box.x0+1,h=box.y1-box.y0+1;
    if(w<12||h<12||w/h<.7||w/h>1.6||box.n>w*h*.22)return false;
    const border=Math.max(2,Math.round(Math.min(w,h)*.075));
    const sides=[0,0,0,0];
    let middle=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      if(!bits[(box.y0+y)*stride+box.x0+x])continue;
      const left=x<border,right=x>=w-border,top=y<border,bottom=y>=h-border;
      if(!(left||right||top||bottom)) middle++;
      if(left)sides[0]++;if(right)sides[1]++;if(top)sides[2]++;if(bottom)sides[3]++;
    }
    return middle<=box.n*.04&&Math.min(sides[0],sides[1])>h*.68&&Math.min(sides[2],sides[3])>w*.68;
  }
  // Recover interior empty slots only when most observed neighbors are one
  // pitch apart and every ink span agrees with one regularly spaced grid.
  function interiorBlanks(spans: Span[]) {
    if (spans.length < 5) return spans;
    const centers=spans.map(([lo,hi])=>(lo+hi)/2);
    const gaps=centers.slice(1).map((x,i)=>x-centers[i]);
    const ordered=gaps.slice().sort((a,b)=>a-b);
    const median=ordered[Math.floor((ordered.length-1)/2)];
    const steps=gaps.map(g=>Math.round(g/median));
    const neighbors=steps.filter(s=>s===1).length;
    if(neighbors < Math.max(3,gaps.length*.6) || neighbors===gaps.length ||
       steps.some(s=>s<1 || s>neighbors))return spans;
    const pitch=(centers[centers.length - 1]-centers[0])/steps.reduce((s,n)=>s+n,0);
    const tolerance=1+pitch*.105;
    let slot=0;
    for(let i=0;i<gaps.length;i++) {
      slot+=steps[i];
      if(Math.abs(gaps[i]-steps[i]*pitch)>tolerance ||
         Math.abs(centers[i+1]-centers[0]-slot*pitch)>tolerance)return spans;
    }
    const result=[spans[0]];
    for(let i=0;i<steps.length;i++) {
      for(let step=1;step<steps[i];step++) {
        const center=centers[i]+step*gaps[i]/steps[i];
        const lo=Math.max(spans[i][1],Math.round(center-pitch/2));
        const hi=Math.min(spans[i+1][0],Math.round(center+pitch/2));
        if(hi-lo<pitch*.76)return spans;
        result.push([lo,hi]);
      }
      result.push(spans[i+1]);
    }
    return result;
  }

  // A precisely framed printed line supplies another pitch measurement: the
  // two outside half-cells add up to one cell. Accept only an interior zero
  // when the first/last centers, each occupied center, and complete, strong
  // template matches all independently agree with this candidate grid.
  function framedCells(bits: Uint8Array, w: number, h: number, spans: Span[], refs: Template[]) {
    if(spans.length<3)return null;
    const middle=(s: Span)=>(s[0]+s[1])/2;
    const first=middle(spans[0]),last=middle(spans[spans.length - 1]);
    const n=Math.round(w/(first+w-last)),pitch=w/n;
    if(n<4||n>spans.length*2||pitch<h*.5||pitch>h*2.2)return null;
    if(Math.abs(first-pitch*.5)>pitch*.085+1 || Math.abs(last-(w-pitch*.5))>pitch*.085+1)return null;
    const proposal: Span[]=[];let occupied=0,empty=0;
    for(let i=0;i<n;i++){
      const a=Math.round(i*pitch),b=Math.round((i+1)*pitch),ink=bounds(bits,w,h,a,b);
      if(!ink){if(i===0||i===n-1)return null;empty++;proposal.push([a,b]);continue;}
      if(Math.abs((ink.x0+ink.x1+1)*.5-(i+.5)*pitch)>pitch*.12 ||
        ink.x1-ink.x0+1>pitch*.9 || ink.x0-a<pitch*.027 || b-ink.x1<pitch*.027)return null;
      occupied++;proposal.push([ink.x0,ink.x1+1]);
    }
    if(occupied<3||!empty||empty>=occupied)return null;
    for(const [a,b] of proposal) {
      const shape=feature(bits,w,h,bounds(bits,w,h,a,b));
      if(shape&&!refs.some(ref=>error(shape,ref.features)<1.05))return null;
    }
    return proposal;
  }

  function ranges(bits: Uint8Array, w: number, h: number, count?: number): Span[] {
    const hist=new Uint16Array(w);
    for (let i=0;i<bits.length;i++) hist[i%w]+=bits[i];
    const ink=bounds(bits,w,h);
    if (!ink) return [];
    const spans: Span[]=[]; let start=-1,last=-1;
    const join=Math.max(2,Math.round((ink.y1-ink.y0+1)*.055));
    for (let x=0;x<=w;x++) {
      if (x<w && hist[x]) {if(start<0) start=x;last=x;}
      else if (start>=0 && (x-last>join || x===w)) {spans.push([start,last+1]);start=-1;}
    }
    if (!count) {
      const rowHeight=ink.y1-ink.y0+1;
      const joined: Span[]=[];
      let previous=null;
      for(const span of spans){
        const box=bounds(bits,w,h,...span);
        if (!box) continue;
        const close=previous&&span[0]-previous.x1-1<rowHeight*.13;
        const separated=previous && close&&(previous.y1<box.y0||box.y1<previous.y0);
        // A detached dot/mark can sit horizontally between two strokes of
        // the same body. Compare the original neighbors on each side of it.
        if(previous && separated&&Math.min(previous.y1-previous.y0+1,box.y1-box.y0+1)<rowHeight*.3
          &&span[1]-joined[joined.length - 1][0]<rowHeight*.9) joined[joined.length - 1][1]=span[1];
        else joined.push([...span]);
        previous=box;
      }
      return interiorBlanks(joined);
    }
    if (spans.length===count) return spans;
    // Minimize ink intersected and displacement from a reasonable pitch.
    // The endpoints delimit the entire line, so blank internal cells can also
    // be repositioned by specifying the number of cells.
    const pitch=w/count, cuts=[0], radius=Math.max(2,Math.floor(pitch*.40));
    for(let i=1;i<count;i++) {
      const target=i*pitch, lo=Math.max(cuts[i-1]+1,Math.floor(target)-radius), hi=Math.min(w-(count-i),Math.ceil(target)+radius);
      let best=lo,cost=Infinity;
      for(let x=lo;x<=hi;x++) {
        const near=hist[x]*3+(hist[x-1]||0)+(hist[x+1]||0);
        const value=near*5+Math.abs(x-target)/pitch;
        if(value<cost) {cost=value;best=x;}
      }
      cuts.push(best);
    }
    cuts.push(w);return cuts.slice(0,-1).map((lo,i)=>[lo,cuts[i+1]]);
  }

  function thin(bits: Uint8Array, n: number) {
    const im=bits.slice();
    const work=new Int32Array(n*n);
    for(let iter=0;iter<n;iter++) {
      let removed=0;
      for(let step=0;step<2;step++) {
        let k=0;
        for(let y=1;y<n-1;y++) for(let x=1;x<n-1;x++) {
          const i=y*n+x;if(!im[i])continue;
          const a=im[i-n],b=im[i-n+1],c=im[i+1],d=im[i+n+1],e=im[i+n],f=im[i+n-1],g=im[i-1],h=im[i-n-1];
          const neighbors=a+b+c+d+e+f+g+h;
          if(neighbors<2||neighbors>6)continue;
          const turns=(1-a)*b+(1-b)*c+(1-c)*d+(1-d)*e+(1-e)*f+(1-f)*g+(1-g)*h+(1-h)*a;
          if(turns!==1)continue;
          if(step===0 ? !(a*c*e||c*e*g) : !(a*c*g||a*e*g)) work[k++]=i;
        }
        for(let j=0;j<k;j++)im[work[j]]=0;
        removed+=k;
      }
      if(!removed)break;
    }
    return im;
  }
  // Look for crossbars and the way strokes meet the baseline. A pencil may
  // hatch a solid area or put a crossbar higher than the printed reference.
  // Compare ink runs over a region rather than requiring exact pixel overlap.
  function rootStructure(mask: Uint8Array, stride: number, left: number, top: number, width: number, height: number) {
    let middleBar = 0, bottomBar = 0, footWidth = 0, footGap = 0, footRows = 0;
    for (let y = 0; y < height; y++) {
      const level = (y + 0.5) / height;
      if (level >= 5 / 6) {
        let first = width, last = -1, gap = 1;
        for (let x = 0; x < width; x++) {
          if (!mask[(top + y) * stride + left + x]) continue;
          first = Math.min(first, x);
          last = x;
          gap = Math.min(gap, 2 * Math.abs((x + 0.5) / width - 0.5));
        }
        if (last >= first) {
          footWidth += (last - first) / width;
          footGap += gap;
          footRows++;
        }
      }
      const middle = level > 0.2 && level < 0.68;
      if (!middle && level <= 0.75) continue;
      let longest = 0;
      // The crop is deskewed as a whole; local pen strokes can still tilt.
      for (const slope of [-0.12, -0.06, 0, 0.06, 0.12]) {
        let run = 0;
        for (let x = 0; x < width; x++) {
          const row = clamp(Math.round(y + (x / width - 0.5) * height * slope), 0, height - 1);
          const i = (top + row) * stride + left + x;
          if (mask[i] || (row > 0 && mask[i - stride]) || (row + 1 < height && mask[i + stride])) {
            longest = Math.max(longest, ++run);
          } else run = 0;
        }
      }
      if (middle) middleBar = Math.max(middleBar, longest / width);
      else bottomBar = Math.max(bottomBar, longest / width);
    }
    return { middleBar, bottomBar, footGap: footGap / Math.max(1, footRows), footWidth: footWidth / Math.max(1, footRows) };
  }
  // Count small enclosed loops near the edge of a root. Similar skeletons can
  // differ in whether their tips are solid or contain a ring.
  function peripheralLoops(bits: Uint8Array, stride: number, box: InkBox) {
    const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1;
    if (Math.min(w, h) < 32) return null;
    const background = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      background[y * w + x] = 1 - bits[(box.y0 + y) * stride + box.x0 + x];
    }
    let count = 0;
    for (const region of connected(background, w, h)) {
      if (!region.x0 || !region.y0 || region.x1 === w - 1 || region.y1 === h - 1) continue;
      const fraction = region.n / (w * h);
      if (region.n < 4 || fraction < .001 || fraction > .025 || region.x0 === region.x1 || region.y0 === region.y1) continue;
      const ww = region.x1 - region.x0 + 1, hh = region.y1 - region.y0 + 1;
      if (Math.min(ww, hh) / Math.max(ww, hh) < .6 || region.n / (ww * hh) < .58) continue;
      if (Math.abs((region.x + .5) / w - .5) > .28 || Math.abs((region.y + .5) / h - .5) > .28) count++;
    }
    return Math.min(count, 3);
  }
  function signature(bits: Uint8Array, w: number, b: InkBox, measureRoot=false) {
    const W=b.x1-b.x0+1,H=b.y1-b.y0+1,n=SIZE, area=new Uint8Array(n*n);
    // Keep orientation and some aspect-ratio information while accommodating a
    // narrow pen or a wide tile. Max pooling preserves very thin pencil lines.
    const ratio=clamp(W/H,.16,6);
    const dw=Math.max(3,Math.round((n-6)*Math.min(1,Math.sqrt(ratio))));
    const dh=Math.max(3,Math.round((n-6)*Math.min(1,1/Math.sqrt(ratio))));
    const ox=Math.floor((n-dw)/2),oy=Math.floor((n-dh)/2);
    for(let y=0;y<dh;y++) for(let x=0;x<dw;x++) {
      const x0=b.x0+Math.floor(x*W/dw),x1=b.x0+Math.ceil((x+1)*W/dw);
      const y0=b.y0+Math.floor(y*H/dh),y1=b.y0+Math.ceil((y+1)*H/dh);
      let found=false;
      for(let yy=y0;yy<y1&&!found;yy++)for(let xx=x0;xx<x1;xx++)if(bits[yy*w+xx]){found=true;break;}
      if(found)area[(y+oy)*n+x+ox]=1;
    }
    const skel=thin(area,n),pts=[],dist=new Uint8Array(n*n).fill(96);
    const density=new Float32Array(16);let mass=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(area[y*n+x]){
      density[Math.min(3,Math.floor(y*4/n))*4+Math.min(3,Math.floor(x*4/n))]++;mass++;
    }
    for(let i=0;i<16;i++)density[i]/=Math.max(1,mass);
    for(let i=0;i<skel.length;i++) if(skel[i]){pts.push(i);dist[i]=0;}
    for(let y=1;y<n-1;y++) for(let x=1;x<n-1;x++) {
      const i=y*n+x;dist[i]=Math.min(dist[i],dist[i-1]+3,dist[i-n]+3,dist[i-n-1]+4,dist[i-n+1]+4);
    }
    for(let y=n-2;y>0;y--) for(let x=n-2;x>0;x--) {
      const i=y*n+x;dist[i]=Math.min(dist[i],dist[i+1]+3,dist[i+n]+3,dist[i+n+1]+4,dist[i+n-1]+4);
    }
    const structure = measureRoot ? {...rootStructure(area,n,ox,oy,dw,dh), loops: peripheralLoops(bits,w,b)} : null;
    return {pts,dist,ratio,density,structure};
  }
  function splitMark(bits: Uint8Array, w: number, b: InkBox) {
    const H=b.y1-b.y0+1;
    let gap=-1;
    for(let y=b.y0+1;y<=b.y0+H*.51;y++) {
      let on=false;
      for(let x=b.x0;x<=b.x1;x++)if(bits[y*w+x]){on=true;break;}
      if(!on && gap<0)gap=y;
      if(on && gap>=0) {
        const mark=bounds(bits,w,0,b.x0,b.x1+1,b.y0,gap), root=bounds(bits,w,0,b.x0,b.x1+1,y,b.y1+1);
        if(mark && root && mark.n<root.n*1.15 && mark.y1-mark.y0<H*.41) return {mark,root};
        gap=-1;
      }
    }
    return null;
  }
  function markInfo(bits: Uint8Array, w: number, b: InkBox) {
    let sx=0,sy=0,xx=0,xy=0,yy=0;
    for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++)if(bits[y*w+x]){sx+=x;sy+=y;xx+=x*x;xy+=x*y;yy+=y*y;}
    xx=xx/b.n-(sx/b.n)**2;yy=yy/b.n-(sy/b.n)**2;xy=xy/b.n-sx*sy/(b.n*b.n);
    const d=Math.hypot(xx-yy,2*xy),angle=Math.atan2(2*xy,xx-yy)/2;
    return {long:d/(xx+yy+1e-6),u:Math.cos(2*angle),v:Math.sin(2*angle)};
  }
  function feature(bits: Uint8Array, w: number, h: number, b=bounds(bits,w,h)) {
    if(!b)return null;
    const divided=splitMark(bits,w,b);
    const full=signature(bits,w,b);
    if(divided)return {full,root:signature(bits,w,divided.root,true),mark:markInfo(bits,w,divided.mark)};
    // The top mark may be detached even when its vertical extent overlaps a
    // tall body. Recover a compact, high component and use only its own ink.
    const cw=b.x1-b.x0+1,ch=b.y1-b.y0+1,local=new Uint8Array(cw*ch);
    for(let y=0;y<ch;y++)local.set(bits.subarray((y+b.y0)*w+b.x0,(y+b.y0)*w+b.x1+1),y*cw);
    const groups=connected(local,cw,ch).sort((a,b)=>a.y-b.y);
    const top=groups[0];
    if(groups.length>1 && top.y<ch*.24 && top.y1<ch*.47 && top.n<b.n*.46) {
      const rest=local.slice(),isolated=new Uint8Array(cw*ch);
      for(const i of top.pixels){rest[i]=0;isolated[i]=1;}
      const r=bounds(rest,cw,ch);
      if(r && r.y0>top.y0+ch*.11)
        return {full,root:signature(rest,cw,r,true),mark:markInfo(isolated,cw,top)};
    }
    return {full,root:null,mark:null};
  }
  function distance(a: ReturnType<typeof signature>, b: ReturnType<typeof signature>) {
    const one=(p: number[], d: Uint8Array)=>{let s=0;for(const i of p)s+=Math.min(27,d[i]);return s/Math.max(1,p.length)/3;};
    let mass=0;
    for(let i=0;i<a.density.length;i++)mass+=Math.abs(a.density[i]-b.density[i]);
    return (one(a.pts,b.dist)+one(b.pts,a.dist))*.5 + .65*Math.min(1.4,Math.abs(Math.log(a.ratio/b.ratio))) + mass*1.6;
  }
  function error(a: Features, b: Features) {
    const full=distance(a.full,b.full);
    if(a.mark && b.mark && a.root?.structure && b.root?.structure) {
      const m=a.mark,t=b.mark;
      const orientation=(1-m.u*t.u-m.v*t.v)*Math.min(m.long,t.long);
      const markCost=orientation*1.9+Math.abs(m.long-t.long)*3.3;
      const left = a.root.structure, right = b.root.structure;
      const structureCost = Math.abs(left.middleBar - right.middleBar) + Math.abs(left.bottomBar - right.bottomBar)
        + Math.abs(left.footGap - right.footGap) + 0.6 * Math.abs(left.footWidth - right.footWidth);
      const loops = left.loops === null || right.loops === null ? 0 : Math.min(2, Math.abs(left.loops - right.loops));
      return .29*full+.71*distance(a.root,b.root)+markCost+1.3*structureCost+.16*loops;
    }
    return full + (a.mark||b.mark ? 2.1 : 0);
  }
  // The cardinal 1 and first ordinal differ at the inner tip of the diagonal.
  // Compare its thickness to the same stroke farther along, so a bold pen
  // does not look like the enlarged terminal of the ordinal.
  function innerTip(bits: Uint8Array, stride: number, box: InkBox | null) {
    if (!box) return null;
    const w=box.x1-box.x0+1,h=box.y1-box.y0+1;
    if(Math.min(w,h)<22)return null;
    const column=new Uint16Array(w);
    for(let x=0;x<w*.82;x++)for(let y=Math.ceil(h*.30);y<h*.93;y++){
      column[x]+=bits[(box.y0+y)*stride+box.x0+x];
    }
    const first=column.findIndex(v=>v !== 0);
    if(first<w*.24||first>w*.59)return null;
    const average=(a: number,b: number)=>{
      let sum=0,n=0;
      for(let x=Math.ceil(a);x<=Math.floor(b);x++){sum+=column[x];n++;}
      return sum/Math.max(1,n);
    };
    const stem=average(w*.70,w*.79);
    return stem>=2?average(first+w*.10,first+w*.16)/stem:null;
  }
  let templatesPromise: Promise<Template[]> | null;
  async function templates() {
    if(templatesPromise)return templatesPromise;
    templatesPromise=(async()=>{
      const inventory=window.ExileEngine.tokens;
      const faces=await document.fonts.load("112px ExileGlyphs",inventory.map(t=>t.glyph).join(""));
      if(!faces.length) throw new Error("The glyph font is unavailable");
      const c=surface(150,150),ctx=context2d(c),refs: Template[]=[];
      ctx.font="112px ExileGlyphs";ctx.textAlign="center";ctx.textBaseline="alphabetic";
      for(const [i,t] of inventory.entries()){
        ctx.clearRect(0,0,150,150);ctx.fillText(t.glyph,75,117);
        const rgba=ctx.getImageData(0,0,150,150).data,bits=new Uint8Array(150*150);
        for(let j=0;j<bits.length;j++)bits[j]=rgba[j*4+3]>=100?1:0;
        const features=feature(bits,150,150);
        if(features)refs.push({id:t.id,features,tip:['one','first'].includes(t.id)?innerTip(bits,150,bounds(bits,150,150)):null});
        if(i%16===15)await nextFrame();
      }
      return refs;
    })();
    try{return await templatesPromise;}catch(e){templatesPromise=null;throw e;}
  }
  async function estimateGeometry(img: OcrImage, c: HTMLCanvasElement, components: Component[], scale: number, signal?: AbortSignal) {
    const [width,height]=sizeOf(img);
    const short=Math.min(c.width,c.height), tol=clamp(short*.025,5,18);
    const groups=components.filter(g=>{
      const gw=g.x1-g.x0+1,gh=g.y1-g.y0+1;
      return g.n>5 && gw>1 && gh>1 && Math.max(gw,gh)<short*.16 && g.n/(gw*gh)<.9;
    }).sort((a,b)=>b.n-a.n).slice(0,110);
    let best=null;
    for(let i=0;i<groups.length;i++){
      if(i>0 && i%12===0){await nextFrame();signal?.throwIfAborted();}
      for(let j=i+1;j<groups.length;j++) {
      const a=groups[i],b=groups[j];let dx=b.x-a.x,dy=b.y-a.y;const span=Math.hypot(dx,dy);
      if(span<short*.13)continue;
      if(dx<0){dx=-dx;dy=-dy;}dx/=span;dy/=span;
      const hits=[];
      for(const g of groups) {
        const u=(g.x-a.x)*dx+(g.y-a.y)*dy,v=-(g.x-a.x)*dy+(g.y-a.y)*dx;
        if(Math.abs(v)<tol)hits.push({u,v,g});
      }
      hits.sort((p,q)=>p.u-q.u);
      let start=0;
      for(let k=1;k<=hits.length;k++)if(k===hits.length || hits[k].u-hits[k-1].u>short*.115) {
        const row=hits.slice(start,k);start=k;
        if(row.length<3)continue;
        const extent=row[row.length-1].u-row[0].u;
        if(extent<short*.13)continue;
        const score=row.reduce((v,p)=>v+Math.sqrt(p.g.n)*Math.max(.45,1-.3*Math.abs(p.v)/tol),0);
        if(!best || score>best.score)best={row,score};
      }
      }
    }
    if(!best)return {start:{x:width*.12,y:height*.5},end:{x:width*.88,y:height*.5},height:height*.15,estimated:false};
    const gs=best.row.map(p=>p.g),weight=gs.reduce((t,g)=>t+Math.sqrt(g.n),0);
    const mx=gs.reduce((t,g)=>t+g.x*Math.sqrt(g.n),0)/weight,my=gs.reduce((t,g)=>t+g.y*Math.sqrt(g.n),0)/weight;
    let xx=0,yy=0,xy=0;
    for(const g of gs){const w=Math.sqrt(g.n);xx+=w*(g.x-mx)**2;yy+=w*(g.y-my)**2;xy+=w*(g.x-mx)*(g.y-my);}
    const angle=.5*Math.atan2(2*xy,xx-yy),dx=Math.cos(angle),dy=Math.sin(angle);
    let u0=Infinity,u1=-Infinity,v0=Infinity,v1=-Infinity;
    for(const g of gs)for(const i of g.pixels){
      const x=i%c.width-mx,y=Math.floor(i/c.width)-my,u=x*dx+y*dy,v=-x*dy+y*dx;
      u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);
    }
    const bodyHeight=Math.max(v1-v0,tol*1.6),bottom=v1,top=v0;
    // RANSAC follows the bodies; add neighbouring dots and detached class marks
    // after fitting the writing direction. Keep long photo edges out of the row.
    for(const g of components) {
      if(g.n<3 || Math.hypot(g.x1-g.x0,g.y1-g.y0)>bodyHeight*1.7)continue;
      const u=(g.x-mx)*dx+(g.y-my)*dy,v=-(g.x-mx)*dy+(g.y-my)*dx;
      if(u<u0-bodyHeight*.24 || u>u1+bodyHeight*.24 || v<top-bodyHeight*.64 || v>bottom+bodyHeight*.32)continue;
      for(const i of g.pixels){const x=i%c.width-mx,y=Math.floor(i/c.width)-my,offset=-x*dy+y*dx;
        v0=Math.min(v0,offset);v1=Math.max(v1,offset);}
    }
    const heightWork=Math.max(v1-v0,tol*1.6),v=(v0+v1)*.5;
    const pt=(u: number)=>({x:clamp((mx+u*dx-v*dy)/scale,0,width),y:clamp((my+u*dy+v*dx)/scale,0,height)});
    return {start:pt(u0-heightWork*.15),end:pt(u1+heightWork*.15),height:heightWork*1.35/scale,estimated:true};
  }
  function horizontalLines(components: Component[], canvas: HTMLCanvasElement, scale: number) {
    const {width,height}=canvas;
    const groups=components.filter(g=>g.n>=5&&g.x1-g.x0<width*.65&&g.y1-g.y0<height*.65);
    const roots=groups.filter(g=>{
      const w=g.x1-g.x0+1,h=g.y1-g.y0+1;
      return h>=5&&w>1&&w/h<2.8&&w/h>.09&&g.n>=h*1.3;
    }).sort((a,b)=>(b.y1-b.y0)-(a.y1-a.y0));
    const rows: HorizontalRow[]=[];
    for(const seed of roots.slice(0,110)) {
      const h=seed.y1-seed.y0+1, baseline=seed.y1;
      if(rows.some(r=>Math.abs(r.baseline-baseline)<h*.22&&Math.abs(r.h-h)<h*.25))continue;
      const pieces=groups.filter(g=>g.y0>=baseline-h*1.8&&g.y1<=baseline+h*.18&&g.x1-g.x0<h*2.05);
      if(!pieces.length)continue;
      const aligned=pieces.filter(g=>g.y1-g.y0>h*.48&&Math.abs(g.y1-baseline)<h*.34);
      const prominent=h>=Math.min(width,height)*.17;
      if(aligned.length<2&&!prominent)continue;
      const y0=Math.min(...pieces.map(g=>g.y0)),y1=Math.max(...pieces.map(g=>g.y1));
      const x0=Math.min(...pieces.map(g=>g.x0)),x1=Math.max(...pieces.map(g=>g.x1));
      if(x1-x0<h*1.9&&!prominent)continue;
      const center=(y0+y1)/2/scale,pad=h*.065;
      rows.push({h,baseline,weight:h*Math.sqrt(Math.min(aligned.length,12)),geometry:{
        start:{x:Math.max(0,x0-pad)/scale,y:center},end:{x:Math.min(width,x1+1+pad)/scale,y:center},
        height:(y1-y0+1+2*pad)/scale,estimated:true,
      }});
    }
    return rows;
  }
  async function suggestLine(img: OcrImage, {signal}: {signal?: AbortSignal} = {}): Promise<OcrLine> {
    await nextFrame();signal?.throwIfAborted();
    const [width,height]=sizeOf(img),scale=Math.min(1,620/Math.max(width,height));
    const c=surface(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));
    const ctx=context2d(c);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);
    const normal=connected(maskOf(c),c.width,c.height);
    const tilted=await estimateGeometry(img,c,normal,scale,signal);
    const opposite=connected(maskOf(c,true),c.width,c.height);
    const lines=[...horizontalLines(normal,c,scale),...horizontalLines(opposite,c,scale)].sort((a,b)=>b.weight-a.weight);
    const choices: OcrLine[]=[];
    if(tilted.estimated)choices.push(tilted);
    if(width>height*12)choices.push({start:{x:0,y:height/2},end:{x:width,y:height/2},height,estimated:true});
    for(const {geometry:g} of lines) {
      if(choices.some(p=>Math.abs(g.start.y-p.start.y)<g.height*.12&&Math.abs(g.height-p.height)<g.height*.18&&Math.abs(g.start.x-p.start.x)<g.height*.4))continue;
      choices.push(g);
      if(choices.length>=8)break;
    }
    let winner=null,best=0;
    for(const g of choices){
      signal?.throwIfAborted();
      const sample=await recognize(img,{...g,signal,probe:true});
      const scores=sample.cells.map(cell=>cell.candidates[0]?.score||0);
      const strong=sample.cells.filter(cell=>cell.whole&&(cell.candidates[0]?.score ?? 0)>.56).length;
      const mean=scores.reduce((a,b)=>a+b,0)/Math.max(1,scores.length);
      const single=scores.length===1&&strong===1&&mean>.78&&g.height>Math.min(width,height)*.19&&g.end.x-g.start.x<g.height*1.8;
      if(!single&&(scores.length<2||strong<Math.max(2,Math.ceil(scores.length*.2))||mean<.455))continue;
      const sizes=sample.cells.flatMap(cell=>cell.whole && cell.inkHeight !== undefined ? [cell.inkHeight] : []).sort((a,b)=>a-b);
      const printedHeight=g.height*sizes[Math.floor(sizes.length/2)];
      const merit=mean*mean*Math.sqrt(printedHeight*strong)*Math.min(1,scores.length/3);
      if(merit>best){best=merit;winner=g;}
    }
    return winner||{start:{x:width*.12,y:height*.5},end:{x:width*.88,y:height*.5},height:height*.15,estimated:false};
  }
  async function recognize(img: OcrImage, options: OcrOptions): Promise<OcrResult> {
    if (!options) throw new Error("Invalid line geometry");
    const {height,onProgress,signal}=options;
    let count=options?.count;
    if(options?.estimated===false) return {cells:[],count:0,width:0,height:0,angle:0,preview:''};
    let {start,end}=options;
    if(![start?.x,start?.y,end?.x,end?.y,height].every(Number.isFinite)||height<=0)throw new Error("Invalid line geometry");
    const [sourceWidth,sourceHeight]=sizeOf(img);
    const dx=end.x-start.x,dy=end.y-start.y;
    let first=0,last=1;
    for(const [origin,direction,extent] of [[start.x,dx,sourceWidth],[start.y,dy,sourceHeight]]) {
      if(direction===0){if(origin<0||origin>extent) last=-1;continue;}
      const a=-origin/direction,b=(extent-origin)/direction;
      first=Math.max(first,Math.min(a,b));last=Math.min(last,Math.max(a,b));
    }
    // Keep the original pitch of a counted row, including when its requested
    // endpoints extend beyond the photo. Discard slots cut off by its edges.
    if(count!=null&&Number.isSafeInteger(count)&&count>=1&&(first>0||last<1)){
      const lo=Math.max(0,Math.ceil(first*count-1e-8)),hi=Math.min(count,Math.floor(last*count+1e-8));
      first=lo/count;last=hi/count;count=hi-lo;
    }
    if(last<=first) return {cells:[],count:0,width:0,height:0,angle:0,preview:''};
    end={x:start.x+last*dx,y:start.y+last*dy};
    start={x:start.x+first*dx,y:start.y+first*dy};
    const length=Math.hypot(end.x-start.x,end.y-start.y);
    if(length<2)throw new Error("Line is too short");
    if(count!=null && (!Number.isSafeInteger(count)||count<1||count>Math.floor(length))) {
      throw Object.assign(new RangeError("The line needs at least one source pixel per cell"), {code: "pixel-count"});
    }
    const checkActive=()=>{if(signal?.aborted)throw new DOMException("Cancelled","AbortError");};
    checkActive();
    // Match at a useful stroke height. Long lines retain the same sampling
    // density as short ones. Only the review thumbnail scales to the screen.
    const scale=Math.min(2,112/height);
    const w=Math.max(2,Math.round(length*scale),count||0),h=Math.max(3,Math.round(height*scale));
    const sx=w/length;
    const angle=Math.atan2(end.y-start.y,end.x-start.x);
    function fullyInPhoto(x0: number,x1: number) {
      const ux=Math.cos(angle),uy=Math.sin(angle);
      for(const along of [x0/sx,x1/sx])for(const offset of [-height/2,height/2]) {
        const x=start.x+ux*along-uy*offset,y=start.y+uy*along+ux*offset;
        if(x< -1e-5||y< -1e-5||x>sourceWidth+1e-5||y>sourceHeight+1e-5)return false;
      }
      return true;
    }
    function crop(x0: number,x1: number,maxWidth=x1-x0,maxHeight=h) {
      const zoom=Math.min(1,maxWidth/(x1-x0),maxHeight/h);
      const c=surface(Math.max(1,Math.round((x1-x0)*zoom)),Math.max(1,Math.round(h*zoom)));
      const ctx=context2d(c);
      ctx.scale(c.width/(x1-x0),c.height/h);
      ctx.translate(-x0,h/2);ctx.scale(sx,scale);
      ctx.rotate(-angle);ctx.translate(-start.x,-start.y);
      // Only composited source pixels participate in the local contrast. A
      // rotated strip may have transparent corners outside the photograph.
      ctx.fillStyle="#fff";ctx.fillRect(0,0,sourceWidth,sourceHeight);ctx.drawImage(img,0,0);
      return c;
    }
    function contrast([lo,hi]: Span) {
      const c=crop(lo,hi),rgba=context2d(c).getImageData(0,0,c.width,c.height).data;
      let ink=0,paper=0,n=0,m=0;
      for(let y=0;y<h;y++)for(let x=lo;x<hi;x++){
        const i=(y*c.width+x-lo)*4;if(rgba[i+3]<250)continue;
        const gray=(77*rgba[i]+150*rgba[i+1]+29*rgba[i+2])/256;
        if(bits[y*w+x]){ink+=gray;n++;}else{paper+=gray;m++;}
      }
      return Math.abs(ink/Math.max(1,n)-paper/Math.max(1,m));
    }
    // Browser canvases have a maximum side length. Work on overlapping strips
    // so a separator or a detached class mark may cross a tile boundary.
    const tileWidth=2048,halo=h*2+24;
    const bits=new Uint8Array(w*h);
    for(let left=0;left<w;left+=tileWidth) {
      checkActive();
      const right=Math.min(w,left+tileWidth),a=Math.max(0,left-halo),b=Math.min(w,right+halo);
      const tile=crop(a,b),tw=tile.width,ink=clean(maskOf(tile),tw,h);
      for(let y=0;y<h;y++) {
        const offset=y*tw+left-a;
        bits.set(ink.subarray(offset,offset+right-left),y*w+left);
      }
      if(right<w)await nextFrame();
    }
    let spans=ranges(bits,w,h,count);
    const refs=spans.length?await templates():[];
    if(!count&&!options.probe&&spans.length) spans=framedCells(bits,w,h,spans,refs)||spans;
    // Some photographed boards show an empty slot as a faint outline. Require
    // a regular position between inked glyphs and much lower contrast than both.
    const frames=new Set<Span>();
    const center=(span: Span)=>(span[0]+span[1])/2;
    for(let i=1;i<spans.length-1;i++) {
      const s=spans[i],left=spans[i-1],right=spans[i+1],dx=center(s)-center(left),dy=center(right)-center(s);
      if(dx/dy<.78||dx/dy>1.28)continue;
      const box=bounds(bits,w,h,...s);
      if(box&&emptyFrame(bits,w,box)&&contrast(s)<Math.min(contrast(left),contrast(right))*.42)frames.add(s);
    }
    if(options.probe&&spans.length>8) spans=Array.from({length:8},(_,i)=>spans[Math.round(i*(spans.length-1)/7)]);
    const cells: OcrCell[]=[];
    const tipRefs=refs.flatMap(ref=>ref.tip === null ? [] : [{id: ref.id, tip: ref.tip}]);
    for(const [index,[x0,x1]] of spans.entries()) {
      checkActive();
      const box=bounds(bits,w,h,x0,x1),feat=box?feature(bits,w,h,box):null;
      const candidates=feat&&!frames.has(spans[index]) ? refs.map(ref=>{
        const err=error(feat,ref.features);
        return {id:ref.id,score:Math.exp(-err/3.8)};
      }).sort((a,b)=>b.score-a.score).slice(0,12) : fullyInPhoto(x0,x1) ? [{id:"zero",score:1}] : [];
      if(tipRefs.length===2&&tipRefs.every(ref=>candidates.slice(0,2).some(c=>c.id===ref.id))) {
        const tip=innerTip(bits,w,box);
        if(tip!==null){
          for(const ref of tipRefs) {
            const match=candidates.find(c=>c.id===ref.id);
            if (match) match.score*=Math.exp(-.8*Math.abs(tip-ref.tip));
          }
          candidates.sort((a,b)=>b.score-a.score);
        }
      }
      const preview=options.probe?'':crop(x0,x1,112,112).toDataURL("image/png");
      const cell: OcrCell={box:{x:x0,y:0,width:x1-x0,height:h},preview,candidates};
      if(!feat&&!count) cell.inferredBlank=true;
      if(options.probe){
        cell.inkHeight=box?(box.y1-box.y0+1)/h:0;
        cell.whole=!!box&&box.y0>0&&box.y1<h-1&&cell.inkHeight>.13;
      }
      cells.push(cell);
      if(onProgress)onProgress((index+1)/spans.length);
      if(index%3===2)await nextFrame();
    }
    return {cells,width:w,height:h,count:cells.length,angle,preview:options.probe?'':crop(0,w,1320).toDataURL("image/png")};
  }
  window.ExileOCR={recognize,suggestLine};
})();
