import { siteOrigin } from '../social/site.js';

export const dynamic = 'force-static';

export default function sitemap() {
  return [{ url: siteOrigin + '/' }];
}
