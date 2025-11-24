import { expect, test } from 'vitest';
import { createTempDir } from './utils/test';
import { join } from 'node:path';
import {
  backup,
  cat,
  check,
  diff,
  init,
  keyList,
  ls,
  snapshots,
  tag,
  version,
} from './commands';
import { writeFile } from 'node:fs/promises';

test('integration test', { timeout: 20_000 }, async () => {
  await expect(version()).resolves.toEqual(
    expect.objectContaining({
      version: '0.18.0',
    })
  );

  const dir = await createTempDir();
  const repository = join(dir, 'repository');
  const password = 'password';

  await init().repository(repository).password(password).run();

  await expect(
    keyList().repository(repository).password(password).run()
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        current: true,
      }),
    ])
  );

  await expect(
    check().repository(repository).password(password).run()
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        num_errors: 0,
        broken_packs: null,
        suggest_repair_index: false,
        suggest_prune: false,
      }),
    ])
  );

  await writeFile(join(dir, 'test-file'), 'test-file');

  const { files_new: filesNew, snapshot_id: firstSnapshotId } = await backup()
    .repository(repository)
    .password(password)
    .addFile(join(dir, 'test-file'))
    .tag('abc,def')
    .run();

  expect(filesNew).toBe(1);

  await expect(
    cat()
      .repository(repository)
      .password(password)
      .target('snapshot', firstSnapshotId)
      .run()
  ).resolves.toEqual(
    expect.objectContaining({
      tags: expect.arrayContaining(['abc', 'def']),
    })
  );

  const tagResult = await tag()
    .repository(repository)
    .password(password)
    .set('new-tag')
    .run();
  const {
    old_snapshot_id: oldSnapshotId,
    new_snapshot_id: newFirstSnapshotId,
  } = tagResult.find((result) => result.message_type === 'changed')!;

  expect(firstSnapshotId).toEqual(oldSnapshotId);

  const [
    {
      id: snapshotId,
      tags,
      summary: { total_files_processed },
    },
  ] = await snapshots().repository(repository).password(password).run();

  expect(newFirstSnapshotId).toEqual(snapshotId);
  expect(tags).toEqual(expect.arrayContaining(['new-tag']));
  expect(total_files_processed).toBe(1);

  await writeFile(join(dir, 'test-file'), 'new-contents');

  const { snapshot_id: newSnapshotId } = await backup()
    .repository(repository)
    .password(password)
    .addFile(join(dir, 'test-file'))
    .tag('new-tag')
    .run();

  await expect(
    diff()
      .repository(repository)
      .password(password)
      .compare(snapshotId, newSnapshotId)
      .run()
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: expect.stringContaining('test-file'),
        modifier: 'M',
      }),
    ])
  );

  await expect(
    ls().repository(repository).password(password).snapshot(snapshotId).run()
  ).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        paths: expect.arrayContaining([expect.stringContaining('test-file')]),
      }),
    ])
  );
});
