import path from 'node:path';
import PQueue from 'p-queue';
import { LauncherApi } from './api/index.js';
import type { Config } from './config.js';
import { downloadRawFile, saveSnapshot } from './io.js';
import logger from './logger.js';

export interface ArchiverOptions {
  readonly outputDir: string;
}

export class Archiver {
  private readonly queue: PQueue;

  public constructor(
    private readonly config: Config,
    private readonly options: ArchiverOptions,
  ) {
    this.queue = new PQueue({ concurrency: config.threadCount.network });
  }

  public async run(): Promise<void> {
    const bootstrapApi = new LauncherApi(this.config, { launcherVersion: '0.0.0' });
    const latestYml = await bootstrapApi.fetchLatestYml();
    const launcherVersion = latestYml.parsed.version;
    logger.info(`Launcher version resolved from latest.yml: ${launcherVersion}`);

    const api = new LauncherApi(this.config, { launcherVersion });
    const outputDir = this.options.outputDir;
    const rawOptions = {
      userAgent: this.config.network.userAgent.axios,
      timeout: this.config.network.timeout,
      retryCount: this.config.network.retryCount,
    };

    await this.saveLatestYml(outputDir, latestYml.raw, latestYml.parsed, latestYml.url);

    const tasks: Array<() => Promise<void>> = [
      async () => {
        const rsp = await api.getAdvancedConfig();
        const { wrote } = await saveSnapshot({ outputDir, category: 'advanced-config', req: {}, rsp });
        logger.info(`Fetched advanced-config (wrote=${wrote})`);
      },
      async () => {
        const rsp = await api.getBaseConfig();
        const { wrote } = await saveSnapshot({ outputDir, category: 'base-config', req: {}, rsp });
        logger.info(`Fetched base-config (wrote=${wrote})`);
        if (rsp.launcher_background_img !== '') {
          const dl = await downloadRawFile(rsp.launcher_background_img, outputDir, rawOptions);
          logger.info(`Background image raw (wrote=${dl.isWrote})`);
        }
      },
      async () => {
        const rsp = await api.getOperationsResource();
        const { wrote } = await saveSnapshot({ outputDir, category: 'operations-resource', req: {}, rsp });
        logger.info(`Fetched operations-resource (wrote=${wrote})`);
      },
      async () => {
        const rsp = await api.getSocialMediaResource();
        const { wrote } = await saveSnapshot({ outputDir, category: 'social-media-resource', req: {}, rsp });
        logger.info(`Fetched social-media-resource (wrote=${wrote})`);
      },
      async () => {
        try {
          const rsp = await api.getInstallationConfig();
          const { wrote } = await saveSnapshot({ outputDir, category: 'installation-config', req: {}, rsp });
          logger.info(`Fetched installation-config (wrote=${wrote})`);
          if (typeof rsp.installer_background_img === 'string' && rsp.installer_background_img !== '') {
            const dl = await downloadRawFile(rsp.installer_background_img, outputDir, rawOptions);
            logger.info(`Installer background raw (wrote=${dl.isWrote})`);
          }
        } catch (error) {
          logger.warn('installation-config trial request failed, skipping:', error);
        }
      },
      async () => {
        const rsp = await api.getDownloadCdn();
        const { wrote } = await saveSnapshot({ outputDir, category: 'download-cdn', req: {}, rsp });
        logger.info(`Fetched download-cdn (wrote=${wrote})`);
      },
    ];

    for (const task of tasks) {
      this.queue.add(task);
    }
    await this.queue.onIdle();

    const gameConfig = await api.getGameConfig();
    const gameWrote = await saveSnapshot({ outputDir, category: 'game-config', req: {}, rsp: gameConfig });
    logger.info(`Fetched game-config v${gameConfig.game_latest_version} (wrote=${gameWrote.wrote})`);

    const gameConfigJsonReq = {
      version: gameConfig.game_latest_version,
      file_path: gameConfig.game_latest_file_path,
    };
    const gameConfigJson = await api.getGameConfigJson(gameConfigJsonReq.version, gameConfigJsonReq.file_path);
    const manifest = await api.fetchManifest(gameConfigJson.url, Date.now());
    const manifestDl = await downloadRawFile(gameConfigJson.url, outputDir, rawOptions);
    logger.info(`Manifest raw (wrote=${manifestDl.isWrote}, files=${manifest.file.length})`);

    let totalBytes = 0;
    for (const entry of manifest.file) {
      const size = Number.parseInt(entry.size, 10);
      if (Number.isFinite(size)) {
        totalBytes += size;
      }
    }
    const gameConfigJsonRsp = {
      url: gameConfigJson.url,
      manifest: {
        source: manifest.source,
        fileCount: manifest.file.length,
        totalBytes,
      },
    };
    const jsonWrote = await saveSnapshot({
      outputDir,
      category: 'game-config-json',
      req: gameConfigJsonReq,
      rsp: gameConfigJsonRsp,
    });
    logger.info(`Fetched game-config-json (wrote=${jsonWrote.wrote})`);
  }

  private async saveLatestYml(outputDir: string, raw: string, parsed: { version: string }, url: string): Promise<void> {
    const urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';
    const localPath = path.join(outputDir, 'raw', urlObj.hostname, ...urlObj.pathname.split('/').filter(Boolean));
    if (!(await Bun.file(localPath).exists())) {
      await Bun.write(localPath, raw);
    }
    const { wrote } = await saveSnapshot({
      outputDir,
      category: 'latest-yml',
      req: {},
      rsp: parsed,
    });
    logger.info(`Fetched latest-yml v${parsed.version} (wrote=${wrote})`);
  }
}
