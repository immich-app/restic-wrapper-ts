import StreamZip from 'node-stream-zip';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import * as tar from 'tar';
import { beforeEach, describe, expect, it } from 'vitest';
import { MissingFileError, MissingFilesError, MissingSnapshotError } from '../errors';
import { createTempDir, initRepository } from '../utils/test';
import { backup } from './backup';
import { dump } from './dump';

describe('dump', () => {
  let dir: string;
  let snapshotId: string;

  beforeEach(async () => {
    dir = await createTempDir();
    await initRepository(join(dir, 'repository'));

    await mkdir(join(dir, 'target'));
    await writeFile(join(dir, 'test-file'), 'data');

    const { snapshot_id } = await backup()
      .repository(join(dir, 'repository'))
      .password('password')
      .addFile(join(dir, 'test-file'))
      .run();

    snapshotId = snapshot_id;
  });

  it('fails if snapshot is not specified', async () => {
    await expect(dump().repository(join(dir, 'repository')).password('password').run()).rejects.toThrowError(
      new MissingSnapshotError(),
    );
  });

  it('fails if file is not specified', async () => {
    await expect(
      dump().repository(join(dir, 'repository')).password('password').snapshot('snapshot').run(),
    ).rejects.toThrowError(new MissingFileError());
  });

  it('dumps file to stdout', async () => {
    const buffer = await dump()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .file(join(dir, 'test-file'))
      .run();

    expect(buffer.toString()).toBe('data');
  });

  it('dumps file to file', async () => {
    await expect(
      dump()
        .repository(join(dir, 'repository'))
        .password('password')
        .snapshot(snapshotId)
        .file(join(dir, 'test-file'))
        .target(join(dir, 'output-file'))
        .run(),
    ).resolves.toBeUndefined();
  });

  it('dumps folder as tar', async () => {
    const buffer = await dump()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .file(dir)
      .run();

    const filenames: string[] = [];
    await new Promise((resolve) =>
      Readable.from(buffer)
        .pipe(tar.t())
        .on('entry', (entry) => filenames.push(entry.path))
        .on('end', resolve),
    );

    expect(filenames).toContainEqual(expect.stringContaining('test-file'));
  });

  it('dumps folder as zip', async () => {
    await dump()
      .repository(join(dir, 'repository'))
      .password('password')
      .snapshot(snapshotId)
      .file(dir)
      .archive('zip')
      .target(join(dir, 'output.zip'))
      .run();

    const zip = new StreamZip.async({ file: join(dir, 'output.zip') });
    const entries = await zip.entries();
    expect(Object.values(entries)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: expect.stringContaining('test-file'),
        }),
      ]),
    );

    await zip.close();
  });
});
