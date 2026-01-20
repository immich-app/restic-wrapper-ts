import type { ChildProcess } from 'node:child_process';
import EventEmitter from 'node:events';
import * as z from 'zod';
import { ResticEnvironmentVariable } from '../constants';
import { MissingPasswordError, MissingRepositoryError } from '../errors';
import { restic } from './process';

interface Events<T> {
  event: (event: T) => void;
  process: (process: ChildProcess) => void;
}

export const baseArgs = z.object({
  cacert: z.string().optional(),
  cacheDir: z.string().optional(),
  cleanupCache: z.coerce.boolean(),
  compression: z.enum(['auto', 'off', 'max']).optional(),
  httpUserAgent: z.string().optional(),
  insecureTls: z.coerce.boolean(),
  keyHint: z.string().optional(),
  limitDownload: z.number().optional(),
  limitUpload: z.number().optional(),
  noCache: z.coerce.boolean(),
  noExtraVerify: z.coerce.boolean(),
  noLock: z.coerce.boolean(),
  option: z
    .string()
    .regex(/^.+=.+$/)
    .optional(),
  packSize: z.number().optional(),
  retryLock: z.string().optional(),
  stuckRequestTimeout: z.string().optional(),
  tlsClientCert: z.string().optional(),
  /**
   * be verbose
   */
  verbose: z.coerce.boolean(),
});

export const commonFromRepositoryArgs = z.object({
  /**
   * Use an empty password for source repository
   */
  fromInsecureNoPassword: z.coerce.boolean(),
  /**
   * Key ID of key to try decrypting the source repository first
   */
  fromKeyHint: z.string().optional(),
  /**
   * Shell command to obtain source repository password from
   */
  fromPasswordCommand: z.string().optional(),
  /**
   * File to read the source repository password from
   */
  fromPasswordFile: z.string().optional(),
  /**
   * Source repository to copy chunker parameters/read from
   */
  fromRepo: z.string().optional(),
  /**
   * File from which to read the source repository location to copy chunker parameters/read from
   */
  fromRepositoryFile: z.string().optional(),
});

export const commonFilterArgs = z.object({
  /**
   * Only consider snapshots for these host(s)
   */
  host: z.string().array().default([]),
  /**
   * Only consider snapshots including this (absolute) path
   */
  path: z
    .string()
    .regex(/^(\\|\/)/)
    .array()
    .default([]),
  /**
   * Only consider snapshots including tags
   */
  tag: z.string().array().default([]),
});

export const commonGroupBy = z.object({
  /**
   * Group snapshots by host, paths, and/or tags
   *
   * @default host,paths
   */
  groupBy: z
    .string()
    .regex(/^(?:host|paths|tags)(?:,(?:host|paths|tags))*$|^$/)
    .optional(),
});

export const commonRepackArgs = z.object({
  /**
   * Tolerate given limit of unused data
   */
  maxUnused: z.string().optional(),
  /**
   * Stop after repacking this much data in total
   *
   * Allowed suffixes: k/K, m/M, g/G, t/T
   */
  maxRepackSize: z
    .string()
    .regex(/^\d+(?:\.\d+)?[kKmMgGtT]$/)
    .optional(),
  /**
   * Only repack packs which are cacheable
   */
  repackCacheableOnly: z.coerce.boolean(),
  /**
   * Repack pack files below 80% of target pack size
   */
  repackSmall: z.coerce.boolean(),
  /**
   * Repack all uncompressed data
   */
  repackUncompressed: z.coerce.boolean(),
  /**
   * Pack below-limit packfiles
   *
   * Allowed suffixes: k/K, m/M
   */
  repackSmallerThan: z
    .string()
    .regex(/^\d+(?:\.\d+)?[kKmM]$/)
    .optional(),
});

type Extend<T> = T extends Date ? T | string | number : T;

export type DynamicBuilder<T, C> = C & {
  [K in keyof T]-?: T[K] extends any[]
    ? (...args: Extend<T[K][any]>[]) => DynamicBuilder<T, C>
    : T[K] extends boolean
      ? (arg?: boolean) => DynamicBuilder<T, C>
      : undefined extends T[K]
        ? (arg?: Extend<T[K]>) => DynamicBuilder<T, C>
        : (arg: Extend<T[K]>) => DynamicBuilder<T, C>;
};

export abstract class ArgumentBuilder<T, Output> extends EventEmitter {
  #dynamicArgs: Record<string, any> = {};
  #zodArgs: z.ZodObject;

  constructor(args: z.ZodObject = baseArgs) {
    super();
    this.#zodArgs = args;

    for (const [key, validator] of Object.entries(args.shape)) {
      (this as z.infer<typeof args>)[key] = (...args: any) => {
        const actualValidator =
          validator instanceof z.ZodDefault
            ? validator.def.innerType
            : validator instanceof z.ZodOptional
              ? validator.def.innerType
              : validator;

        if (actualValidator instanceof z.ZodArray) {
          if (!this.#dynamicArgs[key]) {
            this.#dynamicArgs[key] = [];
          }

          this.#dynamicArgs[key].push(...validator.parse(args));
        } else if (args[0] === undefined && actualValidator instanceof z.ZodBoolean) {
          this.#dynamicArgs[key] = true;
        } else {
          this.#dynamicArgs[key] = validator.parse(args[0]);
        }

        return this;
      };
    }
  }

  #password:
    | {
        type: ResticEnvironmentVariable;
        value: string;
      }
    | false
    | undefined;

  get hasPassword() {
    return this.#password !== undefined;
  }

  public password(password: string) {
    this.#password = {
      type: ResticEnvironmentVariable.ResticPassword,
      value: password,
    };

    return this;
  }

  public passwordCommand(command: string) {
    this.#password = {
      type: ResticEnvironmentVariable.ResticPasswordCommand,
      value: command,
    };

    return this;
  }

  public passwordFile(path: string) {
    this.#password = {
      type: ResticEnvironmentVariable.ResticPasswordFile,
      value: path,
    };

    return this;
  }

  public insecureNoPassword() {
    this.#password = false;
    return this;
  }

  #repository:
    | {
        type: ResticEnvironmentVariable;
        value: string;
      }
    | undefined;

  get hasRepository() {
    return this.#repository !== undefined;
  }

  public repository(repository: string) {
    this.#repository = {
      type: ResticEnvironmentVariable.ResticRepository,
      value: repository,
    };

    return this;
  }

  public repositoryFile(path: string) {
    this.#repository = {
      type: ResticEnvironmentVariable.ResticRepositoryFile,
      value: path,
    };

    return this;
  }

  abstract command(): string;
  abstract parse(data: T): T;
  setFilter(data: string): boolean;
  setFilter(): boolean {
    return true;
  }
  validate(): void {
    this.#zodArgs.parse(this.#dynamicArgs);
  }
  format(): 'jsonlines' | 'jsonlines-no-log' | 'json' | 'string' | 'binary' | 'none' {
    return 'jsonlines';
  }

  toArgs(): string[] {
    const args = [this.command(), '--json'];

    if (this.#password === false) {
      args.push('--insecure-no-password');
    }

    for (const [key, value] of Object.entries(this.#dynamicArgs)) {
      const realKey = key.replaceAll(/[A-Z]/g, (str) => `-${str.toLowerCase()}`);
      const values = Array.isArray(value) ? value : [value];

      for (const value of values) {
        switch (typeof value) {
          case 'string': {
            args.push(`--${realKey}`, value);
            break;
          }
          case 'boolean': {
            if (value) {
              args.push(`--${realKey}`);
            }
            break;
          }
          case 'number': {
            args.push(`--${realKey}`, (value as number).toString());
            break;
          }
          case 'undefined': {
            break;
          }
          default: {
            if (value instanceof Date) {
              args.push(`--${realKey}`, value.toISOString());
            } else {
              console.warn(`Not sure how to handle ${key} = ${value} of type ${typeof value}`);
            }
          }
        }
      }
    }

    return args;
  }

  toEnv(): Record<string, string> {
    const env: Record<string, string> = {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
    };

    if (this.#repository) {
      env[this.#repository.type] = this.#repository.value;
    }

    if (this.#password) {
      env[this.#password.type] = this.#password.value;
    }

    return env;
  }

  async run(): Promise<Output> {
    return (await restic(this)) as Output;
  }

  on<K extends keyof Events<T>>(event: K, listener: Events<T>[K]) {
    return super.on(event, listener);
  }

  emit<K extends keyof Events<T>>(event: K, ...args: Parameters<Events<T>[K]>) {
    return super.emit(event, ...args);
  }

  once<K extends keyof Events<T>>(event: K, listener: Events<T>[K]) {
    return super.once(event, listener);
  }

  off<K extends keyof Events<T>>(event: K, listener: Events<T>[K]) {
    return super.off(event, listener);
  }
}

export abstract class RepositoryArgumentBuilder<T, Output> extends ArgumentBuilder<T, Output> {
  validate(): void {
    super.validate();

    if (!this.hasRepository) {
      throw new MissingRepositoryError();
    }

    if (!this.hasPassword) {
      throw new MissingPasswordError();
    }
  }
}
