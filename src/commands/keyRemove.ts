import { MissingKeyIdError } from '../errors';
import { RepositoryArgumentBuilder } from '../utils/args';

class KeyRemoveArgumentBuilder extends RepositoryArgumentBuilder<void, void> {
  #keyId: string | undefined;

  keyId(keyId: string) {
    this.#keyId = keyId;
    return this;
  }

  command(): string {
    return 'remove';
  }

  toArgs(): string[] {
    return ['key', ...super.toArgs(), this.#keyId!];
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'none';
  }

  parse(): never {
    throw 'unimplemented';
  }

  validate(): void {
    super.validate();
    
    if (this.#keyId === undefined) {
      throw new MissingKeyIdError();
    }
  }
}

/**
 * Delete an existing key by its ID.
 *
 * ```typescript
 * await keyRemove()
 *   .repository(..)
 *   .password(..)
 *   .keyId(..)
 * ```
 */
export function keyRemove() {
  return new KeyRemoveArgumentBuilder();
}
