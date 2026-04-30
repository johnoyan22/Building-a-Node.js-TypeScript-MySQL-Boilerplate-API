import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AppConfig } from '../_types/config';

const root = process.cwd();
const byCwd = join(root, 'config.json');
const configPath = existsSync(byCwd) ? byCwd : join(__dirname, '..', 'config.json');

export const config: AppConfig = JSON.parse(readFileSync(configPath, 'utf8')) as AppConfig;
