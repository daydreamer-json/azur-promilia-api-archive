import type { Config } from '../config.js';
import { BaseApiClient, type BaseApiClientOptions } from './client.js';
import { LauncherEndpoints } from './launcher.js';
import { PkgEndpoints } from './pkg.js';
import type {
  AdvancedConfig,
  BaseConfig,
  DownloadCdn,
  GameConfig,
  GameConfigJson,
  InstallationConfig,
  LatestYml,
  Manifest,
  OperationsResource,
  SocialMediaResource,
} from './schemas/index.js';

export type LauncherApiOptions = BaseApiClientOptions;

export class LauncherApi {
  private readonly launcher: LauncherEndpoints;
  private readonly pkg: PkgEndpoints;

  public constructor(config: Config, options: LauncherApiOptions) {
    const client = new BaseApiClient(config, options);
    this.launcher = new LauncherEndpoints(client);
    this.pkg = new PkgEndpoints(client);
  }

  public getAdvancedConfig(): Promise<AdvancedConfig> {
    return this.launcher.getAdvancedConfig();
  }

  public getBaseConfig(): Promise<BaseConfig> {
    return this.launcher.getBaseConfig();
  }

  public getGameConfig(): Promise<GameConfig> {
    return this.launcher.getGameConfig();
  }

  public getOperationsResource(): Promise<OperationsResource> {
    return this.launcher.getOperationsResource();
  }

  public getSocialMediaResource(): Promise<SocialMediaResource> {
    return this.launcher.getSocialMediaResource();
  }

  public getInstallationConfig(): Promise<InstallationConfig> {
    return this.launcher.getInstallationConfig();
  }

  public getDownloadCdn(): Promise<DownloadCdn> {
    return this.launcher.getDownloadCdn();
  }

  public getGameConfigJson(version: string, filePath: string): Promise<GameConfigJson> {
    return this.launcher.getGameConfigJson(version, filePath);
  }

  public fetchLatestYml(): Promise<{ readonly raw: string; readonly parsed: LatestYml; readonly url: string }> {
    return this.pkg.fetchLatestYml();
  }

  public fetchManifest(manifestUrl: string, nocache: number): Promise<Manifest> {
    return this.pkg.fetchManifest(manifestUrl, nocache);
  }
}

export * from './schemas/index.js';
