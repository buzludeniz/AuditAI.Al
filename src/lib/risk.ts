import type { AuditFlag, AuditReport } from '../types';

export type Severity = AuditFlag['severity'];
export type RiskLevel = AuditReport['risk_level'];

/** Points a flag adds to the risk score, by severity (see the system prompt). */
export const SEVERITY_POINTS: Record<Severity, number> = {
  'E ulët': 5,
  'E mesme': 10,
  'E lartë': 20,
  Kritike: 25,
};

export const MIN_SCORE = 5;
export const MAX_SCORE = 100;

export function pointsForSeverity(severity: Severity): number {
  return SEVERITY_POINTS[severity];
}

/** Sum of flag points, capped at 100, with a minimum score of 5. */
export function computeRiskScore(flags: Pick<AuditFlag, 'severity'>[]): number {
  const total = flags.reduce((sum, f) => sum + (SEVERITY_POINTS[f.severity] ?? 0), 0);
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, total));
}

/** Bands match the colour thresholds used by RiskScore.tsx (30 / 60 / 85). */
export function riskLevelForScore(score: number): RiskLevel {
  if (score > 85) return 'kritik';
  if (score > 60) return 'i lartë';
  if (score > 30) return 'mesatar';
  return 'i ulët';
}

/**
 * Make the numbers in a model-produced report consistent: per-flag points come
 * from severity, the score from the flags, and the level from the score.
 */
export function normalizeReport(report: AuditReport): AuditReport {
  const flags = report.flags.map((f) => ({ ...f, points_added: pointsForSeverity(f.severity) }));
  const risk_score = computeRiskScore(flags);
  return {
    ...report,
    flags,
    risk_score,
    risk_level: riskLevelForScore(risk_score),
    summary: { ...report.summary, flags_found: flags.length },
  };
}
