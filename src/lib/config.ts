import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import type { LogLevelString } from './logger.js';

export const LAUNCHER_VERSION_PLACEHOLDER = '__LAUNCHER_VERSION__';

const DEFAULT_SIGN_SALT = 'DE7108E9B2842FD460F4777702727869';
const DEFAULT_LAUNCHER_BASE = 'aHR0cHM6Ly9hcGktbGF1bmNoZXItanAueW8tc3Rhci5jb20=';
const DEFAULT_PKG_BASE = 'aHR0cHM6Ly9sYXVuY2hlci1wa2ctYXp1cHJvLWpwLnlvLXN0YXIuY29t';
const DEFAULT_CHROME_ELECTRON =
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) AZUPRO_JP_Gamelauncher/__LAUNCHER_VERSION__ Chrome/108.0.5359.62 Electron/22.0.0 Safari/537.36';

const LogLevelSchema = z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']);

const ConfigFileSchema = z.object({
  cipher: z
    .object({
      launcher: z
        .object({
          signSalt: z.string().min(1).default(DEFAULT_SIGN_SALT),
        })
        .default({ signSalt: DEFAULT_SIGN_SALT }),
    })
    .default({ launcher: { signSalt: DEFAULT_SIGN_SALT } }),
  api: z
    .object({
      base: z
        .object({
          launcher: z.string().min(1).default(DEFAULT_LAUNCHER_BASE),
          pkg: z.string().min(1).default(DEFAULT_PKG_BASE),
        })
        .default({ launcher: DEFAULT_LAUNCHER_BASE, pkg: DEFAULT_PKG_BASE }),
      gameTag: z.string().min(1).default('AZUPRO_JP'),
    })
    .default({
      base: { launcher: DEFAULT_LAUNCHER_BASE, pkg: DEFAULT_PKG_BASE },
      gameTag: 'AZUPRO_JP',
    }),
  network: z
    .object({
      userAgent: z
        .object({
          chromeElectron: z
            .string()
            .min(1)
            .refine((s) => s.includes(LAUNCHER_VERSION_PLACEHOLDER), {
              message: `chromeElectron must contain ${LAUNCHER_VERSION_PLACEHOLDER}`,
            })
            .default(DEFAULT_CHROME_ELECTRON),
          axios: z.string().min(1).default('axios/1.5.0'),
          minimum: z.string().min(1).default('Mozilla/5.0'),
        })
        .default({
          chromeElectron: DEFAULT_CHROME_ELECTRON,
          axios: 'axios/1.5.0',
          minimum: 'Mozilla/5.0',
        }),
      timeout: z.number().int().positive().default(20000),
      retryCount: z.number().int().min(0).default(5),
    })
    .default({
      userAgent: {
        chromeElectron: DEFAULT_CHROME_ELECTRON,
        axios: 'axios/1.5.0',
        minimum: 'Mozilla/5.0',
      },
      timeout: 20000,
      retryCount: 5,
    }),
  threadCount: z
    .object({
      network: z.number().int().positive().default(3),
    })
    .default({ network: 3 }),
  logger: z
    .object({
      logLevel: LogLevelSchema.default('info'),
    })
    .default({ logLevel: 'info' as const }),
});

export type ConfigFile = z.infer<typeof ConfigFileSchema>;

export interface Config {
  readonly cipher: { readonly launcher: { readonly signSalt: string } };
  readonly api: {
    readonly base: { readonly launcher: string; readonly pkg: string };
    readonly gameTag: string;
  };
  readonly network: {
    readonly userAgent: { readonly chromeElectron: string; readonly axios: string; readonly minimum: string };
    readonly timeout: number;
    readonly retryCount: number;
  };
  readonly threadCount: { readonly network: number };
  readonly logger: { readonly logLevel: LogLevelString };
}

function decodeBase64(input: string): string {
  return Buffer.from(input, 'base64').toString('utf8');
}

function toConfig(file: ConfigFile): Config {
  return {
    cipher: { launcher: { signSalt: file.cipher.launcher.signSalt } },
    api: {
      base: {
        launcher: decodeBase64(file.api.base.launcher),
        pkg: decodeBase64(file.api.base.pkg),
      },
      gameTag: file.api.gameTag,
    },
    network: {
      userAgent: {
        chromeElectron: file.network.userAgent.chromeElectron,
        axios: file.network.userAgent.axios,
        minimum: file.network.userAgent.minimum,
      },
      timeout: file.network.timeout,
      retryCount: file.network.retryCount,
    },
    threadCount: { network: file.threadCount.network },
    logger: { logLevel: file.logger.logLevel },
  };
}

export const CONFIG_PATH = path.resolve('config/config.yaml');

export async function loadConfig(configPath: string = CONFIG_PATH): Promise<Config> {
  const file = Bun.file(configPath);
  if (!(await file.exists())) {
    const defaults = ConfigFileSchema.parse({});
    await Bun.write(configPath, YAML.stringify(defaults));
    return Object.freeze(toConfig(defaults));
  }
  const rawText = await file.text();
  const rawData: unknown = rawText.trim() === '' ? {} : YAML.parse(rawText);
  const parsed = ConfigFileSchema.parse(rawData ?? {});
  const normalized = JSON.stringify(parsed);
  const original = JSON.stringify(rawData ?? {});
  if (original !== normalized) {
    await Bun.write(configPath, YAML.stringify(parsed));
  }
  return Object.freeze(toConfig(parsed));
}
