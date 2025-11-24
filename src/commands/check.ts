import {
  baseArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import * as z from 'zod';

const checkArgs = z.object({
  ...baseArgs.shape,
  /**
   * Read all data blobs
   */
  readData: z.coerce.boolean(),
  /**
   * Read a subset of data packs
   *
   * Specified as 'n/t' for speciifc part,
   * or either 'x%' or 'x.y%',
   * or a size in bytes with suffixes k/K, m/M, g/G, t/T for a random subset
   */
  readDataSubset: z.string().optional(),
  /**
   * Use existing cache (only read uncached from repository)
   */
  withCache: z.coerce.boolean(),
});

class CheckArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof checkMessage>,
  z.infer<typeof checkMessage>[]
> {
  constructor() {
    super(checkArgs);
  }

  command(): string {
    return 'check';
  }

  parse(data: z.infer<typeof checkMessage>): z.infer<typeof checkMessage> {
    return checkMessage.parse(data);
  }
}

/**
 * Test repository for errors and report any errors it finds.
 *
 * ```typescript
 * const result = await check()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function check() {
  return new CheckArgumentBuilder() as DynamicBuilder<
    z.infer<typeof checkArgs>,
    CheckArgumentBuilder
  >;
}

const checkMessage = z.object({
  message_type: z.literal('summary'),
  num_errors: z.number().int().nonnegative(),
  broken_packs: z.string().array().nullable(),
  suggest_repair_index: z.coerce.boolean(),
  suggest_prune: z.coerce.boolean(),
});
