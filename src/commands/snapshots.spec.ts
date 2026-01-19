import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { backup } from './backup';
import { snapshots } from './snapshots';

describe('init', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    snapshotId = snapshot_id;
  });

  it('lists snapshots', async () => {
    await expect(snapshots().repository(join(dir, 'repository')).password('password').run()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: snapshotId,
        }),
      ]),
    );
  });
});
