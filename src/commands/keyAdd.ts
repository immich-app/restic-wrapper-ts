import * as z from 'zod';
import { MissingPasswordError } from '../errors';
import { baseArgs, RepositoryArgumentBuilder, type DynamicBuilder } from '../utils/args';

const keyAddArgs = z.object({
  ...baseArgs.shape,
  /**
   * Hostname for the new key
   */
  host: z.string().optional(),
  /**
   * Username for the new key
   */
  user: z.string().optional(),
});

class KeyAddArgumentBuilder extends RepositoryArgumentBuilder<void, void> {
  #command: 'add' | 'passwd';

  constructor(command: 'add' | 'passwd' = 'add') {
    super(keyAddArgs);
    this.#command = command;
  }

  #password: string | false | undefined;

  newInsecureNoPassword() {
    this.#password = false;
    return this;
  }

  newPasswordFile(path: string) {
    this.#password = path;
    return this;
  }

  command(): string {
    return this.#command;
  }

  toArgs(): string[] {
    const args = ['key', ...super.toArgs()];

    if (this.#password === false) {
      args.push('--new-insecure-no-password');
    } else if (this.#password) {
      args.push('--new-password-file', this.#password);
    }

    return args;
  }

  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'none';
  }

  /* istanbul ignore next */
  parse(): never {
    throw 'unimplemented';
  }

  validate(): void {
    super.validate();

    if (this.#password === undefined) {
      throw new MissingPasswordError();
    }
  }
}

/**
 * Create and validate new key.
 *
 * ```typescript
 * await keyAdd()
 *   .repository(..)
 *   .password(..)
 *   .newPasswordFile(..)
 *   // or
 *   .newInsecureNoPassword();
 * ```
 */
export function keyAdd() {
  return new KeyAddArgumentBuilder() as DynamicBuilder<z.infer<typeof keyAddArgs>, KeyAddArgumentBuilder>;
}

/**
 * Update current key password and remove old key.
 *
 * ```typescript
 * await keyPasswd()
 *   .repository(..)
 *   .password(..)
 *   .newPasswordFile(..)
 *   // or
 *   .newInsecureNoPassword();
 * ```
 */
export function keyPasswd() {
  return new KeyAddArgumentBuilder('passwd') as DynamicBuilder<z.infer<typeof keyAddArgs>, KeyAddArgumentBuilder>;
}
