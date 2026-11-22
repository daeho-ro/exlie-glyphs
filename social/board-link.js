import '../dist/board-links.js';
import { selectableCodes } from './selectable-codes.js';

export const { parseShareKey } = globalThis.ExileBoardLinks.create(Object.entries(selectableCodes));

export const { normalizeAuthor } = globalThis.ExileBoardLinks;
