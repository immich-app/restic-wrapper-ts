import { beforeEach, describe, it } from 'vitest';
import { init } from './init';
import { createTempDir } from '../utils/test';

describe('init', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
  });

  it('initialises a repository', async () => {
    await init().repository(dir).password('password').run();
  });
});
