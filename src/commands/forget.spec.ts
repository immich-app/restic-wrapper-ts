import { writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { join } from 'node:path';

import { backup } from './backup';
import { forget } from './forget';
import { snapshots } from './snapshots';

describe('forget', () => {
  let dir: string;
  let snapshotId1: string;
  let snapshotId2: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id: snapshot_id_1 } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    const { snapshot_id: snapshot_id_2 } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    snapshotId1 = snapshot_id_1;
    snapshotId2 = snapshot_id_2;
  });

  it('forgets snapshot', async () => {
    await expect(
      snapshots().repository(join(dir, 'repository')).password('password').run()
    ).resolves.toHaveLength(2);

    await expect(
      forget()
        .repository(join(dir, 'repository'))
        .password('password')
        .snapshot(snapshotId2)
        .run()
    ).resolves.toBeUndefined();

    await expect(
      snapshots().repository(join(dir, 'repository')).password('password').run()
    ).resolves.toHaveLength(1);
  });

  it('keeps last 1', async () => {
    await expect(
      snapshots().repository(join(dir, 'repository')).password('password').run()
    ).resolves.toHaveLength(2);

    await expect(
      forget()
        .repository(join(dir, 'repository'))
        .password('password')
        .keepLast(1)
        .run()
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keep: expect.arrayContaining([
            expect.objectContaining({
              id: snapshotId2,
            }),
          ]),
          reasons: expect.arrayContaining([
            expect.objectContaining({
              matches: ['last snapshot'],
            }),
          ]),
          remove: expect.arrayContaining([
            expect.objectContaining({
              id: snapshotId1,
            }),
          ]),
        }),
      ])
    );

    await expect(
      snapshots().repository(join(dir, 'repository')).password('password').run()
    ).resolves.toHaveLength(1);
  });
});
