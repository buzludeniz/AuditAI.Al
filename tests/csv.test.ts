import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv, toCsv } from '../src/lib/csv';

describe('parseCsv', () => {
  it('parses a simple CSV', () => {
    expect(parseCsv('nipt,vlera,tvsh\n123,1000,200\n456,500,100\n')).toEqual({
      headers: ['nipt', 'vlera', 'tvsh'],
      rows: [
        ['123', '1000', '200'],
        ['456', '500', '100'],
      ],
    });
  });

  it('handles CRLF, BOM and blank lines', () => {
    const r = parseCsv('﻿a,b\r\n1,2\r\n\r\n3,4\r\n');
    expect(r.headers).toEqual(['a', 'b']);
    expect(r.rows).toEqual([['1', '2'], ['3', '4']]);
  });

  it('handles quoted fields with delimiters, quotes and newlines', () => {
    const r = parseCsv('name,note\n"Shpk, Alfa","said ""hi"""\n"Beta","line1\nline2"');
    expect(r.rows).toEqual([
      ['Shpk, Alfa', 'said "hi"'],
      ['Beta', 'line1\nline2'],
    ]);
  });

  it('detects semicolon and tab delimiters', () => {
    expect(detectDelimiter('a;b;c')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('"a;b",c')).toBe(',');
    expect(parseCsv('a;b\n1,5;2').rows).toEqual([['1,5', '2']]);
  });

  it('pads short rows and truncates long rows to the header width', () => {
    const r = parseCsv('a,b,c\n1\n1,2,3,4');
    expect(r.rows).toEqual([['1', '', ''], ['1', '2', '3']]);
  });

  it('returns empty data for empty input', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
    expect(parseCsv('\n\n')).toEqual({ headers: [], rows: [] });
  });

  it('round-trips through toCsv', () => {
    const data = { headers: ['a', 'b'], rows: [['x,y', 'say "hi"'], ['1', '2']] };
    expect(parseCsv(toCsv(data))).toEqual(data);
  });
});
