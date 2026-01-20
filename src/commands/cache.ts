import * as z from 'zod';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';
import { findAndParseTable } from '../utils/tableParser';

export const cacheArgs = z.object({
  ...baseArgs.shape,
  /**
   * Max age in days for cache directories to be considered old
   *
   * @default 30
   */
  maxAge: z.number().int().nonnegative().optional(),
  /**
   * Do not output size of cache directories
   */
  noSize: z.boolean().optional(),
});

class CacheArgumentBuilder<T> extends RepositoryArgumentBuilder<T, T> {
  constructor() {
    super(cacheArgs);
  }

  #cleanup: boolean = false;

  /* istanbul ignore next */
  cleanup() {
    this.#cleanup = true;
    return this as never as DynamicBuilder<
      z.infer<typeof cacheArgs>,
      CacheArgumentBuilder<z.infer<typeof cacheCleanupMessage>>
    >;
  }

  command(): string {
    return 'cache';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  toArgs(): string[] {
    const args = super.toArgs();

    if (this.#cleanup) {
      args.push('--cleanup');
    }

    return args;
  }

  parse(data: unknown): T {
    if (this.#cleanup) {
      return cacheCleanupMessage.parse({
        raw: data as string,
        removedDirectories: (data as string).match(/no old cache dirs found/)
          ? 0
          : /remove (\d)+ old cache directories/.exec(data as string)?.[1],
      }) as T;
    }

    try {
      const noDirs = (data as string).match(/no cache dirs found/);
      if (noDirs) {
        return cacheListingMessage.parse({
          raw: data as string,
          directories: 0,
          table: [],
        }) as T;
      }

      return cacheListingMessage.parse({
        raw: data as string,
        directories: /(\d+) cache dirs in/.exec(data as string)?.[1],
        table: findAndParseTable(data as string),
      }) as T;
    } catch {
      return cacheListingMessage.parse({
        raw: data as string,
      }) as T;
    }
  }

  validate(): void {
    super.validate();
  }
}

/**
 * Operate on local cache directories.
 *
 * ```typescript
 * await cache()
 *   .repository(..)
 *   .password(..)
 * ```
 */
export function cache() {
  return new CacheArgumentBuilder() as DynamicBuilder<
    z.infer<typeof cacheArgs>,
    CacheArgumentBuilder<z.infer<typeof cacheListingMessage>>
  >;
}

const cacheListingMessage = z.object({
  raw: z.string(),
  directories: z.coerce.number().int().nonnegative().optional(),
  table: z
    .array(
      z.object({
        'Repo ID': z.string().trim(),
        'Last Used': z.string().trim(),
        Old: z.string().transform((val) => val.trim() === 'yes'),
        Size: z.string().trim().optional(),
      }),
    )
    .optional(),
});

const cacheCleanupMessage = z.object({
  raw: z.string(),
  removedDirectories: z.coerce.number().int().nonnegative().optional(),
});
