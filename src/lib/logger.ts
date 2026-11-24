import log4js from 'log4js';

export type LogLevelString = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const PATTERN = '%[%d{hh:mm:ss.SSS} %-5.0p >%] %m';

log4js.configure({
  appenders: {
    System: {
      type: 'stdout',
      layout: { type: 'pattern', pattern: PATTERN },
    },
  },
  categories: {
    default: { appenders: ['System'], level: 'info' },
  },
});

const logger: log4js.Logger = log4js.getLogger('System');

export function setLogLevel(level: LogLevelString): void {
  logger.level = level;
}

export default logger;
