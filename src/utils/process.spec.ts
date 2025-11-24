import { describe, expect, it, vi } from 'vitest';

import { ResticCommandFailedError } from '../errors';
import { ArgumentBuilder } from './args';
import { restic } from './process';

describe('wrapper', () => {
  it('handles runtime errors', async () => {
    class InvalidCommand extends ArgumentBuilder<{}> {
      command(): string {
        return 'invalid-command';
      }

      parse(data: {}): {} {
        return data;
      }
    }

    await expect(restic(new InvalidCommand())).rejects.toThrowError(
      new ResticCommandFailedError('unknown command "invalid-command" for "restic"'),
    );
  });

  it('parses stdout as jsonlines', async () => {
    class VersionCommand extends ArgumentBuilder<{}> {
      command(): string {
        return 'version';
      }

      parse(data: {}): {} {
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
    class VersionCommand extends ArgumentBuilder<{}> {
      command(): string {
        return 'version';
      }

      parse(): {} {
        throw new Error('dummy error');
      }

      format(): 'jsonlines' | 'json' {
        return 'json';
      }
    }

    await expect(restic(new VersionCommand())).rejects.toThrowError(new Error('dummy error'));
  });

  it('emits events', async () => {
    class VersionCommand extends ArgumentBuilder<{}> {
      command(): string {
        return 'version';
      }

      parse(data: {}): {} {
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
