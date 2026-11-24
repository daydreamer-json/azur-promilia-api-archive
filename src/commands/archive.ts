import path from 'node:path';
import type { CommandModule } from 'yargs';
import { Archiver } from '../lib/archiver.js';
import { loadConfig } from '../lib/config.js';
import logger, { setLogLevel, type LogLevelString } from '../lib/logger.js';

export interface ArchiveArgs {
  readonly 'output-dir': string;
  readonly 'log-level'?: string | undefined;
}

const LOG_LEVEL_CHOICES: readonly LogLevelString[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function parseLogLevel(input: string | undefined, fallback: LogLevelString): LogLevelString {
  if (input === undefined) return fallback;
  return (LOG_LEVEL_CHOICES as readonly string[]).includes(input) ? (input as LogLevelString) : fallback;
}

export const archiveCommand: CommandModule<{}, ArchiveArgs> = {
  command: 'archive',
  describe: 'Archive launcher APIs',
  builder: (yargs) =>
    yargs.options({
      'output-dir': {
        alias: 'o',
        type: 'string',
        default: path.resolve('output'),
        normalize: true,
        describe: 'Output root directory',
      },
      'log-level': {
        type: 'string',
        choices: LOG_LEVEL_CHOICES as unknown as string[],
        describe: 'Log level',
      },
    }),
  handler: async (argv) => {
    const config = await loadConfig();
    const level = parseLogLevel(argv['log-level'], config.logger.logLevel);
    setLogLevel(level);
    logger.info(`Output directory: ${argv['output-dir']}`);
    const archiver = new Archiver(config, { outputDir: path.resolve(argv['output-dir']) });
    await archiver.run();
  },
};
