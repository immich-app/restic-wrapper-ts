import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { keyAdd } from './keyAdd';
import { keyList } from './keyList';
import { keyRemove } from './keyRemove';
import { MissingKeyIdError } from '../errors';

describe('keyRemove', () => {
  let dir: string;
  let targetKeyId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await keyAdd().repository(join(dir, 'repository')).password('password').newInsecureNoPassword().run();
    const keys = await keyList().repository(join(dir, 'repository')).password('password').run();
    targetKeyId = keys.find(key => !key.current)!.id;
  });

  it('fails if keyId is not specified', async () => {
    await expect(keyRemove().repository(join(dir, 'repository')).password('password').run()).rejects.toThrowError(new MissingKeyIdError());
  });

  it('removes a key', {
    timeout: 10_000
  }, async () => {
    await keyRemove().repository(join(dir, 'repository')).password('password').keyId(targetKeyId).run();
    
    const keys = await keyList().repository(join(dir, 'repository')).password('password').run();
    expect(keys.length).toBe(1);
  });
});
