'use client';

import React, { JSX } from 'react';

// --- TYPE DEFINITIONS ---
type InlineElement = string | JSX.Element;

// --- INLINE FORMATTING PARSER ---
// [CẢI TIẾN] Hỗ trợ thêm Link, Inline Code, Strikethrough, và Image
const parseInlineFormatting = (text: string): InlineElement[] => {
    if (!text) return [text];
    
    // [CẢI TIẾN] Regex hỗ trợ thêm gạch ngang ~~text~~ và hình ảnh ![alt](src)
    const regex = /(\!\[.*?\]\(.*?\))|(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(\*.*?\*)|(`.*?`)|(~~.*?~~)/g;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, index) => {
        // Image: ![alt](src)
        const imageMatch = part.match(/^\!\[(.*?)\]\((.*?)\)$/);
        if (imageMatch) {
            return (
                <span key={index} className="block my-4">
                    <img 
                        src={imageMatch[2]} 
                        alt={imageMatch[1]} 
                        className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                    />
                </span>
            );
        }

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

        // Strikethrough: ~~text~~
        if (part.startsWith('~~') && part.endsWith('~~')) {
            return <del key={index}>{part.slice(2, -2)}</del>;
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
    if (parts.length > 1 && !parts[0].includes('`')) { // Tránh parse sai `code: example`
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

    const parseBlock = (block: string, blockIndex: number) => {
        const lines = block.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) return null;

        const firstLine = lines[0].trim();
        
        // --- QUY TẮC RENDER ---
        
        // 1. Tiêu đề (Headings): # H1, ## H2, ...
        const headingMatch = firstLine.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
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
        
        // 2. Bảng (Table) - [CẢI TIẾN] Hỗ trợ căn chỉnh cột
        const isTableSeparator = (l: string) => l.trim().match(/^\|(?:\s*:?-+:?\s*\|)+$/);
        if (lines.length >= 2 && firstLine.startsWith('|') && isTableSeparator(lines[1])) {
            const headers = firstLine.split('|').slice(1, -1).map(h => h.trim());
            
            // Phân tích dòng separator để xác định cách căn chỉnh
            const alignments = lines[1].split('|').slice(1, -1).map(cell => {
                const trimmed = cell.trim();
                if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
                if (trimmed.endsWith(':')) return 'right';
                return 'left'; // Mặc định
            });
            
            const rows = lines.slice(2).map(rowLine => rowLine.split('|').slice(1, -1).map(c => c.trim()));
            return (
                <div key={blockIndex} className="overflow-x-auto my-8 rounded-lg border border-slate-300 shadow-md">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-slate-100">
                            <tr>
                                {headers.map((header, hIndex) => (
                                    <th key={hIndex} className={`border-b-2 border-slate-300 px-4 py-3 text-sm font-bold uppercase text-slate-700 tracking-wider text-${alignments[hIndex]}`}>
                                        {parseInlineFormatting(header)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIndex) => (
                                <tr key={rIndex} className="bg-white even:bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200 last:border-b-0">
                                    {row.map((cell, cIndex) => (
                                        <td key={cIndex} className={`px-4 py-3 text-slate-600 align-top text-${alignments[cIndex]}`}>
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

        // 3. Khối mã (Code Block) - [CẢI TIẾN] Hỗ trợ xác định ngôn ngữ
        if (firstLine.startsWith('```')) {
            const lang = firstLine.substring(3).trim(); // Lấy ngôn ngữ, ví dụ: ```javascript
            const codeContent = lines.slice(1, lines.length > 1 && lines[lines.length - 1].trim() === '```' ? -1 : undefined).join('\n');
            return (
                <pre key={blockIndex} className="bg-slate-800 text-white font-mono text-sm p-4 my-6 rounded-lg overflow-x-auto relative group">
                    {lang && <span className="absolute top-2 right-2 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded opacity-50 group-hover:opacity-100 transition-opacity">{lang}</span>}
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

        // [CẢI TIẾN] 5. Khối cảnh báo tùy chỉnh (Custom Alert Block)
        if (firstLine.startsWith('!>')) {
            const alertContent = lines.map(l => l.replace(/^!>\s?/, '')).join('\n');
            return (
                <div key={blockIndex} className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 my-6 rounded-r-lg" role="alert">
                    <p className="font-bold">Lưu ý</p>
                    <div>{parseInlineFormatting(alertContent)}</div>
                </div>
            );
        }

        // 6. Danh sách (Unordered & Ordered) - [CẢI TIẾN] Hỗ trợ Task List
        const isUnordered = firstLine.startsWith('* ') || firstLine.startsWith('- ');
        const isOrdered = firstLine.match(/^\d+\.\s/);
        const isTaskList = (l: string) => l.trim().match(/^[-*]\s\[[ x]\]\s/);
        
        if (isUnordered || isOrdered) {
            const ListTag = isOrdered ? 'ol' : 'ul';
            const listClass = isOrdered ? 'list-decimal' : 'list-disc';
            
            return (
                <ListTag key={blockIndex} className={`${listClass} list-outside space-y-3 my-5 pl-7 text-slate-700`}>
                    {lines.map((item, lIndex) => {
                        // Task List Item: - [x] Done or - [ ] Todo
                        const taskMatch = item.match(/^[-*]\s\[([ x])\]\s(.*)/);
                        if (taskMatch) {
                            const isChecked = taskMatch[1].toLowerCase() === 'x';
                            const content = taskMatch[2];
                            return (
                                <li key={lIndex} className="flex items-start pl-1">
                                    <input type="checkbox" checked={isChecked} readOnly disabled className="mr-3 mt-1" />
                                    <span className={isChecked ? 'text-slate-400 line-through' : ''}>
                                        {parseInlineFormatting(content)}
                                    </span>
                                </li>
                            );
                        }

                        // Regular List Item
                        const content = isOrdered
                            ? item.trim().replace(/^\d+\.\s/, '')
                            : item.trim().substring(2);
                        return <li key={lIndex} className="pl-1">{parseListItemContent(content)}</li>;
                    })}
                </ListTag>
            );
        }
        
        // 7. Đường kẻ ngang (Horizontal Rule)
        if (firstLine === '---' || firstLine === '***' || firstLine === '___') {
            return <hr key={blockIndex} className="my-10 border-slate-200" />;
        }

        // 8. Mặc định: Đoạn văn bản (Paragraph)
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