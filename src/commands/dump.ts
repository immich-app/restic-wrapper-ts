import * as z from 'zod';
import { MissingFilesError, MissingSnapshotError } from '../errors';
import { baseArgs, commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const dumpArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  /**
   * Set archive format for directories
   *
   * @default tar
   */
  archive: z.enum(['tar', 'zip']).optional(),
});

class DumpArgumentBuilder<T> extends RepositoryArgumentBuilder<T, T> {
  constructor() {
    super(dumpArgs);
  }

  #snapshot: string | undefined;

  snapshot(snapshot: string) {
    this.#snapshot = snapshot;
    return this;
  }

  #file: string | undefined;

  file(file: string) {
    this.#file = file;
    return this;
  }

  #target: string | undefined;

  target(target: string) {
    this.#target = target;
    return this as unknown as DynamicBuilder<z.infer<typeof dumpArgs>, DumpArgumentBuilder<void>>;
  }

  command(): string {
    return 'dump';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return this.#target ? 'none' : 'binary';
  }

  toArgs(): string[] {
    const args = [...super.toArgs(), this.#snapshot!, this.#file!];

    if (this.#target) {
      args.push('--target', this.#target);
    }

    return args;
  }

  parse(): never {
    throw 'unimplemented';
  }

  validate(): void {
    super.validate();

    if (!this.#snapshot) {
      throw new MissingSnapshotError();
    }

    if (!this.#file) {
      throw new MissingFilesError();
    }
  }
}

/**
 * Print a backed-up file to stdout (or write to target).
 *
 * ```typescript
 * const binary = await dump()
 *   .repository(..)
 *   .password(..)
 *   .snapshot(..)
 *   .file(..);
 * ```
 */
export function dump() {
  return new DumpArgumentBuilder() as DynamicBuilder<z.infer<typeof dumpArgs>, DumpArgumentBuilder<Buffer>>;
}
