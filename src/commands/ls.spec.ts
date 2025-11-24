import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { MissingSnapshotError } from '../errors';
import { backup } from './backup';
import { ls } from './ls';

describe('ls', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await mkdir(join(dir, 'directory'));
    await mkdir(join(dir, 'directory', 'subdir'));
    await writeFile(join(dir, 'test-file'), 'data');
    await writeFile(join(dir, 'directory', 'dir-file'), 'data');
    await writeFile(join(dir, 'directory', 'subdir', 'subdir-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .addFile(join(dir, 'directory'))
      .run();

    snapshotId = snapshot_id;
  });

  it('provides a file listing', async () => {
    await expect(
      ls().repository(join(dir, 'repository')).password('password').snapshot(snapshotId).run(),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message_type: 'snapshot',
          id: snapshotId,
        }),
        expect.objectContaining({
          path: expect.stringContaining('test-file'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('dir-file'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('subdir-file'),
        }),
      ]),
    );
  });

  it('provides a directory listing', async () => {
    const listing = await ls()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .directory(join(dir, 'directory'))
      .run();

    expect(listing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('dir-file'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('subdir'),
        }),
      ]),
    );

    expect(listing).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('test-file'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('subdir-file'),
        }),
      ]),
    );
  });

  it('provides a recursive directory listing', async () => {
    const listing = await ls()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .directory(join(dir, 'directory'))
      .recursive()
      .run();

    expect(listing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('dir-file'),
        }),
        expect.objectContaining({
          path: expect.stringContaining('subdir-file'),
        }),
      ]),
    );

    expect(listing).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.stringContaining('test-file'),
        }),
      ]),
    );
  });

  it('throws without snapshot specified', async () => {
    expect(() => ls().repository(join(dir, 'repository')).password('password').validate()).toThrowError(
      new MissingSnapshotError(),
    );
  });
});
