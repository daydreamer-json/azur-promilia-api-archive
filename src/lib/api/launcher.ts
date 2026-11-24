import type { BaseApiClient } from './client.js';
import {
  AdvancedConfigSchema,
  BaseConfigSchema,
  DownloadCdnSchema,
  GameConfigJsonSchema,
  GameConfigSchema,
  InstallationConfigSchema,
  OperationsResourceSchema,
  SocialMediaResourceSchema,
  envelopeSchema,
  type AdvancedConfig,
  type BaseConfig,
  type DownloadCdn,
  type GameConfig,
  type GameConfigJson,
  type InstallationConfig,
  type OperationsResource,
  type SocialMediaResource,
} from './schemas/index.js';

export class LauncherEndpoints {
  public constructor(private readonly client: BaseApiClient) {}

  public getAdvancedConfig(): Promise<AdvancedConfig> {
    return this.client.getEnvelope('/api/launcher/advanced/config', AdvancedConfigSchema);
  }

  public getBaseConfig(): Promise<BaseConfig> {
    return this.client.getEnvelope('/api/launcher/base/config', BaseConfigSchema);
  }

  public getGameConfig(): Promise<GameConfig> {
    return this.client.getEnvelope('/api/launcher/game/config', GameConfigSchema);
  }

  public getOperationsResource(): Promise<OperationsResource> {
    return this.client.getEnvelope('/api/launcher/operations/resource', OperationsResourceSchema);
  }

  public getSocialMediaResource(): Promise<SocialMediaResource> {
    return this.client.getEnvelope('/api/launcher/social/media/resource', SocialMediaResourceSchema);
  }

  public getInstallationConfig(): Promise<InstallationConfig> {
    return this.client.getEnvelope('/api/launcher/installation/config', InstallationConfigSchema);
  }

  public getDownloadCdn(): Promise<DownloadCdn> {
    return this.client.getEnvelope('/api/launcher/advanced/game/download/cdn', DownloadCdnSchema);
  }

  public async getGameConfigJson(version: string, filePath: string): Promise<GameConfigJson> {
    const url = `${this.client.config.api.base.launcher}/api/launcher/game/config/json`;
    const json: unknown = await this.client.api
      .get(url, {
        searchParams: { version, file_path: filePath },
        headers: { Authorization: this.client.authHeader() },
      })
      .json();
    const envelope = envelopeSchema(GameConfigJsonSchema).parse(json);
    if (envelope.code !== 200) {
      throw new Error(`API responded with non-200 code: game/config/json -> ${envelope.code}`);
    }
    return envelope.data;
  }
}
