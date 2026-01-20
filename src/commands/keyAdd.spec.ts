import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { keyAdd } from './keyAdd';
import { keyList } from './keyList';
import { writeFile } from 'node:fs/promises';

describe('keyAdd', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
  });

  it('adds a new key with no password', {
    timeout: 10_000
  }, async () => {
    await keyAdd().repository(join(dir, 'repository')).password('password').newInsecureNoPassword().run();

    const keys = await keyList().repository(join(dir, 'repository')).insecureNoPassword().run();
    expect(keys.length).toBe(2);
  });

  it('adds a new key with password', {
    timeout: 10_000
  }, async () => {
    await writeFile(join(dir, 'pwd'), 'new-password');
    await keyAdd().repository(join(dir, 'repository')).password('password').newPasswordFile(join(dir, 'pwd')).run();

    const keys = await keyList().repository(join(dir, 'repository')).password('new-password').run();
    expect(keys.length).toBe(2);
  });
});
