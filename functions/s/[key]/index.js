import reader from '../../../social/reader-shell.html';
import { sharedBoard, shareHeaders, shareUrl } from '../../../social/share-response.js';
import { siteName } from '../../../social/site.js';

const copy = {
  ko: {
    locale: 'ko_KR', title: n => `유배지 문자판 · ${n}글자`,
    description: '친구가 보낸 기호를 보고 뜻을 짐작해 보세요. 문자판에서 풀이를 펼칠 수 있습니다.',
    alt: n => `풀이를 접은 유배지 문자판 미리보기 (전체 ${n}글자)`,
  },
  en: {
    locale: 'en_US', title: n => `Shared Exile board · ${n} ${n === 1 ? 'glyph' : 'glyphs'}`,
    description: 'Try reading the glyphs your friend sent, then open the board to reveal their meanings.',
    alt: n => `Preview of a shared board with hidden readings (${n} ${n === 1 ? 'glyph' : 'glyphs'} in total)`,
  },
  ja: {
    locale: 'ja_JP', title: n => `流刑地の文字盤 · ${n}文字`,
    description: '友だちから届いた記号の意味を考えてみましょう。文字盤を開くと読みを表示できます。',
    alt: n => `読みを隠した文字盤のプレビュー（全${n}文字）`,
  },
};

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export function onRequest(context) {
  return sharedBoard(context, ({ lang, total, author }, key) => {
    const { request } = context;
    const text = copy[lang];
    const title = text.title(total) + ' | ' + siteName;
    const url = shareUrl(request, key, author);
    const image = shareUrl(request, key, author, '/card.png');
    const description = author ? 'by ' + author + ' · ' + text.description : text.description;
    const imageAlt = text.alt(total) + (author ? ' · by ' + author : '');
    const headers = {
      ...shareHeaders, 'Content-Type': 'text/html; charset=utf-8',
      'Content-Language': lang, 'Cache-Control': 'no-cache',
    };
    if (request.method === 'HEAD') return new Response(null, { headers });

    const tags = [
      ['og:type', 'website'], ['og:site_name', siteName], ['og:title', title],
      ['og:description', description], ['og:locale', text.locale], ['og:url', url],
      ['og:image', image], ['og:image:type', 'image/png'], ['og:image:width', '1200'],
      ['og:image:height', '630'], ['og:image:alt', imageAlt],
      ['twitter:card', 'summary_large_image'], ['twitter:title', title],
      ['twitter:description', description], ['twitter:image', image], ['twitter:image:alt', imageAlt],
    ];
    const meta = tags.map(([key, value]) => {
      const attribute = key.startsWith('og:') ? 'property' : 'name';
      const escaped = escapeAttribute(value);
      return `<meta ${attribute}="${key}" content="${escaped}">`;
    }).join('');
    // The same static reader shell powers both the generator and a received board.
    return new HTMLRewriter()
      .on('html', { element(el) { el.setAttribute('lang', lang); } })
      .on('head', { element(el) {
        el.prepend('<base href="/reader/">', { html: true });
        el.append(`<link rel="canonical" href="${escapeAttribute(url)}"><meta name="robots" content="noindex, follow">` + meta, { html: true });
      } })
      .on('main#app', { element(el) {
        // The recipient can see the board even before the reader or its webfont loads.
        el.setInnerContent(
          `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(imageAlt)}" width="1200" height="630" style="display:block;width:100%;height:auto" fetchpriority="high">`,
          { html: true },
        );
      } })
      .on('a#brand', { element(el) { el.setAttribute('href', '/'); } })
      .on('head > title', { element(el) { el.setInnerContent(title); } })
      .on('meta[name="description"]', { element(el) {
        el.replace(`<meta name="description" content="${escapeAttribute(description)}">`, { html: true });
      } })
      .transform(new Response(reader, { headers }));
  });
}
