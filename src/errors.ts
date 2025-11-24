export type { ZodError } from 'zod';

export class MissingFilesError extends Error {
  constructor() {
    super('Specify files to create snapshot from with .addFile(..)');
  }
}

export class MissingRepositoryError extends Error {
  constructor() {
    super('Specify a repository with .repository(..) or .repositoryPath(..)');
  }
}

export class MissingPasswordError extends Error {
  constructor() {
    super('Specify a repository password with .password(..), .passwordFile(..), or .passwordCommand(..)');
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

class TryParseError extends Error {
  constructor(message: string) {
    try {
      super(JSON.parse(message.split('\n').pop()!).message);
    } catch {
      super(message);
    }
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
