/* istanbul ignore file @preserve */

import * as z from 'zod';
import {
  baseArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';

const migrateArgs = z.object({
  ...baseArgs.shape,
  /**
   * Force migration to run even if it's already been performed.
   */
  force: z.coerce.boolean().optional(),
});

class MigrateArgumentBuilder extends RepositoryArgumentBuilder<string, string> {
  constructor() {
    super(migrateArgs);
  }

  // corresponds to https://github.com/restic/restic/tree/master/internal/migrations
  #migration: 'upgrade_repo_v2' | undefined;

  migration(name: 'upgrade_repo_v2') {
    this.#migration = name;
  }

  command(): string {
    return 'migrate';
  }

  toArgs(): string[] {
    const args = super.toArgs();

    if (this.#migration !== undefined) {
      args.push(this.#migration);
    }

    return args;
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  /* istanbul ignore next */
  parse(): never {
    throw "unimplemented"
  }
}

/**
 * Run repository migrations.
 *
 * ```typescript
 * await migrate()
 *   .repository(..)
 *   .password(..)
 *   .migration('upgrade_repo_v2')
 *   .force()
 *   .run();
 * ```
 */
export function migrate() {
  return new MigrateArgumentBuilder() as DynamicBuilder<
    z.infer<typeof migrateArgs>,
    MigrateArgumentBuilder
  >;
}
