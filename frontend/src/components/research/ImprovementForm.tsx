// components/research/ImprovementForm.tsx

'use client';
import React, { useState } from 'react';

// --- Icons for options ---
const HookIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
    </svg>
);
const ScriptIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);
const CtaIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56v4.82a6 6 0 01-1.844 4.24l-1.282-1.281M15.59 14.37A6 6 0 0018.75 12c0-1.77-1.02-3.29-2.5-4.032m-5.63 1.426v4.82A6 6 0 014.5 12c0-1.77 1.02-3.29 2.5-4.032m-5.63 1.426a9 9 0 015.84-7.38v4.82a6 6 0 01-5.84 7.38z" />
    </svg>
);
const SparklesIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10.868 2.884c.321.64.321 1.415 0 2.055l-1.76 3.52a.5.5 0 00.465.695h3.52c.85 0 1.212.992.64 1.562l-3.52 3.52a.5.5 0 00-.232.465v3.52c0 .85-.992 1.212-1.562.64l-3.52-3.52a.5.5 0 00-.465-.232H2.884c-.85 0-1.212-.992-.64-1.562l3.52-3.52a.5.5 0 00.232-.465V6.444c0-.85.992-1.212 1.562-.64L10.868 2.884zM8.42 20a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM17.63 8.42a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM20 17.63a1.92 1.92 0 10-3.84 0 1.92 1.92 0 003.84 0zM8.42 2.37a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84z" clipRule="evenodd" /></svg>);


interface ImprovementFormProps {
  onGenerateNewScript: (improvements: string[]) => void;
  isGenerating: boolean;
}

type ImprovementChoices = {
  hook: boolean;
  script: boolean;
  cta: boolean;
};

export const ImprovementForm = ({ onGenerateNewScript, isGenerating }: ImprovementFormProps) => {
  const [improvementChoices, setImprovementChoices] = useState<ImprovementChoices>({ hook: false, script: false, cta: false });
  // State mới cho ô nhập liệu tùy chỉnh
  const [customPrompt, setCustomPrompt] = useState('');

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setImprovementChoices(prev => ({ ...prev, [name]: checked }));
  };

  const handleGenerateClick = () => {
    // Lấy các yêu cầu từ checkbox
    const selectedCheckboxes = Object.entries(improvementChoices)
      .filter(([, value]) => value)
      .map(([key]) => {
          switch(key) {
              case 'hook': return 'Improve the hook';
              case 'script': return 'Optimize the script and pacing';
              case 'cta': return 'Strengthen the Call To Action (CTA)';
              default: return key;
          }
      });
    
    // Lấy yêu cầu từ ô nhập liệu tùy chỉnh
    const trimmedCustomPrompt = customPrompt.trim();
    
    // Kết hợp cả hai
    const allImprovements = [...selectedCheckboxes];
    if (trimmedCustomPrompt) {
        allImprovements.push(trimmedCustomPrompt);
    }

    if (allImprovements.length > 0) {
      onGenerateNewScript(allImprovements);
    }
  };
  
  // Kiểm tra xem có tùy chọn nào được chọn không
  const anyOptionSelected = Object.values(improvementChoices).some(v => v);

  const options = [
    { name: 'hook', label: 'Improve Hook', description: 'Sharpen the first 3 seconds.', icon: <HookIcon className="w-6 h-6 text-purple-600" /> },
    { name: 'script', label: 'Optimize Script', description: 'Enhance pacing and flow.', icon: <ScriptIcon className="w-6 h-6 text-blue-600" /> },
    { name: 'cta', label: 'Strengthen CTA', description: 'Make the call to action clearer.', icon: <CtaIcon className="w-6 h-6 text-green-600" /> },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-slate-200">
      <div className="max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">What would you like to improve?</h3>
        
        <div className="space-y-4 mb-8">
          {options.map(item => {
            const isChecked = improvementChoices[item.name as keyof ImprovementChoices];
            return (
              <label 
                key={item.name} 
                className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isChecked 
                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-100' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input 
                  type="checkbox" 
                  name={item.name} 
                  checked={isChecked} 
                  onChange={handleCheckboxChange} 
                  className="sr-only"
                />
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    isChecked ? 'bg-purple-100' : 'bg-slate-100'
                }`}>
                    {item.icon}
                </div>
                <div className="ml-4">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isChecked ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                }`}>
                    {isChecked && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
              </label>
            )
          })}
        </div>

        {/* --- KHU VỰC NHẬP LIỆU TÙY CHỈNH --- */}
        <div className={`transition-all duration-500 ease-in-out ${anyOptionSelected ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="mb-8 text-black">
                <label htmlFor="custom-prompt" className="block text-sm font-medium text-slate-700 mb-2">
                    Add specific instructions (optional):
                </label>
                <textarea
                    id="custom-prompt"
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Make the tone more humorous' or 'Add a surprising twist at the end'"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
            </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleGenerateClick}
            disabled={!anyOptionSelected || isGenerating}
            className="w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-8 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{isGenerating ? 'Generating...' : 'Create New Script'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
