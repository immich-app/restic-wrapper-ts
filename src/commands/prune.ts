/* istanbul ignore file */

import * as z from 'zod';
import { baseArgs, commonRepackArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

export const pruneArgs = z.object({
  ...baseArgs.shape,
  ...commonRepackArgs.shape,
  /**
   * Do not modify the repository, just print what would be done
   */
  dryRun: z.coerce.boolean(),
  /**
   * Try to recover a repository stuck with no free space.
   * 
   * Do not use without trying out `.maxRepackSize(0)` first.
   * 
   * **⚠️ Read documentation before using!**
   */
  unsafeRecoverNoFreeSpace: z.coerce.boolean(),
});

class PruneArgumentBuilder extends RepositoryArgumentBuilder<
 string, string
> {
  constructor() {
    super(pruneArgs);
  }

  command(): string {
    return 'prune';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  parse(data: string): string {
    return data;
  }
}

/**
 * Check repository and remove data that is not referenced and therefore not needed.
 *
 * ```typescript
 * await prune()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function prune() {
  return new PruneArgumentBuilder() as DynamicBuilder<z.infer<typeof pruneArgs>, PruneArgumentBuilder>;
}
