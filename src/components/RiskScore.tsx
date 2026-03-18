import React from 'react';

interface RiskScoreProps {
  score: number;
  level: string;
}

export default function RiskScore({ score, level }: RiskScoreProps) {
  let colorClass = "text-[#00FF85]";
  if (score > 30 && score <= 60) colorClass = "text-[#FACC15]";
  if (score > 60 && score <= 85) colorClass = "text-[#F97316]";
  if (score > 85) colorClass = "text-[#EF4444]";

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`text-8xl font-bold ${colorClass}`}>
        {score}
      </div>
      <div className="mt-4 text-[#525252] uppercase tracking-widest text-xs font-semibold">
        {level}
      </div>
    </div>
  );
}
