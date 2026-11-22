import { parseShareKey } from './board-link.ts';

type ShareContext = Pick<EventContext<unknown, 'key' | 'author', unknown>, 'request' | 'params'>;
type BoardResponder = (board: SharedBoard & { author: string }, key: string) => Response | Promise<Response>;

const expiredCopy = {
  en: ['This share link has expired', 'Open Exile Glyphs'],
  ko: ['만료된 공유 링크입니다', 'Exile Glyphs 홈으로'],
  ja: ['この共有リンクは期限切れです', 'Exile Glyphs のホームへ'],
};

export function retiredShare(request: Request) {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (new URL(request.url).pathname.endsWith('/card.png')) {
    return new Response(null, { status: 410, headers });
  }
  const languages = (request.headers.get('Accept-Language') || '').toLowerCase().split(',')
    .map(range => {
      const [tag, weight = '1'] = range.trim().split(/\s*;\s*q=/);
      return { lang: tag.split('-')[0], weight: Number(weight) };
    })
    .filter((entry): entry is { lang: keyof typeof expiredCopy; weight: number } =>
      Object.hasOwn(expiredCopy, entry.lang) && entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight);
  const lang = languages[0]?.lang || 'en';
  const [message, home] = expiredCopy[lang];
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${message} | Exile Glyphs</title>
<style>body{margin:12vh auto;padding:0 1.5rem;max-width:32rem;background:#f2eee4;color:#28281f;font:1rem/1.6 system-ui,sans-serif}h1{font-size:1.5rem}a{color:#754325}</style>
<main><h1>${message}</h1><a href="/">${home}</a></main></html>`;
  return new Response(request.method === 'HEAD' ? null : html, { status: 410, headers: {
    ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Language': lang, Vary: 'Accept-Language',
  } });
}

export function sharedBoard(context: ShareContext, respond: BoardResponder) {
  const { request, params } = context;
  const key = params.key;
  if (typeof key !== 'string') return new Response(null, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  // Old long links contain just 24 preview glyphs and a count. Their full board
  // lived in the retired URL fragment and cannot be recovered by the server.
  const preview = /^([A-Za-z0-9_-]{66})\.([1-9][0-9]{3,15})$/.exec(key);
  if (preview && Number.isSafeInteger(Number(preview[2])) && Number(preview[2]) > 2048 &&
      parseShareKey(preview[1])?.total === 24) {
    return retiredShare(request);
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const board = parseShareKey(key);
  const author = globalThis.ExileBoardLinks.readAuthor(new URL(request.url));
  if (!board || (params.author !== undefined && !author)) {
    return new Response(null, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  return respond({ ...board, author }, key);
}

export function shareUrl(request: Request, key: string, author: string, suffix = '') {
  const authorPath = globalThis.ExileBoardLinks.authorPath(author);
  return new URL('/s/' + key + authorPath + suffix, request.url).href;
}

export const shareHeaders = {
  'Referrer-Policy': 'origin',
  'X-Robots-Tag': 'noindex',
  'X-Content-Type-Options': 'nosniff',
};
