import * as z from 'zod';
import { baseArgs, commonFromRepositoryArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const initArgs = z.object({
  ...baseArgs.shape,
  ...commonFromRepositoryArgs.shape,
  /**
   * Copy chunker parameters from secondary repository
   */
  copyChunkerParams: z.coerce.boolean(),
  /**
   * Repository format version to use
   *
   * @default stable
   */
  repositoryVersion: z.enum(['latest', 'stable']).optional(),
});

class InitArgumentBuilder extends RepositoryArgumentBuilder<z.infer<typeof initMessage>, z.infer<typeof initMessage>> {
  constructor() {
    super(initArgs);
  }

  command(): string {
    return 'init';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    // only a single message is sent to output
    return 'json';
  }

  parse(data: z.infer<typeof initMessage>): z.infer<typeof initMessage> {
    return initMessage.parse(data);
  }
}

/**
 * Initialise a new repository
 *
 * ```typescript
 * await init()
 *   .repository(..)
 *   .password(..)
 * ```
 */
export function init() {
  return new InitArgumentBuilder() as DynamicBuilder<z.infer<typeof initArgs>, InitArgumentBuilder>;
}

const initMessage = z.object({
  message_type: z.literal('initialized'),
  id: z.string(),
  repository: z.string(),
});
