import { siteName, siteOrigin } from './site.ts';

interface BoardMetadata {
  url: string;
  title: string;
  description: string;
  lang: ReaderLocale;
  image: string;
  imageAlt: string;
  author: string;
}

export function boardSchemaScript({ url, title, description, lang, image, imageAlt, author }: BoardMetadata) {
  const page = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name: title,
    description,
    ...(author ? { creditText: 'by ' + author } : {}),
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteOrigin + '/' },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      contentUrl: image,
      encodingFormat: 'image/png',
      caption: imageAlt,
    },
  };
  // Script content uses raw HTML text. Preserve literal '<' when JSON is decoded.
  const json = JSON.stringify(page).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
