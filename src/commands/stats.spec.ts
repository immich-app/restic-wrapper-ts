import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { backup } from './backup';
import { stats } from './stats';

describe('stats', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'empty-repository'));
    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    await backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'test-file')).run();

    snapshotId = snapshot_id;
  });

  it('generates stats', async () => {
    await expect(stats().repository(join(dir, 'repository')).password('password').run()).resolves.toEqual(
      expect.objectContaining({
        total_size: expect.any(Number),
        total_file_count: expect.any(Number),
        snapshots_count: 2,
      }),
    );
  });

  it('generates stats for a single snapshot', async () => {
    await expect(
      stats().repository(join(dir, 'repository')).password('password').snapshot(snapshotId).run(),
    ).resolves.toEqual(
      expect.objectContaining({
        total_size: expect.any(Number),
        total_file_count: expect.any(Number),
        snapshots_count: 1,
      }),
    );
  });

  it.each`
    mode                 | repository
    ${'restoreSize'}     | ${'repository'}
    ${'restoreSize'}     | ${'empty-repository'}
    ${'filesByContents'} | ${'repository'}
    ${'filesByContents'} | ${'empty-repository'}
    ${'blobsPerFile'}    | ${'repository'}
    ${'blobsPerFile'}    | ${'empty-repository'}
    ${'rawData'}         | ${'repository'}
    ${'rawData'}         | ${'empty-repository'}
  `('use $mode with $repository', async ({ mode, repository }) => {
    await stats()
      .repository(join(dir, repository))
      .password('password')
      [
        `mode${mode[0].toUpperCase()}${mode.slice(1)}` as
          | 'modeRestoreSize'
          | 'modeFilesByContents'
          | 'modeBlobsPerFile'
          | 'modeRawData'
      ]()
      .run();
  });
});
