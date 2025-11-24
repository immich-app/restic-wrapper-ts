import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { hostname, tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';

import * as tar from 'tar';

export async function createTempDir() {
  return mkdtemp(join(tmpdir(), 'vitest-'));
}

export async function initRepository(path: string) {
  await mkdir(path);
  await tar.x({
    file: join(import.meta.dirname, 'test-data', 'empty-repo.tar.gz'),
    cwd: path,
  });
}

/* istanbul ignore next @preserve */
export async function createLock(repositoryPath: string) {
  const data = JSON.stringify(
    {
      time: new Date().toISOString(),
      exclusive: true,
      hostname: hostname(),
      username: userInfo().username,
      pid: process.pid,
      uid: process.getuid?.(),
      gid: process.getgid?.(),
    },
    null,
    2,
  );

  await writeFile(join(repositoryPath, 'locks', createHash('sha256').update(data).digest('hex')), data);
}
