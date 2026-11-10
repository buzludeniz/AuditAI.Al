import { describe, expect, it } from 'vitest';
import { computeRiskScore, normalizeReport, riskLevelForScore } from '../src/lib/risk';
import type { AuditReport } from '../src/types';

const flag = (severity: AuditReport['flags'][number]['severity'], id = 1) => ({
  id,
  name: 'n',
  category: 'c',
  severity,
  finding: 'f',
  why_it_matters: 'w',
  points_added: 0,
});

describe('computeRiskScore', () => {
  it('uses a minimum score of 5 when there are no flags', () => {
    expect(computeRiskScore([])).toBe(5);
  });

  it('adds 5/10/20/25 points by severity', () => {
    expect(computeRiskScore([flag('E ulët')])).toBe(5);
    expect(computeRiskScore([flag('E ulët'), flag('E mesme')])).toBe(15);
    expect(computeRiskScore([flag('E lartë'), flag('Kritike')])).toBe(45);
  });

  it('caps at 100', () => {
    expect(computeRiskScore(Array.from({ length: 6 }, () => flag('Kritike')))).toBe(100);
  });
});

describe('riskLevelForScore', () => {
  it.each([
    [5, 'i ulët'],
    [30, 'i ulët'],
    [31, 'mesatar'],
    [60, 'mesatar'],
    [61, 'i lartë'],
    [85, 'i lartë'],
    [86, 'kritik'],
    [100, 'kritik'],
  ])('score %i -> %s', (score, level) => {
    expect(riskLevelForScore(score)).toBe(level);
  });
});

describe('normalizeReport', () => {
  it('recomputes points, score, level and flag count from the flags', () => {
    const report: AuditReport = {
      risk_score: 99,
      risk_level: 'kritik',
      summary: { total_invoices: 3, period: '2024', total_expenses: 1, total_revenue: 2, total_tvsh: 3, flags_found: 7 },
      flags: [flag('E mesme', 1), flag('E lartë', 2)],
      recommendations: [],
      disclaimer: '',
    };
    const out = normalizeReport(report);
    expect(out.flags.map((f) => f.points_added)).toEqual([10, 20]);
    expect(out.risk_score).toBe(30);
    expect(out.risk_level).toBe('i ulët');
    expect(out.summary.flags_found).toBe(2);
  });
});
