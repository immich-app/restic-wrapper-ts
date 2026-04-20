import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissingFilesError, ResticCommandFailedError } from '../errors';
import { createLock, createTempDir, initRepository } from '../utils/test';
import { backup } from './backup';

describe('backup', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();

    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'test');
  });

  it('adds test files successfully', async () => {
    const event = vi.fn();
    const { total_files_processed } = await backup()
      .verbose()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .on('event', event)
      .run();

    expect(total_files_processed).toBe(1);

    expect(event).toHaveBeenCalledWith(
      expect.objectContaining({
        message_type: 'verbose_status',
        action: 'new',
      }),
    );

    expect(event).toHaveBeenCalledWith(
      expect.objectContaining({
        message_type: 'verbose_status',
        action: 'scan_finished',
      }),
    );

    expect(event).toHaveBeenCalledWith(
      expect.objectContaining({
        message_type: 'summary',
      }),
    );
  });

  it('refuses to continue with no files', () => {
    expect(() => backup().repository(join(dir, 'repository')).password('password').validate()).toThrowError(
      new MissingFilesError(),
    );
  });

  it('fails to open non-existent repository', async () => {
    await expect(
      backup().repository(join(dir, 'missing-repository')).password('password').addFile(join(dir, 'test-file')).run(),
    ).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Fatal: repository does not exist: unable to open config file'),
      }),
    );
  });

  it('fails to open repository with wrong password', async () => {
    await expect(
      backup().repository(join(dir, 'repository')).password('wrong-password').addFile(join(dir, 'test-file')).run(),
    ).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Fatal: wrong password or no key found'),
      }),
    );
  });

  it('ignores missing files', async () => {
    const { total_files_processed } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .addFile(join(dir, 'missing-file'))
      .run();

    expect(total_files_processed).toBe(1);
  });

  it('fails to add only non-existent files', async () => {
    await expect(
      backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'missing-file')).run(),
    ).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining('Fatal: all source directories/files do not exist'),
      }),
    );
  });

  it.skip('fails to open a locked repository', async () => {
    await createLock(join(dir, 'repository'));

    await expect(
      backup().repository(join(dir, 'repository')).password('password').addFile(join(dir, 'test-file')).run(),
    ).rejects.toThrowError(
      new ResticCommandFailedError('unable to create lock in backend: ciphertext verification failed'),
    );
  });

  it.todo('fails to read source data');

  it('rejects immediately when the signal is already aborted', async () => {
    const reason = new Error('pre-aborted');
    const ac = new AbortController();
    ac.abort(reason);

    await expect(
      backup()
        .repository(join(dir, 'repository'))
        .password('password')
        .signal(ac.signal)
        .addFile(join(dir, 'test-file'))
        .run(),
    ).rejects.toBe(reason);
  });

  it('aborts a running backup with the signal reason', async () => {
    const sourceDir = join(dir, 'source');
    await mkdir(sourceDir);
    await Promise.all(
      Array.from({ length: 2_000 }, (_, i) => writeFile(join(sourceDir, `file-${i}.txt`), `content ${i}`)),
    );

    const ac = new AbortController();
    const reason = new Error('user-canceled');

    await expect(
      backup()
        .repository(join(dir, 'repository'))
        .password('password')
        .signal(ac.signal)
        .addFile(sourceDir)
        .on('event', () => ac.abort(reason))
        .run(),
    ).rejects.toBe(reason);
  });
});
