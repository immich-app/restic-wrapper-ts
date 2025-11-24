import { writeFile } from 'node:fs/promises';
import { beforeEach, describe, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { join } from 'node:path';

import { check } from './check';

describe('check', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await createTempDir();

    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'repository-file'), join(dir, 'repository'));
    await writeFile(join(dir, 'password-file'), 'password');
  });

  it('checks empty repository', async () => {
    await check()
      .repository(join(dir, 'repository'))
      .password('password')
      .run();
  });

  it('can load repository path from file', async () => {
    await check()
      .repositoryFile(join(dir, 'repository-file'))
      .password('password')
      .run();
  });

  it('can load password from file', async () => {
    await check()
      .repository(join(dir, 'repository'))
      .passwordFile(join(dir, 'password-file'))
      .run();
  });

  it('can load password from command', async () => {
    await check()
      .repository(join(dir, 'repository'))
      .passwordCommand('/usr/bin/env bash -c "echo password"')
      .run();
  });

  it.todo('fails to lock the repository');
  it.todo('handles being interrupted');
});
