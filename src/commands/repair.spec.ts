import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { writeFile } from 'node:fs/promises';
import { MissingRepairTypeError } from '../errors';
import { backup } from './backup';
import { list } from './list';
import { repair } from './repair';

describe('repair', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await writeFile(join(dir, 'test-file'), 'data');
    await backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'test-file')).run();
  });

  it('fails if target is not specified', async () => {
    await expect(repair().repository(join(dir, 'repository')).password('password').run()).rejects.toThrowError(
      new MissingRepairTypeError(),
    );
  });

  it('generates a new index', async () => {
    await repair().repository(join(dir, 'repository')).password('password').index().run();
  });

  it('repairs packs', async () => {
    const packs = await list().repository(join(dir, 'repository')).password('password').type('packs').run();
    await repair()
      .repository(join(dir, 'repository'))
      .password('password')
      .pack(...packs)
      .run();
  });

  it('repairs snapshots', async () => {
    await repair().repository(join(dir, 'repository')).password('password').snapshots().run();
  });
});
