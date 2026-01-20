import * as z from 'zod';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

class KeyListArgumentBuilder extends RepositoryArgumentBuilder<
  z.infer<typeof keyListMessage>,
  z.infer<typeof keyListMessage>
> {
  command(): string {
    return 'list';
  }

  toArgs(): string[] {
    return ['key', ...super.toArgs()];
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'none' {
    return 'json';
  }

  parse(data: z.infer<typeof keyListMessage>): z.infer<typeof keyListMessage> {
    return keyListMessage.parse(data);
  }
}

/**
 * List all keys (passwords) associated with the repository
 *
 * ```typescript
 * const keys = await keyList()
 *   .repository(..)
 *   .password(..);
 * ```
 */
export function keyList() {
  return new KeyListArgumentBuilder() as DynamicBuilder<z.infer<typeof baseArgs>, KeyListArgumentBuilder>;
}

const keyListMessage = z.array(
  z.object({
    current: z.boolean(),
    id: z.string(),
    userName: z.string(),
    hostName: z.string(),
    created: z.coerce.date(),
  }),
);
