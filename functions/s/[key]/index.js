import reader from '../../../dist/index.html';
import { sharedBoard, shareHeaders } from '../../../social/share-response.js';
import { siteName, siteOrigin } from '../../../social/site.js';

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

export function onRequest(context) {
  return sharedBoard(context, ({ lang, total }, key) => {
    const { request } = context;
    const text = copy[lang];
    const title = text.title(total) + ' | ' + siteName;
    const url = new URL('/s/' + key, request.url).href;
    const image = url + '/card.png';
    const headers = {
      ...shareHeaders, 'Content-Type': 'text/html; charset=utf-8',
      'Content-Language': lang, 'Cache-Control': 'public, max-age=300',
    };
    if (request.method === 'HEAD') return new Response(null, { headers });

    const tags = [
      ['og:type', 'website'], ['og:site_name', siteName], ['og:title', title],
      ['og:description', text.description], ['og:locale', text.locale], ['og:url', url],
      ['og:image', image], ['og:image:type', 'image/png'], ['og:image:width', '1200'],
      ['og:image:height', '630'], ['og:image:alt', text.alt(total)],
      ['twitter:card', 'summary_large_image'], ['twitter:title', title],
      ['twitter:description', text.description], ['twitter:image', image], ['twitter:image:alt', text.alt(total)],
    ];
    const meta = tags.map(([key, value]) => {
      const attribute = key.startsWith('og:') ? 'property' : 'name';
      const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      return `<meta ${attribute}="${key}" content="${escaped}">`;
    }).join('');
    // The same static reader shell powers both the generator and a received board.
    return new HTMLRewriter()
      .on('html', { element(el) { el.setAttribute('lang', lang); } })
      .on('head', { element(el) {
        el.prepend('<base href="/reader/">', { html: true });
        el.append(`<link rel="canonical" href="${siteOrigin}/"><meta name="robots" content="noindex, follow">` + meta, { html: true });
      } })
      .on('a#brand', { element(el) { el.setAttribute('href', '/'); } })
      .on('head > title', { element(el) { el.setInnerContent(title); } })
      .on('meta[name="description"]', { element(el) { el.setAttribute('content', text.description); } })
      .transform(new Response(reader, { headers }));
  });
}
