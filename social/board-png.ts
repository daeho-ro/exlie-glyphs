import art from './assets/board-art.bin';
import authors from './assets/author-glyphs.bin';
import {createBoardRenderer} from './card-raster.ts';

export const renderBoardPng = createBoardRenderer(art, authors);
