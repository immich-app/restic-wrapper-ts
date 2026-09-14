import { describe, expect, it, vitest } from 'vitest';

import { execFile } from 'node:child_process';
import { open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { check, init, keyAdd, stats } from '../commands';
import {
  ResticCommandFailedError,
  ResticFailedToLockRepositoryError,
  ResticRepositoryDoesNotExistError,
  ResticWrongPasswordError,
} from '../errors';
import { ArgumentBuilder } from './args';
import { restic, spawnRestic } from './process';
import { createTempDir, initRepository } from './test';

describe('wrapper', () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type Data = {};

  it('handles runtime errors', async () => {
    class InvalidCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'invalid-command';
      }

      parse(data: Data): Data {
        return data;
      }
    }

    await expect(restic(new InvalidCommand())).rejects.toThrowError(
      new ResticCommandFailedError('unknown command "invalid-command" for "restic"'),
    );
  });

  it('parses stdout as jsonlines', async () => {
    class VersionCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'version';
      }

      parse(data: Data): Data {
        return data;
      }
    }

    await expect(restic(new VersionCommand())).resolves.toEqual([
      expect.objectContaining({
        message_type: expect.any(String),
      }),
    ]);
  });

  it('handles errors on invalid json output', async () => {
    class VersionCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'version';
      }

      parse(): Data {
        throw new Error('dummy error');
      }

      format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
        return 'json';
      }
    }

    await expect(restic(new VersionCommand())).rejects.toThrowError(new Error('dummy error'));
  });

  it('surfaces wrong password or no key found error', async () => {
    const dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await expect(check().repository(join(dir, 'repository')).password('incorrect').run()).rejects.toThrowError(
      ResticWrongPasswordError,
    );
  });

  it('surfaces exclusive lock error', async () => {
    const dir = await createTempDir();
    const repository = join(dir, 'repository');
    await initRepository(repository);

    // block the keyAdd process from cleaning up lock until we need it cleaned up
    const fifo = join(dir, 'newPassword');
    await promisify(execFile)('mkfifo', [fifo]);
    const handle = await open(fifo, 'r+');

    const lockOperation = keyAdd().repository(repository).newPasswordFile(fifo).password('password');
    spawnRestic(lockOperation);

    try {
      await vitest.waitFor(
        async () => {
          const locks = await readdir(join(repository, 'locks'));
          expect(locks.length).toBeGreaterThan(0);
        },
        { timeout: 10_000 },
      );

      await expect(check().repository(repository).password('password').run()).rejects.toThrowError(
        ResticFailedToLockRepositoryError,
      );
    } finally {
      await handle.close();
    }
  });

  it('surfaces repository does not exist error instead of a json parse error', async () => {
    const dir = await createTempDir();

    const run = stats().repository(join(dir, 'missing-repository')).password('password').run();

    await expect(run).rejects.toThrowError(ResticRepositoryDoesNotExistError);
    await expect(run).rejects.toThrowError('repository does not exist');
  });

  it('surfaces wrong password error instead of a json parse error', async () => {
    const dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await expect(stats().repository(join(dir, 'repository')).password('incorrect').run()).rejects.toThrowError(
      ResticWrongPasswordError,
    );
  });

  it('surfaces stderr of a failed command instead of a json parse error', async () => {
    const dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    const run = init().repository(join(dir, 'repository')).password('password').run();

    await expect(run).rejects.toThrowError(ResticCommandFailedError);
    await expect(run).rejects.toThrowError('config file already exists');
  });

  it('rejects with the abort reason instead of a json parse error', async () => {
    const dir = await createTempDir();

    const reason = new Error('pre-aborted');
    const ac = new AbortController();
    ac.abort(reason);

    await expect(stats().repository(join(dir, 'repository')).password('password').signal(ac.signal).run()).rejects.toBe(
      reason,
    );
  });

  it('surfaces the exit code error when a string command fails and parsing throws', async () => {
    class FragileStringCommand extends ArgumentBuilder<string, string> {
      command(): string {
        return 'stats';
      }

      parse(data: string): string {
        return JSON.parse(data);
      }

      format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
        return 'string';
      }
    }

    const dir = await createTempDir();

    await expect(
      restic(new FragileStringCommand().repository(join(dir, 'missing-repository')).password('password')),
    ).rejects.toThrowError(ResticRepositoryDoesNotExistError);
  });

  it('rejects with a parse error when restic succeeds with non-json output', async () => {
    class PlainVersionCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'version';
      }

      parse(data: Data): Data {
        return data;
      }

      format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
        return 'json';
      }

      toArgs(): string[] {
        return [this.command()];
      }
    }

    await expect(restic(new PlainVersionCommand())).rejects.toThrowError(SyntaxError);
  });

  it('emits events', async () => {
    class VersionCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'version';
      }

      parse(data: Data): Data {
        return data;
      }
    }

    const process = vitest.fn();
    const event = vitest.fn();
    const unregistered = vitest.fn();

    await restic(
      new VersionCommand()
        .once('process', process)
        .on('event', event)
        .on('event', unregistered)
        .off('event', unregistered),
    );

    expect(process).toBeCalled();
    expect(event).toBeCalled();
    expect(unregistered).toBeCalledTimes(0);
  });
});
