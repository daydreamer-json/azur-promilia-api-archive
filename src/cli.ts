import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { archiveCommand } from './commands/archive.js';
import { APPLICATION_NAME, VERSION_NUMBER } from './lib/meta.js';

export async function runCli(): Promise<void> {
  await yargs(hideBin(process.argv))
    .scriptName(APPLICATION_NAME)
    .command(archiveCommand)
    .demandCommand(1)
    .strict()
    .help()
    .alias('help', 'h')
    .alias('help', '?')
    .alias('version', 'V')
    .version(VERSION_NUMBER)
    .parseAsync();
}
