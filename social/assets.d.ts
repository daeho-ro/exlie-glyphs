// Cloudflare Pages bundles text modules as strings and binary modules as ArrayBuffers.
declare module '*.html' {
  const html: string;
  export default html;
}
declare module '*.bin' {
  const data: ArrayBuffer;
  export default data;
}
