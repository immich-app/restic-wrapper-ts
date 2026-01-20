import * as z from 'zod';
import { MissingSnapshotError } from '../errors';
import { baseArgs, commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const restoreArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  /**
   * Delete files from target directory if they do not exist in snapshot
   */
  delete: z.coerce.boolean(),
  /**
   * Do not write any data
   */
  dryRun: z.coerce.boolean(),
  /**
   * Exclude pattern(s)
   */
  exclude: z.string().array().default([]),
  /**
   * Read exclude patterns from given file(s)
   */
  excludeFile: z.string().array().default([]),
  /**
   * Exclude xattr by pattern(s)
   */
  excludeXattr: z.string().array().default([]),
  /**
   * Exclude pattern(s) but ignore case in patterns
   */
  iexcludePattern: z.coerce.string().array().default([]),
  /**
   * Read exclude patterns from given file(s) but ignore case in patterns
   */
  iexcludeFile: z.coerce.string().array().default([]),
  /**
   * Include pattern(s) but ignore case in patterns
   */
  iincludePattern: z.coerce.string().array().default([]),
  /**
   * Read include patterns from given file(s) but ignore case in patterns
   */
  iincludeFile: z.coerce.string().array().default([]),
  /**
   * Include pattern(s)
   */
  include: z.string().array().default([]),
  /**
   * Read include patterns from given file(s)
   */
  includeFile: z.string().array().default([]),
  /**
   * Include xattr by pattern(s)
   */
  includeXattr: z.string().array().default([]),
  /**
   * Overwrite behaviour
   *
   * @default always
   */
  overwrite: z.enum(['always', 'if-changed', 'if-newer', 'never']).optional(),
  /**
   * Restore files as sparse
   */
  sparse: z.coerce.boolean(),
  /**
   * Directory to extract data to
   */
  target: z.string().array().min(1),
  /**
   * Verify restored files content
   */
  verify: z.coerce.boolean(),
});

class RestoreArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof restoreMessage>,
  z.infer<typeof restoreSummaryMessage>
> {
  constructor() {
    super(restoreArgs);
  }

  #snapshot: string | undefined;

  snapshot(snapshot: string) {
    this.#snapshot = snapshot;
    return this;
  }

  command(): string {
    return 'restore';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'none' {
    return 'jsonlines-no-log';
  }

  toArgs(): string[] {
    return [...super.toArgs(), this.#snapshot!];
  }

  parse(data: z.infer<typeof restoreMessage>): z.infer<typeof restoreMessage> {
    return restoreMessage.parse(data);
  }

  validate(): void {
    super.validate();

    if (!this.#snapshot) {
      throw new MissingSnapshotError();
    }
  }
}

/**
 * Create a new snapshot saving given files and arguments
 *
 * ```typescript
 * await restore()
 *   .repository(..)
 *   .password(..)
 *   .snapshot(..)
 *   .target(..);
 * ```
 */
export function restore() {
  return new RestoreArgumentBuilder() as DynamicBuilder<z.infer<typeof restoreArgs>, RestoreArgumentBuilder>;
}

const restoreStatusMessage = z.object({
  message_type: z.literal('status'),
  seconds_elapsed: z.number().int().nonnegative().optional(),
  percent_done: z.number(),
  total_files: z.number().int().nonnegative().optional(),
  files_restored: z.number().int().nonnegative().optional(),
  files_skipped: z.number().int().nonnegative().optional(),
  files_deleted: z.number().int().nonnegative().optional(),
  total_bytes: z.number().int().nonnegative().optional(),
  bytes_restored: z.number().int().nonnegative().optional(),
  bytes_skipped: z.number().int().nonnegative().optional(),
});

const restoreVerboseStatusMessage = z.object({
  message_type: z.literal('verbose_status'),
  action: z.enum(['restored', 'updated', 'unchanged', 'deleted']),
  item: z.string(),
  size: z.number().int().nonnegative(),
});

const restoreSummaryMessage = z.object({
  message_type: z.literal('summary'),
  seconds_elapsed: z.number().int().nonnegative().optional(),
  total_files: z.number().int().nonnegative().optional(),
  files_restored: z.number().int().nonnegative().optional(),
  files_skipped: z.number().int().nonnegative().optional(),
  files_deleted: z.number().int().nonnegative().optional(),
  total_bytes: z.number().int().nonnegative().optional(),
  bytes_restored: z.number().int().nonnegative().optional(),
  bytes_skipped: z.number().int().nonnegative().optional(),
});

const restoreMessage = z.union([restoreStatusMessage, restoreVerboseStatusMessage, restoreSummaryMessage]);
