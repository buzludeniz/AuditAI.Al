import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Gemini SDK so no network call is ever made.
const generateContent = vi.fn();
const ctor = vi.fn();
vi.mock('@google/genai', () => ({
  Type: { OBJECT: 'OBJECT', INTEGER: 'INTEGER', STRING: 'STRING', NUMBER: 'NUMBER', ARRAY: 'ARRAY' },
  GoogleGenAI: class {
    models = { generateContent };
    constructor(opts: unknown) {
      ctor(opts);
    }
  },
}));

import { createApp } from '../server/app';

const geminiReport = {
  risk_score: 1,
  risk_level: 'i ulët',
  summary: { total_invoices: 2, period: '2024', total_expenses: 10, total_revenue: 20, total_tvsh: 4, flags_found: 0 },
  flags: [
    { id: 1, name: 'TVSH', category: 'tvsh', severity: 'E lartë', finding: 'f', why_it_matters: 'w', points_added: 1 },
  ],
  recommendations: ['r'],
  disclaimer: 'd',
};

const valid = { headers: ['nipt', 'vlera'], rows: [['1', '100'], ['2', '200']] };

let server: Server;
let base: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((r) => server.close(r)));

beforeEach(() => {
  generateContent.mockReset();
  ctor.mockReset();
  process.env.GEMINI_API_KEY = 'test-key';
});

const post = (body: unknown, raw = false) =>
  fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  });

describe('POST /api/analyze', () => {
  it('calls Gemini with the server key and returns a normalized report', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(geminiReport) });
    const res = await post(valid);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(ctor).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(generateContent).toHaveBeenCalledOnce();
    const arg = generateContent.mock.calls[0][0];
    expect(arg.contents).toContain('nipt,vlera\n1,100\n2,200');
    expect(arg.config.responseMimeType).toBe('application/json');
    // score is recomputed from flag severity: one "E lartë" flag = 20 points
    expect(body.risk_score).toBe(20);
    expect(body.risk_level).toBe('i ulët');
    expect(body.flags[0].points_added).toBe(20);
    expect(body.summary.flags_found).toBe(1);
  });

  it.each([
    ['missing rows', { headers: ['a'] }],
    ['empty headers', { headers: [], rows: [['x']] }],
    ['non-string cell', { headers: ['a'], rows: [[1]] }],
    ['ragged row', { headers: ['a', 'b'], rows: [['1']] }],
    ['array body', []],
    ['too many rows', { headers: ['a'], rows: Array.from({ length: 5001 }, () => ['x']) }],
    ['cell too long', { headers: ['a'], rows: [['x'.repeat(501)]] }],
  ])('rejects invalid input: %s', async (_name, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON', async () => {
    const res = await post('{not json', true);
    expect(res.status).toBe(400);
  });

  it('rejects bodies over the size limit', async () => {
    const res = await post({ headers: ['a'], rows: [['x'.repeat(1_100_000)]] });
    expect(res.status).toBe(413);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns 503 when the server has no API key', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns 502 without leaking details when Gemini fails', async () => {
    generateContent.mockRejectedValue(new Error('upstream secret detail test-key'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await post(valid);
    spy.mockRestore();
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('test-key');
  });
});
