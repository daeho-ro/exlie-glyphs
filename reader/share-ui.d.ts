interface Window {
  ExileDictionary: {
    page(language: string): string;
    search(query: string): string;
    detail(id: string): { title: string; body: string } | undefined;
  };
  ExileShare: {
    createBoardLink(ids: readonly string[], lang?: ReaderLocale, author?: string): string;
    parseShareKey: BoardLinkCodec['parseShareKey'];
    readBoardAt: BoardLinkCodec['readBoardAt'];
    png(ids: readonly string[], lang?: string, showReading?: boolean, author?: string): Promise<Blob>;
    download(image: Blob, filename?: string): void;
  };
}
