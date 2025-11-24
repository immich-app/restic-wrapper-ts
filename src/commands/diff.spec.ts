import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { MissingCompareError } from '../errors';
import { backup } from './backup';
import { diff } from './diff';

describe('diff', () => {
  let dir: string;
  let snapshotA: string;
  let snapshotB: string;

  beforeAll(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await writeFile(join(dir, 'test-file'), 'data');
    await writeFile(join(dir, 'deleted-file'), 'data');

    const { snapshot_id: snapshot_a } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .addFile(join(dir, 'deleted-file'))
      .run();

    await writeFile(join(dir, 'test-file'), 'changed data');
    await writeFile(join(dir, 'new-file'), 'new data');

    const { snapshot_id: snapshot_b } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .addFile(join(dir, 'new-file'))
      .run();

    snapshotA = snapshot_a;
    snapshotB = snapshot_b;
  });

  it('correctly produces a diff', async () => {
    await expect(
      diff().repository(join(dir, 'repository')).password('password').compare(snapshotA, snapshotB).run(),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringMatching(/deleted-file/),
          modifier: '-',
        }),
        expect.objectContaining({
          path: expect.stringMatching(/new-file/),
          modifier: '+',
        }),
        expect.objectContaining({
          path: expect.stringMatching(/test-file/),
          modifier: 'M',
        }),
        expect.objectContaining({
          source_snapshot: snapshotA,
          target_snapshot: snapshotB,
          added: expect.objectContaining({
            files: 1,
          }),
          removed: expect.objectContaining({
            files: 1,
          }),
        }),
      ]),
    );
  });

  it('throws without snapshots specified', async () => {
    expect(() => diff().repository(join(dir, 'repository')).password('password').validate()).toThrowError(
      new MissingCompareError(),
    );
  });
});
