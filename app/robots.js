import { siteOrigin } from '../social/site.js';

export const dynamic = 'force-static';

export default function robots() {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: siteOrigin + '/sitemap.xml' };
}
