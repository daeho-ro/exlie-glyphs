import { parseShareKey } from './board-link.js';

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
  return respond(board, params.key);
}

export const shareHeaders = {
  'Referrer-Policy': 'origin',
  'X-Robots-Tag': 'noindex',
  'X-Content-Type-Options': 'nosniff',
};
