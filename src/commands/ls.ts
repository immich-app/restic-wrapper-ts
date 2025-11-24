import {
  baseArgs,
  commonFilterArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import * as z from 'zod';
import { snapshot } from './snapshots';
import { MissingSnapshotError } from '../errors';

const lsArgs = z.object({
  ...baseArgs.shape,

  /**
   * Only consider snapshots for these host(s)
   *
   * Applies only when .latest() is used
   */
  host: commonFilterArgs.shape.host,
  /**
   * Only consider snapshots including this (absolute) path
   *
   * Applies only when .latest() is used
   */
  path: commonFilterArgs.shape.path,
  /**
   * Only consider snapshots including tags
   *
   * Applies only when .latest() is used
   */
  tag: commonFilterArgs.shape.tag,

  // human-readable: N/A
  // long: N/A
  // ncdu: unimplemented
  /**
   * Include files in subfolders of listed directories
   */
  recursive: z.coerce.boolean(),
  /**
   * Reverse the sorted output
   */
  reverse: z.coerce.boolean(),
  /**
   * Sort output
   */
  sort: z
    .enum(['name', 'size', 'time', 'mtime', 'atime', 'ctime', 'extension'])
    .optional(),
});

class LsArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof lsMessage>,
  z.infer<typeof lsMessage>[]
> {
  constructor() {
    super(lsArgs);
  }

  #directories: string[] = [];

  /**
   * Select directory/directories to filter by
   */
  directory(...path: string[]) {
    this.#directories.push(...path);
    return this;
  }

  #snapshot: string | undefined;

  /**
   * Select snapshot to list
   */
  snapshot(snapshotId: string) {
    this.#snapshot = snapshotId;
    return this;
  }

  /**
   * Use latest snapshot
   */
  latest() {
    this.#snapshot = 'latest';
    return this;
  }

  command(): string {
    return 'ls';
  }

  toArgs(): string[] {
    return [...super.toArgs(), this.#snapshot!, ...this.#directories];
  }

  parse(data: z.infer<typeof lsMessage>): z.infer<typeof lsMessage> {
    return lsMessage.parse(data);
  }

  validate(): void {
    super.validate();

    if (!this.#snapshot) {
      throw new MissingSnapshotError();
    }
  }
}

/**
 * Test repository for errors and report any errors it finds.
 *
 * ```typescript
 * await ls()
 *   .repository(..)
 *   .password(..);
 * ```
 */
export function ls() {
  return new LsArgumentBuilder() as DynamicBuilder<
    z.infer<typeof lsArgs>,
    LsArgumentBuilder
  >;
}

const snapshotMessage = z.object({
  message_type: z.literal('snapshot'),
  /**
   * @deprecated
   */
  struct_type: z.literal('snapshot'),
  ...snapshot.shape,
});

const nodeMessage = z.object({
  message_type: z.literal('node'),
  struct_type: z.literal('node'),
  name: z.string(),
  type: z.string(),
  path: z.string(),
  uid: z.number().int().nonnegative(),
  gid: z.number().int().nonnegative(),
  /**
   * @deprecated missing in output
   */
  size: z.number().int().nonnegative().optional(),
  mode: z.number().int().nonnegative(),
  permissions: z.string(),
  atime: z.coerce.date(),
  mtime: z.coerce.date(),
  ctime: z.coerce.date(),
  inode: z.number().int().nonnegative(),
});

const lsMessage = z.union([snapshotMessage, nodeMessage]);
