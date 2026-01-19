import * as z from 'zod';
import { baseArgs, commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const tagArgs = z.object({
  ...baseArgs.shape,
  ...commonFilterArgs.shape,
  /**
   * Tags which will be added to existing tags
   */
  add: z.string().array().default([]),
  /**
   * Tags to remove from existing tags
   */
  remove: z.string().array().default([]),
  /**
   * Tags which will replace existing tags
   */
  set: z.string().array().default([]),
});

class TagArgumentBuilder extends RepositoryArgumentBuilder<z.infer<typeof tagMessage>, z.infer<typeof tagMessage>[]> {
  constructor() {
    super(tagArgs);
  }

  #snapshots: string[] = [];

  snapshot(...snapshots: string[]) {
    this.#snapshots.push(...snapshots);
    return this;
  }

  command(): string {
    return 'tag';
  }

  setFilter(line: string): boolean {
    return line !== 'create exclusive lock for repository';
  }

  toArgs(): string[] {
    return [...super.toArgs(), ...this.#snapshots];
  }

  parse(data: z.infer<typeof tagMessage>): z.infer<typeof tagMessage> {
    return tagMessage.parse(data);
  }
}

/**
 * Modify tags on existing snapshots
 *
 * ```typescript
 * await tag()
 *   .repository(..)
 *   .password(..)
 *   .set('my', 'tag')
 *   .snapshot(..)
 *   .run();
 * ```
 */
export function tag() {
  return new TagArgumentBuilder() as DynamicBuilder<z.infer<typeof tagArgs>, TagArgumentBuilder>;
}

const changedMessage = z.object({
  message_type: z.literal('changed'),
  old_snapshot_id: z.string(),
  new_snapshot_id: z.string(),
});

const summaryMessage = z.object({
  message_type: z.literal('summary'),
  changed_snapshots: z.number().int(),
});

const tagMessage = z.union([changedMessage, summaryMessage]);
