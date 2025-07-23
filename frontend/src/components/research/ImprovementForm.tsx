// components/research/ImprovementForm.tsx (Tạo file mới)

'use client';
import React, { useState } from 'react';

interface ImprovementFormProps {
  onGenerateNewScript: (improvements: string[]) => void;
  isGenerating: boolean;
}

type ImprovementChoices = {
  hook: boolean;
  script: boolean;
  cta: boolean;
  all: boolean;
};

export const ImprovementForm = ({ onGenerateNewScript, isGenerating }: ImprovementFormProps) => {
  const [improvementChoices, setImprovementChoices] = useState<ImprovementChoices>({ hook: false, script: false, cta: false, all: false });

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    if (name === 'all') {
      setImprovementChoices({ all: checked, hook: checked, script: checked, cta: checked });
    } else {
      const newChoices = { ...improvementChoices, [name]: checked, all: false };
      const allChecked = newChoices.hook && newChoices.script && newChoices.cta;
      setImprovementChoices({ ...newChoices, all: allChecked });
    }
  };

  const handleGenerateClick = () => {
    const selectedCheckboxes = Object.entries(improvementChoices)
      .filter(([, value]) => value)
      .map(([key]) => {
          // Chuyển key thành một câu mô tả rõ ràng hơn cho AI
          switch(key) {
              case 'hook': return 'Improve the hook';
              case 'script': return 'Optimize the script and pacing';
              case 'cta': return 'Strengthen the Call To Action (CTA)';
              default: return key;
          }
      });

    if (selectedCheckboxes.length > 0) {
      onGenerateNewScript(selectedCheckboxes);
    }
  };
  
  const noImprovementSelected = Object.values(improvementChoices).every(v => !v);

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="max-w-xl mx-auto">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Choose Improvement Areas</h3>
        <div className="space-y-3 mb-6">
          {[
            { name: 'hook', label: 'Improve Hook (Initial Hook)' },
            { name: 'script', label: 'Optimize Script & Pacing' },
            { name: 'cta', label: 'Strengthen Call to Action (CTA)' },
            { name: 'all', label: 'Improve All' },
          ].map(item => (
            <label key={item.name} className="flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 border border-transparent hover:border-blue-300 cursor-pointer transition-colors">
              <input type="checkbox" name={item.name} checked={improvementChoices[item.name as keyof ImprovementChoices]} onChange={handleCheckboxChange} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0" />
              <span className="ml-4 text-gray-800 font-medium">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={handleGenerateClick}
            disabled={noImprovementSelected || isGenerating}
            className="bg-green-600 cursor-pointer hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-full transition duration-300 shadow-md hover:shadow-lg"
          >
            {isGenerating ? 'Generating...' : 'Create New Script'}
          </button>
        </div>
      </div>
    </div>
  );
};