import type { ParsedCsv } from '../src/lib/csv';

export const LIMITS = {
  maxBodyBytes: '1mb',
  maxColumns: 50,
  maxRows: 5000,
  maxCellLength: 500,
} as const;

export class ValidationError extends Error {}

/** Validate an untrusted request body as parsed CSV data. */
export function validateParsedCsv(body: unknown): ParsedCsv {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ValidationError('Body must be a JSON object with "headers" and "rows".');
  }
  const { headers, rows } = body as Record<string, unknown>;

  if (!Array.isArray(headers) || headers.length === 0) {
    throw new ValidationError('"headers" must be a non-empty array of strings.');
  }
  if (headers.length > LIMITS.maxColumns) {
    throw new ValidationError(`Too many columns (max ${LIMITS.maxColumns}).`);
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ValidationError('"rows" must be a non-empty array.');
  }
  if (rows.length > LIMITS.maxRows) {
    throw new ValidationError(`Too many rows (max ${LIMITS.maxRows}).`);
  }

  const checkCell = (cell: unknown): string => {
    if (typeof cell !== 'string') throw new ValidationError('All cells must be strings.');
    if (cell.length > LIMITS.maxCellLength) {
      throw new ValidationError(`Cell too long (max ${LIMITS.maxCellLength} characters).`);
    }
    return cell;
  };

  const cleanHeaders = headers.map(checkCell);
  const cleanRows = rows.map((row) => {
    if (!Array.isArray(row) || row.length !== cleanHeaders.length) {
      throw new ValidationError('Every row must be an array with one string per header.');
    }
    return row.map(checkCell);
  });
  return { headers: cleanHeaders, rows: cleanRows };
}
