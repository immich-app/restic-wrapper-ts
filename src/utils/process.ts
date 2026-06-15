import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import {
  ResticBackupCommandCouldNotReadSourceDataError,
  ResticCommandFailedError,
  ResticFailedToLockRepositoryError,
  ResticGoRuntimeError,
  ResticInterruptedError,
  ResticRepositoryDoesNotExistError,
  ResticUnknownError,
  ResticWrongPasswordError,
} from '../errors';
import type { ArgumentBuilder } from './args';
import { JsonLinesReader } from './streams';

export function spawnRestic<T, Output>(argsBuilder: ArgumentBuilder<T, Output>): ChildProcessWithoutNullStreams {
  return spawn('restic', argsBuilder.toArgs(), {
    env: argsBuilder.toEnv(),
    signal: argsBuilder.abortSignal,
  });
}

export async function restic<T, Output>(argsBuilder: ArgumentBuilder<T, Output>): Promise<Output> {
  argsBuilder.validate();

  const process = spawn('restic', argsBuilder.toArgs(), {
    env: argsBuilder.toEnv(),
    signal: argsBuilder.abortSignal,
  });

  argsBuilder.emit('process', process);

  const [_, output] = await Promise.all([
    processExit(argsBuilder.abortSignal, process),
    processOutput(argsBuilder, process),
  ]);

  return output() as Output;
}

function processOutput<T, Output>(argsBuilder: ArgumentBuilder<T, Output>, process: ChildProcessWithoutNullStreams) {
  return new Promise<() => T | T[] | undefined>((resolve) => {
    let data: T | T[] | undefined = [];

    if (argsBuilder.format() === 'none') {
      data = undefined;
      process.stdout.on('close', () => resolve(() => void 0));
    } else if (argsBuilder.format() === 'string') {
      let stdout = '';
      process.stdout.on('data', (data) => (stdout += data));
      process.stdout.on('close', () => resolve(() => argsBuilder.parse(stdout as T)));
    } else if (argsBuilder.format() === 'binary') {
      const chunks: Buffer[] = [];
      process.stdout.on('data', (chunk) => chunks.push(chunk));
      process.stdout.on('close', () => resolve(() => Buffer.concat(chunks) as T));
    } else if (argsBuilder.format() === 'json') {
      let stdout = '';
      process.stdout.on('data', (data) => (stdout += data));
      process.stdout.on('close', () =>
        resolve(() => {
          try {
            return argsBuilder.parse(JSON.parse(stdout));
          } catch (error) {
            console.error('Failing output:', stdout);
            throw error;
          }
        }),
      );
    } else {
      const jsonLinesReader = new JsonLinesReader<T>(
        (line) => {
          const valid = argsBuilder.parse(line);
          argsBuilder.emit('event', valid);

          if (argsBuilder.format() === 'jsonlines-no-log') {
            data = valid;
          } else {
            (data as T[]).push(valid);
          }
        },
        // work-around for `tag` output
        (line) => argsBuilder.setFilter(line),
      );

      process.stdout.pipe(jsonLinesReader);
      jsonLinesReader.on('close', () => resolve(() => data));
    }
  });
}

function processExit(abortSignal: AbortSignal | undefined, process: ChildProcessWithoutNullStreams) {
  let stderr = '';
  process.stderr.on('data', (data) => (stderr += data));

  return new Promise<void>((resolve, reject) => {
    process.on('error', (error) => reject(abortSignal?.aborted ? abortSignal.reason : error));

    process.on('exit', (code) => {
      if (abortSignal?.aborted) {
        reject(abortSignal.reason);
        return;
      }

      switch (code) {
        case 0: {
          resolve();
          break;
        }
        case 1: {
          reject(new ResticCommandFailedError(stderr.trimEnd()));
          break;
        }
        /* istanbul ignore next */
        case 2: {
          reject(new ResticGoRuntimeError(stderr.trimEnd()));
          break;
        }
        // backup.spec.ts
        case 3: {
          reject(new ResticBackupCommandCouldNotReadSourceDataError(stderr.trimEnd()));
          break;
        }
        case 10: {
          reject(new ResticRepositoryDoesNotExistError(stderr.trimEnd()));
          break;
        }
        /* istanbul ignore next */
        // check.spec.ts
        case 11: {
          reject(new ResticFailedToLockRepositoryError(stderr.trimEnd()));
          break;
        }
        case 12: {
          reject(new ResticWrongPasswordError(stderr.trimEnd()));
          break;
        }
        /* istanbul ignore next */
        // check.spec.ts
        case 130: {
          reject(new ResticInterruptedError(stderr.trimEnd()));
          break;
        }
        /* istanbul ignore next */
        default: {
          reject(new ResticUnknownError(stderr.trimEnd()));
        }
      }
    });
  });
}
