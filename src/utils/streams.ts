import { Writable } from 'node:stream';
import { TextDecoder } from 'node:util';

export class JsonLinesReader<T> extends Writable {
  private buffer: number[] = [];
  private static decoder = new TextDecoder();

  constructor(
    private callback: (data: T) => void,
    private filter?: (line: string) => boolean,
  ) {
    super();
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    for (const byte of chunk) {
      if (byte === 10) {
        try {
          this.flush();
        } catch (error) {
          callback(error as Error);
          return;
        }
      } else {
        this.buffer.push(byte);
      }
    }

    callback();
  }

  flush() {
    if (this.buffer.length) {
      const text = JsonLinesReader.decoder.decode(new Uint8Array(this.buffer));

      try {
        if (!this.filter || this.filter(text)) {
          this.callback(JSON.parse(text));
        }
      } catch (error) {
        /* istanbul ignore else @preserve */
        if (process.env.NODE_ENV === 'test') {
          console.error('Failing output:', text);
        }

        throw error;
      }

      this.buffer = [];
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    try {
      this.flush();
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}
