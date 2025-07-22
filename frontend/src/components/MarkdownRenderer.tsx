'use client';

import React from 'react';

// --- COMPONENT HELPER ĐỂ PARSE MARKDOWN ---
export const MarkdownRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    const parseInlineFormatting = (line: string) => {
        if (!line) return line;
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) { return <strong key={index}>{part.slice(2, -2)}</strong>; }
            if (part.startsWith('*') && part.endsWith('*')) { return <em key={index}>{part.slice(1, -1)}</em>; }
            return part;
        });
    };

    // Chuẩn hóa và tách văn bản thành các "đoạn" (paragraphs/blocks)
    const normalizedText = text.replace(/\\n/g, '\n');
    const blocks = normalizedText.split(/\n\s*\n/).filter(p => p.trim() !== '');

    return (
        <div className="font-sans text-base leading-relaxed">
            {blocks.map((block, blockIndex) => {
                const lines = block.split('\n').filter(l => l.trim() !== '');
                if (lines.length === 0) return null;

                const firstLine = lines[0];
                
                // --- [MỚI] QUY TẮC XỬ LÝ BẢNG (TABLE) ---
                const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);
                if (lines.length >= 2 && firstLine.trim().startsWith('|') && isTableSeparator(lines[1])) {
                    const headers = firstLine.split('|').slice(1, -1).map(h => h.trim());
                    // Bỏ qua dòng separator (lines[1]), bắt đầu từ dòng thứ 3 (index 2)
                    const rows = lines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(c => c.trim()));

                    return (
                        <div key={blockIndex} className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50">
                                        {headers.map((header, hIndex) => (
                                            <th key={hIndex} className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700">
                                                {parseInlineFormatting(header)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rIndex) => (
                                        <tr key={rIndex} className="bg-white hover:bg-slate-50/70 border-b border-slate-200 last:border-b-0">
                                            {row.map((cell, cIndex) => (
                                                <td key={cIndex} className="px-4 py-3 text-slate-600 align-top">
                                                    {parseInlineFormatting(cell)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }

                // --- CÁC QUY TẮC CŨ ĐỂ XỬ LÝ KỊCH BẢN ---
                if (firstLine.startsWith('### ')) {
                    return <h2 key={blockIndex} className="text-2xl font-bold text-gray-800 mt-8 mb-4 border-b border-slate-200 pb-2">{parseInlineFormatting(firstLine.substring(4))}</h2>;
                }
                 if (firstLine.trim().startsWith('* ')) {
                    return (
                        <ul key={blockIndex} className="list-disc list-outside space-y-2 my-4 pl-5 text-slate-700">
                            {lines.map((item, lIndex) => (<li key={lIndex}>{parseInlineFormatting(item.trim().substring(2))}</li>))}
                        </ul>
                    );
                }
                
                // --- Mặc định render một đoạn văn bản (paragraph) ---
                return (
                    <p key={blockIndex} className="my-3 text-slate-700">
                        {lines.map((line, lIndex) => {
                            if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
                                return <span key={lIndex} className="block text-slate-500 italic">{parseInlineFormatting(line.trim().slice(1,-1))}</span>
                            }
                            if (line.trim().endsWith(':')) {
                                return <span key={lIndex} className="block font-semibold text-slate-800 mt-2">{parseInlineFormatting(line)}</span>
                            }
                            return (
                                <React.Fragment key={lIndex}>
                                    {parseInlineFormatting(line)}
                                    {lIndex < lines.length - 1 && <br />}
                                </React.Fragment>
                            );
                        })}
                    </p>
                );
            })}
        </div>
    );
};