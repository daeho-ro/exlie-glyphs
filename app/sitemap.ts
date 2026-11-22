import type { MetadataRoute } from 'next';
import { siteOrigin } from '../social/site.ts';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteOrigin + '/' }];
}
