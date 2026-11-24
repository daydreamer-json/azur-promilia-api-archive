import { createHash } from 'node:crypto';
import { LAUNCHER_VERSION_PLACEHOLDER } from './config.js';

export function md5Hex(input: string): string {
  return createHash('md5').update(input, 'utf8').digest('hex');
}

export interface AuthHeaderOptions {
  readonly gameTag: string;
  readonly version: string;
  readonly salt: string;
  readonly data?: string;
  readonly time?: number;
}

export function buildAuthHeader(options: AuthHeaderOptions): string {
  const time = options.time ?? Math.floor(Date.now() / 1000);
  const head = { game_tag: options.gameTag, time, version: options.version };
  const data = options.data ?? '';
  const sign = md5Hex(JSON.stringify(head) + data + options.salt);
  return JSON.stringify({ head, sign });
}

export function buildChromeElectronUserAgent(template: string, version: string): string {
  return template.replaceAll(LAUNCHER_VERSION_PLACEHOLDER, version);
}
