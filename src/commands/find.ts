import { MissingMatchError } from '../errors';
import {
  baseArgs,
  commonFilterArgs,
  RepositoryArgumentBuilder,
  type DynamicBuilder,
} from '../utils/args';
import * as z from 'zod';

const findArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  // human-readable: N/A
  /**
   * Ignore case for pattern
   */
  ignoreCase: z.coerce.boolean(),
  // long: N/A
  /**
   * Newest modification date/time
   */
  newest: z.string().optional(),
  /**
   * Oldest modification date/time
   */
  oldest: z.string().optional(),
  // pack: unimplemented (no JSON output according to docs)
  /**
   * Reverse sort order oldest to newest
   */
  reverse: z.coerce.boolean(),
  /**
   * Display the pack-ID the blobs belong to
   */
  showPackId: z.coerce.boolean(),
  /**
   * Snapshot(s) to search in
   */
  snapshot: z.string().array().default([]),
});

class FindArgumentBuilder<T> extends RepositoryArgumentBuilder<T, T> {
  constructor() {
    super(findArgs);
  }

  #search: 'blob' | 'tree' | 'object' = 'object';
  #match: string[] = [];

  /* istanbul ignore next */
  blob() {
    this.#search = 'blob';
    return this as never as DynamicBuilder<
      z.infer<typeof findArgs>,
      FindArgumentBuilder<z.infer<typeof blobResults>>
    >;
  }

  /* istanbul ignore next */
  tree() {
    this.#search = 'tree';
    return this as never as DynamicBuilder<
      z.infer<typeof findArgs>,
      FindArgumentBuilder<z.infer<typeof treeResults>>
    >;
  }

  object() {
    this.#search = 'object';
    return this as never as DynamicBuilder<
      z.infer<typeof findArgs>,
      FindArgumentBuilder<z.infer<typeof objectResults>>
    >;
  }

  match(match: string) {
    this.#match.push(match);
    return this;
  }

  command(): string {
    return 'find';
  }

  toArgs(): string[] {
    const args = [];

    switch (this.#search) {
      /* istanbul ignore next */
      case 'blob':
        args.push('--blob');
        break;
      /* istanbul ignore next */
      case 'tree':
        args.push('--tree');
        break;
    }

    return [...super.toArgs(), ...args, ...this.#match];
  }

  format(): 'jsonlines' | 'json' {
    return 'json';
  }

  parse(data: T): T {
    switch (this.#search) {
      /* istanbul ignore next */
      case 'blob':
        return blobResults.parse(data) as T;
      /* istanbul ignore next */
      case 'tree':
        return treeResults.parse(data) as T;
      case 'object':
        return objectResults.parse(data) as T;
    }
  }

  validate(): void {
    super.validate();

    if (this.#match.length === 0) {
      throw new MissingMatchError();
    }
  }
}

/**
 * Find matches for given search terms
 *
 * ```typescript
 * const results = await find()
 *   .repository(..)
 *   .password(..)
 *   .match('*.json')
 *   .match('*.yml')
 *   .run();
 * ```
 */
export function find() {
  return new FindArgumentBuilder() as DynamicBuilder<
    z.infer<typeof findArgs>,
    FindArgumentBuilder<z.infer<typeof objectResults>>
  >;
}

const match = z.object({
  path: z.string(),
  permissions: z.string(),
  name: z.string().optional(),
  type: z.string(),
  atime: z.coerce.date(),
  mtime: z.coerce.date(),
  ctime: z.coerce.date(),
  user: z.string(),
  group: z.string(),
  inode: z.number().int().nonnegative(),
  mode: z.number().int().nonnegative(),
  device_id: z.number().int().nonnegative(),
  links: z.number().int().nonnegative(),
  link_target: z.string().optional(),
  uid: z.number().int().nonnegative(),
  gid: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
});

const objectResults = z
  .object({
    hits: z.number().int().nonnegative(),
    snapshot: z.string(),
    matches: match.array(),
  })
  .array();

const blobResults = z.array(
  z.object({
    object_type: z.literal('blob'),
    id: z.string(),
    path: z.string(),
    parent_tree: z.string(),
    snapshot: z.string(),
    time: z.string(),
  })
);

const treeResults = z.array(
  z.object({
    object_type: z.literal('tree'),
    id: z.string(),
    path: z.string(),
    parent_tree: z.string(),
    snapshot: z.string(),
    time: z.string(),
  })
);
