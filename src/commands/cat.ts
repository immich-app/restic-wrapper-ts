import * as z from 'zod';
import { MissingTargetError } from '../errors';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

class CatArgumentBuilder extends RepositoryArgumentBuilder<any, any> {
  #target: string | undefined;
  #id: string | undefined;

  /**
   * The object to read from.
   */
  target(target: 'masterkey' | 'config'): this;
  target(target: 'pack' | 'blob' | 'snapshot' | 'index' | 'key' | 'lock', id: string): this;
  target(target: 'tree', path: string): this;
  target(
    target: 'masterkey' | 'config' | 'pack' | 'blob' | 'snapshot' | 'index' | 'key' | 'lock' | 'tree',
    arg2?: string,
  ) {
    this.#target = target;
    this.#id = arg2;
    return this;
  }

  command(): string {
    return 'cat';
  }

  validate(): void {
    super.validate();

    if (!this.#target) {
      throw new MissingTargetError();
    }
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'none' {
    return 'json';
  }

  toArgs(): string[] {
    const args = [this.#target!];

    if (this.#id) {
      args.push(this.#id);
    }

    return [...super.toArgs(), ...args];
  }

  parse(data: any): any {
    return data;
  }
}

/**
 * Fetch data about various objects in repository.
 *
 * ```typescript
 * const result = await cat()
 *   .repository(join(dir, 'repository'))
 *   .password('password')
 *   .target('masterkey')
 *   .run();
 * ```
 */
export function cat() {
  return new CatArgumentBuilder() as DynamicBuilder<z.infer<typeof baseArgs>, CatArgumentBuilder>;
}
