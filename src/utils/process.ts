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
  });
}

export function restic<T, Output>(argsBuilder: ArgumentBuilder<T, Output>): Promise<Output> {
  argsBuilder.validate();

  return new Promise((resolve, reject) => {
    console.debug('restic', argsBuilder.toArgs(), {
      env: argsBuilder.toEnv(),
    });

    const process = spawn('restic', argsBuilder.toArgs(), {
      env: argsBuilder.toEnv(),
    });

    process.on('error', reject);
    argsBuilder.emit('process', process);

    let stderr = '';
    process.stderr.on('data', (data) => (stderr += data));

    let finished = 0;
    function finish() {
      if (++finished === 2) {
        resolve(data as Output);
      }
    }

    let data: T | T[] | undefined = [];

    if (argsBuilder.format() === 'none') {
      data = undefined;
      process.stdout.on('close', finish);
    } else if (argsBuilder.format() === 'string') {
      let stdout = '';
      process.stdout.on('data', (data) => (stdout += data));
      process.stdout.on('close', () => {
        data = argsBuilder.parse(stdout as T);
        finish();
      });
    } else if (argsBuilder.format() === 'binary') {
      const chunks: Buffer[] = [];
      process.stdout.on('data', (chunk) => chunks.push(chunk));
      process.stdout.on('close', () => {
        data = Buffer.concat(chunks) as T;
        finish();
      });
    } else if (argsBuilder.format() === 'json') {
      let stdout = '';
      process.stdout.on('data', (data) => (stdout += data));
      process.stdout.on('close', () => {
        try {
          data = argsBuilder.parse(JSON.parse(stdout));
          finish();
        } catch (error) {
          console.error('Failing output:', stdout);
          reject(error);
        }
      });
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
      jsonLinesReader.on('close', finish);
    }

    process.on('exit', (code) => {
      switch (code) {
        case 0: {
          finish();
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
        /* istanbul ignore next */
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
