import * as z from 'zod';
import { ArgumentBuilder } from '../utils/args';

class VersionArgumentBuilder extends ArgumentBuilder<z.infer<typeof versionMessage>, z.infer<typeof versionMessage>> {
  command(): string {
    return 'version';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' {
    return 'json';
  }

  parse(data: z.infer<typeof versionMessage>): z.infer<typeof versionMessage> {
    return versionMessage.parse(data);
  }
}

/**
 * Get version information about restic
 *
 * ```typescript
 * const restic = await version();
 * ```
 */
export async function version(): Promise<z.infer<typeof versionMessage>> {
  return await new VersionArgumentBuilder().run();
}

export const versionMessage = z.object({
  message_type: z.literal('version'),
  version: z.string(),
  go_version: z.string(),
  go_os: z.string(),
  go_arch: z.string(),
});
