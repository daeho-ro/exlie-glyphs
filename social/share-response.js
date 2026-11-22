import { normalizeAuthor, parseShareKey } from './board-link.js';

// Pages runs Functions only for /s/*. Both endpoints accept the exact same keys.
export function sharedBoard(context, respond) {
  const { request, params } = context;
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const board = parseShareKey(params.key);
  if (!board) {
    return new Response(null, { status: 404, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  const author = normalizeAuthor(new URL(request.url).searchParams.get('by'));
  return respond({ ...board, author }, params.key);
}

export function shareUrl(request, key, author, suffix = '') {
  const url = new URL('/s/' + key + suffix, request.url);
  if (author) url.searchParams.set('by', author);
  return url.href;
}

export const shareHeaders = {
  'Referrer-Policy': 'origin',
  'X-Robots-Tag': 'noindex',
  'X-Content-Type-Options': 'nosniff',
};
