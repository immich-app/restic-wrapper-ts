import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { keyList } from './keyList';

describe('keyList', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
  });

  it('lists keys', async () => {
    const keys = await keyList().repository(join(dir, 'repository')).password('password').run();

    expect(keys.length).toBe(1);
    expect(keys[0].current).toBeTruthy();
  });
});
