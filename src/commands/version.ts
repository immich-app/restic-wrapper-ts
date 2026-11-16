import * as z from 'zod';
import { ArgumentBuilder } from '../utils/args';

class VersionArgumentBuilder extends ArgumentBuilder<z.infer<typeof versionMessage>, z.infer<typeof versionMessage>> {
  command(): string {
    return 'version';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
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

export function features({ version }: Pick<z.infer<typeof versionMessage>, 'version'>) {
  const counter = /\+futo\.(\d{1,6})(?:\.|$)/.exec(version);
  let revision = counter ? Number(counter[1]) : 0;
  if (!counter && version.includes('+futo.')) {
    revision = 1;
  }

  return {
    walkConcurrency: revision >= 1,
    iexcludeScopedGlob: revision >= 2,
  };
}

export const versionMessage = z.object({
  message_type: z.literal('version'),
  version: z.string(),
  go_version: z.string(),
  go_os: z.string(),
  go_arch: z.string(),
});
