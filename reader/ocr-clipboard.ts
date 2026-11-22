// File selection and explicit paste both deliver a local image to the photo reader.
(() => {
  'use strict';
  const copy = {
    ko: {
      file: '사진 선택',
      fileType: '이미지 파일을 선택해 주세요.',
      button: '이미지 붙여넣기',
      area: '여기를 길게 눌러 붙여넣기',
      empty: '클립보드에 이미지가 없습니다. 사진이나 스크린샷을 복사해 주세요.',
      manual:
        '아래 영역을 길게 눌러 붙여넣으세요. 키보드에서는 ⌘V 또는 Ctrl+V를 사용할 수 있습니다.',
    },
    en: {
      file: 'Choose a photo',
      fileType: 'Choose an image file.',
      button: 'Paste image',
      area: 'Press and hold here to paste',
      empty: 'Copy a photo or screenshot, then paste it here.',
      manual:
        'Press and hold in the area below and choose Paste, or press ⌘V or Ctrl+V.',
    },
    ja: {
      file: '写真を選ぶ',
      fileType: '画像ファイルを選んでください。',
      button: '画像をペースト',
      area: '長押ししてペースト',
      empty:
        '写真またはスクリーンショットをコピーしてからペーストしてください。',
      manual:
        '下の枠を長押ししてペーストするか、⌘V または Ctrl+V を押してください。',
    },
  };
  const isImage = (type: string) =>
    typeof type === 'string' &&
    type.startsWith('image/') &&
    type !== 'image/svg+xml';
  function eventImage(event: ClipboardEvent) {
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
  function attach(dialog: HTMLDialogElement, locale: ReaderLocale, load: (blob: Blob) => void) {
    const t = copy[locale] || copy.ko;
    const host = dialog.querySelector('.ocr-upload');
    if (!host) throw new Error('Missing photo upload area');
    const picker = document.createElement('label');
    picker.className = 'action ocr-file-picker';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    picker.append(t.file, fileInput);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.dataset.pasteImage = '';
    button.textContent = t.button;
    const area = document.createElement('div');
    area.className = 'ocr-paste-area';
    area.hidden = true;
    area.contentEditable = 'true';
    area.spellcheck = false;
    area.setAttribute('inputmode', 'none');
    area.setAttribute('role', 'textbox');
    area.setAttribute('aria-label', t.area);
    area.textContent = t.area;
    const message = document.createElement('p');
    message.className = 'ocr-note';
    message.setAttribute('role', 'status');
    host.replaceChildren(picker, button, area, message);
    let generation = 0;
    function receive(blob: Blob) {
      generation++;
      if (!dialog.isConnected) return;
      message.textContent = '';
      area.hidden = true;
      load(blob);
    }
    fileInput.addEventListener('click', () => { generation++; });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      if (file.type && !file.type.startsWith('image/')) {
        generation++;
        message.textContent = t.fileType;
        return;
      }
      receive(file);
    });
    function manualPaste(messageText: string) {
      message.textContent = messageText;
      area.hidden = false;
      area.focus({ preventScroll: true });
    }
    async function fromClipboard() {
      const ticket = ++generation;
      if (typeof navigator.clipboard?.read !== 'function') {
        manualPaste(t.manual);
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
        manualPaste(t.empty);
      } catch {
        if (ticket !== generation || !dialog.isConnected) return;
        manualPaste(t.manual);
      }
    }
    function pasted(event: ClipboardEvent) {
      if (!dialog.open) return;
      const blob = eventImage(event);
      if (blob) {
        event.preventDefault();
        receive(blob);
      } else if (event.target instanceof Node && area.contains(event.target)) {
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
