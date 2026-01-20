import * as z from 'zod';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const initArgs = z.object({
  ...baseArgs.shape,
  /**
   * Copy chunker parameters from secondary repository
   */
  copyChunkerParams: z.coerce.boolean(),
  /**
   * Use an empty password for source repository
   */
  fromInsecureNoPassword: z.coerce.boolean(),
  /**
   * Shell command to obtain source repository password from
   */
  fromPasswordCommand: z.string().optional(),
  /**
   * File to read the source repository password from
   */
  fromPasswordFile: z.string().optional(),
  /**
   * Source repository to copy chunker parameters from
   */
  fromRepo: z.string().optional(),
  /**
   * File from which to read the source repository location to copy chunker parameters from
   */
  fromRepositoryFile: z.string().optional(),
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

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'none' {
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
