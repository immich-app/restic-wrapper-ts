import * as z from 'zod';
import {
  baseArgs,
  commonFilterArgs,
  commonGroupBy,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import { snapshot } from './snapshots';

const baseForgetArgs = z.object({
  ...baseArgs.shape,
  // compact: N/A
  /**
   * Do not delete anything
   */
  dryRun: z.coerce.boolean(),
  /**
   * Automatically run prune if snapshots are removed
   */
  prune: z.coerce.boolean(),
  /**
   * Tolerate given limit of unused data
   */
  maxUnused: z.string().optional(),
  /**
   * Stop after repacking this much data in total
   *
   * Allowed suffixes: k/K, m/M, g/G, t/T
   */
  maxRepackSize: z
    .string()
    .regex(/^\d+(?:\.\d+)?[kKmMgGtT]$/)
    .optional(),
  /**
   * Only repack packs which are cacheable
   */
  repackCacheableOnly: z.coerce.boolean(),
  /**
   * Repack pack files below 80% of target pack size
   */
  repackSmall: z.coerce.boolean(),
  /**
   * Repack all uncompressed data
   */
  repackUncompressed: z.coerce.boolean(),
  /**
   * Pack below-limit packfiles
   *
   * Allowed suffixes: k/K, m/M
   */
  repackSmallerThan: z
    .string()
    .regex(/^\d+(?:\.\d+)?[kKmM]$/)
    .optional(),
});

const allForgetArgs = z.object({
  ...baseForgetArgs.shape,
  ...commonFilterArgs.shape,
  ...commonGroupBy.shape,
  keepLast: z.number().optional(),
  keepHourly: z.string().optional(),
  keepDaily: z.string().optional(),
  keepWeekly: z.string().optional(),
  keepMonthly: z.string().optional(),
  keepYearly: z.string().optional(),
  keepWithin: z.string().optional(),
  keepWithinHourly: z.string().optional(),
  keepWithinDaily: z.string().optional(),
  keepWithinWeekly: z.string().optional(),
  keepWithinMonthly: z.string().optional(),
  keepWithinYearly: z.string().optional(),
  keepTag: z.string().array().default([]),
  unsafeAllowRemoveAll: z.coerce.boolean(),
});

class ForgetArgumentBuilder<T> extends RepositoryArgumentBuilder<T, T> {
  constructor() {
    super(allForgetArgs);
  }

  #snapshots: string[] = [];

  snapshot(...snapshots: string[]) {
    this.#snapshots.push(...snapshots);
    return this as never as DynamicBuilder<z.infer<typeof baseForgetArgs>, ForgetArgumentBuilder<void>>;
  }

  command(): string {
    return 'forget';
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#snapshots];
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'none' {
    return this.#snapshots.length ? 'none' : 'json';
  }

  parse(data: T): T {
    return forgetMessage.parse(data) as T;
  }
}

/**
 * Remove snapshots according to given policy.
 *
 * ```typescript
 * const results = await forget()
 *   .todo();
 * ```
 */
export function forget() {
  return new ForgetArgumentBuilder() as DynamicBuilder<
    z.infer<typeof allForgetArgs>,
    ForgetArgumentBuilder<z.infer<typeof forgetMessage>>
  >;
}

const keepReasons = z.array(
  z.object({
    snapshot,
    matches: z.string().array(),
  }),
);

const forgetMessage = z.array(
  z.object({
    tags: z.string().array().nullable(),
    host: z.string(),
    paths: z.string().array(),
    keep: snapshot.array(),
    remove: snapshot.array(),
    reasons: keepReasons,
  }),
);
