// components/research/ImprovedScript.tsx (Cập nhật)

'use client';
import React from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ImprovementForm } from './ImprovementForm'; // <<< THÊM

interface ImprovedScriptProps {
    script: string;
    onCopy: (text: string) => void;
    onEdit: () => void;
    onSave: () => void; // <<< THÊM
    isSaving: boolean; // <<< THÊM
    onGenerateNewScript: (improvements: string[]) => void; // <<< THÊM
    isGenerating: boolean; // <<< THÊM
}

export const ImprovedScript = (props: ImprovedScriptProps) => {
    const { script, onCopy, onEdit, onSave, isSaving, onGenerateNewScript, isGenerating } = props;
    return (
        <CollapsibleCard
            title="Improved Script"
            onCopy={() => onCopy(script)}
            copyText={script}
            onEdit={onEdit}
            onSave={onSave}
            isSaving={isSaving}
            borderClass="border-green-500 border-2"
            titleColor="text-green-700"
        >
            <MarkdownRenderer text={script} />
            {/* Cho phép cải tiến lặp lại */}
            <ImprovementForm onGenerateNewScript={onGenerateNewScript} isGenerating={isGenerating} />
        </CollapsibleCard>
    );
};