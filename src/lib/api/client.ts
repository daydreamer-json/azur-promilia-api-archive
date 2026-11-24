import ky, { type KyInstance } from 'ky';
import { buildAuthHeader, buildChromeElectronUserAgent } from '../auth.js';
import type { Config } from '../config.js';
import { envelopeSchema } from './schemas/envelope.js';

export interface BaseApiClientOptions {
  readonly launcherVersion: string;
}

export class BaseApiClient {
  public readonly api: KyInstance;
  public readonly downloader: KyInstance;
  public readonly raw: KyInstance;

  public constructor(
    public readonly config: Config,
    public readonly options: BaseApiClientOptions,
  ) {
    const chromeUA = buildChromeElectronUserAgent(config.network.userAgent.chromeElectron, options.launcherVersion);
    this.api = ky.create({
      headers: {
        'User-Agent': chromeUA,
        'Content-Type': 'application/json;charset=UTF-8',
      },
      timeout: config.network.timeout,
      retry: { limit: config.network.retryCount },
    });
    this.downloader = ky.create({
      headers: {
        'User-Agent': config.network.userAgent.axios,
        'Cache-Control': 'no-cache',
      },
      timeout: config.network.timeout,
      retry: { limit: config.network.retryCount },
    });
    this.raw = ky.create({
      headers: { 'User-Agent': config.network.userAgent.axios },
      timeout: config.network.timeout,
      retry: { limit: config.network.retryCount },
    });
  }

  public authHeader(): string {
    return buildAuthHeader({
      gameTag: this.config.api.gameTag,
      version: this.options.launcherVersion,
      salt: this.config.cipher.launcher.signSalt,
      data: '',
    });
  }

  public async getEnvelope<T>(path: string, dataSchema: import('zod').ZodType<T>): Promise<T> {
    const url = `${this.config.api.base.launcher}${path}`;
    const json: unknown = await this.api.get(url, { headers: { Authorization: this.authHeader() } }).json();
    const envelope = envelopeSchema(dataSchema).parse(json);
    if (envelope.code !== 200) {
      throw new Error(`API responded with non-200 code: ${path} -> ${envelope.code}`);
    }
    return envelope.data;
  }
}
