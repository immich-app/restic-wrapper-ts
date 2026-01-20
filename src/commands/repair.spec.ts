import { join } from 'node:path';
import { beforeEach, describe, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { repair } from './repair';
import { backup } from './backup';
import { writeFile } from 'node:fs/promises';
import { list } from './list';

describe('repair', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await writeFile(join(dir, 'test-file'), 'data');
    await backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'test-file')).run();
  });

  it('generates a new index', async () => {
    await repair().repository(join(dir, 'repository')).password('password').index().run();
  });

  it('repairs packs', async () => {
    const packs = await list().repository(join(dir, 'repository')).password('password').type('packs').run();
    await repair().repository(join(dir, 'repository')).password('password').pack(...packs).run();
  });

  it('repairs snapshots', async () => {
    await repair().repository(join(dir, 'repository')).password('password').snapshots().run();
  });
});
