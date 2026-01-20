import * as z from 'zod';

export class MissingFilesError extends Error {
  constructor() {
    super('Specify files to create snapshot from with .addFile(..)');
  }
}

export class MissingFileError extends Error {
  constructor() {
    super('Specify file to dump with .file(..)');
  }
}

export class MissingRepositoryError extends Error {
  constructor() {
    super('Specify a repository with .repository(..) or .repositoryFile(..)');
  }
}

export class MissingPasswordError extends Error {
  constructor() {
    super('Specify a repository password with .password(..), .passwordFile(..), .passwordCommand(..) or .insecureNoPassword()');
  }
}

export class MissingKeyIdError extends Error {
  constructor() {
    super('Specify key ID with .keyId(..)');
  }
}

export class MissingSnapshotError extends Error {
  constructor() {
    super('Specify a snapshot with .snapshot(..)');
  }
}

export class MissingTargetError extends Error {
  constructor() {
    super('Specify a target with .target(..)');
  }
}

export class MissingTypeError extends Error {
  constructor() {
    super('Specify a type with .type(..)');
  }
}

export class MissingRepairTypeError extends Error {
  constructor() {
    super('Specify something to repair with .index(), .pack(..) or .snapshots()');
  }
}

export class MissingMountpointError extends Error {
  constructor() {
    super('Specify a mount point with .mountpoint(..)');
  }
}

export class MissingMatchError extends Error {
  constructor() {
    super('Specify what to match with .match(..)');
  }
}

export class MissingCompareError extends Error {
  constructor() {
    super('Specify what to compare with .compare(..)');
  }
}

const errorMessage = z.union([
  z.object({
    message_type: z.literal('exit_error'),
    code: z.number().int(),
    message: z.string(),
  }),
  z.object({
    message_type: z.literal('error'),
    message: z.string().optional(),
    error: z
      .object({
        message: z.string(),
      })
      .optional(),
    during: z.string().optional(),
    item: z.string().optional(),
  }),
  z.object({
    message_type: z.literal('raw'),
    message: z.string(),
  }),
]);

class TryParseError extends Error {
  error: z.infer<typeof errorMessage>[] | string;

  constructor(message: string) {
    const error = message.split('\n').map((item) => {
      try {
        return errorMessage.parse(JSON.parse(item));
      } catch {
        return {
          message_type: 'raw' as const,
          message: item,
        };
      }
    });

    super(
      error
        .map((e) =>
          e.message_type === 'raw'
            ? e.message
            : e.message_type === 'exit_error'
              ? `Restic exited with code ${e.code}: ${e.message}`
              : `Restic error${e.during ? ` during ${e.during}` : ''}${
                  e.item ? ` on ${e.item}` : ''
                }: ${e.error?.message ?? e.message ?? 'unknown error'}`,
        )
        .join('\n'),
    );

    this.error = error;
  }
}

export class ResticUnknownError extends Error {}
export class ResticGoRuntimeError extends Error {}
export class ResticCommandFailedError extends TryParseError {}
export class ResticBackupCommandCouldNotReadSourceDataError extends TryParseError {}
export class ResticRepositoryDoesNotExistError extends TryParseError {}
export class ResticFailedToLockRepositoryError extends TryParseError {}
export class ResticWrongPasswordError extends TryParseError {}
export class ResticInterruptedError extends TryParseError {}
