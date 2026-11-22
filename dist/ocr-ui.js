(() => {
  'use strict';
  const copy = {
    ko: {
      title:'사진 읽기', intro:'사진은 이 기기에서만 읽습니다.',
      close:'닫기', region:'읽을 줄 선택',
      guide:'첫 글자의 바로 앞과 마지막 글자의 바로 뒤를 순서대로 눌러 주세요. 점을 끌어 옮길 수도 있어요.',
      start:'시작점', end:'끝점', height:'줄 높이', count:'문자 수', auto:'자동',
      read:'이 줄 읽기', working:'문자 비교 중…', finding:'읽을 줄을 찾고 있어요…',
      picture:'줄의 시작점과 끝점을 지정할 사진', review:'인식 결과 확인', guideReview:'고칠 글자를 누르고 알맞은 뜻을 고르세요.',
      candidates:'닮은 후보', library:'전체 문자에서 고르기', change:'범위 조정', apply:'문자판에 적용', repaste:'다른 사진 붙여넣기',
      unread:'선택 필요', empty:'글자를 찾지 못했습니다. 범위와 줄 높이를 조정해 보세요.',
      invalidCount:'줄에 보이는 글자 수를 입력하세요. 비워 두면 자동으로 셉니다.',
      next:'다음 줄 읽기', undoRow:'마지막 줄 빼기', saved:'확인한 줄', savedApply:'확인한 줄만 적용',
      fileError:'사진을 열 수 없습니다. 브라우저에서 볼 수 있는 이미지를 복사해 붙여넣으세요.',
      error:'이 줄을 읽지 못했습니다. 범위를 조정한 뒤 다시 시도해 주세요.', short:'두 점 사이의 거리를 늘려 주세요.',
      cell:'문자', photo:'원본 사진 조각', picked:'선택한 문자', compare:'인식된 줄',
    },
    en: {
      title:'Read a photo', intro:'Your photo stays on this device.',
      close:'Close', region:'Select a line',
      guide:'Tap just before the first glyph, then just past the last. You can also drag either handle.',
      start:'Start', end:'End', height:'Line height', count:'Glyph count', auto:'Auto',
      read:'Read this line', working:'Matching glyphs…', finding:'Finding a line…',
      picture:'Photo with adjustable line endpoints', review:'Review the glyphs', guideReview:'To change a reading, tap the glyph and choose its meaning.',
      candidates:'Closest matches', library:'Choose from all glyphs', change:'Adjust the line', apply:'Use on the board', repaste:'Paste another photo',
      unread:'Pick a glyph', empty:'No glyphs found. Adjust the endpoints and line height.',
      invalidCount:'Enter the number of glyphs you see, or leave it blank for an automatic count.',
      next:'Read another line', undoRow:'Remove last line', saved:'Confirmed lines', savedApply:'Use confirmed lines',
      fileError:'This photo could not be opened. Copy and paste an image your browser can display.',
      error:'Could not read the line. Adjust the region and try again.', short:'Move the endpoints farther apart.',
      cell:'Glyph', photo:'Original crop', picked:'Selected glyph', compare:'Selected line',
    },
    ja: {
      title:'写真を読む', intro:'写真はこの端末内で読み取ります。',
      close:'閉じる', region:'読み取る行を選ぶ',
      guide:'最初の文字の手前、最後の文字のすぐ後の順にタップしてください。点をドラッグして調整もできます。',
      start:'始点', end:'終点', height:'行の高さ', count:'文字数', auto:'自動',
      read:'この行を読む', working:'文字を照合中…', finding:'行を探しています…',
      picture:'行の始点と終点を調整する写真', review:'読み取り結果を確認', guideReview:'直したい文字をタップして、意味を選んでください。',
      candidates:'似ている候補', library:'すべての文字から選ぶ', change:'範囲を調整', apply:'文字盤に反映', repaste:'別の写真をペースト',
      unread:'選択が必要', empty:'文字が見つかりません。範囲と行の高さを調整してください。',
      invalidCount:'行に見える文字数を入力してください。空欄にすると自動で数えます。',
      next:'次の行を読む', undoRow:'最後の行を除く', saved:'確認した行', savedApply:'確認した行を反映',
      fileError:'写真を開けません。ブラウザーで表示できる画像をコピーして貼り付けてください。',
      error:'行を読み取れませんでした。範囲を調整してやり直してください。', short:'始点と終点をもう少し離してください。',
      cell:'文字', photo:'元の写真の一部', picked:'選択した文字', compare:'選択した行',
    },
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const escape = (value) => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function open(locale, apply, initialFile) {
    const t = copy[locale] || copy.en;
    const tokens = window.ExileEngine.tokens.filter(token => token.glyph);
    const byId = new Map(tokens.map(token => [token.id,token]));
    const meaning = token => token.labels[locale] || token.labels.en;
    const roles = {
      ko: {noun:'명사', adjective:'형용사'},
      en: {noun:'noun', adjective:'adjective'},
      ja: {noun:'名詞', adjective:'形容詞'},
    }[locale] || {};
    const meaningCounts = new Map();
    for (const token of tokens) {
      const name = meaning(token);
      meaningCounts.set(name, (meaningCounts.get(name) || 0) + 1);
    }
    const label = token => {
      const name = meaning(token);
      return meaningCounts.get(name) > 1 && roles[token.pos] ? name + ' (' + roles[token.pos] + ')' : name;
    };
    const sorted = [...tokens].sort((a,b) => label(a).localeCompare(label(b),locale));
    const dialog = document.createElement('dialog');
    dialog.className = 'ocr-dialog';
    dialog.setAttribute('aria-labelledby','ocr-title');
    dialog.innerHTML = `<div class="dialog-top"><h2 id="ocr-title">${t.title}</h2><button type="button" class="square" data-close aria-label="${t.close}"><svg aria-hidden="true" viewBox="0 0 24 24" class="icon"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <section id="ocr-queue" hidden><b></b><div><button class="btn" data-undo-row type="button">${t.undoRow}</button> <button class="btn" data-apply-queue type="button">${t.savedApply}</button></div></section>
      <div id="ocr-status" role="status"></div><section id="ocr-region" hidden>
        <h3>${t.region}</h3><p id="ocr-guide" class="ocr-note">${t.guide}</p>
        <div id="ocr-stage" role="group" aria-label="${t.picture}" aria-describedby="ocr-guide"><canvas></canvas>
          <svg preserveAspectRatio="none" aria-hidden="true"><polygon/><line/></svg>
          <button type="button" class="ocr-handle" data-end="start" aria-label="${t.start}">1</button>
          <button type="button" class="ocr-handle" data-end="end" aria-label="${t.end}">2</button>
        </div><div class="ocr-ends"><button type="button" data-edit="start">1 · ${t.start}</button><button type="button" data-edit="end">2 · ${t.end}</button></div>
        <div class="ocr-controls"><label>${t.height}<input type="range" id="ocr-height" min="1" step="1"></label>
        <label>${t.count}<input type="number" id="ocr-count" min="1" step="1" inputmode="numeric" placeholder="${t.auto}"></label></div>
        <button type="button" class="action" data-read>${t.read}</button>
      </section><section id="ocr-review" aria-labelledby="ocr-review-title" tabindex="-1" hidden><h3 id="ocr-review-title">${t.review}</h3>
        <img id="ocr-strip" alt="${t.compare}"><div class="ocr-cells" role="group" aria-label="${t.picked}"></div>
        <p class="ocr-note">${t.guideReview}</p><div id="ocr-matches" hidden></div>
        <div class="ocr-foot"><button type="button" class="action" data-apply>${t.apply}</button><button type="button" class="btn" data-back>${t.change}</button><button type="button" class="btn" data-next-row>${t.next}</button></div>
      </section><details id="ocr-paste-tools" open><summary hidden>${t.repaste}</summary><p class="ocr-note">${t.intro}</p><div class="ocr-upload"></div></details>`;
    document.body.append(dialog);
    const q = selector => dialog.querySelector(selector);
    const stage = q('#ocr-stage'), thumbnail = q('canvas'), overlay = q('#ocr-stage svg');
    const region = q('#ocr-region'), review = q('#ocr-review'), range = q('#ocr-height');
    const status = message => { q('#ocr-status').textContent = message; };
    const pasteTools = q('#ocr-paste-tools');
    let image, geometry, nextEnd = 'start', task = 0, result, chosen, activeCell, pointer, controller;
    const current = ticket => dialog.open && ticket === task;
    const confirmed = [];
    function showQueue() {
      const queue = q('#ocr-queue');
      queue.hidden = !confirmed.length;
      if(confirmed.length) queue.querySelector('b').textContent = t.saved + ' · ' + confirmed.length;
      q('[data-apply-queue]').hidden = !review.hidden;
    }
    function chooseEnd(key) {
      nextEnd = key;
      for(const control of dialog.querySelectorAll('[data-edit]')) control.setAttribute('aria-pressed', String(control.dataset.edit === key));
    }
    function drawRegion() {
      const {start,end,height} = geometry;
      const dx = end.x-start.x, dy = end.y-start.y, len = Math.hypot(dx,dy) || 1;
      const x = -dy*height/(2*len), y = dx*height/(2*len);
      const vertices = [[start.x+x,start.y+y],[end.x+x,end.y+y],[end.x-x,end.y-y],[start.x-x,start.y-y]];
      overlay.setAttribute('viewBox', `0 0 ${image.width} ${image.height}`);
      q('polygon').setAttribute('points', vertices.map(pair=>pair.join(',')).join(' '));
      const line = q('line');
      for(const [key,value] of Object.entries({x1:start.x,y1:start.y,x2:end.x,y2:end.y})) line.setAttribute(key,value);
      for(const el of stage.querySelectorAll('button')) {
        const p = geometry[el.dataset.end];
        el.style.left = (100*p.x/image.width)+'%'; el.style.top = (100*p.y/image.height)+'%';
      }
    }
    function showRegion(message = '') {
      review.hidden = true;
      region.hidden = false;
      drawRegion();
      showQueue();
      status(message);
    }
    async function load(blob) {
      if (!dialog.open) return;
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      const ticket = ++task;
      region.hidden = review.hidden = true; result = null; chosen = null; image = null; geometry = null; showQueue();
      q('[data-read]').disabled = false; region.inert = false; pointer = null;
      pasteTools.open = false;
      pasteTools.querySelector('summary').hidden = false;
      status(t.finding);
      const img = new Image(), url = URL.createObjectURL(blob);
      try {
        img.src = url; await img.decode();
        if(!current(ticket)) return;
        image = img;
        const scale = Math.min(1, 1280/Math.max(img.naturalWidth,img.naturalHeight));
        thumbnail.width = Math.max(1,Math.round(img.naturalWidth*scale));
        thumbnail.height = Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx = thumbnail.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,thumbnail.width,thumbnail.height); ctx.drawImage(img,0,0,thumbnail.width,thumbnail.height);
        let proposal;
        try {
          proposal = await window.ExileOCR.suggestLine(img, { signal });
        } catch {
          proposal = {start:{x:img.width*.1,y:img.height*.5}, end:{x:img.width*.9,y:img.height*.5}, height:img.height*.15, estimated:false};
        }
        if(!current(ticket)) return;
        geometry = proposal;
        stage.style.setProperty('--photo-ratio', image.width/image.height);
        range.min = 2;
        range.max = Math.max(Math.ceil(geometry.height),Math.round(Math.min(image.width,image.height)*1.4),+range.min+1);
        range.value = geometry.height;
        q('#ocr-count').value = '';
        chooseEnd('start');
        if (proposal.estimated) await read();
        else showRegion(t.empty);
      } catch {
        if(current(ticket)) {
          status(t.fileError);
          pasteTools.open = true;
        }
      }
      finally { URL.revokeObjectURL(url); }
    }
    function pos(event) {
      const r = stage.getBoundingClientRect();
      return {x:clamp((event.clientX-r.left)/r.width,0,1)*image.width,y:clamp((event.clientY-r.top)/r.height,0,1)*image.height};
    }
    stage.addEventListener('pointerdown', event => {
      if(!geometry || pointer || event.button !== 0) return;
      const key = event.target.closest('[data-end]')?.dataset.end || nextEnd;
      chooseEnd(key); pointer = {id:event.pointerId,key};
      stage.setPointerCapture(event.pointerId); geometry[key] = pos(event); drawRegion();
    });
    stage.addEventListener('pointermove', event => {
      if(pointer?.id !== event.pointerId) return;
      geometry[pointer.key] = pos(event); drawRegion();
    });
    function endPointer(event) {
      if(pointer?.id !== event.pointerId) return;
      chooseEnd(pointer.key === 'start' ? 'end' : 'start'); pointer = null;
    }
    stage.addEventListener('pointerup',endPointer); stage.addEventListener('pointercancel',endPointer);
    stage.addEventListener('keydown', event => {
      const key = event.target.dataset.end, offsets = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(!key || !offsets[event.key] || !geometry) return;
      event.preventDefault(); chooseEnd(key);
      const [x,y] = offsets[event.key], step = Math.max(1,image.width/400)*(event.shiftKey ? 5 : 1);
      geometry[key].x = clamp(geometry[key].x+x*step,0,image.width); geometry[key].y = clamp(geometry[key].y+y*step,0,image.height);
      drawRegion();
    });
    range.addEventListener('input',() => { geometry.height = +range.value; drawRegion(); });
    const detachClipboard = window.ExileClipboard?.attach(dialog,locale,load);
    async function read() {
      if(!geometry || q('[data-read]').disabled) return;
      const length = Math.hypot(geometry.start.x-geometry.end.x,geometry.start.y-geometry.end.y);
      if(length < 2) { showRegion(t.short); return; }
      const field = q('#ocr-count'), count = field.value === '' ? undefined : field.valueAsNumber;
      if(!field.validity.valid || (count !== undefined && (!Number.isSafeInteger(count) || count < 1 || count > Math.floor(length)))) { showRegion(t.invalidCount); field.focus(); return; }
      const ticket = ++task;
      controller = new AbortController();
      q('[data-read]').disabled = true; region.inert = true; status(t.working);
      try {
        const found = await window.ExileOCR.recognize(image,{start:geometry.start,end:geometry.end,height:geometry.height,count,signal:controller.signal,onProgress:n=>{ if(current(ticket)) status(t.working+' '+Math.round(n*100)+'%'); }});
        if(!current(ticket)) return;
        if(!found.cells.length) {showRegion(t.empty); return;}
        result = found; chosen = found.cells.map(cell=>cell.candidates.find(c=>byId.has(c.id))?.id || '');
        activeCell = chosen.indexOf('');
        region.hidden = true; review.hidden = false; q('#ocr-strip').src = result.preview;
        status(''); showQueue(); renderReview();
        review.focus({preventScroll:true}); review.scrollIntoView({block:'nearest'});
      } catch {if(current(ticket)) showRegion(t.error);}
      finally { if(current(ticket)) {q('[data-read]').disabled=false;region.inert=false;} }
    }
    function selection(id) {
      const changed = activeCell;
      chosen[changed]=id; activeCell=chosen.indexOf(''); renderReview();
      q(`[data-cell="${activeCell < 0 ? changed : activeCell}"]`).focus({preventScroll:true});
    }
    function renderReview() {
      q('.ocr-cells').innerHTML = result.cells.map((cell,i)=>{
        const word = byId.get(chosen[i]); const name = word ? label(word) : t.unread;
        return `<button type="button" data-cell="${i}" aria-label="${t.cell} ${i+1} · ${escape(name)}" aria-expanded="${i===activeCell}" aria-controls="ocr-matches" aria-pressed="${i===activeCell}"><small>${i+1}</small><img src="${cell.preview}" alt=""><b>${escape(name)}</b></button>`;
      }).join('');
      q('[data-apply]').disabled = q('[data-next-row]').disabled = chosen.includes('');
      q('#ocr-matches').hidden = activeCell < 0;
      if (activeCell < 0) { q('#ocr-matches').replaceChildren(); return; }
      const cell = result.cells[activeCell], id = chosen[activeCell];
      const matches = cell.candidates.filter(c=>byId.has(c.id));
      q('#ocr-matches').innerHTML = `<div class="ocr-match-heading"><img src="${cell.preview}" alt="${t.photo}"><h4>${t.cell} ${activeCell+1} · ${t.candidates}</h4></div>
        <div class="ocr-candidates">${matches.map(c=>{const word=byId.get(c.id);return `<button type="button" data-match="${escape(c.id)}" aria-pressed="${id===c.id}"><span class="glyph" aria-hidden="true">${escape(word.glyph)}</span><span>${escape(label(word))}</span></button>`;}).join('')}</div>
        <label class="ocr-library">${t.library}<select id="ocr-library"><option value="">—</option>${sorted.map(word=>`<option value="${escape(word.id)}" ${word.id===id?'selected':''}>${escape(label(word))}</option>`).join('')}</select></label>`;
    }
    dialog.addEventListener('change',event=>{if(event.target.id==='ocr-library' && byId.has(event.target.value))selection(event.target.value);});
    dialog.addEventListener('click',event=>{
      const button=event.target.closest('button'); if(!button)return;
      if(button.hasAttribute('data-close')) finish();
      else if(button.dataset.edit) chooseEnd(button.dataset.edit);
      else if(button.hasAttribute('data-read')) read();
      else if(button.hasAttribute('data-cell')) {
        const index = +button.dataset.cell;
        activeCell = activeCell === index ? -1 : index;
        renderReview(); q(`[data-cell="${index}"]`).focus({preventScroll:true});
      }
      else if(button.dataset.match) selection(button.dataset.match);
      else if(button.hasAttribute('data-back')) {showRegion();q('[data-read]').focus();}
      else if(button.hasAttribute('data-undo-row')) {confirmed.pop();showQueue();}
      else if(button.hasAttribute('data-apply-queue') && confirmed.length) finish(confirmed.flat());
      else if(chosen?.length && chosen.every(id=>byId.has(id))) {
        if(button.hasAttribute('data-next-row')) nextLine();
        if(button.hasAttribute('data-apply')) finish(confirmed.flat().concat(chosen));
      }
    });
    function nextLine() {
      confirmed.push(chosen.slice());
      const {start,end,height}=geometry, length=Math.hypot(end.x-start.x,end.y-start.y);
      const dx=-(end.y-start.y)*height/length,dy=(end.x-start.x)*height/length;
      const shifted=[start,end].map(p=>({x:p.x+dx,y:p.y+dy}));
      const insideImage=shifted.every(p=>p.x>=0&&p.x<=image.width&&p.y>=0&&p.y<=image.height);
      result=null;chosen=null;q('.ocr-cells').replaceChildren();q('#ocr-matches').replaceChildren();
      q('#ocr-count').value='';review.hidden=true;region.hidden=true;
      chooseEnd('start');showQueue();
      if(insideImage) {
        [geometry.start,geometry.end]=shifted;
        read();
      } else {
        showRegion(); region.scrollIntoView({block:'start'});
      }
    }
    function dispose() {
      dialog.removeEventListener('close',dispose);
      task++; controller?.abort(); detachClipboard?.(); dialog.remove();
    }
    function finish(ids) {
      if (!dialog.open) return;
      dialog.close();
      dispose();
      if (ids) apply(ids);
    }
    dialog.addEventListener('close',dispose,{once:true});
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish();});
    dialog.showModal();
    if(initialFile)load(initialFile);
  }
  window.ExilePhotoReader = {open};
})();
