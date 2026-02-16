// ============================================================
// lib/markdown/parser.ts
//
// Pure markdown → HTML converter used by the Notes editor.
// Lives in lib/ so it can be imported anywhere (server, client,
// future mobile app) without pulling in any React code.
// ============================================================

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] ?? m)
  );
}

export function parseMarkdown(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;

  // ── Code blocks (mermaid gets special callout style) ───────
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_m, code) =>
    `<div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4 my-4">
      <div class="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-sm">📊 Mermaid Diagram</div>
      <pre class="bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
      <p class="text-xs text-blue-500 dark:text-blue-400 mt-2">Paste into mermaid.live to render</p>
    </div>`
  );

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) =>
    `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm leading-relaxed"><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`
  );

  // ── Headings ───────────────────────────────────────────────
  html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-bold mt-2 mb-1 text-gray-700 dark:text-gray-300">$1</h6>');
  html = html.replace(/^##### (.*$)/gim,  '<h5 class="text-base font-bold mt-3 mb-1 text-gray-800 dark:text-gray-200">$1</h5>');
  html = html.replace(/^#### (.*$)/gim,   '<h4 class="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h4>');
  html = html.replace(/^### (.*$)/gim,    '<h3 class="text-xl font-bold mt-5 mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim,     '<h2 class="text-2xl font-bold mt-6 mb-3 text-blue-600 dark:text-blue-400">$1</h2>');
  html = html.replace(/^# (.*$)/gim,      '<h1 class="text-3xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-gray-700 pb-2">$1</h1>');

  // ── Task lists (before generic bullets) ───────────────────
  html = html.replace(/^- \[x\] (.+)$/gim, '<li class="ml-4 my-0.5 flex items-start gap-2"><span class="mt-1 w-4 h-4 rounded bg-purple-500 flex items-center justify-center flex-shrink-0"><svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></span><span class="line-through text-gray-400">$1</span></li>');
  html = html.replace(/^- \[ \] (.+)$/gim, '<li class="ml-4 my-0.5 flex items-start gap-2"><span class="mt-1 w-4 h-4 rounded border-2 border-gray-400 flex-shrink-0"></span><span>$1</span></li>');

  // ── Inline formatting ──────────────────────────────────────
  html = html.replace(/~~(.*?)~~/g,       '<del class="text-gray-400 line-through">$1</del>');
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic text-gray-900 dark:text-gray-100">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g,   '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
  html = html.replace(/\*(.*?)\*/g,       '<em class="italic text-gray-800 dark:text-gray-200">$1</em>');
  html = html.replace(/`([^`]+)`/g,       '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-500 transition-colors" target="_blank" rel="noopener">$1</a>');

  // ── Horizontal rule ────────────────────────────────────────
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-gray-200 dark:border-gray-700" />');

  // ── Lists ──────────────────────────────────────────────────
  html = html.replace(/^\- (.+)$/gm,      '<li class="ml-4 my-0.5 list-disc list-inside">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm,   '<li class="ml-4 my-0.5 list-decimal list-inside">$1</li>');

  // ── Blockquotes ────────────────────────────────────────────
  html = html.replace(/^> (.+)$/gm,
    '<blockquote class="border-l-4 border-purple-400 dark:border-purple-600 pl-4 italic text-gray-600 dark:text-gray-400 my-3 bg-purple-50/30 dark:bg-purple-900/10 py-1 rounded-r">$1</blockquote>'
  );

  // ── Tables ─────────────────────────────────────────────────
  html = html.replace(/\|(.+)\|/g, (match) => {
    if (match.includes('---')) return '';
    const cells = match.slice(1, -1).split('|').map(c => c.trim());
    return '<tr class="border-b border-gray-200 dark:border-gray-700">' +
      cells.map(c => `<td class="px-3 py-2 text-sm">${c}</td>`).join('') +
      '</tr>';
  });
  html = html.replace(/(<tr[\s\S]*?<\/tr>\s*)+/g, m =>
    `<div class="overflow-x-auto my-4"><table class="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">${m}</table></div>`
  );

  // ── Paragraphs ─────────────────────────────────────────────
  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-800 dark:text-gray-200 leading-relaxed">');
  html = '<p class="my-3 text-gray-800 dark:text-gray-200 leading-relaxed">' + html + '</p>';
  html = html.replace(/\n/g, '<br/>');

  return html;
}

// ── Word / reading stats ────────────────────────────────────

export interface MarkdownStats {
  words: number;
  characters: number;
  lines: number;
  readingTime: string; // e.g. "2 min read"
}

export function getStats(text: string): MarkdownStats {
  const words       = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters  = text.length;
  const lines       = text.split('\n').length;
  const mins        = Math.ceil(words / 200);
  const readingTime = mins <= 1 ? '< 1 min read' : `${mins} min read`;
  return { words, characters, lines, readingTime };
}
