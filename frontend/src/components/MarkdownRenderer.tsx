'use client';

import React, { JSX } from 'react';

// --- TYPE DEFINITIONS ---
type InlineElement = string | JSX.Element;

// --- INLINE FORMATTING PARSER ---
// [CẢI TIẾN] Hỗ trợ thêm Link `[text](url)` và Inline Code `` `code` ``
const parseInlineFormatting = (text: string): InlineElement[] => {
    if (!text) return [text];
    
    // Regex để tìm các định dạng: Link, Bold, Italic, Inline Code
    const regex = /(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)/g;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, index) => {
        // Links: [text](url)
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
            return (
                <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {linkMatch[1]}
                </a>
            );
        }
        // Bold: **text**
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        // Italic: *text*
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index}>{part.slice(1, -1)}</em>;
        }
        // Inline Code: `code`
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-slate-200 text-slate-800 font-mono text-sm rounded-md px-1.5 py-0.5">{part.slice(1, -1)}</code>;
        }
        return part;
    });
};

const parseListItemContent = (text: string): React.ReactNode => {
    // Thử tách dòng tại dấu hai chấm đầu tiên
    const parts = text.split(/:\s*(.*)/);
    if (parts.length > 1) {
        const label = parts[0];
        const description = parts[1];
        return (
            <>
                <strong className="text-slate-800">{label}:</strong>{' '}
                {parseInlineFormatting(description)}
            </>
        );
    }
    
    // Nếu không có mẫu "Nhãn:", thì parse như bình thường
    return parseInlineFormatting(text);
}

// --- COMPONENT CHÍNH ---
export const MarkdownRenderer = ({ text }: { text: string }) => {
    if (!text) return null;

    // Chuẩn hóa và tách văn bản thành các "khối" logic
    const normalizedText = text.replace(/\\n/g, '\n');
    const blocks = normalizedText.split(/\n\s*\n/).filter(p => p.trim() !== '');

    // [CẢI TIẾN LỚN] Tái cấu trúc logic thành các hàm render chuyên biệt
    // Giúp code dễ đọc, dễ quản lý và mở rộng
    const parseBlock = (block: string, blockIndex: number) => {
        const lines = block.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) return null;

        const firstLine = lines[0].trim();
        
        // --- QUY TẮC RENDER ---
        
        // 1. Tiêu đề (Headings): # H1, ## H2, ...
        const headingMatch = firstLine.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length; // Sửa lỗi: Lấy độ dài của chuỗi '#'
            const content = headingMatch[2];
            const className = [
                "font-bold text-slate-800 mt-10 mb-5 border-b-2 border-slate-200 pb-3",
                level === 1 && "text-4xl", level === 2 && "text-3xl",
                level === 3 && "text-2xl", level === 4 && "text-xl",
                level === 5 && "text-lg", level === 6 && "text-base",
            ].filter(Boolean).join(' ');
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return <Tag key={blockIndex} className={className}>{parseInlineFormatting(content)}</Tag>;
        }
        
        // 2. Bảng (Table)
        const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);
        if (
            lines.length >= 2 &&
            firstLine.startsWith('|') &&
            isTableSeparator(lines[1])
        ) {
            const headers = firstLine.split('|').slice(1, -1).map(h => h.trim());
            const rows = lines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(c => c.trim()));
            return (
                <div key={blockIndex} className="overflow-x-auto my-8 rounded-lg border border-slate-300 shadow-md">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-slate-100">
                            <tr>
                                {headers.map((header, hIndex) => (
                                    <th key={hIndex} className="border-b-2 border-slate-300 px-4 py-3 text-left text-sm font-bold uppercase text-slate-700 tracking-wider">
                                        {parseInlineFormatting(header)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
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

        // 3. Khối mã (Code Block)
        if (firstLine.startsWith('```')) {
            const codeContent = lines.slice(1, -1).join('\n');
            return (
                <pre key={blockIndex} className="bg-slate-800 text-white font-mono text-sm p-4 my-6 rounded-lg overflow-x-auto">
                    <code>{codeContent}</code>
                </pre>
            );
        }

        // 4. Trích dẫn (Blockquote)
        if (firstLine.startsWith('>')) {
            const quoteContent = lines.map(l => l.replace(/^>\s?/, '')).join('\n');
            return (
                <blockquote key={blockIndex} className="border-l-4 border-slate-300 pl-4 my-6 italic text-slate-600">
                    {parseInlineFormatting(quoteContent)}
                </blockquote>
            );
        }

        // 5. Danh sách không có thứ tự (Unordered List)
       if (firstLine.startsWith('* ') || firstLine.startsWith('- ')) {
            return (
                <ul key={blockIndex} className="list-disc list-outside space-y-3 my-5 pl-7 text-slate-700">
                    {lines.map((item, lIndex) => {
                        const content = item.trim().substring(2);
                        // Sử dụng hàm parse mới để tự động nhận diện và in đậm nhãn
                        return <li key={lIndex} className="pl-1">{parseListItemContent(content)}</li>;
                    })}
                </ul>
            );
        }

        // 6. Danh sách có thứ tự (Ordered List)
        if (firstLine.match(/^\d+\.\s/)) {
            return (
                <ol key={blockIndex} className="list-decimal list-outside space-y-3 my-5 pl-7 text-slate-700">
                    {lines.map((item, lIndex) => {
                         const content = item.trim().replace(/^\d+\.\s/, '');
                         return (<li key={lIndex} className="pl-1">{parseInlineFormatting(content)}</li>);
                    })}
                </ol>
            );
        }
        
        // 7. Đường kẻ ngang (Horizontal Rule)
        if (firstLine === '---') {
            return <hr key={blockIndex} className="my-10 border-slate-200" />;
        }
        
        // 8. Mặc định: Đoạn văn bản (Paragraph) - Giữ lại định dạng kịch bản đặc biệt
        return (
            <p key={blockIndex} className="my-5 text-slate-700">
                {lines.map((line, lIndex) => {
                    const trimmedLine = line.trim();
                    // (hành động/chú thích)
                    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
                        return <span key={lIndex} className="block text-slate-500 italic my-1 mx-8">{parseInlineFormatting(trimmedLine.slice(1,-1))}</span>;
                    }
                    // Tên nhân vật:
                    if (trimmedLine.endsWith(':')) {
                         return <span key={lIndex} className="block font-semibold text-slate-800 uppercase tracking-wide mb-1 mt-3">{parseInlineFormatting(trimmedLine)}</span>;
                    }
                    // Lời thoại/văn bản thông thường
                    return (
                        <React.Fragment key={lIndex}>
                            {parseInlineFormatting(line)}
                            {lIndex < lines.length - 1 && <br />}
                        </React.Fragment>
                    );
                })}
            </p>
        );
    };

    return (
        <div className="font-sans text-base leading-relaxed max-w-4xl mx-auto p-4">
            {blocks.map((block, index) => parseBlock(block, index))}
        </div>
    );
};