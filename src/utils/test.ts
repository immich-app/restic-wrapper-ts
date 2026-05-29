import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
