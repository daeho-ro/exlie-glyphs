(() => {
  'use strict';
  const copy = {
    ko: {
      title:'사진 읽기', intro:'사진은 이 기기에서만 읽습니다.',
      close:'닫기', region:'읽을 줄 선택',
      guide:'첫 글자 앞과 마지막 글자 뒤를 차례로 누르세요. 사진은 밀어서 이동하고, 점은 끌어서 조정할 수 있어요.',
      zoom:'사진 크기', zoomIn:'사진 확대', zoomOut:'사진 축소',
      start:'시작점', end:'끝점', height:'줄 높이', count:'문자 수', auto:'자동',
      read:'이 줄 읽기', working:'문자 비교 중…', finding:'읽을 줄을 찾고 있어요…',
      picture:'줄의 시작점과 끝점을 지정할 사진', review:'인식 결과 확인', countLabel:(n: number)=>n+'글자', guideReview:'고칠 글자를 누르고 알맞은 뜻을 고르세요.',
      choices:'문자 선택', confirmGlyph:'이 문자로 바꾸기', search:'문자 이름 검색', noMatches:'일치하는 문자가 없어요.', change:'범위·글자 수 조정', apply:'문자판에 적용', back:'뒤로',
      unread:'선택 필요', empty:'글자를 찾지 못했습니다. 범위와 줄 높이를 조정해 보세요.',
      invalidCount:'줄에 보이는 글자 수를 입력하세요. 비워 두면 자동으로 셉니다.',
      line:(n: number)=>n+'번째 줄', lines:'인식된 줄', skipped:'읽지 못한 줄은 직접 추가할 수 있어요.',
      addRow:'줄 추가', removeRow:'이 줄 제외', returnReview:'결과로 돌아가기',
      next:'다음 줄 읽기', undoRow:'마지막 줄 빼기', saved:'확인한 줄', savedApply:'확인한 줄만 적용',
      fileError:'사진을 열 수 없습니다. PNG 또는 JPEG 이미지로 다시 시도해 주세요.',
      error:'이 줄을 읽지 못했습니다. 범위를 조정한 뒤 다시 시도해 주세요.', short:'두 점 사이의 거리를 늘려 주세요.',
      cell:'문자', photo:'원본 사진 조각', picked:'선택한 문자', compare:'인식된 줄',
    },
    en: {
      title:'Read a photo', intro:'Your photo stays on this device.',
      close:'Close', region:'Select a line',
      guide:'Tap just before the first glyph, then just past the last. Swipe the photo to pan or drag a handle to adjust it.',
      zoom:'Photo zoom', zoomIn:'Zoom in', zoomOut:'Zoom out',
      start:'Start', end:'End', height:'Line height', count:'Glyph count', auto:'Auto',
      read:'Read this line', working:'Matching glyphs…', finding:'Finding lines…',
      picture:'Photo with adjustable line endpoints', review:'Review the glyphs', countLabel:(n: number)=>n+(n === 1 ? ' glyph' : ' glyphs'), guideReview:'To change a reading, tap the glyph and choose its meaning.',
      choices:'Glyph choices', confirmGlyph:'Use this glyph', search:'Search glyph names', noMatches:'No matching glyphs.', change:'Adjust line or count', apply:'Use on the board', back:'Back',
      unread:'Pick a glyph', empty:'No glyphs found. Adjust the endpoints and line height.',
      invalidCount:'Enter the number of glyphs you see, or leave it blank for an automatic count.',
      line:(n: number)=>'Line '+n, lines:'Recognized lines', skipped:'You can add any line the reader missed.',
      addRow:'Add a line', removeRow:'Exclude this line', returnReview:'Back to results',
      next:'Read another line', undoRow:'Remove last line', saved:'Confirmed lines', savedApply:'Use confirmed lines',
      fileError:'Could not open this image. Try a PNG or JPEG photo.',
      error:'Could not read the line. Adjust the region and try again.', short:'Move the endpoints farther apart.',
      cell:'Glyph', photo:'Original crop', picked:'Selected glyph', compare:'Selected line',
    },
    ja: {
      title:'写真を読む', intro:'写真はこの端末内で読み取ります。',
      close:'閉じる', region:'読み取る行を選ぶ',
      guide:'最初の文字の手前、最後の文字のすぐ後の順にタップしてください。写真はスワイプで移動し、点はドラッグで調整できます。',
      zoom:'写真の倍率', zoomIn:'写真を拡大', zoomOut:'写真を縮小',
      start:'始点', end:'終点', height:'行の高さ', count:'文字数', auto:'自動',
      read:'この行を読む', working:'文字を照合中…', finding:'行を探しています…',
      picture:'行の始点と終点を調整する写真', review:'読み取り結果を確認', countLabel:(n: number)=>n+'文字', guideReview:'直したい文字をタップして、意味を選んでください。',
      choices:'文字を選ぶ', confirmGlyph:'この文字に変更', search:'文字名を検索', noMatches:'一致する文字がありません。', change:'範囲・文字数を調整', apply:'文字盤に反映', back:'戻る',
      unread:'選択が必要', empty:'文字が見つかりません。範囲と行の高さを調整してください。',
      invalidCount:'行に見える文字数を入力してください。空欄にすると自動で数えます。',
      line:(n: number)=>n+'行目', lines:'読み取った行', skipped:'読み取れなかった行は手動で追加できます。',
      addRow:'行を追加', removeRow:'この行を除外', returnReview:'結果に戻る',
      next:'次の行を読む', undoRow:'最後の行を除く', saved:'確認した行', savedApply:'確認した行を反映',
      fileError:'画像を開けません。PNG または JPEG でお試しください。',
      error:'行を読み取れませんでした。範囲を調整してやり直してください。', short:'始点と終点をもう少し離してください。',
      cell:'文字', photo:'元の写真の一部', picked:'選択した文字', compare:'選択した行',
    },
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const escape = (value: unknown) => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] ?? ch));

  function open(locale: ReaderLocale, apply: (ids: string[]) => void, initialFile?: Blob) {
    const t = copy[locale] || copy.en;
    const tokens = window.ExileEngine.tokens.filter(token => token.glyph);
    const byId = new Map(tokens.map(token => [token.id,token]));
    const meaning = (token: ReadingToken) => token.labels[locale] || token.labels.en;
    const roles = {
      ko: {noun:'명사', adjective:'형용사'},
      en: {noun:'noun', adjective:'adjective'},
      ja: {noun:'名詞', adjective:'形容詞'},
    }[locale];
    const meaningCounts = new Map<string, number>();
    for (const token of tokens) {
      const name = meaning(token);
      meaningCounts.set(name, (meaningCounts.get(name) || 0) + 1);
    }
    const label = (token: ReadingToken) => {
      const name = meaning(token);
      return (meaningCounts.get(name) ?? 0) > 1 && (token.pos === 'noun' || token.pos === 'adjective') ? name + ' (' + roles[token.pos] + ')' : name;
    };
    const normalizeSearch = (text: string) => text.normalize('NFKC').toLocaleLowerCase(locale).trim();
    const library = new Map([...tokens]
      .sort((a, b) => label(a).localeCompare(label(b), locale))
      .map(word => [word.id, {
        word,
        names: normalizeSearch([label(word), ...Object.values(word.labels),
          ...Object.values(word.aliases || {}).flat()].join(' ')),
      }]));
    const dialog = document.createElement('dialog');
    dialog.className = 'ocr-dialog';
    dialog.setAttribute('aria-labelledby','ocr-title');
    dialog.innerHTML = `<div class="dialog-top"><button type="button" class="ocr-back" data-ocr-back hidden><svg viewBox="0 0 24 24" aria-hidden="true" class="icon"><path d="m14 5-7 7 7 7"/></svg>${t.back}</button><h2 id="ocr-title">${t.title}</h2><button type="button" class="square" data-close aria-label="${t.close}"><svg aria-hidden="true" viewBox="0 0 24 24" class="icon"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
      <section id="ocr-queue" hidden><b></b><div><button class="btn" data-undo-row type="button">${t.undoRow}</button> <button class="btn" data-apply-queue type="button">${t.savedApply}</button></div></section>
      <div id="ocr-status" role="status"></div><section id="ocr-region" hidden>
        <div class="ocr-region-head"><h3>${t.region}</h3>
          <div class="ocr-photo-zoom" role="group" aria-label="${t.zoom}">
            <button type="button" data-zoom-out aria-controls="ocr-photo-viewport" aria-label="${t.zoomOut}" aria-disabled="true">−</button>
            <output data-zoom-level aria-live="polite">1×</output>
            <button type="button" data-zoom-in aria-controls="ocr-photo-viewport" aria-label="${t.zoomIn}">+</button>
          </div>
        </div>
        <p id="ocr-guide" class="ocr-note">${t.guide}</p>
        <div id="ocr-photo-viewport"><div id="ocr-stage" role="group" aria-label="${t.picture}" aria-describedby="ocr-guide">
          <svg preserveAspectRatio="none" aria-hidden="true"><polygon/><line/></svg>
          <button type="button" class="ocr-handle" data-end="start" aria-label="${t.start}">1</button>
          <button type="button" class="ocr-handle" data-end="end" aria-label="${t.end}">2</button>
        </div></div><div class="ocr-ends"><button type="button" data-edit="start">1 · ${t.start}</button><button type="button" data-edit="end">2 · ${t.end}</button></div>
        <div class="ocr-controls"><label>${t.height}<input type="range" id="ocr-height" min="1" step="1"></label>
        <label>${t.count}<input type="number" id="ocr-count" min="1" step="1" inputmode="numeric" placeholder="${t.auto}"></label></div>
        <div class="ocr-foot"><button type="button" class="action" data-read>${t.read}</button><button type="button" class="btn" data-return-review hidden>${t.returnReview}</button></div>
      </section><section id="ocr-review" aria-labelledby="ocr-review-title" hidden><h3 id="ocr-review-title" tabindex="-1">${t.review} <small data-result-count></small></h3>
        <div id="ocr-lines" role="group" aria-label="${t.lines}" hidden></div>
        <p class="ocr-note" data-ocr-skipped hidden>${t.skipped}</p>
        <div id="ocr-row-result"><div class="ocr-strip-frame"><img id="ocr-strip" alt="${t.compare}"></div><div class="ocr-cells" role="group" aria-label="${t.picked}"></div>
        <p class="ocr-note">${t.guideReview}</p></div>
        <div class="ocr-foot"><button type="button" class="action" data-apply>${t.apply}</button><button type="button" class="btn" data-back>${t.change}</button><button type="button" class="btn" data-next-row>${t.next}</button><button type="button" class="btn" data-remove-row hidden>${t.removeRow}</button></div>
      </section><section id="ocr-matches" aria-labelledby="ocr-choice-title" hidden></section><section id="ocr-paste-tools"><p class="ocr-note">${t.intro}</p><div class="ocr-upload"></div></section>`;
    document.body.append(dialog);
    function q<E extends Element = HTMLElement>(selector: string): E {
      const element = dialog.querySelector<E>(selector);
      if (!element) throw new Error('Missing photo reader control: ' + selector);
      return element;
    }
    type End = 'start' | 'end';
    type ReviewedLine = { geometry: OcrLine; result: OcrResult; chosen: string[]; count?: number };
    const isEnd = (value: string | undefined): value is End => value === 'start' || value === 'end';
    const viewport = q('#ocr-photo-viewport');
    const stage = q('#ocr-stage'), overlay = q<SVGSVGElement>('#ocr-stage svg');
    const region = q('#ocr-region'), review = q('#ocr-review'), range = q<HTMLInputElement>('#ocr-height');
    const status = (message: string) => { q('#ocr-status').textContent = message; };
    const pasteTools = q('#ocr-paste-tools'), matches = q('#ocr-matches');
    const visualViewport = window.visualViewport;
    let reviewScrollTop = 0;
    function sizePicker() {
      if (matches.hidden || !visualViewport) return;
      const { height, offsetTop } = visualViewport;
      dialog.style.setProperty('--ocr-view-height', height + 'px');
      dialog.style.setProperty('--ocr-view-center', (offsetTop + height / 2) + 'px');
    }
    function setChoosingGlyph(choosing: boolean) {
      if (choosing === !matches.hidden) return;
      if (choosing) reviewScrollTop = dialog.scrollTop;
      matches.hidden = !choosing;
      dialog.toggleAttribute('data-choosing-glyph', choosing);
      if (choosing) sizePicker();
      else {
        matches.replaceChildren();
        dialog.scrollTop = reviewScrollTop;
      }
    }
    let image: HTMLImageElement | null = null;
    let photoUrl: string | null = null;
    let geometry: OcrLine | null = null;
    const reviewed: ReviewedLine[] = [];
    let activeRow = 0;
    let editingRow: number | null = null;
    let missedLines = 0;
    let keepRowsForNextPhoto = false;
    let nextEnd: End = 'start', task = 0, activeCell = -1;
    let draftGlyph = '';
    let pointer: { id: number; key: End; origin: OcrPoint; handleOffset: OcrPoint | null } | null = null;
    const zoomLevels = [1, 1.5, 2, 3, 4];
    let zoomIndex = 0;
    let controller: AbortController | null = null;
    const current = (ticket: number) => dialog.open && ticket === task;
    const confirmed: string[][] = [];
    const linePicker = q('#ocr-lines');
    const readButton = q<HTMLButtonElement>('[data-read]');
    const countField = q<HTMLInputElement>('#ocr-count');
    const isResolved = (row: ReviewedLine) => row.chosen.every(id => byId.has(id));
    function showQueue() {
      const queue = q('#ocr-queue');
      queue.hidden = !confirmed.length;
      if(confirmed.length) q('#ocr-queue b').textContent = t.saved + ' · ' + confirmed.length;
      q('[data-apply-queue]').hidden = !review.hidden;
    }
    function chooseEnd(key: End) {
      nextEnd = key;
      for(const control of dialog.querySelectorAll<HTMLButtonElement>('[data-edit]')) control.setAttribute('aria-pressed', String(control.dataset.edit === key));
    }
    function drawRegion() {
      if (!geometry || !image) return;
      const {start,end,height} = geometry;
      const dx = end.x-start.x, dy = end.y-start.y, len = Math.hypot(dx,dy) || 1;
      const x = -dy*height/(2*len), y = dx*height/(2*len);
      const vertices = [[start.x+x,start.y+y],[end.x+x,end.y+y],[end.x-x,end.y-y],[start.x-x,start.y-y]];
      overlay.setAttribute('viewBox', `0 0 ${image.naturalWidth} ${image.naturalHeight}`);
      q<SVGPolygonElement>('polygon').setAttribute('points', vertices.map(pair=>pair.join(',')).join(' '));
      const line = q<SVGLineElement>('line');
      for(const [key,value] of Object.entries({x1:start.x,y1:start.y,x2:end.x,y2:end.y})) line.setAttribute(key,String(value));
      for(const el of stage.querySelectorAll('button')) {
        const key = el.dataset.end;
        if (!isEnd(key)) continue;
        const p = geometry[key];
        el.style.left = (100*p.x/image.naturalWidth)+'%'; el.style.top = (100*p.y/image.naturalHeight)+'%';
      }
    }
    function setGeometry(photo: HTMLImageElement, line: OcrLine) {
      geometry = { ...line, start: { ...line.start }, end: { ...line.end } };
      range.min = '2';
      range.max = String(Math.max(Math.ceil(line.height), Math.round(Math.min(photo.naturalWidth, photo.naturalHeight) * 1.4), +range.min + 1));
      range.value = String(line.height);
      countField.value = '';
      countField.placeholder = t.auto;
      chooseEnd('start');
    }
    function setZoom(index: number) {
      zoomIndex = index;
      const zoom = zoomLevels[index];
      stage.style.setProperty('--photo-zoom', String(zoom));
      q('[data-zoom-level]').textContent = zoom + '×';
      q('[data-zoom-out]').setAttribute('aria-disabled', String(index === 0));
      q('[data-zoom-in]').setAttribute('aria-disabled', String(index === zoomLevels.length - 1));
    }
    function centerPhoto(relativeX: number, relativeY: number) {
      viewport.scrollTo({
        left: relativeX * stage.offsetWidth - viewport.clientWidth / 2,
        top: relativeY * stage.offsetHeight - viewport.clientHeight / 2,
      });
    }
    function zoomPhoto(step: number) {
      const index = zoomIndex + step;
      if (index < 0 || index >= zoomLevels.length) return;
      const x = (viewport.scrollLeft + viewport.clientWidth / 2) / stage.offsetWidth;
      const y = (viewport.scrollTop + viewport.clientHeight / 2) / stage.offsetHeight;
      setZoom(index);
      centerPhoto(x, y);
    }
    function revealHandle(key: End) {
      if (!geometry || !image) return;
      const point = geometry[key];
      const x = point.x / image.naturalWidth * stage.offsetWidth;
      const y = point.y / image.naturalHeight * stage.offsetHeight;
      const edge = 22;
      if (x < viewport.scrollLeft + edge || x > viewport.scrollLeft + viewport.clientWidth - edge) {
        viewport.scrollLeft = x - viewport.clientWidth / 2;
      }
      if (y < viewport.scrollTop + edge || y > viewport.scrollTop + viewport.clientHeight - edge) {
        viewport.scrollTop = y - viewport.clientHeight / 2;
      }
    }
    function showRegion(message = '') {
      const revealPhoto = region.hidden;
      review.hidden = true;
      setChoosingGlyph(false);
      region.hidden = false;
      q('[data-return-review]').hidden = reviewed.length === 0;
      drawRegion();
      if (revealPhoto && geometry && image) {
        centerPhoto((geometry.start.x + geometry.end.x) / (2 * image.naturalWidth),
          (geometry.start.y + geometry.end.y) / (2 * image.naturalHeight));
      }
      showQueue();
      status(message);
    }
    function releasePhoto() {
      image?.remove();
      image = null;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = null;
    }
    function clearPhoto() {
      ++task;
      controller?.abort();
      controller = null;
      region.hidden = review.hidden = true;
      region.inert = false;
      readButton.disabled = false;
      if (keepRowsForNextPhoto) confirmed.push(...reviewed.filter(isResolved).map(row => row.chosen));
      reviewed.length = 0;
      activeRow = 0;
      activeCell = -1;
      editingRow = null;
      missedLines = 0;
      keepRowsForNextPhoto = false;
      pointer = null;
      releasePhoto();
      geometry = null;
      setZoom(0);
      q<HTMLImageElement>('#ocr-strip').removeAttribute('src');
      linePicker.replaceChildren();
      q('.ocr-cells').replaceChildren();
      setChoosingGlyph(false);
      showQueue();
    }
    function showPaste(message = '') {
      clearPhoto();
      pasteTools.hidden = false;
      q('[data-ocr-back]').hidden = true;
      status(message);
      dialog.scrollTop = 0;
      q('[data-paste-image]').focus({preventScroll:true});
    }
    async function load(blob: Blob) {
      if (!dialog.open) return;
      clearPhoto();
      const ticket = task;
      controller = new AbortController();
      const { signal } = controller;
      pasteTools.hidden = true;
      const back = q('[data-ocr-back]');
      back.hidden = false;
      back.focus({preventScroll:true});
      status(t.finding);
      const img = new Image();
      photoUrl = URL.createObjectURL(blob);
      img.alt = '';
      img.draggable = false;
      try {
        img.src = photoUrl;
        await img.decode();
        if (!current(ticket)) return;
        image = img;
        stage.prepend(img);
        const fallback = {
          start: { x: img.naturalWidth * .1, y: img.naturalHeight * .5 },
          end: { x: img.naturalWidth * .9, y: img.naturalHeight * .5 },
          height: img.naturalHeight * .15,
          estimated: false,
        };
        const lines: OcrLine[] = await window.ExileOCR.suggestLines(img, { signal }).catch(() => []);
        if (!current(ticket)) return;
        if (!lines.length) {
          const line = await window.ExileOCR.suggestLine(img, { signal }).catch(() => fallback);
          if (!current(ticket)) return;
          if (line.estimated) lines.push(line);
          else {
            setGeometry(img, line);
            showRegion(t.empty);
            return;
          }
        }
        for (const [index, line] of lines.entries()) {
          try {
            const found = await window.ExileOCR.recognize(img, {
              ...line, signal,
              onProgress: fraction => {
                if (current(ticket)) status(t.working + ' ' + Math.round((index + fraction) * 100 / lines.length) + '%');
              },
            });
            if (!current(ticket)) return;
            if (found.cells.length) reviewed.push(reviewedLine(line, found));
            else missedLines++;
          } catch {
            if (!current(ticket)) return;
            missedLines++;
          }
        }
        if (reviewed.length) showReview(0);
        else {
          setGeometry(img, lines[0] || fallback);
          showRegion(t.empty);
        }
      } catch {
        if(current(ticket)) showPaste(t.fileError);
      }
    }
    function setEndpoint(key: End, event: PointerEvent, offset: OcrPoint = { x: 0, y: 0 }) {
      if (!geometry || !image) return;
      const bounds = stage.getBoundingClientRect();
      geometry[key] = {
        x: clamp((event.clientX + offset.x - bounds.left) / bounds.width, 0, 1) * image.naturalWidth,
        y: clamp((event.clientY + offset.y - bounds.top) / bounds.height, 0, 1) * image.naturalHeight,
      };
      drawRegion();
    }
    stage.addEventListener('pointerdown', event => {
      if (!geometry || !image || pointer || !event.isPrimary || event.button !== 0 || !(event.target instanceof Element)) return;
      const handle = event.target.closest<HTMLElement>('[data-end]');
      const origin = { x: event.clientX, y: event.clientY };
      const key = handle?.dataset.end;
      if (handle && isEnd(key)) {
        const box = handle.getBoundingClientRect();
        pointer = {
          id: event.pointerId,
          key,
          origin,
          handleOffset: { x: box.left + box.width / 2 - origin.x, y: box.top + box.height / 2 - origin.y },
        };
        chooseEnd(key);
        stage.setPointerCapture(event.pointerId);
      } else {
        pointer = { id: event.pointerId, key: nextEnd, origin, handleOffset: null };
      }
    });
    const moved = (event: PointerEvent, origin: OcrPoint) => Math.hypot(event.clientX - origin.x, event.clientY - origin.y);
    stage.addEventListener('pointermove', event => {
      if (pointer?.id !== event.pointerId) return;
      if (pointer.handleOffset) setEndpoint(pointer.key, event, pointer.handleOffset);
      else if (moved(event, pointer.origin) > 8) pointer = null;
    });
    stage.addEventListener('pointerup', event => {
      if (pointer?.id !== event.pointerId) return;
      if (pointer.handleOffset) {
        if (moved(event, pointer.origin) > 0) setEndpoint(pointer.key, event, pointer.handleOffset);
      } else if (moved(event, pointer.origin) <= 8) {
        setEndpoint(pointer.key, event);
      }
      chooseEnd(pointer.key === 'start' ? 'end' : 'start');
      pointer = null;
    });
    function cancelPointer(event: PointerEvent) {
      if (pointer?.id === event.pointerId) pointer = null;
    }
    stage.addEventListener('pointercancel', cancelPointer);
    stage.addEventListener('lostpointercapture', cancelPointer);
    stage.addEventListener('pointerleave', event => {
      if (!pointer?.handleOffset) cancelPointer(event);
    });
    stage.addEventListener('keydown', event => {
      if (!(event.target instanceof HTMLElement)) return;
      const key = event.target.dataset.end, offsets: Record<string, [number, number]> = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(!isEnd(key) || !offsets[event.key] || !geometry || !image) return;
      event.preventDefault(); chooseEnd(key);
      const [x,y] = offsets[event.key], step = Math.max(1,image.naturalWidth/400)*(event.shiftKey ? 5 : 1);
      geometry[key].x = clamp(geometry[key].x+x*step,0,image.naturalWidth); geometry[key].y = clamp(geometry[key].y+y*step,0,image.naturalHeight);
      drawRegion();
      revealHandle(key);
    });
    range.addEventListener('input',() => { if (!geometry) return; geometry.height = +range.value; drawRegion(); });
    const detachClipboard = window.ExileClipboard?.attach(dialog,locale,load);
    function reviewedLine(line: OcrLine, result: OcrResult, count?: number): ReviewedLine {
      return {
        geometry: line,
        result,
        count,
        chosen: result.cells.map(cell => cell.candidates.find(candidate => byId.has(candidate.id))?.id || ''),
      };
    }
    function showReview(index: number, focusHeading = true) {
      activeRow = index;
      activeCell = -1;
      editingRow = null;
      region.hidden = true;
      review.hidden = false;
      status('');
      showQueue();
      renderReview();
      if (focusHeading) {
        dialog.scrollTop = 0;
        q('#ocr-review-title').focus({ preventScroll: true });
      }
    }
    async function read() {
      if (!geometry || !image || readButton.disabled) return;
      const line = geometry, photo = image;
      const length = Math.hypot(line.start.x - line.end.x, line.start.y - line.end.y);
      if (length < 2) { showRegion(t.short); return; }
      const count = countField.value === '' ? undefined : countField.valueAsNumber;
      if (!countField.validity.valid || (count !== undefined && (!Number.isSafeInteger(count) || count < 1 || count > Math.floor(length)))) {
        showRegion(t.invalidCount);
        countField.focus();
        return;
      }
      const ticket = ++task;
      controller = new AbortController();
      readButton.disabled = true;
      region.inert = true;
      status(t.working);
      try {
        const found = await window.ExileOCR.recognize(photo, {
          start: line.start, end: line.end, height: line.height, count, signal: controller.signal,
          onProgress: fraction => {
            if (current(ticket)) status(t.working + ' ' + Math.round(fraction * 100) + '%');
          },
        });
        if (!current(ticket)) return;
        if (!found.cells.length) { showRegion(t.empty); return; }
        const row = reviewedLine(line, found, count);
        if (editingRow === null) {
          reviewed.push(row);
          missedLines = Math.max(0, missedLines - 1);
        } else reviewed[editingRow] = row;
        const linePosition = ({ start, end }: OcrLine) => {
          const dx = end.x - start.x, dy = end.y - start.y;
          return Math.abs(dx) >= Math.abs(dy) && dx !== 0
            ? start.y + dy * (photo.naturalWidth / 2 - start.x) / dx
            : (start.y + end.y) / 2;
        };
        reviewed.sort((a, b) => linePosition(a.geometry) - linePosition(b.geometry));
        showReview(reviewed.indexOf(row));
      } catch {
        if (current(ticket)) showRegion(t.error);
      } finally {
        if (current(ticket)) {
          readButton.disabled = false;
          region.inert = false;
        }
      }
    }
    function returnToReview() {
      const editedCell = activeCell;
      activeCell = -1;
      renderReview();
      q<HTMLButtonElement>(`[data-cell="${editedCell}"]`).focus({ preventScroll: true });
    }
    function selection(id: string) {
      const row = reviewed[activeRow];
      if (!row || activeCell < 0) return;
      row.chosen[activeCell] = id;
      returnToReview();
    }
    function renderChoices(query: string) {
      const cell = reviewed[activeRow]?.result.cells[activeCell];
      if (!cell) return;
      const terms = normalizeSearch(query).split(/\s+/);
      const ids = new Set([...cell.candidates.map(candidate => candidate.id), ...library.keys()]);
      const buttons = [];
      for (const id of ids) {
        const entry = library.get(id);
        if (!entry || !terms.every(term => entry.names.includes(term))) continue;
        const { word } = entry;
        buttons.push(`<button type="button" data-glyph-choice="${escape(id)}" aria-pressed="${id === draftGlyph}">
          <span class="glyph" aria-hidden="true">${escape(word.glyph)}</span><span>${escape(label(word))}</span></button>`);
      }
      const grid = q('.ocr-choice-grid');
      grid.innerHTML = buttons.join('') || `<p class="ocr-note" role="status">${t.noMatches}</p>`;
      grid.scrollTop = 0;
    }
    function makeMouseScrollable(grid: HTMLElement) {
      let drag: { pointerId: number; startY: number; scrollTop: number } | null = null;
      let moved = false;
      grid.addEventListener('pointerdown', event => {
        moved = false;
        if (event.pointerType === 'mouse' && event.button === 0 && grid.scrollHeight > grid.clientHeight) {
          drag = { pointerId: event.pointerId, startY: event.clientY, scrollTop: grid.scrollTop };
        }
      });
      grid.addEventListener('pointermove', event => {
        if (!drag || drag.pointerId !== event.pointerId || !(event.buttons & 1)) return;
        const distance = event.clientY - drag.startY;
        if (!moved) {
          if (Math.abs(distance) < 6) return;
          moved = true;
          grid.setPointerCapture(event.pointerId);
          grid.dataset.dragging = '';
        }
        grid.scrollTop = drag.scrollTop - distance;
      });
      function stopDrag(event: PointerEvent) {
        if (drag?.pointerId !== event.pointerId) return;
        drag = null;
        delete grid.dataset.dragging;
      }
      grid.addEventListener('pointerup', stopDrag);
      grid.addEventListener('pointercancel', stopDrag);
      grid.addEventListener('lostpointercapture', stopDrag);
      grid.addEventListener('pointerleave', event => { if (!moved) stopDrag(event); });
      // A pointer drag must not also activate the tile where it began.
      grid.addEventListener('click', event => {
        if (moved && event.detail) {
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    }
    function renderReview() {
      const row = reviewed[activeRow];
      if (!row) return;
      const { result, chosen } = row;
      const multiple = reviewed.length > 1;
      linePicker.hidden = !multiple;
      if (multiple) {
        linePicker.innerHTML = reviewed.map((line, index) => `<button type="button" data-ocr-row="${index}" aria-controls="ocr-row-result" aria-pressed="${index === activeRow}">${t.line(index + 1)}${isResolved(line) ? '' : ' · ' + t.unread}</button>`).join('');
      }
      q('[data-ocr-skipped]').hidden = missedLines === 0;
      q('[data-result-count]').textContent = t.countLabel(result.cells.length);
      q<HTMLImageElement>('#ocr-strip').src = result.preview;
      q('[data-next-row]').textContent = multiple ? t.addRow : t.next;
      q('[data-remove-row]').hidden = !multiple;
      q('.ocr-cells').innerHTML = result.cells.map((cell,i)=>{
        const word = byId.get(chosen[i]); const name = word ? label(word) : t.unread;
        return `<button type="button" data-cell="${i}" aria-label="${t.cell} ${i+1} · ${escape(name)}" aria-controls="ocr-matches"><small>${i+1}</small><img src="${cell.preview}" alt=""><b>${escape(name)}</b></button>`;
      }).join('');
      const needsSelection = reviewed.some(line => !isResolved(line));
      q<HTMLButtonElement>('[data-apply]').disabled = needsSelection;
      q<HTMLButtonElement>('[data-next-row]').disabled = needsSelection;
      setChoosingGlyph(activeCell >= 0);
      if (activeCell < 0) return;
      const cell = result.cells[activeCell];
      draftGlyph = chosen[activeCell];
      matches.innerHTML = `<div class="ocr-match-heading"><img src="${cell.preview}" alt="${t.photo}"><h3 id="ocr-choice-title" tabindex="-1">${t.cell} ${activeCell + 1}</h3></div>
        <input id="ocr-library-search" class="field" type="search" placeholder="${t.search}" aria-label="${t.search}" autocomplete="off">
        <div class="ocr-choice-grid" role="group" aria-label="${t.choices}"></div>
        <div class="ocr-choice-actions"><button type="button" class="action" data-confirm-glyph ${draftGlyph ? '' : 'disabled'}>${t.confirmGlyph}</button></div>`;
      renderChoices('');
      makeMouseScrollable(q('.ocr-choice-grid'));
    }
    dialog.addEventListener('input', event => {
      const field = event.target;
      if (field instanceof HTMLInputElement && field.id === 'ocr-library-search') renderChoices(field.value);
    });
    dialog.addEventListener('click',event=>{
      const button=event.target instanceof Element ? event.target.closest('button') : null; if(!button)return;
      if(button.hasAttribute('data-close')) finish();
      else if (button.hasAttribute('data-ocr-back')) {
        if (activeCell >= 0) returnToReview();
        else showPaste();
      }
      else if (button.hasAttribute('data-zoom-out')) zoomPhoto(-1);
      else if (button.hasAttribute('data-zoom-in')) zoomPhoto(1);
      else if (isEnd(button.dataset.edit)) {
        chooseEnd(button.dataset.edit);
        revealHandle(button.dataset.edit);
      }
      else if(button.hasAttribute('data-read')) read();
      else if (button.dataset.ocrRow !== undefined) {
        const index = Number(button.dataset.ocrRow);
        showReview(index, false);
        q(`[data-ocr-row="${index}"]`).focus({ preventScroll: true });
      } else if (button.hasAttribute('data-cell')) {
        activeCell = Number(button.dataset.cell);
        renderReview();
        q('#ocr-choice-title').focus({ preventScroll: true });
      } else if (button.dataset.glyphChoice && byId.has(button.dataset.glyphChoice)) {
        draftGlyph = button.dataset.glyphChoice;
        q('.ocr-choice-grid').querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-pressed', 'true');
        q<HTMLButtonElement>('[data-confirm-glyph]').disabled = false;
      } else if (button.hasAttribute('data-confirm-glyph') && byId.has(draftGlyph)) {
        selection(draftGlyph);
      } else if (button.hasAttribute('data-return-review')) showReview(activeRow);
      else if (button.hasAttribute('data-back') && image) {
        editingRow = activeRow;
        const row = reviewed[activeRow];
        setGeometry(image, row.geometry);
        countField.value = row.count === undefined ? '' : String(row.count);
        countField.placeholder = String(row.result.cells.length);
        showRegion();
        readButton.focus();
      } else if (button.hasAttribute('data-remove-row') && reviewed.length > 1) {
        reviewed.splice(activeRow, 1);
        showReview(Math.min(activeRow, reviewed.length - 1));
      } else if (button.hasAttribute('data-undo-row')) {
        confirmed.pop();
        showQueue();
      } else if (button.hasAttribute('data-apply-queue') && confirmed.length) {
        finish(confirmed.flat());
      } else if (reviewed.length && reviewed.every(isResolved)) {
        if (button.hasAttribute('data-next-row')) nextLine();
        if (button.hasAttribute('data-apply')) finish(confirmed.flat().concat(reviewed.flatMap(row => row.chosen)));
      }
    });
    function nextLine() {
      const last = reviewed.at(-1);
      if (!last || !image) return;
      keepRowsForNextPhoto = true;
      const { start, end, height } = last.geometry;
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      const direction = end.x >= start.x ? 1 : -1;
      const dx = direction * (start.y - end.y) * height / length;
      const dy = direction * (end.x - start.x) * height / length;
      const shifted = {
        start: { x: start.x + dx, y: start.y + dy },
        end: { x: end.x + dx, y: end.y + dy },
        height,
      };
      const { naturalWidth: width, naturalHeight: imageHeight } = image;
      const insideImage = [shifted.start, shifted.end].every(p => p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= imageHeight);
      editingRow = null;
      setGeometry(image, insideImage ? shifted : last.geometry);
      showRegion();
      q('[data-edit="start"]').focus({ preventScroll: true });
      region.scrollIntoView({ block: 'start' });
    }
    function dispose() {
      dialog.removeEventListener('close', dispose);
      visualViewport?.removeEventListener('resize', sizePicker);
      visualViewport?.removeEventListener('scroll', sizePicker);
      task++;
      controller?.abort();
      releasePhoto();
      detachClipboard?.();
      dialog.remove();
    }
    function finish(ids?: string[]) {
      if (!dialog.open) return;
      dialog.close();
      dispose();
      if (ids) apply(ids);
    }
    dialog.addEventListener('close',dispose,{once:true});
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      if (activeCell >= 0) returnToReview();
      else finish();
    });
    visualViewport?.addEventListener('resize', sizePicker);
    visualViewport?.addEventListener('scroll', sizePicker);
    dialog.showModal();
    if(initialFile)load(initialFile);
  }
  window.ExilePhotoReader = {open};
})();
