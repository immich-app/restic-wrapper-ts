import { beforeEach, describe, it } from 'vitest';
import { createTempDir } from '../utils/test';
import { init } from './init';

describe('init', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
  });

  it('initialises a repository', async () => {
    await init().repository(dir).password('password').run();
  });
});
