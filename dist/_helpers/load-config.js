"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const root = process.cwd();
const byCwd = (0, path_1.join)(root, 'config.json');
const configPath = (0, fs_1.existsSync)(byCwd) ? byCwd : (0, path_1.join)(__dirname, '..', 'config.json');
exports.config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf8'));
