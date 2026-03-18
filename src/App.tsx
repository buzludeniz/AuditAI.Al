import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import ReportDashboard from './components/ReportDashboard';
import { analyzeCSV } from './components/AuditEngine';
import { AuditReport } from './types';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (csvContent: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeCSV(csvContent);
      setReport(result);
    } catch (err) {
      console.error(err);
      setError("Ndodhi një gabim gjatë analizimit të skedarit. Ju lutem provoni përsëri.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-[#00FF85] selection:text-black">
      {/* Header */}
      <header className="px-8 py-6 flex items-center gap-3">
        <h1 className="text-white font-bold text-lg tracking-tight">AuditAI.al</h1>
        <span className="border border-[#1f1f1f] text-[#525252] text-xs px-2 py-0.5 rounded-sm">Beta</span>
      </header>

      <main className="px-8 pb-12">
        {!report && !isLoading && (
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <div className="text-[#525252] text-sm font-mono flex items-center">
              Duke analizuar...<span className="inline-block w-2 h-4 bg-[#525252] ml-1 animate-blink"></span>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mt-8 p-4 border border-[#1f1f1f] bg-[#111111] text-[#EF4444] rounded-md text-sm">
            {error}
          </div>
        )}

        {report && !isLoading && (
          <div>
            <div className="max-w-4xl mx-auto mt-8 flex justify-between items-center">
              <button 
                onClick={() => setReport(null)}
                className="text-[#525252] text-sm hover:text-white transition-colors"
              >
                &larr; Kthehu
              </button>
              <button
                className="border border-[#1f1f1f] text-white bg-transparent px-4 py-2 rounded-md text-sm hover:border-[#00FF85] hover:text-[#00FF85] transition-colors"
                onClick={() => window.print()}
              >
                Shkarko Raportin
              </button>
            </div>
            <ReportDashboard report={report} />
          </div>
        )}
      </main>
    </div>
  );
}
