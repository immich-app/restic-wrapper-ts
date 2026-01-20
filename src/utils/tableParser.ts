export function parseTable(header: string, data: string[]): Record<string, string>[] {
  const headerCols = header.split(/(?<=  +)(?=\S)/);
  const keys = headerCols.map((key) => key.trim());

  return data.map((line) => {
    let idx = 0;

    return headerCols.reduce(
      (dict, col, index) => {
        const value = line.slice(idx, index === headerCols.length - 1 ? line.length : idx + col.length);
        idx += col.length;

        return {
          ...dict,
          [keys[index]]: value.trim(),
        };
      },
      {} as Record<string, string>,
    );
  });
}

export function findAndParseTable(input: string) {
  const lines = input.split('\n');
  const tableStart = lines.findIndex((line) => line.startsWith('-'));
  const tableEnd = tableStart + 1 + lines.slice(tableStart + 1).findIndex((line) => line.startsWith('-'));

  return parseTable(lines[tableStart - 1], lines.slice(tableStart + 1, tableEnd));
}
