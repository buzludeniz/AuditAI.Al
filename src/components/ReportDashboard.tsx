import React, { useState } from 'react';
import { AuditReport, AuditFlag } from '../types';
import RiskScore from './RiskScore';

interface ReportDashboardProps {
  report: AuditReport;
}

export default function ReportDashboard({ report }: ReportDashboardProps) {
  const [expandedFlags, setExpandedFlags] = useState<Record<number, boolean>>({});

  const toggleFlag = (id: number) => {
    setExpandedFlags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getSeverityDotColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'kritike': return 'bg-[#EF4444]';
      case 'e lartë': return 'bg-[#F97316]';
      case 'e mesme': return 'bg-[#FACC15]';
      case 'e ulët': return 'bg-[#525252]';
      default: return 'bg-[#525252]';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-16 pb-24">
      
      {/* Risk Score Section */}
      <section>
        <RiskScore score={report.risk_score} level={report.risk_level} />
      </section>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-[#1f1f1f] py-8">
        <div>
          <p className="text-[#525252] uppercase tracking-widest text-xs mb-2">Fatura Totale</p>
          <p className="text-white font-semibold text-xl">{report.summary.total_invoices}</p>
        </div>
        <div>
          <p className="text-[#525252] uppercase tracking-widest text-xs mb-2">Shpenzime</p>
          <p className="text-white font-semibold text-xl">{report.summary.total_expenses.toLocaleString('sq-AL')} ALL</p>
        </div>
        <div>
          <p className="text-[#525252] uppercase tracking-widest text-xs mb-2">Të Ardhurat</p>
          <p className="text-white font-semibold text-xl">{report.summary.total_revenue.toLocaleString('sq-AL')} ALL</p>
        </div>
        <div>
          <p className="text-[#525252] uppercase tracking-widest text-xs mb-2">TVSH Totale</p>
          <p className="text-white font-semibold text-xl">{report.summary.total_tvsh.toLocaleString('sq-AL')} ALL</p>
        </div>
      </section>

      {/* Flags */}
      <section>
        <h3 className="text-[#525252] uppercase tracking-widest text-xs mb-6">Gjetjet ({report.summary.flags_found})</h3>
        <div className="flex flex-col gap-2">
          {report.flags.length === 0 ? (
            <div className="text-[#a3a3a3] text-sm">Nuk u gjetën probleme.</div>
          ) : (
            report.flags.map((flag) => (
              <div key={flag.id} className="bg-[#111111] border border-[#1f1f1f] rounded-md overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                  onClick={() => toggleFlag(flag.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${getSeverityDotColor(flag.severity)}`} />
                    <span className="text-white font-medium text-sm">{flag.name}</span>
                  </div>
                  <div className="text-[#a3a3a3] font-mono text-xs bg-[#1f1f1f] px-2 py-1 rounded-sm shrink-0 ml-4">
                    +{flag.points_added}
                  </div>
                </div>
                {expandedFlags[flag.id] && (
                  <div className="p-4 pt-0 border-t border-[#1f1f1f] mt-2 bg-[#111111]">
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-[#525252] uppercase tracking-widest text-xs mb-1">Gjetja</p>
                        <p className="text-[#a3a3a3] text-sm leading-relaxed">{flag.finding}</p>
                      </div>
                      <div>
                        <p className="text-[#525252] uppercase tracking-widest text-xs mb-1">Pse ka rëndësi</p>
                        <p className="text-[#a3a3a3] text-sm leading-relaxed">{flag.why_it_matters}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <h3 className="text-[#525252] uppercase tracking-widest text-xs mb-6">Rekomandime</h3>
        <div className="space-y-4">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className="text-[#00FF85] font-mono text-sm mt-0.5">{(idx + 1).toString().padStart(2, '0')}</span>
              <p className="text-white text-sm leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
