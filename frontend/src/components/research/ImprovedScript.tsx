// components/research/ImprovedScript.tsx

'use client';
import React from 'react';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

interface ImprovedScriptProps {
    script: string;
    onCopy: (text: string) => void;
}

export const ImprovedScript = ({ script, onCopy }: ImprovedScriptProps) => {
    return (
        <CollapsibleCard
            title="Improved Script"
            onCopy={() => onCopy(script)}
            copyText={script}
            borderClass="border-green-500 border-2"
            titleColor="text-green-700"
        >
            <MarkdownRenderer text={script} />
        </CollapsibleCard>
    );
};