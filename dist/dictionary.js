(() => {
  'use strict';
  const catalog = window.ExileCatalog;
  const reading = window.ExileReading;
  const codes = window.ExileCodes;
  const composition = window.ExileComposition;
  const dictionary = {
    ko: {
      title: '문자 사전', search: '단어 검색', empty: '일치하는 단어가 없습니다.',
      root: '어근', unknownRoot: '뜻 미확인', forms: '변형', parts: '구성 문자',
      unknown: '뜻 미확인', proposed: '추정한 뜻', add: '문자판에 추가',
      noun: '명사', verb: '동사', adjective: '형용사', adverb: '부사', numbers: '수와 연산',
      functionWords: '기능어', phrase: '표현', number: '수', ordinal: '서수', operator: '연산',
      conjunction: '접속사', pronoun: '대명사', preposition: '전치사', auxiliary: '조동사', marker: '표지',
    },
    en: {
      title: 'Glyph dictionary', search: 'Search words', empty: 'No matching words.',
      root: 'Root', unknownRoot: 'Root of unknown meaning', forms: 'Other forms', parts: 'Component signs',
      unknown: 'Meaning unknown', proposed: 'Proposed reading', add: 'Add to board',
      noun: 'Noun', verb: 'Verb', adjective: 'Adjective', adverb: 'Adverb', numbers: 'Numbers and operators',
      functionWords: 'Function words', phrase: 'Expression', number: 'Number', ordinal: 'Ordinal', operator: 'Operator',
      conjunction: 'Conjunction', pronoun: 'Pronoun', preposition: 'Preposition', auxiliary: 'Auxiliary', marker: 'Marker',
    },
    ja: {
      title: '文字辞典', search: '単語を検索', empty: '一致する単語がありません。',
      root: '語根', unknownRoot: '意味が不明の語根', forms: '派生形', parts: '構成文字',
      unknown: '意味不明', proposed: '推定される意味', add: '文字盤に追加',
      noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞', numbers: '数と演算',
      functionWords: '機能語', phrase: '表現', number: '数', ordinal: '序数', operator: '演算',
      conjunction: '接続詞', pronoun: '代名詞', preposition: '前置詞', auxiliary: '助動詞', marker: '標識',
    },
  };
  let locale = 'ko';
  let query = '';
  const groups = ['noun', 'verb', 'adjective', 'adverb', 'numbers', 'functionWords', 'phrase'];
  const groupByPos = {
    number: 'numbers', ordinal: 'numbers', operator: 'numbers', pronoun: 'functionWords',
    conjunction: 'functionWords', preposition: 'functionWords', auxiliary: 'functionWords', marker: 'functionWords',
  };
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const text = (key) => dictionary[locale][key];
  const label = (entry) => entry.meaningKnown === false ? text('unknown') : entry.labels[locale];
  const normalize = (value) => value.normalize('NFKC').toLowerCase().trim();
  const words = new Map(catalog.entries.map((entry) => [
    entry.id, [...Object.values(entry.labels), ...Object.values(entry.aliases || {}).flat()].map(normalize),
  ]));

  function glyph(entry) {
    if (entry.sequence) return entry.sequence.map((id) => reading.byId.get(id)?.glyph || '').join('');
    const token = reading.byId.get(entry.id);
    if (token) return token.glyph;
    const family = composition.byId[entry.modelFrom] || entry.root;
    const code = composition.forms[family]?.[entry.pos]?.code;
    return code ? String.fromCodePoint(code) : '';
  }
  function ink(entry, className) {
    return `<span aria-hidden="true" class="${className} glyph${entry.sequence ? ' compound' : ''}">${escape(glyph(entry))}</span>`;
  }
  function resultBody() {
    const term = normalize(query);
    const entries = catalog.entries.filter((entry) => term
      ? words.get(entry.id).some((word) => word.includes(term))
      : entry.status !== 'inferred');
    if (!entries.length) return `<p class="empty-result" role="status">${text('empty')}</p>`;
    const grouped = new Map();
    for (const entry of entries) {
      const group = groupByPos[entry.pos] || entry.pos;
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group).push(entry);
    }
    const order = new Intl.Collator(locale, { numeric: true });
    return groups.filter((group) => grouped.has(group)).map((group) => {
      const tiles = grouped.get(group).sort((a, b) => order.compare(label(a), label(b))).map((entry) =>
        `<button type="button" class="entry-tile" data-entry="${escape(entry.id)}">${ink(entry, 'entry-ink')}<span class="entry-name">${escape(label(entry))}</span></button>`);
      return `<section class="word-class"><h2>${text(group)}</h2><div class="entries-grid">${tiles.join('')}</div></section>`;
    }).join('');
  }
  function page(language) {
    locale = Object.hasOwn(dictionary, language) ? language : 'ko';
    return `<h1 id="dictionary-title">${text('title')}</h1>
      <label class="dict-search"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg>
      <input id="query" type="search" class="field" aria-label="${text('search')}" placeholder="${text('search')}" value="${escape(query)}"></label><div id="dx-results">${resultBody()}</div>`;
  }
  function row(entry) {
    const name = entry.meaningKnown && entry.status === 'inferred'
      ? `<span title="${text('proposed')}">${escape(label(entry))}?</span>` : escape(label(entry));
    const content = `${ink(entry, 'form-ink')}<span class="form-name">${name}</span><small class="form-pos">${text(entry.pos)}</small>`;
    return entry.meaningKnown
      ? `<button type="button" class="form-row" data-entry="${escape(entry.id)}">${content}</button>`
      : `<div class="form-row">${content}</div>`;
  }
  function related(entry) {
    const description = codes.describe(entry.id);
    const rootId = description ? description.root : entry.root;
    const root = catalog.get(rootId);
    const variants = catalog.family(entry.id).filter((form) => form.id !== entry.id);
    if (!variants.length) return '';
    const bare = composition.rootGlyph(rootId || entry.id);
    const rootInk = bare ? `<span aria-hidden="true" class="root-ink glyph">${escape(bare)}</span>` : '';
    const rootWord = `<div class="root-word">${rootInk}<div><small>${text('root')}</small><strong>${escape(rootId && root ? label(root) : text('unknownRoot'))}</strong></div></div>`;
    return `${rootWord}<h3>${text('forms')}</h3><div class="form-list">${variants.map(row).join('')}</div>`;
  }
  function detail(id) {
    const entry = catalog.get(id);
    if (!entry) return;
    const translations = Object.entries(entry.labels).filter(([lang]) => lang !== locale)
      .map(([lang, value]) => `<span lang="${lang}">${escape(value)}</span>`).join(' · ');
    const lead = `<div class="detail-word">${ink(entry, 'detail-ink')}<div><strong>${text(entry.pos)}</strong><p>${translations}</p></div></div>`;
    const parts = entry.sequence
      ? `<h3>${text('parts')}</h3><div class="component-list">${entry.sequence.map((part) => row(catalog.get(part))).join('')}</div>`
      : related(entry);
    const canAdd = entry.sequence ? entry.sequence.every((part) => reading.byId.has(part)) : reading.byId.has(id);
    const action = canAdd ? `<div class="detail-actions"><button type="button" class="action" data-dx-add="${escape(id)}">${text('add')}</button></div>` : '';
    return { title: label(entry), body: `<div class="word-detail">${lead}${parts}${action}</div>` };
  }
  function search(value) {
    query = value;
    return resultBody();
  }
  window.ExileDictionary = { page, detail, search };
})();
