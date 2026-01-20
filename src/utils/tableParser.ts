export function parseTable(header: string, data: string[]): Record<string, string>[] {
  const headerCols = header.split(/(?<=  +)(?=\S)/);
  const keys = headerCols.map((key) => key.trim());

  return data.map((line) => {
    const entry: Record<string, string> = {};

    let stringPointer = 0;
    for (let index = 0; index < headerCols.length; index++) {
      const col = headerCols[index];

      const value = line.slice(
        stringPointer,
        index === headerCols.length - 1 ? line.length : stringPointer + col.length,
      );
      stringPointer += col.length;

      entry[keys[index]] = value.trim();
    }

    return entry;
  });
}

export function findAndParseTable(input: string) {
  const lines = input.split('\n');
  const tableStart = lines.findIndex((line) => line.startsWith('-'));
  const tableEnd = tableStart + 1 + lines.slice(tableStart + 1).findIndex((line) => line.startsWith('-'));

  return parseTable(lines[tableStart - 1], lines.slice(tableStart + 1, tableEnd));
}
