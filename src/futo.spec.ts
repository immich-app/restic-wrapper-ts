import { mkdir, writeFile } from 'node:fs/promises';
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

  it.runIf(futo.iexcludeScopedGlob)('leaves out matching items only under the scope paths', async () => {
    const photos = join(dir, 'photos');
    const other = join(dir, 'other');
    await mkdir(join(photos, '@eaDir'), { recursive: true });
    await mkdir(join(other, '@eaDir'), { recursive: true });
    await writeFile(join(photos, 'a.jpg'), 'a');
    await writeFile(join(photos, '@eaDir', 'thumb.jpg'), 'thumb');
    await writeFile(join(other, '@eaDir', 'thumb.jpg'), 'thumb');

    const added: string[] = [];
    await backup()
      .verbose()
      .repository(join(dir, 'repository'))
      .password('password')
      .iexcludeScopedGlob({ paths: [photos], patterns: ['**/@EADIR'] })
      .addFile(photos, other)
      .on('event', (event) => {
        if (event.message_type === 'verbose_status' && event.action === 'new') {
          added.push(event.item);
        }
      })
      .run();

    expect(added).toContain(join(photos, 'a.jpg'));
    expect(added).toContain(join(other, '@eaDir', 'thumb.jpg'));
    expect(added.filter((item) => item.startsWith(join(photos, '@eaDir')))).toEqual([]);
  });

  it.runIf(futo.iexcludeScopedGlob)('fails on an invalid scoped glob pattern', async () => {
    await expect(
      backup()
        .repository(join(dir, 'repository'))
        .password('password')
        .iexcludeScopedGlob({ paths: [dir], patterns: ['['] })
        .addFile(join(dir, 'test-file'))
        .run(),
    ).rejects.toThrow();
  });
});
