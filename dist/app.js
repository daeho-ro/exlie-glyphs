(() => {
  'use strict';
  const reader = window.ExileReading;
  const share = window.ExileShare;
  const app = document.getElementById('app');
  const dialog = document.getElementById('dialog');
  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch],
    );
  const messages = {
    desk: ['만들기', 'Create', '作る'],
    dict: ['사전', 'Lexicon', '辞典'],
    title: ['유배지 문자열 생성기', 'Exile glyph generator', '流刑地の文字列メーカー'],
    examples: ['예문 고르기', 'Examples', '例文を選ぶ'],
    zone: ['구역', 'Zone', 'エリア'],
    photo: ['사진 읽기', 'Read a photo', '写真を読む'],
    empty: [
      '아래 기호를 누르면 여기에 놓입니다.',
      'Tap a sign below to place it here.',
      '下の記号をタップして追加します。',
    ],
    tail: ['선택 해제', 'Deselect', '選択を解除'],
    back: ['한 칸 지우기', 'Delete one', '一文字消す'],
    deleteSelected: ['선택 삭제', 'Delete', '削除'],
    clear: ['비우기', 'Clear', 'クリア'],
    restore: ['되돌리기', 'Undo', '元に戻す'],
    palette: ['기호 넣기', 'Add signs', '記号を追加'],
    search: ['단어 검색', 'Search words', '単語を検索'],
    moreSigns: ['모든 기호 보기', 'Show all signs', 'すべての記号を見る'],
    fewerSigns: ['접기', 'Show fewer', '閉じる'],
    sign: ['기호', 'Sign', '記号'],
    noun: ['명사', 'Noun', '名詞'],
    verb: ['동사', 'Verb', '動詞'],
    adjective: ['형용사', 'Adjective', '形容詞'],
    adverb: ['부사', 'Adverb', '副詞'],
    number: ['수사', 'Number', '数詞'],
    marker: ['표지', 'Marker', '標識'],
    operator: ['연산·관계', 'Operator', '演算・関係'],
    auxiliary: ['조동사', 'Auxiliary', '助動詞'],
    pronoun: ['대명사', 'Pronoun', '代名詞'],
    ordinal: ['서수', 'Ordinal', '序数'],
    conjunction: ['접속', 'Connective', '接続'],
    preposition: ['관계', 'Relation', '関係'],
    noMatch: [
      '맞는 기호가 없습니다.',
      'No matching signs.',
      '該当する記号はありません。',
    ],
    guide: [
      '문장 전체의 풀이를 보려면 예문을 고르세요.',
      'Choose an example to read the full sentence.',
      '文全体の意味を読むには、例文を選んでください。',
    ],
    editGuide: [
      '기호를 누르면 문자판에 추가됩니다. 중간에 넣으려면 바로 앞 글자를 먼저 누르세요.',
      'Tap a sign to add it. To insert it in the middle, first tap the sign it should follow.',
      '記号をタップすると文字盤に追加されます。途中に入れるときは、先に直前の文字をタップしてください。',
    ],
    denseImage: [
      '문자열이 길어 한 장에 담기 어렵습니다. 나눠 저장하거나 링크를 공유해 주세요.',
      'This sequence is too long for one image. Save it in parts or share the link.',
      '一枚の画像に収まりません。分けて保存するかリンクを共有してください。',
    ],
    sourceBody: [
      '공개 도판과 팬 판독을 바탕으로 복원한 문자입니다. ‘유추형’은 품사 규칙을 적용해 만든 형태입니다.',
      'Glyphs were reconstructed from public boards and fan readings. Inferred forms apply the word-class marks.',
      '公開された図版とファンの解読を基に復元しました。推定形は品詞標識から作った形です。',
    ],
    wiki: [
      '유배지 구역별 판독',
      'Readings by puzzle area',
      'エリア別の解読資料',
    ],
    fontError: [
      '웹폰트를 불러올 수 없습니다. 페이지를 새로고침해 주세요.',
      'The glyph font could not load. Please reload the page.',
      'フォントを読み込めません。ページを再読み込みしてください。',
    ],
    invalid: [
      '이 문자판 링크를 열 수 없습니다.',
      'This card link could not be opened.',
      '文字盤のリンクを開けません。',
    ],
    linkCopied: [
      '문자판 링크를 복사했습니다.',
      'Board link copied.',
      'リンクをコピーしました。',
    ],
    linkManual: [
      '길게 눌러 링크를 복사하세요.',
      'Touch and hold the link to copy it.',
      'リンクを長押ししてコピーしてください。',
    ],
    puzzleLink: ['문자판 링크', 'Board link', '文字盤のリンク'],
    saveFailed: ['이미지를 저장할 수 없습니다. 다시 시도해 주세요.', 'Could not save the image. Please try again.', '画像を保存できませんでした。もう一度お試しください。'],
    shareFileHint: ['링크를 공유하려면 생성기를 웹 주소로 열어 주세요.', 'Open the generator at a web address to share a link.', 'リンクを共有するには、ウェブアドレスから開いてください。'],
    shareFailed: [
      '공유할 수 없습니다. 다시 시도해 주세요.',
      'Sharing failed. Please try again.',
      '共有できませんでした。もう一度お試しください。',
    ],
    help: ['사용 안내', 'How to use', '使い方'],
    sources: ['문자와 출처', 'Glyphs & sources', '文字と出典'],
    png: ['이미지 저장', 'Save image', '画像を保存'],
    export: ['내보내기', 'Export', '書き出す'],
    share: ['링크 공유', 'Share link', 'リンクを共有'],
    labelLang: ['언어', 'Language', '言語'],
    close: ['닫기', 'Close', '閉じる'],
    boardRef: [
      '바닥 문자 참고 자료',
      'Floor inscription reference',
      '床の文字の参考資料',
    ],
    show: ['풀이 보기', 'Show reading', '読みを表示'],
    hide: ['풀이 접기', 'Hide reading', '読みを隠す'],
  };
  const paths = {
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 4M12 17h.01"/>',
    share:
      '<path d="M12 16V3m-4 4 4-4 4 4M7 10H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/>',
    read: '<path d="M3 5c3-1 6-1 9 1v14c-3-2-6-2-9-1zm9 1c3-2 6-2 9-1v14c-3-1-6-1-9 1"/>',
    write: '<path d="m4 16-1 5 5-1L20 8l-4-4zM13.5 6.5l4 4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
    tile: '<path d="m12 2 8 5v10l-8 5-8-5V7zM8 12l4-3 4 3-4 3z"/>',
    undo: '<path d="m9 7-5 5 5 5m-5-5h10a5 5 0 0 0 5-5"/>',
    clear: '<path d="M4 6h16M9 6V4h6v2M7 6l1 14h8l1-14M10.5 10v6m3-6v6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',
    picture:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m4 18 6-6 3 3 3-3 5 5"/>',
    file: '<path d="M5 3h9l5 5v13H5zm9 0v5h5M8 14h8m-8 3h5"/>',
    link: '<path d="m10 14 4-4m-4-2 2-2a4.2 4.2 0 0 1 6 6l-2 2m-2 2-2 2a4.2 4.2 0 0 1-6-6l2-2"/>',
  };
  const ico = (id) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" class="icon">${paths[id]}</svg>`;
  const saved = (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  };
  const chooseLang = (value) => (reader.languages.includes(value) ? value : 'ko');
  const savedLocale = saved('exile-ui');
  let hasLocalePreference = reader.languages.includes(savedLocale);
  const state = {
    loc: hasLocalePreference ? savedLocale : chooseLang(navigator.language.split('-')[0]),
    page: 'desk',
    ids: [],
    selected: null,
    history: [],
    query: '',
    allSigns: false,
    shared: false,
    revealed: true,
  };
  const tr = (key) =>
    messages[key]?.[['ko', 'en', 'ja'].indexOf(state.loc)] || key;
  const txt = (key) => esc(tr(key));
  const words = (ids) => ids.map((id) => reader.byId.get(id));
  const glyph = (word) =>
    `<span class="glyph glyph-${esc(word.id)}" aria-hidden="true">${esc(word.glyph)}</span>`;
  const common = [
    'spider',
    'see',
    'snake',
    'bird',
    'person',
    'eat',
    'purple',
    'small',
    'red',
    'blue',
    'tree',
    'fruit',
  ];
  const keyboard = [...new Set([...common, ...reader.tokens.map((t) => t.id)])]
    .map((id) => reader.byId.get(id))
    .filter(Boolean);
  const previewSize = 8;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2000);
  }
  function plate(ids) {
    const signs = words(ids).map((word, index) => {
      return `<button type="button" class="board-slot" data-slot="${index}" aria-pressed="${index === state.selected}">
        ${glyph(word)}<span class="slot-order">${txt('sign')} ${index + 1}</span>
        <span class="slot-meaning" lang="${state.loc}">${esc(word.labels[state.loc])}</span></button>`;
    }).join('');
    const previous = state.history.at(-1);
    const selected = state.selected !== null;
    const canRestore = previous && !previous.singleAppend && previous.ids.length > 0;
    const editTools = [
      selected && `<button data-act="tail">${txt('tail')}</button>`,
      ids.length > 0 && `<button data-act="undo">${txt(selected ? 'deleteSelected' : 'back')}</button>`,
      !selected && ids.length > 1 && `<button data-act="clear">${txt('clear')}</button>`,
      !selected && canRestore && `<button data-act="restore">${txt('restore')}</button>`,
    ].filter(Boolean).join('');
    const example = ids.length ? reader.read(ids, state.loc).example : null;
    return `<section class="plate" id="board" data-revealed="${state.revealed}">
      <div id="board-reading"><div id="board-signs" class="inscription" data-long="${ids.length > 5}">${signs || `<span class="plate-empty">${txt('empty')}</span>`}</div></div>
      ${ids.length ? `<button type="button" class="board-reveal" data-act="reveal" aria-controls="board-reading${example ? ' board-example' : ''}" aria-expanded="${state.revealed}">${txt(state.revealed ? 'hide' : 'show')}</button>` : ''}
      ${example ? `<p class="board-example" id="board-example" lang="${state.loc}">${esc(example.texts[state.loc])}</p>` : ''}
      ${ids.length || editTools ? `<div class="plate-bottom">
        ${ids.length ? `<button type="button" class="board-export" data-act="export" aria-haspopup="dialog" aria-controls="dialog">${ico('share')}${txt('export')}</button>` : ''}
        <div class="plate-tools">${editTools}</div></div>` : ''}</section>`;
  }
  function exampleMenu() {
    const zones = [...new Set(reader.examples.map((e) => e.zone))].sort(
      (a, b) => a - b,
    );
    return `<label class="select-box"><select id="example" aria-label="${txt('examples')}"><option value="">${txt('examples')}</option>${zones.map((z) => `<optgroup label="${txt('zone')} ${z}">${reader.examples.map((e, i) => (e.zone === z ? `<option value="${i}">${esc(e.texts[state.loc])}</option>` : '')).join('')}</optgroup>`).join('')}</select></label>`;
  }
  function keyChoices() {
    const query = state.query.trim().normalize('NFKC').toLowerCase();
    const list = !query ? keyboard : keyboard.filter((word) =>
      [...Object.values(word.labels), ...Object.values(word.aliases || {}).flat()].some((name) =>
        name.normalize('NFKC').toLowerCase().includes(query)));
    if (!list.length) return `<p class="note" role="status">${txt('noMatch')}</p>`;
    const names = new Set();
    const duplicates = new Set();
    for (const word of list) {
      const name = word.labels[state.loc];
      if (names.has(name)) duplicates.add(name);
      names.add(name);
    }
    const shown = query || state.allSigns ? list : list.slice(0, previewSize);
    const tiles = shown.map((word) => {
      const name = word.labels[state.loc];
      return `<button type="button" class="tile" data-add="${esc(word.id)}">${glyph(word)}
        <span class="meaning">${esc(name)}</span>${duplicates.has(name) ? `<small>${txt(word.pos)}</small>` : ''}</button>`;
    }).join('');
    const toggle = !query && list.length > previewSize
      ? `<button type="button" class="all-signs" data-act="all-signs" aria-expanded="${state.allSigns}">${txt(state.allSigns ? 'fewerSigns' : 'moreSigns')}</button>` : '';
    const grid = `<div class="tiles">${tiles}</div>`;
    return state.allSigns ? toggle + grid : grid + toggle;
  }
  function desk() {
    const wall = [
      ['bird', 'eat', 'spider'],
      ['person', 'eat', 'fruit'],
      ['cow', 'eat', 'grass'],
    ]
      .map((row) => `<div>${words(row).map(glyph).join('')}</div>`)
      .join('');
    return `<div class="intro temple-hero"><div class="hero-text"><h1>${txt('title')}</h1></div><div class="wall-inscription" aria-hidden="true">${wall}</div></div>
      <div class="work-grid"><article class="editor"><div class="desk-actions">${exampleMenu()}<button class="mobile-palette-btn" data-act="read-photo">${ico('picture')}${txt('photo')}</button></div>
      ${plate(state.ids)}<section class="inline-picker"><div class="output-head"><h2>${txt('palette')}</h2></div><label class="search palette-search">${ico('search')}<input id="pal-query" class="field" type="search" autocomplete="off" placeholder="${txt('search')}" aria-label="${txt('search')}" value="${esc(state.query)}"></label><div id="key-choices">${keyChoices()}</div></section>
      </article></div>`;
  }
  function render() {
    app.classList.toggle('workshop-view', state.page === 'desk');
    document.documentElement.lang = state.loc;
    document.title = 'Exile Glyphs · ' + tr(state.page === 'desk' ? 'title' : 'dict');
    $('locale').value = state.loc;
    $('locale').setAttribute('aria-label', tr('labelLang'));
    $('globe').innerHTML = ico('globe');
    $('help').innerHTML = ico('help');
    $('help').setAttribute('aria-label', tr('help'));
    $('help').title = tr('help');
    $('close').innerHTML = ico('close');
    $('close').setAttribute('aria-label', tr('close'));
    $('source').textContent = tr('sources');
    $('nav').innerHTML = ['desk', 'dict']
      .map(
        (page) =>
          `<button data-page="${page}" ${state.page === page ? 'aria-current="page"' : ''}>${txt(page)}</button>`,
      )
      .join('');
    app.innerHTML = state.page === 'desk' ? desk() : window.ExileDictionary.page(state.loc);
  }
  function modal(title, content) {
    dialog.dataset.panel = title;
    $('dialog-title').textContent = tr(title);
    $('dialog-body').innerHTML = content;
    if (!dialog.open) dialog.showModal();
  }
  async function saveCard(button) {
    button.disabled = true;
    try {
      const blob = await share.png(state.ids.slice(), state.loc, state.revealed);
      share.download(blob);
      window.dataLayer?.push({ event: 'glyph_card_save' });
    } catch (error) {
      toast(tr(error?.code === 'board-too-dense' ? 'denseImage' : 'saveFailed'));
    } finally {
      button.disabled = false;
    }
  }
  async function shareBoard() {
    try {
      if (location.protocol === 'file:') {
        toast(tr('shareFileHint'));
        return;
      }
      const url = share.createBoardLink(state.ids, state.loc);
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Exile Glyphs', url });
          window.dataLayer?.push({ event: 'glyph_link_share' });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        window.dataLayer?.push({ event: 'glyph_link_share' });
        toast(tr('linkCopied'));
      } catch {
        modal('share', `<p>${txt('linkManual')}</p><a class="btn" href="${esc(url)}">${txt('puzzleLink')}</a>`);
      }
    } catch {
      toast(tr('shareFailed'));
    }
  }
  let activeHash;
  function syncBoardHash() {
    const canonical = share.boardHash(state.ids, state.loc);
    if (location.hash !== canonical) {
      activeHash = canonical;
      location.replace(canonical);
    }
  }
  function openPage(page) {
    if (state.page === page) return;
    const hash = page === 'dict' ? '#dict' : state.shared ? share.boardHash(state.ids, state.loc) : '';
    activeHash = hash;
    if (location.hash !== hash) location.hash = hash;
    state.page = page;
    render();
    window.scrollTo(0, 0);
  }
  function loadHash() {
    if (activeHash === location.hash) return;
    activeHash = location.hash;
    const fromDictionary = state.page === 'dict';
    state.page = activeHash === '#dict' ? 'dict' : 'desk';
    if (activeHash.startsWith('#b=')) {
      const board = share.readBoardLink(activeHash);
      const continuing = board && fromDictionary && state.shared &&
        activeHash === share.boardHash(state.ids, board.lang);
      if (!continuing) {
        state.ids = board?.ids || [];
        state.selected = null;
        state.history = [];
        state.shared = Boolean(board);
        state.revealed = !board;
      }
      if (board) {
        if (!hasLocalePreference) state.loc = chooseLang(board.lang);
        syncBoardHash();
      } else {
        toast(tr('invalid'));
      }
    } else if (state.page === 'desk' && state.shared) {
      state.shared = false;
    }
    render();
  }
  function refreshBoard() {
    $('board').outerHTML = plate(state.ids);
  }
  function updateIds(ids, selected = null, singleAppend = false) {
    if (!Array.isArray(ids) || ids.some((id) => !reader.byId.has(id))) return;
    state.history.push({ ids: state.ids.slice(), selected: state.selected, singleAppend });
    if (state.history.length > 30) state.history.shift();
    if (state.shared || location.hash.startsWith('#b=')) {
      activeHash = '';
      location.replace('#');
    }
    state.shared = false;
    state.ids = ids.slice();
    state.selected = selected;
    refreshBoard();
  }
  function insert(ids) {
    const at = state.selected === null ? state.ids.length : state.selected + 1;
    updateIds(
      [...state.ids.slice(0, at), ...ids, ...state.ids.slice(at)],
      state.selected === null ? null : at + ids.length - 1,
      state.selected === null && ids.length === 1,
    );
  }
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    if (button.dataset.entry) {
      const entry = window.ExileDictionary.detail(button.dataset.entry);
      if (!entry) return;
      modal('dict', entry.body);
      $('dialog-title').textContent = entry.title;
      return;
    }
    if (button.dataset.dxAdd) {
      const ids = window.ExileCatalog.get(button.dataset.dxAdd)?.sequence || [
        button.dataset.dxAdd,
      ];
      dialog.close();
      openPage('desk');
      insert(ids);
      return;
    }
    if (button.dataset.page) {
      openPage(button.dataset.page);
      return;
    }
    if (button.hasAttribute('data-slot')) {
      const i = Number(button.dataset.slot);
      state.selected = state.selected === i ? null : i;
      refreshBoard();
      app
        .querySelector('[data-slot="' + i + '"]')
        ?.focus({ preventScroll: true });
      return;
    }
    if (button.dataset.add) {
      insert([button.dataset.add]);
      return;
    }
    switch (button.dataset.act) {
      case 'export':
        button.focus({ preventScroll: true });
        modal('export', `<button type="button" class="option-row" data-act="save-card">${ico('picture')}${txt('png')}</button>
          <button type="button" class="option-row" data-act="share">${ico('link')}${txt('share')}</button>`);
        dialog.querySelector('[data-act="save-card"]').focus({ preventScroll: true });
        break;
      case 'save-card':
        dialog.close();
        saveCard(button);
        break;
      case 'share':
        dialog.close();
        shareBoard();
        break;
      case 'read-photo':
        window.ExilePhotoReader.open(state.loc, (ids) => updateIds(ids));
        break;
      case 'tail':
        state.selected = null;
        refreshBoard();
        break;
      case 'undo': {
        const at = state.selected ?? state.ids.length - 1;
        if (at < 0) break;
        updateIds(state.ids.filter((_, i) => i !== at));
        break;
      }
      case 'clear':
        updateIds([]);
        break;
      case 'restore': {
        const prior = state.history.pop();
        if (prior) {
          state.ids = prior.ids;
          state.selected = prior.selected;
          refreshBoard();
        }
        break;
      }
      case 'all-signs':
        state.allSigns = !state.allSigns;
        $('key-choices').innerHTML = keyChoices();
        $('key-choices').querySelector('[data-act="all-signs"]')?.focus({ preventScroll: true });
        break;
      case 'reveal':
        state.revealed = !state.revealed;
        if (state.revealed) window.dataLayer?.push({ event: 'glyph_reading_show' });
        $('board').dataset.revealed = String(state.revealed);
        button.setAttribute('aria-expanded', String(state.revealed));
        button.textContent = tr(state.revealed ? 'hide' : 'show');
        break;
    }
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.id === 'locale') {
      state.loc = chooseLang(el.value);
      hasLocalePreference = true;
      save('exile-ui', state.loc);
      if (state.shared && state.page === 'desk') syncBoardHash();
      render();
    }
    if (el.id === 'example' && el.value !== '') {
      updateIds(reader.examples[Number(el.value)].ids);
      el.value = '';
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'pal-query') {
      state.query = e.target.value;
      state.allSigns = false;
      $('key-choices').innerHTML = keyChoices();
    }
    if (e.target.id === 'query') {
      $('dx-results').innerHTML = window.ExileDictionary.search(e.target.value);
    }
  });
  document.addEventListener('paste', (event) => {
    if (state.page !== 'desk' || document.querySelector('dialog[open]')) return;
    const blob = window.ExileClipboard.eventImage(event);
    if (!blob) return;
    event.preventDefault();
    window.ExilePhotoReader.open(state.loc, (ids) => updateIds(ids), blob);
  });
  $('help').onclick = () =>
    modal(
      'help',
      `<div class="dialog-copy"><p>${txt('editGuide')}</p><p>${txt('guide')}</p></div>`,
    );
  $('source').onclick = () =>
    modal(
      'sources',
      `<div class="dialog-copy"><p>${txt('sourceBody')}</p><ul><li><a target="_blank" rel="noreferrer" href="https://namu.wiki/w/데블스%20플랜:%20데드%20어게인/유배지">${txt('wiki')}</a></li><li><a target="_blank" rel="noreferrer" href="https://docs.google.com/document/d/1tBPXuCcMpO4xpiQHFhDdQVlWIt3-OhRtgGIFeKNip_o/edit">${txt('boardRef')}</a></li></ul></div>`,
    );
  $('brand').onclick = (e) => {
    e.preventDefault();
    openPage('desk');
  };
  $('close').onclick = () => dialog.close();
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  window.addEventListener('hashchange', loadHash);
  loadHash();
  document.fonts
    .load('36px ExileGlyphs', reader.byId.get('bird').glyph)
    .then((f) => {
      if (!f.length) toast(tr('fontError'));
    })
    .catch(() => toast(tr('fontError')));
})();
