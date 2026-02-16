'use client';

// ============================================================
// components/editor/Toolbar.tsx
//
// Feature 3: Markdown Formatting Toolbar
//
// Sits above the textarea. Each button wraps the current
// selection in the appropriate markdown syntax, or inserts
// a snippet at the cursor if nothing is selected.
// ============================================================

import React, { RefObject } from 'react';
import {
  Bold, Italic, Code, Link, Heading1, Heading2, Heading3,
  List, ListOrdered, Minus, Quote, Eye, Edit3, CheckSquare,
} from 'lucide-react';

interface ToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  content: string;
  viewMode: 'edit' | 'preview';
  onContentChange: (val: string) => void;
  onViewModeChange: (mode: 'edit' | 'preview') => void;
}

interface FormatAction {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  action: (sel: string) => { before: string; after: string; placeholder: string };
  insertLine?: boolean; // insert at line start instead of wrapping
}

const FORMATS: FormatAction[] = [
  {
    icon: Bold,
    title: 'Bold (Ctrl+B)',
    action: (sel) => ({ before: '**', after: '**', placeholder: sel || 'bold text' }),
  },
  {
    icon: Italic,
    title: 'Italic (Ctrl+I)',
    action: (sel) => ({ before: '*', after: '*', placeholder: sel || 'italic text' }),
  },
  {
    icon: Code,
    title: 'Inline code',
    action: (sel) => ({ before: '`', after: '`', placeholder: sel || 'code' }),
  },
  {
    icon: Link,
    title: 'Link (Ctrl+K)',
    action: (sel) => ({ before: '[', after: '](url)', placeholder: sel || 'link text' }),
  },
];

const BLOCK_FORMATS: FormatAction[] = [
  {
    icon: Heading1,
    title: 'Heading 1',
    action: (sel) => ({ before: '# ', after: '', placeholder: sel || 'Heading 1' }),
    insertLine: true,
  },
  {
    icon: Heading2,
    title: 'Heading 2',
    action: (sel) => ({ before: '## ', after: '', placeholder: sel || 'Heading 2' }),
    insertLine: true,
  },
  {
    icon: Heading3,
    title: 'Heading 3',
    action: (sel) => ({ before: '### ', after: '', placeholder: sel || 'Heading 3' }),
    insertLine: true,
  },
  {
    icon: Quote,
    title: 'Blockquote',
    action: (sel) => ({ before: '> ', after: '', placeholder: sel || 'quote' }),
    insertLine: true,
  },
  {
    icon: List,
    title: 'Bullet list',
    action: (sel) => ({ before: '- ', after: '', placeholder: sel || 'list item' }),
    insertLine: true,
  },
  {
    icon: ListOrdered,
    title: 'Numbered list',
    action: (sel) => ({ before: '1. ', after: '', placeholder: sel || 'list item' }),
    insertLine: true,
  },
  {
    icon: CheckSquare,
    title: 'Task item',
    action: (sel) => ({ before: '- [ ] ', after: '', placeholder: sel || 'task' }),
    insertLine: true,
  },
  {
    icon: Minus,
    title: 'Horizontal rule',
    action: () => ({ before: '\n---\n', after: '', placeholder: '' }),
    insertLine: true,
  },
];

export default function Toolbar({
  textareaRef,
  content,
  viewMode,
  onContentChange,
  onViewModeChange,
}: ToolbarProps) {

  function applyFormat(fmt: FormatAction) {
    const ta = textareaRef.current;
    if (!ta) return;

    const start  = ta.selectionStart;
    const end    = ta.selectionEnd;
    const sel    = content.slice(start, end);
    const { before, after, placeholder } = fmt.action(sel);
    const insert = sel ? `${before}${sel}${after}` : `${before}${placeholder}${after}`;

    const newContent =
      content.slice(0, start) +
      insert +
      content.slice(end);

    onContentChange(newContent);

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      ta.focus();
      const newStart = sel
        ? start + before.length
        : start + before.length;
      const newEnd = sel
        ? start + insert.length - after.length
        : start + before.length + placeholder.length;
      ta.setSelectionRange(newStart, newEnd);
    });
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 bg-[#0a0a0a]/60 flex-shrink-0 overflow-x-auto">
      {/* Inline formats */}
      <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-1">
        {FORMATS.map((fmt, i) => (
          <ToolbarButton key={i} fmt={fmt} onClick={() => applyFormat(fmt)} />
        ))}
      </div>

      {/* Block / line formats */}
      <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-1">
        {BLOCK_FORMATS.map((fmt, i) => (
          <ToolbarButton key={i} fmt={fmt} onClick={() => applyFormat(fmt)} />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Edit / Preview toggle */}
      <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 flex-shrink-0">
        <button
          onClick={() => onViewModeChange('edit')}
          title="Edit mode"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${
            viewMode === 'edit'
              ? 'bg-purple-600 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Edit3 size={11} />
          Edit
        </button>
        <button
          onClick={() => onViewModeChange('preview')}
          title="Preview mode"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${
            viewMode === 'preview'
              ? 'bg-purple-600 text-white shadow'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Eye size={11} />
          Preview
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({ fmt, onClick }: { fmt: FormatAction; onClick: () => void }) {
  const Icon = fmt.icon;
  return (
    <button
      onClick={onClick}
      title={fmt.title}
      className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-white/8 transition-all active:scale-95"
    >
      <Icon size={14} />
    </button>
  );
}
