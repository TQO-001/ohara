'use client';

// ============================================================
// components/editor/LivePreview.tsx
//
// Renders parsed markdown HTML in the preview pane.
// Also shows a stats bar (word count, reading time) at the bottom.
// ============================================================

import React from 'react';
import { parseMarkdown, getStats } from '@/lib/markdown/parser';

interface LivePreviewProps {
  content: string;
  fileName?: string;
}

export default function LivePreview({ content, fileName }: LivePreviewProps) {
  const html  = parseMarkdown(content);
  const stats = getStats(content);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-10 py-10">
          {/* File title at top of preview */}
          {fileName && (
            <h1 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-white/10">
              {fileName.replace(/\.md$/, '')}
            </h1>
          )}
          <div
            className="prose-content text-gray-200"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex-shrink-0 border-t border-white/5 px-6 py-2 flex items-center gap-6 bg-[#0a0a0a]/40 text-[11px] text-gray-600 font-medium">
        <span>{stats.words.toLocaleString()} words</span>
        <span>{stats.characters.toLocaleString()} characters</span>
        <span>{stats.lines} lines</span>
        <span className="ml-auto text-purple-500/60">{stats.readingTime}</span>
      </div>
    </div>
  );
}
