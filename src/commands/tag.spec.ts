import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, initRepository } from '../utils/test';
import { backup } from './backup';
import { snapshots } from './snapshots';
import { tag } from './tag';

describe('tag', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .tag('abc,def,ghi')
      .run();

    await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .tag('abc,def,ghi')
      .run();

    snapshotId = snapshot_id;
  });

  it('updates a specific snapshot', async () => {
    await tag().repository(join(dir, 'repository')).password('password').set('new-tag').snapshot(snapshotId).run();

    await expect(snapshots().repository(join(dir, 'repository')).password('password').run()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tags: expect.arrayContaining(['abc', 'def', 'ghi']),
        }),
        expect.objectContaining({
          tags: ['new-tag'],
        }),
      ]),
    );
  });

  it.each([
    {
      action: 'set',
      tags: ['abc'],
    },
    {
      action: 'add',
      tags: expect.arrayContaining(['abc', 'def', 'ghi']),
    },
    {
      action: 'remove',
      tags: expect.not.arrayContaining(['abc']),
    },
  ])('can $action tag', async ({ action, tags }) => {
    await expect(
      tag().repository(join(dir, 'repository')).password('password')[action as 'set' | 'add' | 'remove']('abc').run(),
    ).resolves.toEqual(
      action === 'add'
        ? expect.arrayContaining([
            expect.objectContaining({
              message_type: 'summary',
              changed_snapshots: 0,
            }),
          ])
        : expect.arrayContaining([
            expect.objectContaining({
              message_type: 'changed',
              old_snapshot_id: snapshotId,
            }),
            expect.objectContaining({
              message_type: 'changed',
              old_snapshot_id: snapshotId,
            }),
            expect.objectContaining({
              message_type: 'summary',
              changed_snapshots: 2,
            }),
          ]),
    );

    await expect(snapshots().repository(join(dir, 'repository')).password('password').run()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tags,
        }),
        expect.objectContaining({
          tags,
        }),
      ]),
    );
  });
});
