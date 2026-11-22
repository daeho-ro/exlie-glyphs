type OcrImage = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap;

interface OcrPoint { x: number; y: number }
interface OcrLine { start: OcrPoint; end: OcrPoint; height: number; estimated?: boolean }
interface OcrOptions extends OcrLine {
  count?: number;
  probe?: boolean;
  signal?: AbortSignal;
  onProgress?(fraction: number): void;
}
interface OcrCell {
  box: { x: number; y: number; width: number; height: number };
  preview: string;
  candidates: { id: string; score: number }[];
  inferredBlank?: boolean;
  inkHeight?: number;
  whole?: boolean;
}
interface OcrResult {
  cells: OcrCell[];
  count: number;
  width: number;
  height: number;
  angle: number;
  preview: string;
}
interface Window {
  ExileOCR: {
    recognize(image: OcrImage, options: OcrOptions): Promise<OcrResult>;
    suggestLine(image: OcrImage, options?: { signal?: AbortSignal }): Promise<OcrLine>;
  };
  ExilePhotoReader: { open(locale: ReaderLocale, apply: (ids: string[]) => void, initialFile?: Blob): void };
  ExileClipboard: {
    eventImage(event: ClipboardEvent): File | null;
    attach(dialog: HTMLDialogElement, locale: ReaderLocale, load: (blob: Blob) => void): () => void;
  };
}
