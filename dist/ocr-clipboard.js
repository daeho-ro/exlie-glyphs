// Only read clipboard images during an explicit paste action on this device.
(() => {
  'use strict';
  const copy = {
    ko: {
      button: '이미지 붙여넣기',
      area: '여기를 길게 눌러 붙여넣기',
      empty: '클립보드에 이미지가 없습니다. 사진이나 스크린샷을 복사해 주세요.',
      manual:
        '아래 영역을 길게 눌러 붙여넣으세요. 키보드에서는 ⌘V 또는 Ctrl+V를 사용할 수 있습니다.',
    },
    en: {
      button: 'Paste image',
      area: 'Press and hold here to paste',
      empty: 'Copy a photo or screenshot, then paste it here.',
      manual:
        'Press and hold in the area below and choose Paste, or press ⌘V or Ctrl+V.',
    },
    ja: {
      button: '画像をペースト',
      area: '長押ししてペースト',
      empty:
        '写真またはスクリーンショットをコピーしてからペーストしてください。',
      manual:
        '下の枠を長押ししてペーストするか、⌘V または Ctrl+V を押してください。',
    },
  };
  const isImage = (type) =>
    typeof type === 'string' &&
    type.startsWith('image/') &&
    type !== 'image/svg+xml';
  function eventImage(event) {
    const data = event.clipboardData;
    if (!data) return null;
    for (const item of data.items || []) {
      if (item.kind === 'file' && isImage(item.type)) {
        const image = item.getAsFile();
        if (image) return image;
      }
    }
    return (
      Array.from(data.files || []).find((file) => isImage(file.type)) || null
    );
  }
  function attach(dialog, locale, load) {
    const t = copy[locale] || copy.ko;
    const host = dialog.querySelector('.ocr-upload');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action';
    button.dataset.pasteImage = '';
    button.textContent = t.button;
    const area = document.createElement('div');
    area.className = 'ocr-paste-area';
    area.contentEditable = 'true';
    area.spellcheck = false;
    area.setAttribute('inputmode', 'none');
    area.setAttribute('role', 'textbox');
    area.setAttribute('aria-label', t.area);
    area.textContent = t.area;
    const message = document.createElement('p');
    message.className = 'ocr-note';
    message.setAttribute('role', 'status');
    host.replaceChildren(button, area, message);
    let generation = 0;
    function receive(blob) {
      generation++;
      if (!dialog.isConnected) return;
      message.textContent = '';
      load(blob);
    }
    async function fromClipboard() {
      const ticket = ++generation;
      if (typeof navigator.clipboard?.read !== 'function') {
        message.textContent = t.manual;
        area.focus({ preventScroll: true });
        return;
      }
      try {
        const items = await navigator.clipboard.read();
        if (ticket !== generation || !dialog.isConnected) return;
        for (const item of items) {
          const format = item.types.find(isImage);
          if (!format) continue;
          const blob = await item.getType(format);
          if (ticket === generation) receive(blob);
          return;
        }
        message.textContent = t.empty;
      } catch {
        if (ticket !== generation || !dialog.isConnected) return;
        message.textContent = t.manual;
        area.focus({ preventScroll: true });
      }
    }
    function pasted(event) {
      if (!dialog.open) return;
      const blob = eventImage(event);
      if (blob) {
        event.preventDefault();
        receive(blob);
      } else if (area.contains(event.target)) {
        event.preventDefault();
        message.textContent = t.empty;
      }
    }
    // Editable only to make the mobile OS Paste command available.
    area.addEventListener('beforeinput', (e) => e.preventDefault());
    area.addEventListener('input', () => {
      area.textContent = t.area;
    });
    button.addEventListener('click', fromClipboard);
    document.addEventListener('paste', pasted);
    return () => {
      generation++;
      document.removeEventListener('paste', pasted);
    };
  }
  window.ExileClipboard = { attach, eventImage };
})();
