import * as z from 'zod';
import { MissingFilesError } from '../errors';
import { baseArgs, commonGroupBy, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

export const backupArgs = z.object({
  ...baseArgs.shape,
  ...commonGroupBy.shape,
  /**
   * Do not upload or write any data
   */
  dryRun: z.coerce.boolean(),
  /**
   * Exclude by pattern(s)
   */
  exclude: z.string().array().default([]),
  /**
   * Exclude cache directories marked with CACHEDIR.TAG
   *
   * @see https://bford.info/cachedir/
   */
  excludeCaches: z.coerce.boolean(),
  /**
   * Exclude by patterns provided in file(s)
   */
  excludeFile: z.string().array().default([]),
  /**
   * Given filename[:header], exclude contents of directories containing
   * filename (except fielname itself) if header of that file is as provided
   */
  excludeIfPresent: z.string().array().default([]),
  /**
   * Exclude files larger than given size
   *
   * Allowed suffixes: k/K, m/M, g/G, t/T
   */
  excludeLargerThan: z
    .string()
    .regex(/^\d+(?:\.\d+)?[kKmMgGtT]$/)
    .optional(),
  /**
   * Read files to backup from given file(s)
   */
  filesFrom: z.string().array().default([]),
  /**
   * Read files to backup from given file(s)
   */
  filesFromRaw: z.string().array().default([]),
  /**
   * Read files to backup from given file(s)
   */
  filesFromVerbatim: z.string().array().default([]),
  /**
   * Force re-reading source files/directories
   *
   * (overrides 'parent' flag)
   */
  force: z.coerce.boolean(),
  /**
   * Set the hostname for the snapshot
   */
  host: z.string().optional(),
  /**
   * Same as .exclude(..) but ignores case
   */
  iexclude: z.coerce.string().array().default([]),
  /**
   * Same as .excludeFile(..) but ignores case
   */
  iexcludeFile: z.coerce.string().array().default([]),
  /**
   * Ignore ctime changes when checking for modified files
   */
  ignoreCtime: z.coerce.boolean(),
  /**
   * Ignore inode number and ctime changes when checking for modified files
   */
  ignoreInode: z.coerce.boolean(),
  /**
   * Do not run scanner to estimate size of backup
   */
  noScan: z.coerce.boolean(),
  /**
   * Do not cross filesystem boundaries
   */
  oneFileSystem: z.coerce.boolean(),
  /**
   * Use this parent snapshot
   *
   * @default latest snapshot in .groupBy(..) not newer than .time(..)
   */
  parent: z.string().optional(),
  /**
   * Read n files concurrently
   *
   * @default 2
   */
  readConcurrency: z.number().optional(),
  /**
   * Skip snapshot creation if identical to parent snapshot
   */
  skipIfUnchanged: z.coerce.boolean(),
  // stdin: unimplemented
  // stdin-filename: unimplemented
  // stdin-from-command: unimplemented
  /**
   * Add tags for new snapshot
   */
  tag: z.string().array().default([]),
  /**
   * Time of the backup
   *
   * @default now
   */
  time: z.date().optional(),
  /**
   * Store the atime for all files and directories
   */
  withAtime: z.coerce.boolean(),
});

class BackupArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof backupMessage>,
  z.infer<typeof backupSummaryMessage>
> {
  constructor() {
    super(backupArgs);
  }

  #files: string[] = [];

  /**
   * Add one or more files to backup
   */
  addFile(...files: string[]) {
    this.#files.push(...files);
    return this;
  }

  command(): string {
    return 'backup';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'jsonlines-no-log';
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#files];
  }

  parse(data: z.infer<typeof backupMessage>): z.infer<typeof backupMessage> {
    return backupMessage.parse(data);
  }

  validate(): void {
    super.validate();

    if (this.#files.length === 0) {
      throw new MissingFilesError();
    }
  }
}

/**
 * Create a new snapshot saving given files and arguments
 *
 * ```typescript
 * await backup()
 *   .repository(..)
 *   .password(..)
 *   .addFile('my.json')
 *   .addFile('path/to/folder')
 *   .run();
 * ```
 */
export function backup() {
  return new BackupArgumentBuilder() as DynamicBuilder<z.infer<typeof backupArgs>, BackupArgumentBuilder>;
}

const backupStatusMessage = z.object({
  message_type: z.literal('status'),

  seconds_elapsed: z.number().int().nonnegative().optional(),
  seconds_remaining: z.number().int().nonnegative().optional(),

  percent_done: z.number(),
  total_files: z.number().int().nonnegative(),
  total_bytes: z.number().int().nonnegative(),

  files_done: z.number().int().nonnegative().optional(),
  bytes_done: z.number().int().nonnegative().optional(),
  error_count: z.number().int().nonnegative().optional(),

  current_files: z.array(z.string()).optional(),
});

const backupVerboseStatusMessage = z.object({
  message_type: z.literal('verbose_status'),
  action: z.enum(['new', 'unchanged', 'modified', 'scan_finished']),
  item: z.string(),
  duration: z.number(),
  data_size: z.number().int().nonnegative(),
  data_size_in_repo: z.number().int().nonnegative(),
  metadata_size: z.number().int().nonnegative(),
  metadata_size_in_repo: z.number().int().nonnegative(),
  total_files: z.number().int().nonnegative(),
});

const backupSummaryMessage = z.object({
  message_type: z.literal('summary'),
  dry_run: z.coerce.boolean(),
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
  backup_start: z.coerce.date(),
  backup_end: z.coerce.date(),
  total_duration: z.number(),
  snapshot_id: z.string(),
});

const backupMessage = z.union([backupStatusMessage, backupVerboseStatusMessage, backupSummaryMessage]);
