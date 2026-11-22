import { siteName, siteOrigin } from './site.js';

export function boardSchemaScript({ url, title, description, lang, image, imageAlt, author }) {
  const page = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteOrigin + '/' },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      contentUrl: image,
      encodingFormat: 'image/png',
      caption: imageAlt,
    },
  };
  if (author) page.creditText = 'by ' + author;
  // Script content uses raw HTML text. Preserve literal '<' when JSON is decoded.
  const json = JSON.stringify(page).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
