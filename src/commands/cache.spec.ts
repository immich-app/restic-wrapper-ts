import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { cache } from './cache';
import { backup } from './backup';

describe('cache', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    // ensure there is some cache info present
    await backup().repository(join(dir, 'repository')).password('password').addFile(dir).run();
  });

  it('returns cache directories', async () => {
    await expect(
      cache().repository(join(dir, 'repository')).password('password').run(),
    ).resolves.toEqual(
      expect.objectContaining({
        directories: expect.any(Number),
        table: expect.arrayContaining([
          expect.objectContaining({
            "Last Used": expect.any(String),
            Old: false,
            'Repo ID': expect.any(String),
            'Size': expect.any(String),
          })
        ])
      }),
    );
  });

  it('can ignore size', async () => {
    await expect(
      cache().repository(join(dir, 'repository')).password('password').noSize().run(),
    ).resolves.toEqual(
      expect.objectContaining({
        directories: expect.any(Number),
        table: expect.arrayContaining([
          expect.not.objectContaining({
            'Size': expect.any(String),
          })
        ])
      }),
    );
  });

  it('can mark cache dirs as old', async () => {
    await expect(
      cache().repository(join(dir, 'repository')).password('password').maxAge(0).run(),
    ).resolves.toEqual(
      expect.objectContaining({
        directories: expect.any(Number),
        table: expect.arrayContaining([
          expect.objectContaining({
            'Old': true
          })
        ])
      }),
    );
  });

  it('doesn\'t remove anything if too new', async () => {
    await expect(
      cache().repository(join(dir, 'repository')).password('password').maxAge(9999).cleanup().run(),
    ).resolves.toEqual(
      expect.objectContaining({
        raw: expect.stringContaining('no old cache dirs found'),
        removedDirectories: 0,
      }),
    );
  });

  it('removes cache dirs that are too old', async () => {
    const { removedDirectories }= await cache().repository(join(dir, 'repository')).password('password').maxAge(0).cleanup().run();
    expect(removedDirectories).toBeGreaterThan(0);

    await expect(
      cache().repository(join(dir, 'repository')).password('password').run(),
    ).resolves.toEqual(
      expect.objectContaining({
        directories: 0,
        table: [],
      })
    );
  });
});
