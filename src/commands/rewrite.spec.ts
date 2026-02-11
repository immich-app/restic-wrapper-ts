import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { writeFile } from 'node:fs/promises';
import { backup } from './backup';
import { rewrite } from './rewrite';
import { snapshots } from './snapshots';

describe('rewrite', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await writeFile(join(dir, 'test-file'), 'data');
    await writeFile(join(dir, 'trash-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .addFile(join(dir, 'trash-file'))
      .run();

    snapshotId = snapshot_id;
  });

  it('rewrites all snapshots and keeps all versions', async () => {
    await rewrite().repository(join(dir, 'repository')).password('password').exclude('trash-file').run();

    const list = await snapshots().repository(join(dir, 'repository')).password('password').run();
    expect(list.length).toBe(2);
  });

  it('rewrites all snapshots and forgets the old ones', async () => {
    await rewrite().repository(join(dir, 'repository')).password('password').exclude('trash-file').forget().run();

    const list = await snapshots().repository(join(dir, 'repository')).password('password').run();
    expect(list.length).toBe(1);
  });

  it('rewrite one snapshot', async () => {
    await rewrite()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .exclude('trash-file')
      .run();

    const list = await snapshots().repository(join(dir, 'repository')).password('password').run();
    expect(list.length).toBe(2);
  });
});
