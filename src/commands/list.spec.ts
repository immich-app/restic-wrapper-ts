import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';

import { list } from './list';

describe('list', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
  });

  it.each(['blobs', 'packs', 'index', 'snapshots', 'keys', 'locks'])('lists %s', async (type) => {
    const items = await list()
      .repository(join(dir, 'repository'))
      .password('password')
      .type(type as any)
      .run();
    expect(Array.isArray(items)).toBe(true);
  });
});
