'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Folder, FolderOpen, Plus, Trash2, FolderPlus,
  Menu, X, AlertCircle, Info, CheckCircle, AlertTriangle,
  Lightbulb, HelpCircle, Bug, Quote, ChevronRight, ChevronDown,
  Edit2, Download, Loader2, BookOpen
} from 'lucide-react';
import type { NotesVault, NotesItem } from '@/types';

// ── Markdown Parser ──────────────────────────────────────────

const calloutConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>, colors: Record<string, string> }> = {
  note:    { icon: Info,          colors: { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-500',   text: 'text-blue-700 dark:text-blue-300',     icon: 'text-blue-500',    title: 'text-blue-800 dark:text-blue-200' }},
  info:    { icon: Info,          colors: { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-500',   text: 'text-blue-700 dark:text-blue-300',     icon: 'text-blue-500',    title: 'text-blue-800 dark:text-blue-200' }},
  tip:     { icon: Lightbulb,     colors: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500',  text: 'text-green-700 dark:text-green-300',   icon: 'text-green-500',   title: 'text-green-800 dark:text-green-200' }},
  success: { icon: CheckCircle,   colors: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500',  text: 'text-green-700 dark:text-green-300',   icon: 'text-green-500',   title: 'text-green-800 dark:text-green-200' }},
  question:{ icon: HelpCircle,    colors: { bg: 'bg-purple-50 dark:bg-purple-900/20',border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-500',  title: 'text-purple-800 dark:text-purple-200' }},
  warning: { icon: AlertTriangle, colors: { bg: 'bg-yellow-50 dark:bg-yellow-900/20',border: 'border-yellow-500',text: 'text-yellow-800 dark:text-yellow-300', icon: 'text-yellow-600',  title: 'text-yellow-900 dark:text-yellow-200' }},
  danger:  { icon: AlertCircle,   colors: { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-500',    text: 'text-red-700 dark:text-red-300',       icon: 'text-red-500',     title: 'text-red-800 dark:text-red-200' }},
  bug:     { icon: Bug,           colors: { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-500',    text: 'text-red-700 dark:text-red-300',       icon: 'text-red-500',     title: 'text-red-800 dark:text-red-200' }},
  example: { icon: FileText,      colors: { bg: 'bg-purple-50 dark:bg-purple-900/20',border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-500',  title: 'text-purple-800 dark:text-purple-200' }},
  quote:   { icon: Quote,         colors: { bg: 'bg-gray-50 dark:bg-gray-800',      border: 'border-gray-400 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300', icon: 'text-gray-500', title: 'text-gray-800 dark:text-gray-200' }},
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m] ?? m));
}

function parseMarkdown(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;

  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (_m, code) =>
    `<div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4 my-4">
      <div class="font-semibold text-blue-700 dark:text-blue-300 mb-2">📊 Mermaid Diagram</div>
      <pre class="bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
    </div>`
  );

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) =>
    `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm"><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`
  );

  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-base font-bold mt-3 mb-1 text-gray-800 dark:text-gray-200">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-5 mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 text-blue-600 dark:text-blue-400">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">$1</h1>');

  html = html.replace(/~~(.*?)~~/g, '<del class="text-gray-400">$1</del>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/^---$/gm, '<hr class="my-6 border-t-2 border-gray-200 dark:border-gray-700" />');
  html = html.replace(/^\- (.+)$/gm, '<li class="ml-4 my-0.5 list-disc">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 my-0.5 list-decimal">$1</li>');
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-3">$1</blockquote>');
  html = html.replace(/\n\n/g, '</p><p class="my-3 text-gray-800 dark:text-gray-200 leading-relaxed">');
  html = '<p class="my-3 text-gray-800 dark:text-gray-200 leading-relaxed">' + html + '</p>';
  html = html.replace(/\n/g, '<br/>');
  return html;
}

// ── Context Menu ─────────────────────────────────────────────

function ContextMenu({ x, y, items, onClose }: {
  x: number; y: number;
  items: { label: string; icon?: any; action: () => void }[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 z-[100] min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={e => { e.stopPropagation(); item.action(); onClose(); }}
          className="w-full px-4 py-2 text-left text-[13px] font-medium hover:bg-white/10 flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
        >
          {item.icon && <item.icon size={14} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Tree Item ────────────────────────────────────────────────

function TreeItem({ item, level, selectedId, onSelect, onContextMenu }: any) {
  const [expanded, setExpanded] = React.useState(true);
  const isFolder = item.item_type === 'folder';
  const isSelected = !isFolder && selectedId === item.id;

  return (
    <div>
      <div
        onClick={() => isFolder ? setExpanded(e => !e) : onSelect(item)}
        onContextMenu={e => onContextMenu(e, item)}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        className={`flex items-center gap-2.5 py-2 pr-3 mx-2 rounded-lg cursor-pointer text-[13px] transition-all group ${
          isSelected
            ? 'bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20'
            : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
        }`}
      >
        {isFolder
          ? (expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />)
          : <FileText size={15} className="ml-[18px] text-gray-600 group-hover:text-gray-400" />
        }
        <span className="truncate">{item.name}</span>
      </div>
      {isFolder && expanded && item.children?.map((child: any) => (
        <TreeItem key={child.id} item={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} onContextMenu={onContextMenu} />
      ))}
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────

export default function NotesPage() {
  const [vaults, setVaults] = useState<NotesVault[]>([]);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);
  const [tree, setTree] = useState<NotesItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NotesItem | null>(null);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: NotesItem } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load vaults
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/notes/vaults');
        const json = await res.json();
        const v: NotesVault[] = json.data ?? [];
        setVaults(v);
        if (v.length > 0) setCurrentVaultId(v[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load tree when vault changes
  const loadTree = useCallback(async (vaultId: string) => {
    setTreeLoading(true);
    setSelectedItem(null);
    setContent('');
    try {
      const res = await fetch(`/api/notes/vaults/${vaultId}/items`);
      const json = await res.json();
      setTree(json.data ?? []);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentVaultId) loadTree(currentVaultId);
  }, [currentVaultId, loadTree]);

  // Select a file — fetch its content
  async function selectFile(item: NotesItem) {
    if (selectedItem?.id) await flushSave();
    try {
      const res = await fetch(`/api/notes/items/${item.id}`);
      const json = await res.json();
      setSelectedItem(json.data);
      setContent(json.data?.content ?? '');
    } catch {
      setSelectedItem(item);
      setContent(item.content ?? '');
    }
    setSidebarOpen(false);
  }

  // Auto-save with debounce
  async function flushSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!selectedItem) return;
    setSaving(true);
    try {
      await fetch(`/api/notes/items/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } finally {
      setSaving(false);
    }
  }

  function handleContentChange(val: string) {
    setContent(val);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!selectedItem) return;
      setSaving(true);
      try {
        await fetch(`/api/notes/items/${selectedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: val }),
        });
      } finally {
        setSaving(false);
      }
    }, 1200);
  }

  // Create vault
  async function createVault() {
    const name = prompt('Vault name:');
    if (!name?.trim()) return;
    const res = await fetch('/api/notes/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    if (json.data) {
      setVaults(prev => [...prev, json.data]);
      setCurrentVaultId(json.data.id);
    }
  }

  // Create item
  async function createItem(parentId: string | null, itemType: 'file' | 'folder') {
    if (!currentVaultId) return;
    const placeholder = itemType === 'file' ? 'Note name' : 'Folder name';
    const name = prompt(`${placeholder}:`);
    if (!name?.trim()) return;
    const res = await fetch(`/api/notes/vaults/${currentVaultId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), item_type: itemType, parent_id: parentId }),
    });
    const json = await res.json();
    if (json.data) {
      await loadTree(currentVaultId);
      if (itemType === 'file') selectFile(json.data);
    }
  }

  // Rename item
  async function renameItem(item: NotesItem) {
    const newName = prompt('New name:', item.name);
    if (!newName?.trim() || newName === item.name) return;
    await fetch(`/api/notes/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (currentVaultId) loadTree(currentVaultId);
    if (selectedItem?.id === item.id) setSelectedItem(s => s ? { ...s, name: newName.trim() } : s);
  }

  // Delete item
  async function deleteItem(item: NotesItem) {
    const msg = item.item_type === 'folder'
      ? `Delete folder "${item.name}" and all its contents?`
      : `Delete "${item.name}"?`;
    if (!confirm(msg)) return;
    await fetch(`/api/notes/items/${item.id}`, { method: 'DELETE' });
    if (currentVaultId) loadTree(currentVaultId);
    if (selectedItem?.id === item.id) { setSelectedItem(null); setContent(''); }
  }

  // Delete vault
  async function deleteVault(id: string) {
    const vault = vaults.find(v => v.id === id);
    if (!confirm(`Delete vault "${vault?.name}" and ALL its notes? This cannot be undone.`)) return;
    await fetch(`/api/notes/vaults/${id}`, { method: 'DELETE' });
    const newVaults = vaults.filter(v => v.id !== id);
    setVaults(newVaults);
    if (currentVaultId === id) {
      setCurrentVaultId(newVaults[0]?.id ?? null);
      setTree([]); setSelectedItem(null); setContent('');
    }
  }

  // Export current file
  function exportMd() {
    if (!selectedItem || !content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = selectedItem.name; a.click();
    URL.revokeObjectURL(url);
  }

  function handleContextMenu(e: React.MouseEvent, item: NotesItem) {
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  const currentVault = vaults.find(v => v.id === currentVaultId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 h-[calc(100vh-64px)] flex flex-col bg-[#0a0a0a] font-sans antialiased text-white">
      {/* Refined Top Bar */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors" onClick={() => setSidebarOpen(s => !s)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            {vaults.length > 0 ? (
              <select
                value={currentVaultId ?? ''}
                onChange={e => setCurrentVaultId(e.target.value)}
                className="text-sm font-semibold bg-transparent border-none focus:outline-none text-gray-200 cursor-pointer hover:text-purple-400 transition-colors"
              >
                {vaults.map(v => <option key={v.id} value={v.id} className="bg-[#121212]">{v.name}</option>)}
              </select>
            ) : <span className="text-sm text-gray-500 font-medium">No Vaults</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saving && <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">Saving…</span>}
          <button onClick={createVault} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[13px] font-semibold transition-all shadow-lg shadow-purple-900/20 active:scale-95">
            <Plus size={14} className="inline mr-2" /> New Vault
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Explorer */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 h-full`}>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest opacity-70">Explorer</span>
            {currentVaultId && (
              <div className="flex gap-1">
                <button onClick={() => createItem(null, 'file')} className="p-1.5 hover:bg-white/5 rounded-lg text-purple-400"><Plus size={16} /></button>
                <button onClick={() => createItem(null, 'folder')} className="p-1.5 hover:bg-white/5 rounded-lg text-purple-400"><FolderPlus size={16} /></button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pb-6">
            {treeLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500/50" size={20} /></div>
            ) : (
              tree.map(item => (
                <TreeItem key={item.id} item={item} level={0} selectedId={selectedItem?.id} onSelect={selectFile} onContextMenu={handleContextMenu} />
              ))
            )}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0c]">
          {selectedItem ? (
            <>
              <div className="px-8 py-3 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]/50 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={16} className="text-purple-400 flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-gray-200 truncate">{selectedItem.name}</span>
                </div>
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                  {(['edit', 'preview'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { if (mode === 'preview') flushSave(); setViewMode(mode); }}
                      className={`px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all capitalize tracking-wide ${
                        viewMode === mode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                {viewMode === 'edit' ? (
                  <textarea
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    className="w-full h-full p-10 bg-transparent text-gray-200 resize-none focus:outline-none font-mono text-[14px] leading-loose placeholder:text-gray-700"
                    placeholder="Type to begin..."
                    spellCheck={false}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-12 custom-scrollbar">
                    <div className="max-w-3xl mx-auto prose prose-invert prose-purple" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
                  </div>
                )}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] pointer-events-none" />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <BookOpen size={48} className="text-white/10 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Select a Note</h2>
              <p className="text-[13px] text-gray-500 max-w-[240px] leading-relaxed">Choose an existing note from the explorer or create a new one to begin your work.</p>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu Logic */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.item.item_type === 'folder'
              ? [
                  { label: 'New Note',   icon: Plus,       action: () => createItem(contextMenu.item.id, 'file') },
                  { label: 'New Folder', icon: FolderPlus, action: () => createItem(contextMenu.item.id, 'folder') },
                  { label: 'Rename',     icon: Edit2,      action: () => renameItem(contextMenu.item) },
                  { label: 'Delete',     icon: Trash2,     action: () => deleteItem(contextMenu.item) },
                ]
              : [
                  { label: 'Rename',     icon: Edit2,      action: () => renameItem(contextMenu.item) },
                  { label: 'Delete',     icon: Trash2,     action: () => deleteItem(contextMenu.item) },
                ]
          }
        />
      )}
    </div>
  );
}
