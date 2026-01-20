/* istanbul ignore file */

import { baseArgs, RepositoryArgumentBuilder } from '../utils/args';

class RecoverArgumentBuilder extends RepositoryArgumentBuilder<
 string, string
> {
  constructor() {
    super(baseArgs);
  }

  command(): string {
    return 'recover';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  parse(data: string): string {
    return data;
  }
}

/**
 * Build a new snapshot from all directories it can find in the raw data of the repository which are not referenced in an existing snapshot.
 *
 * ```typescript
 * await recover()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function recover() {
  return new RecoverArgumentBuilder();
}
