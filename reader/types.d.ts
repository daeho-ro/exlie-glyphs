type ReaderLocale = 'ko' | 'en' | 'ja';
type LocalizedText = Record<ReaderLocale, string>;
type WordAliases = Partial<Record<ReaderLocale, string[]>>;
type InflectedClass = 'noun' | 'verb' | 'adjective' | 'adverb';
type GlyphClass = InflectedClass | 'number' | 'ordinal' | 'operator' | 'conjunction' |
  'pronoun' | 'preposition' | 'auxiliary' | 'marker';
type WordClass = GlyphClass | 'phrase';
type ReadingStatus = 'attested' | 'inferred' | 'interpreted';

interface CatalogEntry {
  id: string;
  root: string;
  pos: WordClass;
  labels: LocalizedText;
  zones: number[];
  status: ReadingStatus;
  meaningKnown: boolean;
  source: string;
  readonly shapeId: string | null;
  modelFrom?: string;
  sequence?: string[];
  color?: boolean;
  colorOf?: string | null;
  basisZones?: number[];
  notes?: LocalizedText;
  aliases?: WordAliases;
}
interface CatalogZone {
  id: number;
  labels: LocalizedText;
  notes: LocalizedText;
  source: string;
}
interface CatalogRule extends Omit<CatalogZone, 'id'> {
  id: string;
  zones: number[];
}
interface CatalogApi {
  entries: CatalogEntry[];
  forms: CatalogEntry[];
  zones: CatalogZone[];
  rules: CatalogRule[];
  sources: Record<'wiki' | 'panel' | 'mirror' | 'clip' | 'episode' | 'stellaNotes', string>;
  family(id: string): CatalogEntry[];
  get(id: string): CatalogEntry | undefined;
}

interface ReadingToken extends CatalogEntry {
  glyph: string;
}
type ExampleRow = [zone: number, ids: string, ko: string, en: string, ja: string];
interface BoardExample {
  zone: number;
  ids: string[];
  texts: LocalizedText;
}
interface ReadingApi {
  tokens: ReadingToken[];
  byId: Map<string, ReadingToken>;
  examples: BoardExample[];
  languages: ReaderLocale[];
  read(ids: readonly string[], lang?: string): {
    words: (ReadingToken & {label: string})[];
    gloss: string;
    example: BoardExample | null;
  };
}

interface GlyphForm {
  code: number;
  attested: boolean;
  id: string | null;
}
interface GlyphComposition {
  byId: Record<string, string>;
  forms: Record<string, Partial<Record<WordClass, GlyphForm>>>;
  bareCodes: Record<string, number>;
  rootGlyph(id: string): string;
}
interface GlyphCodeDescription {
  pos: GlyphClass;
  prefix: string;
  colour: boolean;
  root: string | null;
  rootCode: string;
}
interface GlyphCodes {
  readonly version: 2;
  readonly width: 4;
  readonly byId: Readonly<Record<string, string>>;
  readonly byCode: Readonly<Record<string, string>>;
  describe(id: string): Readonly<GlyphCodeDescription> | undefined;
}

interface BoardContents {
  ids: string[];
  lang: ReaderLocale;
}
interface SharedBoard extends BoardContents {
  total: number;
}
interface BoardLinkCodec {
  sharePath(ids: readonly string[], lang?: ReaderLocale): string;
  parseShareKey(key: unknown): SharedBoard | null;
  readBoardAt(key: unknown, hash?: string): BoardContents | null;
}
interface BoardLinksApi {
  readonly siteOrigin: string;
  create(entries: Iterable<readonly [id: string, code: string]>): BoardLinkCodec;
  normalizeAuthor(value: unknown): string;
  authorPath(author: unknown): string;
  readAuthor(url: string | URL): string;
}

declare var ExileBoardLinks: BoardLinksApi;
interface Window {
  ExileBoardLinks: BoardLinksApi;
  ExileCatalog: CatalogApi;
  ExileCodes: GlyphCodes;
  ExileComposition: GlyphComposition;
  ExileEngine: { tokens: ReadingToken[] };
  ExileExamples: ExampleRow[];
  ExileGlyphMap: Record<string, number>;
  ExileReading: ReadingApi;
}
