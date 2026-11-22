import { css, description, title } from './reader-template.mjs';

export const metadata = {
  title,
  description,
  icons: { icon: './reader/assets/divine-trial.svg' },
};
export const viewport = { themeColor: '#f7f5ef' };

export default function Layout({ children }) {
  return (
    <html lang="ko">
      <head>{css.map(href => <link key={href} rel="stylesheet" href={href} />)}</head>
      <body>{children}</body>
    </html>
  );
}
