import * as z from 'zod';
import { MissingRepairTypeError } from '../errors';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

class RepairArgumentBuilder extends RepositoryArgumentBuilder<any, any> {
  #targetType: 'index' | 'packs' | 'snapshots' | undefined;
  #targetPacks: string[] = [];

  /**
   * Build a new index
   */
  index() {
    this.#targetType = 'index';
    this.#targetPacks = [];
    return this;
  }

  /**
   * Add a pack to check and repair
   * @param packIds Pack IDs
   */
  pack(...packIds: string[]) {
    this.#targetType = 'packs';
    this.#targetPacks.push(...packIds);
    return this;
  }

  /**
   * Repair snapshots
   */
  snapshots() {
    this.#targetType = 'snapshots';
    return this;
  }

  command(): string {
    return 'repair';
  }

  validate(): void {
    super.validate();

    if (!this.#targetType) {
      throw new MissingRepairTypeError();
    }
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'string';
  }

  toArgs(): string[] {
    return [...super.toArgs(), this.#targetType!, ...this.#targetPacks];
  }

  parse(data: string): string {
    return data;
  }
}

/**
 * Repair the repository.
 *
 * ```typescript
 * const result = await repair()
 *   .repository(join(dir, 'repository'))
 *   .password('password')
 *   .index()
 *   .run();
 * ```
 */
export function repair() {
  return new RepairArgumentBuilder() as DynamicBuilder<z.infer<typeof baseArgs>, RepairArgumentBuilder>;
}
