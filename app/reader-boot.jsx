'use client';

import { useEffect } from 'react';

let started;
function loadInOrder(sources) {
  return Promise.all(sources.map(src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // Dynamic scripts with async=false may download concurrently and run in
    // insertion order. The catalog and font map must exist before the UI runs.
    script.async = false;
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load ' + src));
    document.head.append(script);
  })));
}

export default function ReaderBoot({ sources }) {
  useEffect(() => {
    started ??= loadInOrder(sources).catch(error => {
      const main = document.getElementById('app');
      if (main) {
        main.setAttribute('role', 'alert');
        main.textContent = '문자판을 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
      }
      console.error(error);
    });
  }, [sources]);
  return null;
}
