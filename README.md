# AuditAI.al

An AI-assisted fiscal audit check for Albanian businesses. Upload an e-Faktura
CSV export and the app asks Google Gemini to review it against a fixed set of
tax-risk rules, then shows a 0–100 risk score, the flags it found and
recommendations. The interface and report are in Albanian.

This is a prototype started in Google AI Studio. It is not tax advice.

## What it checks

The rules are defined in the system prompt in `src/components/AuditEngine.ts`:

1. **VAT (TVSH) mismatch.** Invoice VAT ≠ 20% of value; declared total differs from the invoice sum by more than 500 ALL.
2. **Missing invoices.** Expenses with no NIPT; cash expenses above 150,000 ALL without an e-Faktura reference.
3. **Abnormal expense ratios.** Expenses above 85% of revenue; "other expenses" above 15%; one vendor above 25% of expenses.
4. **Round-number clustering.** More than 20% of amounts ending in exactly ,000 ALL.
5. **Duplicate vendors.** The same vendor with two NIPT numbers, or spelling variations of a vendor name.
6. **Income vs expense gap.** Net income below 5% of revenue for a services business; losses continuing into year 3 or later.

Each flag adds 5, 10, 20 or 25 points by severity, capped at 100. Gemini
returns the report as structured JSON (enforced with a response schema), which
the UI renders.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS 4, `motion` for animation, `lucide-react` icons
- `@google/genai` SDK calling a Gemini model with a JSON response schema

## Project layout

```
src/
  App.tsx                       upload → analysing → report flow
  components/UploadZone.tsx     drag-and-drop CSV upload
  components/AuditEngine.ts     prompt, rules, response schema, Gemini call
  components/ReportDashboard.tsx summary, flags and recommendations
  components/RiskScore.tsx      score gauge
  types.ts                      report types
```

## Running locally

Requires Node.js and a Gemini API key.

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY in .env.local
npm run dev
```

The app runs at http://localhost:3000.

**Security note:** `vite.config.ts` injects `GEMINI_API_KEY` into the client
bundle, so anyone who loads a built copy of the app can read the key. Use it
locally only; a public deployment would need the Gemini call moved behind a
server.
