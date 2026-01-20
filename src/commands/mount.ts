/* istanbul ignore file */

import * as z from 'zod';
import {
  baseArgs,
  commonFilterArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import { spawnRestic } from '../utils/process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { MissingMountpointError } from '../errors';

const mountArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  /**
   * Allow other users to access the data in the mounted directory
   */
  allowOther: z.coerce.boolean(),
  /**
   * For 'allow-other', ignore Unix permissions and allow users to read all snapshot files
   */
  noDefaultPermissions: z.coerce.boolean(),
  /**
   * Use 'root' as the owner of files and directories
   */
  ownerRoot: z.coerce.boolean(),
  /**
   * Template to use for path strings
   * 
   * Use following patterns which will be replaced:
   * ```
   * %i by short snapshot ID
   * %I by long snapshot ID
   * %u by username
   * %h by hostname
   * %t by tags
   * %T by timestamp as specified by --time-template
   * ```
   * 
   * @default "ids/%i"
   * @default "snapshots/%T"
   * @default "hosts/%h/%T"
   * @default "tags/%t/%T"
   */
  pathTemplate: z.string().array().default([]),
  /**
   * Template to use for time strings
   * 
   * Must be a sample format for exactly the following timestamp:
   * > Mon Jan 2 15:04:05 -0700 MST 2006
   * 
   * @see https://godoc.org/time#Time.Format
   * @example 2006-01-02_15-04-05
   * @default 2006-01-02T15:04:05Z07:00
   */
  timeTemplate: z.string().optional(),
});

class MountArgumentBuilder extends RepositoryArgumentBuilder<string, string> {
  constructor() {
    super(mountArgs);
  }

  #mountpoint: string | undefined;

  mountpoint(mountpoint: string) {
    this.#mountpoint = mountpoint;
    return this as never as DynamicBuilder<
      z.infer<typeof mountArgs>,
      MountArgumentBuilder
    >;
  }

  toArgs(): string[] {
    return [...super.toArgs(), this.#mountpoint!];
  }

  command(): string {
    return 'mount';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'none';
  }

  parse(): never {
    throw "unimplemented"
  }

  validate(): void {
    if (!this.#mountpoint) {
      throw new MissingMountpointError();
    }
  }

  spawn(): ChildProcessWithoutNullStreams {
    return spawnRestic(this);
  }
}

/**
 * Create a FUSE mount for the repository.
 *
 * ```typescript
 * const process = await mount()
 *   .repository(..)
 *   .password(..)
 *   .spawn();
 * ```
 */
export function mount() {
  return new MountArgumentBuilder() as DynamicBuilder<
    z.infer<typeof mountArgs>,
    MountArgumentBuilder
  >;
}
