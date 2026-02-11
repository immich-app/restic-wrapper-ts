/* istanbul ignore file */

import * as z from 'zod';
import { baseArgs, commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

export const rewriteArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  /**
   * Exclude pattern(s)
   */
  exclude: z.string().array().default([]),
  /**
   * Read exclude patterns from given file(s)
   */
  excludeFile: z.string().array().default([]),
  /**
   * Remove original snapshots after creating new ones
   */
  forget: z.coerce.boolean(),
  /**
   * Exclude pattern(s) but ignore case in patterns
   */
  iexcludePattern: z.coerce.string().array().default([]),
  /**
   * Read exclude patterns from given file(s) but ignore case in patterns
   */
  iexcludeFile: z.coerce.string().array().default([]),
  /**
   * Replace hostname
   */
  newHost: z.string().optional(),
  /**
   * Replace time of backup
   */
  newTime: z.string().optional(),
  /**
   * Create snapshot summary record if it does not exist
   */
  snapshotSummary: z.coerce.boolean(),
});

class RewriteArgumentBuilder extends RepositoryArgumentBuilder<string, string> {
  constructor() {
    super(rewriteArgs);
  }

  #snapshots: string[] = [];

  snapshot(...snapshots: string[]) {
    this.#snapshots.push(...snapshots);
    return this;
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#snapshots];
  }

  command(): string {
    return 'rewrite';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  parse(data: string): string {
    return data;
  }
}

/**
 * Exclude files from existing snapshots.
 *
 * ```typescript
 * await rewrite()
 *   .repository(..)
 *   .password(..)
 *   .exclude(..)
 *   .run();
 * ```
 */
export function rewrite() {
  return new RewriteArgumentBuilder() as DynamicBuilder<z.infer<typeof rewriteArgs>, RewriteArgumentBuilder>;
}
