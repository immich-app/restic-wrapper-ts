import { describe, expect, it } from 'vitest';
import { findAndParseTable } from './tableParser';

describe('findAndParseTable', () => {
  it('parses 3 columns with blank entry', () => {
    const input = `Repo ID     Last Used    Old
----------------------------
dd5d750a4e  11 days ago
9ad9de9d59  11 days ago
8814b8013f  0 days ago
edea37d68e  0 days ago
----------------------------
11 cache dirs in /Users/insert/Library/Caches/restic`;

    expect(findAndParseTable(input)).toEqual([
      { 'Repo ID': 'dd5d750a4e', 'Last Used': '11 days ago', 'Old': '' },
      { 'Repo ID': '9ad9de9d59', 'Last Used': '11 days ago', 'Old': '' },
      { 'Repo ID': '8814b8013f', 'Last Used': '0 days ago', 'Old': '' },
      { 'Repo ID': 'edea37d68e', 'Last Used': '0 days ago', 'Old': '' },
    ]);
  });

  it('parses 3 columns with optional value', () => {
    const input = `Repo ID     Last Used    Old
----------------------------
dd5d750a4e  11 days ago  yes
9ad9de9d59  11 days ago  yes
c56e3d03dd  6 days ago   yes
8814b8013f  0 days ago
edea37d68e  0 days ago
----------------------------
11 cache dirs in /Users/insert/Library/Caches/restic`;

    expect(findAndParseTable(input)).toEqual([
      { 'Repo ID': 'dd5d750a4e', 'Last Used': '11 days ago', 'Old': 'yes' },
      { 'Repo ID': '9ad9de9d59', 'Last Used': '11 days ago', 'Old': 'yes' },
      { 'Repo ID': 'c56e3d03dd', 'Last Used': '6 days ago', 'Old': 'yes' },
      { 'Repo ID': '8814b8013f', 'Last Used': '0 days ago', 'Old': '' },
      { 'Repo ID': 'edea37d68e', 'Last Used': '0 days ago', 'Old': '' },
    ]);
  });

  it('parses 4 columns', () => {
    const input = `Repo ID     Last Used    Old  Size
-----------------------------------------
67de635220  10 days ago         4.967 MiB
26e4bdd39e  10 days ago         4.668 MiB
c92b623c0f  6 days ago          1.016 KiB
8814b8013f  0 days ago              399 B
-----------------------------------------
6 cache dirs in /Users/insert/Library/Caches/restic`;

    expect(findAndParseTable(input)).toEqual([
      { 'Repo ID': '67de635220', 'Last Used': '10 days ago', 'Old': '', 'Size': '4.967 MiB' },
      { 'Repo ID': '26e4bdd39e', 'Last Used': '10 days ago', 'Old': '', 'Size': '4.668 MiB' },
      { 'Repo ID': 'c92b623c0f', 'Last Used': '6 days ago', 'Old': '', 'Size': '1.016 KiB' },
      { 'Repo ID': '8814b8013f', 'Last Used': '0 days ago', 'Old': '', 'Size': '399 B' },
    ]);
  });
});