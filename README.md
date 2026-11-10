# AuditAI.al

An AI-assisted fiscal audit check for Albanian businesses. Upload an e-Faktura
CSV export and the app asks Google Gemini to review it against a fixed set of
tax-risk rules, then shows a 0–100 risk score, the flags it found and
recommendations. The interface and report are in Albanian.

This is a prototype started in Google AI Studio. It is not tax advice.

## What it checks

The rules are defined in the system prompt in `server/prompt.ts`:

1. **VAT (TVSH) mismatch.** Invoice VAT ≠ 20% of value; declared total differs from the invoice sum by more than 500 ALL.
2. **Missing invoices.** Expenses with no NIPT; cash expenses above 150,000 ALL without an e-Faktura reference.
3. **Abnormal expense ratios.** Expenses above 85% of revenue; "other expenses" above 15%; one vendor above 25% of expenses.
4. **Round-number clustering.** More than 20% of amounts ending in exactly ,000 ALL.
5. **Duplicate vendors.** The same vendor with two NIPT numbers, or spelling variations of a vendor name.
6. **Income vs expense gap.** Net income below 5% of revenue for a services business; losses continuing into year 3 or later.

Each flag adds 5, 10, 20 or 25 points by severity, capped at 100 (minimum 5).
Gemini returns the report as structured JSON (enforced with a response schema).
The server then recomputes `points_added`, `risk_score`, `risk_level` and
`flags_found` from the flags (`src/lib/risk.ts`) so the numbers are consistent,
and the UI renders the result.

## How it works

```
browser                         server (Express)                 Google
CSV file -> parseCsv()  --POST /api/analyze {headers, rows}-->  validate -> Gemini
report   <------------------------ JSON report ---------------- normalize <-
```

The CSV is parsed in the browser. Only the parsed rows go to `POST /api/analyze`,
and the server calls Gemini with `GEMINI_API_KEY` from its own environment. The
key is not part of the client bundle.

The endpoint validates its input (at most 5,000 rows, 50 columns and 500
characters per cell, string cells only, rectangular rows) and rejects request
bodies over 1 MB with `413`. Errors from Gemini are logged on the server and
returned to the client as a generic `502`.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 4, `motion` for animation, `lucide-react` icons
- Express server calling Gemini through `@google/genai` with a JSON response schema
- Vitest for tests

## Project layout

```
server/
  index.ts                      starts the API server (loads .env.local / .env)
  app.ts                        Express app: POST /api/analyze, size limit, errors
  validate.ts                   request validation and limits
  gemini.ts                     Gemini call using the server-side key
  prompt.ts                     system prompt, rules, response schema
src/
  App.tsx                       upload -> analysing -> report flow
  lib/csv.ts                    CSV parser / serializer
  lib/risk.ts                   risk scoring and report normalization
  lib/api.ts                    browser client for /api/analyze
  components/                   upload zone, report dashboard, score gauge
  types.ts                      report types
tests/                          Vitest: CSV, risk scoring, endpoint (Gemini mocked)
```

## Running locally

Requires Node.js 22 and a Gemini API key.

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY in .env.local
npm run dev                  # API on :8787 and Vite on http://localhost:3000
```

`npm run dev` runs the API server and the Vite dev server together; Vite proxies
`/api` to the API server.

| Script | What it does |
| --- | --- |
| `npm run dev` | API server (watch mode) + Vite dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (no network; Gemini is mocked) |
| `npm run build` | Production client build into `dist/` |
| `npm start` | Serve `dist/` and the API from one Express process (`NODE_ENV=production`) |

## Deploying

Build with `npm run build`, then run `npm start` with `GEMINI_API_KEY` set in the
server's environment (and `PORT` if needed). Never put the key in a `VITE_*`
variable or in client code. CI (`.github/workflows/ci.yml`) runs typecheck,
tests and build, and fails if the built bundle mentions the key.

The endpoint has no authentication or rate limiting, so put it behind your own
access control before exposing it publicly, since each request spends Gemini quota.
