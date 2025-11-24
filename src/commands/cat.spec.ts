import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { MissingTargetError } from '../errors';
import { cat } from './cat';

describe('check', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
  });

  it('returns config', async () => {
    await expect(
      cat().repository(join(dir, 'repository')).password('password').target('config').run(),
    ).resolves.toEqual(
      expect.objectContaining({
        version: 2,
      }),
    );
  });

  it('throws without a target', async () => {
    expect(() => cat().repository(join(dir, 'repository')).password('password').validate()).toThrowError(
      new MissingTargetError(),
    );
  });
});
