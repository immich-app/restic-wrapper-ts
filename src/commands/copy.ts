import * as z from 'zod';
import { baseArgs, commonFromRepositoryArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const copyArgs = z.object({
  ...baseArgs.shape,
  ...commonFromRepositoryArgs.shape,
});

class CopyArgumentBuilder extends RepositoryArgumentBuilder<string, string> {
  constructor() {
    super(copyArgs);
  }

  #snapshots: string[] = [];

  snapshot(...snapshots: string[]) {
    this.#snapshots.push(...snapshots);
    return this;
  }

  command(): string {
    return 'copy';
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#snapshots];
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'none';
  }

  /* istanbul ignore next */
  parse(): never {
    throw 'unimplemented';
  }
}

/**
 * Copy snapshots from one repository to another.
 *
 * ```typescript
 * await copy()
 *   .fromRepository(..)
 *   .fromPassword(..)
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function copy() {
  return new CopyArgumentBuilder() as DynamicBuilder<z.infer<typeof copyArgs>, CopyArgumentBuilder>;
}
