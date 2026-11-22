import { renderBoardPng } from '../../../social/board-png.js';
import { sharedBoard, shareHeaders } from '../../../social/share-response.js';

export function onRequest(context) {
  return sharedBoard(context, async ({ ids, lang, total }, key) => {
    const headers = {
      ...shareHeaders, 'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    };
    if (context.request.method === 'HEAD') return new Response(null, { headers });
    const cacheKey = new Request(new URL('/s/' + key + '/card.png', context.request.url));
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    const png = await renderBoardPng({ ids: ids.slice(0, 24), lang, total });
    const result = new Response(png, { headers });
    context.waitUntil(cache.put(cacheKey, result.clone()));
    return result;
  });
}
