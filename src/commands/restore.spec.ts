import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { MissingSnapshotError } from '../errors';
import { backup } from './backup';
import { restore } from './restore';

describe('restore', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await mkdir(join(dir, 'target'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    snapshotId = snapshot_id;

    await rm(join(dir, 'test-file'));
  });

  it('restores file', async () => {
    await expect(stat(join(dir, 'test-file'))).rejects.toThrowError();

    const event = vi.fn();
    const { files_restored } = await restore()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .target(join(dir, 'target'))
      .verbose()
      .on('event', event)
      .run();

    expect(files_restored).toBe(4);

    expect(event).toHaveBeenCalledWith(
      expect.objectContaining({
        message_type: 'summary',
      }),
    );

    await stat(join(dir, 'target', dir.slice(1), 'test-file'));
  });

  it('throws without snapshot specified', () => {
    expect(() =>
      restore().repository(join(dir, 'repository')).password('password').target('target').validate(),
    ).toThrowError(new MissingSnapshotError());
  });

  it('throws without target specified', () => {
    expect(() =>
      restore().repository(join(dir, 'repository')).password('password').snapshot('snapshot').validate(),
    ).toThrowError();
  });
});
