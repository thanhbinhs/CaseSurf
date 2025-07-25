// components/research/AnalysisReport.tsx (Cập nhật)

'use client';
import React from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ImprovementForm } from './ImprovementForm'; // <<< THÊM

interface AnalysisReportProps {
  report: string;
  onGenerateNewScript: (improvements: string[]) => void;
  onCopy: (text: string) => void;
  onEdit: () => void;
  isGenerating: boolean; // <<< THÊM
}

export const AnalysisReport = ({ report, onGenerateNewScript, onCopy, onEdit, isGenerating }: AnalysisReportProps) => {
  return (
    <CollapsibleCard 
      title="Analysis Report" 
      onCopy={() => onCopy(report)} 
      copyText={report}
      onEdit={onEdit}
    >
      <MarkdownRenderer text={report} />
      <ImprovementForm onGenerateNewScript={onGenerateNewScript} isGenerating={isGenerating} />
      
    </CollapsibleCard>
  );
};