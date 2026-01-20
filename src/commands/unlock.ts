import * as z from 'zod';
import { baseArgs,  RepositoryArgumentBuilder } from '../utils/args';

const unlockArgs = z.object({
  ...baseArgs.shape,
  /**
   * Remove all locks, even non-stale ones
   */
  removeAll: z.coerce.boolean(),
});

class UnlockArgumentBuilder extends RepositoryArgumentBuilder<void, void> {
  constructor() {
    super(unlockArgs);
  }

  command(): string {
    return 'unlock';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'none';
  }

  parse(): never {
    throw "unimplemented"
  }
}

/**
 * Unlock repository
 *
 * ```typescript
 * await unlock()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function unlock() {
  return new UnlockArgumentBuilder() ;
}
