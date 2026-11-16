import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { backup, features, version } from './commands';
import { createTempDir, initRepository } from './utils/test';

const futo = features(await version());

describe('futo-org/restic', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();

    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'test');
  });

  it.runIf(futo.walkConcurrency)('backs up with a walk concurrency', async () => {
    const { total_files_processed } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .walkConcurrency(4)
      .addFile(join(dir, 'test-file'))
      .run();

    expect(total_files_processed).toBe(1);
  });
});
