import { renderBoardPng } from '../../../social/board-png.js';
import { sharedBoard, shareHeaders, shareUrl } from '../../../social/share-response.js';

export function onRequest(context) {
  return sharedBoard(context, async ({ ids, lang, total, author }, key) => {
    const headers = {
      ...shareHeaders, 'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    };
    if (context.request.method === 'HEAD') return new Response(null, { headers });
    const cacheKey = new Request(shareUrl(context.request, key, author, '/card.png'));
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    const png = await renderBoardPng({ ids: ids.slice(0, 24), lang, total, author });
    const result = new Response(png, { headers });
    context.waitUntil(cache.put(cacheKey, result.clone()));
    return result;
  });
}
