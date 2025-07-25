'use client';

import React from 'react';

// --- COMPONENT HELPER ĐỂ PARSE MARKDOWN ---
// [PHIÊN BẢN CẢI TIẾN]
export const MarkdownRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    // Helper function để parse định dạng inline (in đậm, in nghiêng)
    // Không có thay đổi ở đây, vẫn hoạt động tốt
    const parseInlineFormatting = (line: string) => {
        if (!line) return line;
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) { return <strong key={index}>{part.slice(2, -2)}</strong>; }
            if (part.startsWith('*') && part.endsWith('*')) { return <em key={index}>{part.slice(1, -1)}</em>; }
            return part;
        });
    };

    // Chuẩn hóa và tách văn bản thành các "đoạn" (blocks)
    const normalizedText = text.replace(/\\n/g, '\n');
    const blocks = normalizedText.split(/\n\s*\n/).filter(p => p.trim() !== '');

    return (
        // [CẢI TIẾN] Thêm `max-w-4xl mx-auto` để giới hạn chiều rộng nội dung, dễ đọc hơn trên màn hình lớn
        <div className="font-sans text-base leading-relaxed max-w-4xl mx-auto">
            {blocks.map((block, blockIndex) => {
                const lines = block.split('\n').filter(l => l.trim() !== '');
                if (lines.length === 0) return null;

                const firstLine = lines[0];
                
                // --- QUY TẮC XỬ LÝ BẢNG (TABLE) ---
                const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);
                if (lines.length >= 2 && firstLine.trim().startsWith('|') && isTableSeparator(lines[1])) {
                    const headers = firstLine.split('|').slice(1, -1).map(h => h.trim());
                    const rows = lines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(c => c.trim()));

                    return (
                        // [CẢI TIẾN] Tinh chỉnh bóng (shadow), bo góc và khoảng cách
                        <div key={blockIndex} className="overflow-x-auto my-8 rounded-lg border border-slate-300 shadow-md">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    {/* [CẢI TIẾN] Nền header đậm hơn, chữ viết hoa và tăng nhẹ độ lớn để nổi bật */}
                                    <tr className="bg-slate-100">
                                        {headers.map((header, hIndex) => (
                                            <th key={hIndex} className="border-b-2 border-slate-300 px-4 py-3 text-left text-sm font-bold uppercase text-slate-700 tracking-wider">
                                                {parseInlineFormatting(header)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* [CẢI TIẾN] Thêm hiệu ứng "zebra-striping" (dòng chẵn/lẻ có màu nền khác nhau) để dễ theo dõi */}
                                    {rows.map((row, rIndex) => (
                                        <tr key={rIndex} className="bg-white even:bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200 last:border-b-0">
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

                // --- QUY TẮC XỬ LÝ TIÊU ĐỀ (HEADING) ---
                if (firstLine.startsWith('### ')) {
                    // [CẢI TIẾN] Tăng độ đậm của chữ và đường kẻ, tăng khoảng cách trên dưới
                    return <h2 key={blockIndex} className="text-2xl font-bold text-slate-800 mt-10 mb-5 border-b-2 border-slate-200 pb-3">{parseInlineFormatting(firstLine.substring(4))}</h2>;
                }
                 
                // --- QUY TẮC XỬ LÝ DANH SÁCH (LIST) ---
                if (firstLine.trim().startsWith('* ')) {
                    return (
                        // [CẢI TIẾN] Tăng khoảng thụt lề và khoảng cách giữa các mục
                        <ul key={blockIndex} className="list-disc list-outside space-y-3 my-5 pl-7 text-slate-700">
                            {lines.map((item, lIndex) => (<li key={lIndex} className="pl-1">{parseInlineFormatting(item.trim().substring(2))}</li>))}
                        </ul>
                    );
                }
                
                // --- Mặc định: RENDER ĐOẠN VĂN BẢN (PARAGRAPH) THEO ĐỊNH DẠNG KỊCH BẢN ---
                return (
                    // [CẢI TIẾN] Tăng khoảng cách giữa các đoạn hội thoại
                    <p key={blockIndex} className="my-5 text-slate-700">
                        {lines.map((line, lIndex) => {
                            // (hành động/chú thích)
                            if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
                                // [CẢI TIẾN] Thêm chút thụt lề để phân biệt rõ hơn
                                return <span key={lIndex} className="block text-slate-500 italic my-1 mx-8">{parseInlineFormatting(line.trim().slice(1,-1))}</span>
                            }
                            // Tên nhân vật:
                            if (line.trim().endsWith(':')) {
                                // [CẢI TIẾN] Viết hoa tên nhân vật, đậm hơn, và thêm khoảng cách dưới để tách biệt với lời thoại
                                return <span key={lIndex} className="block font-semibold text-slate-800 uppercase tracking-wide mb-1 mt-3">{parseInlineFormatting(line)}</span>
                            }
                            // Lời thoại thông thường
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