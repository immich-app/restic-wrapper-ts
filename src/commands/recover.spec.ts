import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { writeFile } from 'node:fs/promises';
import { backup } from './backup';
import { forget } from './forget';
import { recover } from './recover';
import { snapshots } from './snapshots';

describe('recover', () => {
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

  it('generates a new snapshot from raw data', async () => {
    await recover().repository(join(dir, 'repository')).password('password').run();

    await expect(snapshots().repository(join(dir, 'repository')).password('password').run()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tags: ['recovered'],
        }),
      ]),
    );
  });
});
