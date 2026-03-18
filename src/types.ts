export interface AuditFlag {
  id: number;
  name: string;
  category: string;
  severity: "E ulët" | "E mesme" | "E lartë" | "Kritike";
  finding: string;
  why_it_matters: string;
  points_added: number;
}

export interface AuditSummary {
  total_invoices: number;
  period: string;
  total_expenses: number;
  total_revenue: number;
  total_tvsh: number;
  flags_found: number;
}

export interface AuditReport {
  risk_score: number;
  risk_level: "i ulët" | "mesatar" | "i lartë" | "kritik";
  summary: AuditSummary;
  flags: AuditFlag[];
  recommendations: string[];
  disclaimer: string;
}
