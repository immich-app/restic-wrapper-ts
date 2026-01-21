import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { MissingMatchError } from '../errors';
import { backup } from './backup';
import { find } from './find';

describe('find', () => {
  let dir: string;
  let snapshotId: string;

  beforeAll(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'hello.json'), 'data');
    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'hello.json'))
      .run();

    snapshotId = snapshot_id;
  });

  it('finds objects', async () => {
    await expect(
      find().repository(join(dir, 'repository')).password('password').match('*.json').object().run(),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          hits: 1,
          snapshot: snapshotId,
          matches: expect.arrayContaining([
            expect.objectContaining({
              path: expect.stringContaining('hello.json'),
            }),
          ]),
        }),
      ]),
    );
  });

  it.todo('finds blobs');
  it.todo('finds trees');

  it('throws without match specified', () => {
    expect(() => find().repository(join(dir, 'repository')).password('password').validate()).toThrowError(
      new MissingMatchError(),
    );
  });
});
