import art from './assets/board-art.bin';
import authors from './assets/author-glyphs.bin';
import {createBoardRenderer} from './card-raster.js';

export const renderBoardPng = createBoardRenderer(art, authors);
