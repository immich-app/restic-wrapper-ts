import * as z from 'zod';
import { baseArgs, commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const statsArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
});

class StatsArgumentBuilder<T> extends RepositoryArgumentBuilder<T, T> {
  constructor() {
    super(statsArgs);
  }

  #snapshots: string[] = [];

  /**
   * Select snapshot(s) to generate stats for
   */
  snapshot(...snapshots: string[]) {
    this.#snapshots.push(...snapshots);
    return this;
  }

  #mode: 'restore-size' | 'files-by-contents' | 'blobs-per-file' | 'raw-data' = 'restore-size';

  /**
   * Set counting mode to restore size
   */
  modeRestoreSize() {
    this.#mode = 'restore-size';
    return this as StatsArgumentBuilder<z.infer<typeof restoreSizeMessage>>;
  }

  /**
   * Set counting mode to files by content
   */
  modeFilesByContents() {
    this.#mode = 'files-by-contents';
    return this as StatsArgumentBuilder<z.infer<typeof filesByContentsMessage>>;
  }

  /**
   * Set counting mode to blobs per file
   */
  modeBlobsPerFile() {
    this.#mode = 'blobs-per-file';
    return this as StatsArgumentBuilder<z.infer<typeof blobsPerFileMessage>>;
  }

  /**
   * Set counting mode to raw data
   */
  modeRawData() {
    this.#mode = 'raw-data';
    return this as StatsArgumentBuilder<z.infer<typeof rawDataMessage>>;
  }

  command(): string {
    return 'stats';
  }

  toArgs(): string[] {
    return [...super.toArgs(), '--mode', this.#mode, ...this.#snapshots];
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' {
    return 'json';
  }

  parse(data: T): T {
    switch (this.#mode) {
      case 'restore-size': {
        return restoreSizeMessage.parse(data) as T;
      }
      case 'files-by-contents': {
        return filesByContentsMessage.parse(data) as T;
      }
      case 'blobs-per-file': {
        return blobsPerFileMessage.parse(data) as T;
      }
      case 'raw-data': {
        return rawDataMessage.parse(data) as T;
      }
    }
  }
}

/**
 * Walk one or more snapshots in a repository to accumulate statistics
 *
 * ```typescript
 * const stats = await stats()
 *   .repository(..)
 *   .password(..)
 *   .snapshot(..);
 * ```
 */
export function stats() {
  return new StatsArgumentBuilder() as DynamicBuilder<
    z.infer<typeof statsArgs>,
    StatsArgumentBuilder<z.infer<typeof restoreSizeMessage>>
  >;
}

const restoreSizeMessage = z.object({
  snapshots_count: z.number().int().nonnegative(),
  total_file_count: z.number().int().nonnegative().optional(),
  total_size: z.number().int().nonnegative(),
});

const filesByContentsMessage = z.object({
  snapshots_count: z.number().int().nonnegative(),
  total_file_count: z.number().int().nonnegative().optional(),
  total_size: z.number().int().nonnegative(),
});

const blobsPerFileMessage = z.object({
  snapshots_count: z.number().int().nonnegative(),
  total_blob_count: z.number().int().nonnegative().optional(),
  total_file_count: z.number().int().nonnegative().optional(),
  total_size: z.number().int().nonnegative(),
});

const rawDataMessage = z.object({
  compression_progress: z.number().optional(),
  compression_ratio: z.number().optional(),
  compression_space_saving: z.number().optional(),
  snapshots_count: z.number().int().nonnegative(),
  total_blob_count: z.number().int().nonnegative().optional(),
  total_size: z.number().int().nonnegative(),
  total_uncompressed_size: z.number().int().nonnegative().optional(),
});

// const _statsMessage = z.object({
//   total_size: z.number().int().nonnegative().optional(),
//   total_file_count: z.number().int().nonnegative().optional(),
//   total_blob_count: z.number().int().nonnegative().optional(),
//   snapshots_count: z.number().int().nonnegative().optional(),
//   total_uncompressed_size: z.number().int().nonnegative().optional(),
//   compression_ratio: z.number().optional(),
//   compression_progress: z.number().optional(),
//   compression_space_saving: z.number().optional(),
// });
