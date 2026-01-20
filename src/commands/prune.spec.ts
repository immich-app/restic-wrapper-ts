import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { writeFile } from 'node:fs/promises';
import { backup } from './backup';
import { forget } from './forget';
import { prune } from './prune';
import { list } from './list';

describe('prune', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await writeFile(join(dir, 'test-file'), 'data');
    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    await forget().repository(join(dir, 'repository')).password('password').snapshot(snapshot_id).run();
  });

  it('prunes old data', async () => {
    const blobsBefore = await list().repository(join(dir, 'repository')).password('password').type('blobs').run();
    await prune().repository(join(dir, 'repository')).password('password').run();
    const blobsAfter = await list().repository(join(dir, 'repository')).password('password').type('blobs').run();

    expect(blobsBefore).not.toEqual(blobsAfter);
  });
});
