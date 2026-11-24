import YAML from 'yaml';
import type { BaseApiClient } from './client.js';
import { LatestYmlSchema, ManifestSchema, type LatestYml, type Manifest } from './schemas/index.js';

export class PkgEndpoints {
  public constructor(private readonly client: BaseApiClient) {}

  public async fetchLatestYml(): Promise<{ readonly raw: string; readonly parsed: LatestYml; readonly url: string }> {
    const rand = Math.random().toString(36).slice(2, 10);
    const url = `${this.client.config.api.base.pkg}/install_pkg/game_launcher/AZUPRO_JP/latest.yml?noCache=${rand}`;
    const raw = await this.client.raw.get(url).text();
    const parsed = LatestYmlSchema.parse(YAML.parse(raw));
    return { raw, parsed, url };
  }

  public async fetchManifest(manifestUrl: string, nocache: number): Promise<Manifest> {
    const separator = manifestUrl.includes('?') ? '&' : '?';
    const url = `${manifestUrl}${separator}nocache=${nocache}`;
    const json: unknown = await this.client.downloader.get(url).json();
    return ManifestSchema.parse(json);
  }
}
