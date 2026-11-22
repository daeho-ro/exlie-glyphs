import { retiredShare } from '../../social/share-response.ts';

export const onRequest: PagesFunction = ({ request, next }) => {
  const url = new URL(request.url);
  if (url.search || url.href.endsWith('?')) return retiredShare(request);
  return next();
};
