import { css, description, tagManager, title } from './reader-template.mjs';
import { siteName, siteOrigin } from '../social/site.js';

const preview = {
  url: '/exile-glyphs-preview.png',
  width: 1200,
  height: 630,
  type: 'image/png',
  alt: 'Exile glyphs and the Exile Glyphs logo on a dark green board',
};

export const metadata = {
  title,
  description,
  metadataBase: new URL(siteOrigin),
  applicationName: siteName,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website', locale: 'en_US', siteName, title, description,
    url: '/', images: [preview],
  },
  twitter: {
    card: 'summary_large_image', title, description,
    images: [{ url: preview.url, alt: preview.alt }],
  },
  icons: { icon: '/reader/assets/inscription.svg' },
};
const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  alternateName: ['유배지 문자열 생성기', '流刑地の文字列メーカー'],
  url: siteOrigin + '/',
  inLanguage: ['en', 'ko', 'ja'],
};

export const viewport = { themeColor: '#f7f5ef' };

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
        <script id="exile-gtm-bootstrap" dangerouslySetInnerHTML={{ __html: tagManager }} />
        {css.map(href => <link key={href} rel="stylesheet" href={href} />)}
      </head>
      <body>{children}</body>
    </html>
  );
}
