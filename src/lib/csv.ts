export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

const DELIMITERS = [',', ';', '\t'] as const;

/** Pick the delimiter that splits the header line into the most fields (outside quotes). */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  let best: string = ',';
  let bestCount = 0;
  for (const d of DELIMITERS) {
    let count = 0;
    let inQuotes = false;
    for (const ch of firstLine) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === d && !inQuotes) count++;
    }
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Minimal RFC 4180 style parser: quoted fields, escaped quotes (""), embedded
 * newlines, CRLF/LF, optional UTF-8 BOM, and `,` / `;` / tab delimiters.
 * Blank lines are skipped; rows are padded or truncated to the header width.
 */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  const endField = () => {
    record.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    if (record.some((f) => f.trim() !== '')) records.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      endField();
    } else if (ch === '\n') {
      endRecord();
    } else if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      endRecord();
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length > 0) endRecord();

  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((r) => {
    const row = r.map((c) => c.trim()).slice(0, headers.length);
    while (row.length < headers.length) row.push('');
    return row;
  });
  return { headers, rows };
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize parsed data back to canonical comma-separated CSV text. */
export function toCsv({ headers, rows }: ParsedCsv): string {
  return [headers, ...rows].map((r) => r.map(escapeField).join(',')).join('\n');
}
