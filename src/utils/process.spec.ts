import { describe, expect, it, vi } from 'vitest';

import { join } from 'node:path';
import { check, keyAdd } from '../commands';
import { ResticCommandFailedError, ResticFailedToLockRepositoryError, ResticWrongPasswordError } from '../errors';
import { ArgumentBuilder } from './args';
import { restic, spawnRestic } from './process';
import { createLock, createTempDir, initRepository } from './test';

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

  it(
    'surfaces exclusive lock error',
    {
      // this test is flaky as we are relying on a process race to create the lock
      retry: 3,
    },
    async () => {
      const dir = await createTempDir();
      await initRepository(join(dir, 'repository'));

      // create an exclusive lock -- should run long enough to hold over next operation
      const lockOperation = keyAdd().repository(join(dir, 'repository')).newInsecureNoPassword().password('password');
      const process = spawnRestic(lockOperation);
      await new Promise((resolve) => process.once('spawn', resolve));

      await expect(check().repository(join(dir, 'repository')).password('password').run()).rejects.toThrowError(
        ResticFailedToLockRepositoryError,
      );
    },
  );

  it('emits events', async () => {
    class VersionCommand extends ArgumentBuilder<Data, Data> {
      command(): string {
        return 'version';
      }

      parse(data: Data): Data {
        return data;
      }
    }

    const process = vi.fn();
    const event = vi.fn();
    const unregistered = vi.fn();

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
