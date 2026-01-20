/* istanbul ignore file */

import { MissingTypeError } from '../errors';
import { baseArgs, RepositoryArgumentBuilder } from '../utils/args';

class ListArgumentBuilder extends RepositoryArgumentBuilder<string[], string[]> {
  constructor() {
    super(baseArgs);
  }

  #type: 'blobs' | 'packs' | 'index' | 'snapshots' | 'keys' | 'locks' | undefined;

  type(type: 'blobs' | 'packs' | 'index' | 'snapshots' | 'keys' | 'locks') {
    this.#type = type;
    return this;
  }

  toArgs(): string[] {
    return [...super.toArgs(), this.#type!];
  }

  command(): string {
    return 'list';
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  validate(): void {
    super.validate();

    if (!this.#type) {
      throw new MissingTypeError();
    }
  }

  parse(data: string[]): string[] {
    return (data as unknown as string).split('\n').filter(str => str);
  }
}

/**
 * List objects in repository of a given type.
 *
 * ```typescript
 * const items = await list()
 *   .repository(..)
 *   .password(..)
 *   .run();
 * ```
 */
export function list() {
  return new ListArgumentBuilder();
}
