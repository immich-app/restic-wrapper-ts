import * as z from 'zod';
import {
  baseArgs,
  commonFilterArgs,
  commonGroupBy,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';

const snapshotsArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  ...commonGroupBy.shape,
  // compact: N/A
  /**
   * Only show the last n snapshots for each host and path
   */
  latest: z.number().optional(),
});

class SnapshotsArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof snapshotsMessage>,
  z.infer<typeof snapshotsMessage>
> {
  constructor() {
    super(snapshotsArgs);
  }

  command(): string {
    return 'snapshots';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' {
    return 'json';
  }

  parse(data: z.infer<typeof snapshotsMessage>): z.infer<typeof snapshotsMessage> {
    return snapshotsMessage.parse(data);
  }
}

/**
 * List all snapshots
 *
 * ```typescript
 * const snapshots = await snapshots()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function snapshots() {
  return new SnapshotsArgumentBuilder() as DynamicBuilder<z.infer<typeof snapshotsArgs>, SnapshotsArgumentBuilder>;
}

export const snapshotSummary = z.object({
  backup_start: z.coerce.date(),
  backup_end: z.coerce.date(),
  files_new: z.number().int().nonnegative(),
  files_changed: z.number().int().nonnegative(),
  files_unmodified: z.number().int().nonnegative(),
  dirs_new: z.number().int().nonnegative(),
  dirs_changed: z.number().int().nonnegative(),
  dirs_unmodified: z.number().int().nonnegative(),
  data_blobs: z.number().int(),
  tree_blobs: z.number().int(),
  data_added: z.number().int().nonnegative(),
  data_added_packed: z.number().int().nonnegative(),
  total_files_processed: z.number().int().nonnegative(),
  total_bytes_processed: z.number().int().nonnegative(),
});

export const snapshot = z.object({
  time: z.coerce.date(),
  parent: z.string().optional(),
  tree: z.string(),
  paths: z.string().array(),
  hostname: z.string(),
  username: z.string(),
  uid: z.number().int().nonnegative(),
  gid: z.number().int().nonnegative(),
  excludes: z.string().array().optional(),
  tags: z.string().array().optional(),
  program_version: z.string(),
  summary: snapshotSummary,
  id: z.string(),
  /**
   * @deprecated
   */
  short_id: z.string(),
});

const snapshotsMessage = z.array(snapshot);
