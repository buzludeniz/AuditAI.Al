import type { AuditReport } from '../types';
import { parseCsv } from './csv';

/** Parse the uploaded CSV in the browser and send it to the server for analysis. */
export async function analyzeCSV(csvContent: string): Promise<AuditReport> {
  const parsed = parseCsv(csvContent);
  if (parsed.headers.length === 0 || parsed.rows.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return (await response.json()) as AuditReport;
}
