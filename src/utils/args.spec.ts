import { describe, expect, it } from 'vitest';
import { MissingPasswordError, MissingRepositoryError } from '../errors';
import { commonFilterArgs, RepositoryArgumentBuilder, type DynamicBuilder } from './args';

import * as z from 'zod';

describe('commonFilterArgs', () => {
  it('validates absolute paths starting with forward slash', () => {
    expect(() => commonFilterArgs.shape.path.parse(['/home/user/data'])).not.toThrow();
    expect(() => commonFilterArgs.shape.path.parse(['/'])).not.toThrow();
    expect(() => commonFilterArgs.shape.path.parse(['/var/log', '/etc/config'])).not.toThrow();
  });

  it('validates absolute paths starting with backslash', () => {
    expect(() => commonFilterArgs.shape.path.parse(['\\Users\\data'])).not.toThrow();
    expect(() => commonFilterArgs.shape.path.parse(['\\'])).not.toThrow();
  });

  it('rejects relative paths', () => {
    expect(() => commonFilterArgs.shape.path.parse(['relative/path'])).toThrow();
    expect(() => commonFilterArgs.shape.path.parse(['./local'])).toThrow();
    expect(() => commonFilterArgs.shape.path.parse(['file.txt'])).toThrow();
  });
});

describe('RepositoryArgumentBuilder', () => {
  const dummyArgs = z.object({
    string: z.string().optional(),
    multiple: z.string().array().default([]),
    number: z.number().optional(),
    toggle: z.coerce.boolean(),
    toggle2: z.coerce.boolean(),
    date: z.coerce.date().array().default([]),
    skipped: z.undefined(),
    unsupportedArg: z.object().optional(),
  });

  class DummyArguments extends RepositoryArgumentBuilder<null, null> {
    constructor() {
      super(dummyArgs);
    }

    command(): string {
      return 'command';
    }

    parse(_data: null): null {
      throw new Error('Method not implemented.');
    }
  }

  it('fails to validate if repository is missing', () => {
    expect(() => new DummyArguments().validate()).toThrowError(new MissingRepositoryError());
  });

  it('fails to validate if password is missing', () => {
    expect(() => new DummyArguments().repository('repository').validate()).toThrowError(new MissingPasswordError());
  });

  it('successfully validates with repository and password', () => {
    new DummyArguments().repository('repository').password('password').validate();
  });

  it('generates dynamic arguments', () => {
    expect(
      (new DummyArguments() as DynamicBuilder<z.infer<typeof dummyArgs>, DummyArguments>)
        .repository('repository')
        .password('password')
        .string('my string')
        .multiple('a')
        .multiple('b', 'c')
        .number(5)
        .toggle()
        .toggle2(false)
        .date(new Date('2025-01-01'))
        .date('2025-01-01')
        .date(+new Date('2025-01-01'))
        .skipped()
        .unsupportedArg({ hello: 'world!' } as never /* hit the else-case for args. */)
        .toArgs(),
    ).toMatchInlineSnapshot(`
      [
        "command",
        "--json",
        "--string",
        "my string",
        "--multiple",
        "a",
        "--multiple",
        "b",
        "--multiple",
        "c",
        "--number",
        "5",
        "--toggle",
        "--date",
        "2025-01-01T00:00:00.000Z",
        "--date",
        "2025-01-01T00:00:00.000Z",
        "--date",
        "2025-01-01T00:00:00.000Z",
      ]
    `);
  });
});
