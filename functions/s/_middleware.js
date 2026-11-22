import { retiredShare } from '../../social/share-response.js';

export function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.search || url.href.endsWith('?')) return retiredShare(request);
  return next();
}
