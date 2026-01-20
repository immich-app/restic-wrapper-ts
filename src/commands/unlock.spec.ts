import { beforeEach, describe, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { join } from 'node:path';
import { unlock } from './unlock';

describe('unlock', () => {
  let dir: string;

  beforeEach(async () => {
      dir = await createTempDir();
      await initRepository(join(dir, 'repository'));
  });

  it('works', async () => {
    await unlock().repository(join(dir, 'repository')).password('password').run();
  });
});
