import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { writeFile } from 'node:fs/promises';
import { backup } from './backup';
import { copy } from './copy';
import { snapshots } from './snapshots';

describe('copy', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await initRepository(join(dir, 'repository2'));

    await writeFile(join(dir, 'pwd'), 'password');
    await writeFile(join(dir, 'test-file'), 'test');
    await writeFile(join(dir, 'other-file'), 'test');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    snapshotId = snapshot_id;

    await backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'other-file')).run();
  });

  it('copies everything to new repository', async () => {
    await copy()
      .fromRepo(join(dir, 'repository'))
      .fromPasswordFile(join(dir, 'pwd'))
      .repository(join(dir, 'repository2'))
      .password('password')
      .run();

    await expect(snapshots().repository(join(dir, 'repository2')).password('password').run()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paths: expect.arrayContaining([expect.stringContaining('test-file')]),
        }),
        expect.objectContaining({
          paths: expect.arrayContaining([expect.stringContaining('other-file')]),
        }),
      ]),
    );
  });

  it('copies only one snapshot to new repository', async () => {
    await copy()
      .fromRepo(join(dir, 'repository'))
      .fromPasswordFile(join(dir, 'pwd'))
      .repository(join(dir, 'repository2'))
      .password('password')
      .snapshot(snapshotId)
      .run();

    const list = await snapshots().repository(join(dir, 'repository2')).password('password').run();

    expect(list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          paths: expect.arrayContaining([expect.stringContaining('test-file')]),
        }),
      ]),
    );

    expect(list).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          paths: expect.arrayContaining([expect.stringContaining('other-file')]),
        }),
      ]),
    );
  });
});
