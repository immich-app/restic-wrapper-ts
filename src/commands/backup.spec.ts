import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MissingFilesError,
  ResticCommandFailedError,
  ResticRepositoryDoesNotExistError,
  ResticWrongPasswordError,
} from '../errors';
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
    ).rejects.toThrowError(
      new ResticRepositoryDoesNotExistError(`Fatal: repository does not exist: unable to open config file: stat ${join(
        dir,
        'missing-repository',
        'config',
      )}: no such file or directory
Is there a repository at the following location?
${join(dir, 'missing-repository')}`),
    );
  });

  it('fails to open repository with wrong password', async () => {
    await expect(
      backup().repository(join(dir, 'repository')).password('wrong-password').addFile(join(dir, 'test-file')).run(),
    ).rejects.toThrowError(new ResticWrongPasswordError('Fatal: wrong password or no key found'));
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
    ).rejects.toThrowError(new ResticCommandFailedError('Fatal: all source directories/files do not exist'));
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
});
