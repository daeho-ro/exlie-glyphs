import art from './assets/board-art.bin';
import {createBoardRenderer} from './card-raster.js';

export const renderBoardPng = createBoardRenderer(art);
