import { createHash, randomBytes } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import ky, { HTTPError } from 'ky';
import { DateTime } from 'luxon';

export interface HistoryIndexEntry {
  readonly id: string;
  readonly updatedAt: string;
  readonly file: string;
  readonly hash: string;
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function historyId(): string {
  const timestamp = DateTime.utc().toFormat("yyyy-MM-dd'T'HH-mm-ss-SSS'Z'");
  return `${timestamp}-${randomBytes(4).toString('hex')}`;
}

export async function saveSnapshot<T>(options: {
  readonly outputDir: string;
  readonly category: string;
  readonly req: unknown;
  readonly rsp: T;
}): Promise<{ readonly wrote: boolean }> {
  const dir = path.join(options.outputDir, 'api', 'launcher', options.category);
  const latestPath = path.join(dir, 'latest.json');
  const historyDir = path.join(dir, 'history');
  const indexPath = path.join(historyDir, 'index.json');

  const latestFile = Bun.file(latestPath);
  if (await latestFile.exists()) {
    const current = (await latestFile.json()) as { rsp: unknown };
    if (isDeepStrictEqual(current.rsp, options.rsp)) {
      return { wrote: false };
    }
  }

  const updatedAt = DateTime.now().toISO() ?? new Date().toISOString();
  const payload = { req: options.req, rsp: options.rsp, updatedAt };
  const payloadStr = JSON.stringify(payload, null, 2);

  const id = historyId();
  const historyPath = path.join(historyDir, `${id}.json`);

  await Bun.write(historyPath, payloadStr);
  await Bun.write(latestPath, payloadStr);

  const indexFile = Bun.file(indexPath);
  const index: HistoryIndexEntry[] = (await indexFile.exists())
    ? ((await indexFile.json()) as HistoryIndexEntry[])
    : [];
  index.push({
    id,
    updatedAt,
    file: `history/${id}.json`,
    hash: sha256Hex(JSON.stringify(options.rsp)),
  });
  index.sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0));
  await Bun.write(indexPath, JSON.stringify(index, null, 2));

  return { wrote: true };
}

export async function downloadRawFile(
  url: string,
  outputDir: string,
  options: { readonly userAgent: string; readonly timeout: number; readonly retryCount: number },
): Promise<{ readonly isWrote: boolean; readonly localPath: string }> {
  const urlObj = new URL(url);
  urlObj.search = '';
  urlObj.hash = '';
  const localPath = path.join(outputDir, 'raw', urlObj.hostname, ...urlObj.pathname.split('/').filter(Boolean));
  if (await Bun.file(localPath).exists()) {
    return { isWrote: false, localPath };
  }
  try {
    const data = await ky
      .get(url, {
        headers: { 'User-Agent': options.userAgent },
        timeout: options.timeout,
        retry: { limit: options.retryCount },
      })
      .bytes();
    await Bun.write(localPath, data);
    return { isWrote: true, localPath };
  } catch (error) {
    if (error instanceof HTTPError && (error.response.status === 404 || error.response.status === 403)) {
      return { isWrote: false, localPath };
    }
    throw error;
  }
}
