#!/usr/bin/env bun
import { runCli } from './cli.js';
import logger from './lib/logger.js';

try {
  await runCli();
} catch (error) {
  logger.error('Unhandled error:', error);
  process.exitCode = 1;
}
