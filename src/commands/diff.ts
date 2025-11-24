import { MissingCompareError } from '../errors';
import {
  baseArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import * as z from 'zod';

const diffArgs = z.object({
  ...baseArgs.shape,
  /**
   * Print changes in metadata
   */
  metadata: z.coerce.boolean(),
});

class DiffArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof diffMessage>,
  z.infer<typeof diffMessage>[]
> {
  constructor() {
    super(diffArgs);
  }

  #snapshotIds: [string, string] | undefined;

  compare(snapshotA: string, snapshotB: string) {
    this.#snapshotIds = [snapshotA, snapshotB];
    return this;
  }

  command(): string {
    return 'diff';
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#snapshotIds!];
  }

  parse(data: z.infer<typeof diffMessage>): z.infer<typeof diffMessage> {
    return diffMessage.parse(data);
  }

  validate(): void {
    if (!this.#snapshotIds) {
      throw new MissingCompareError();
    }
  }
}

/**
 * Test repository for errors and report any errors it finds.
 *
 * ```typescript
 * const diff = await diff()
 *   .repository(..)
 *   .password(..)
 *   .compare("a", "b");
 * ```
 */
export function diff() {
  return new DiffArgumentBuilder() as DynamicBuilder<
    z.infer<typeof diffArgs>,
    DiffArgumentBuilder
  >;
}

const changeMessage = z.object({
  message_type: z.literal('change'),
  path: z.string(),
  modifier: z.string().regex(/[+-TMU?]+/),
});

const diffStat = z.object({
  files: z.number().int(),
  dirs: z.number().int(),
  others: z.number().int(),
  data_blobs: z.number().int(),
  tree_blobs: z.number().int(),
  bytes: z.number().int().nonnegative(),
});

const statisticsMessage = z.object({
  message_type: z.literal('statistics'),
  source_snapshot: z.string(),
  target_snapshot: z.string(),
  /**
   * @deprecated missing from restic output
   */
  changes_files: z.number().int().optional(),
  added: diffStat,
  removed: diffStat,
});

const diffMessage = z.union([changeMessage, statisticsMessage]);
