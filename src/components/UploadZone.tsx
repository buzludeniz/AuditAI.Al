import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (csvContent: string) => void;
  isLoading: boolean;
}

export default function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Ju lutem ngarkoni vetëm skedarë CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onUpload(content);
      }
    };
    reader.onerror = () => {
      setError('Gabim gjatë leximit të skedarit.');
    };
    reader.readAsText(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-16">
      <div
        className={`border border-dashed rounded-md p-24 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          isDragging ? 'border-[#00FF85]' : 'border-[#1f1f1f]'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById('csv-upload')?.click()}
      >
        <input
          type="file"
          accept=".csv"
          onChange={onFileInput}
          className="hidden"
          id="csv-upload"
          disabled={isLoading}
        />
        <Upload className={`w-8 h-8 mb-6 transition-colors ${isDragging ? 'text-[#00FF85]' : 'text-[#525252]'}`} />
        <p className="text-white font-medium mb-2">Ngarkoni eksportin e e-Faktura</p>
        <p className="text-[#525252] text-sm">Tërhiqni skedarin CSV këtu ose klikoni për të shfletuar</p>
      </div>
      
      {error && (
        <div className="mt-6 p-4 border border-[#1f1f1f] bg-[#111111] text-[#EF4444] rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
