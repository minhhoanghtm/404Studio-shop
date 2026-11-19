import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung quy định, điều khoản hoặc chính sách...',
  label = 'Nội Dung Chi Tiết Chính Sách',
  minHeight = '320px',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (openTag: string, closeTag: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = `${openTag}${selectedText || 'Nội dung mẫu'}${closeTag}`;

    const newValue =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + (selectedText.length || 'Nội dung mẫu'.length)
      );
    }, 0);
  };

  const insertHeading = (level: 1 | 2 | 3) => {
    insertTag(`<h${level}>`, `</h${level}>\n`);
  };

  const insertLink = () => {
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (url) {
      insertTag(`<a href="${url}" target="_blank">`, '</a>');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-platinum-light">
          {label} <span className="text-champagne">*</span>
        </label>
      )}

      <div className="border border-white/15 rounded-sm bg-noir-950 overflow-hidden focus-within:border-champagne transition-colors">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 bg-noir-900 border-b border-white/10 text-platinum-dark">
          <button
            type="button"
            onClick={() => insertHeading(1)}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Tiêu đề H1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertHeading(2)}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Tiêu đề H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Tiêu đề H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => insertTag('<strong>', '</strong>')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="In đậm (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<em>', '</em>')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="In nghiêng (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<u>', '</u>')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Gạch chân (Underline)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>\n')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Danh sách dấu chấm (Unordered List)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<ol>\n  <li>', '</li>\n</ol>\n')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Danh sách số thứ tự (Ordered List)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<blockquote>', '</blockquote>\n')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Khối trích dẫn (Blockquote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertLink}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Chèn liên kết URL"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTag('<code>', '</code>')}
            className="p-1.5 hover:bg-white/10 hover:text-white rounded transition-colors"
            title="Mã nguồn (Code snippet)"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono text-platinum-dark">
            <span className="hidden sm:inline">HTML Sanitized</span>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className="w-full p-4 bg-noir-950 text-white font-mono text-xs leading-relaxed focus:outline-none resize-y"
        />
      </div>

      <p className="text-[11px] text-platinum-dark font-light">
        Trình soạn thảo hỗ trợ các thẻ ngữ nghĩa HTML tiêu chuẩn. Mọi mã độc JavaScript, thẻ script hay thuộc tính thực thi đều được tự động loại bỏ để bảo vệ an toàn hệ thống (Anti-Stored XSS).
      </p>
    </div>
  );
};
