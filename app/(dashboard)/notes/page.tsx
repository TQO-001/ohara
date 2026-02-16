'use client';

// ============================================================
// app/(dashboard)/notes/page.tsx
//
// Notes workspace. This file is the orchestration layer:
//   - All state lives here
//   - All API calls live here
//   - UI components are imported from components/
//
// Features:
//   1. Upload / Download vault or single notes  ← NEW
//   2. Drag-and-drop to reorganise the sidebar  ← NEW
//   3. Markdown formatting toolbar              ← NEW
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, FolderPlus, Menu, X, Loader2, BookOpen,
  Download, Upload, Edit2, FileText, MoreHorizontal,
} from 'lucide-react';
import type { NotesVault, NotesItem } from '@/types';
import { ContextMenu, TreeItem } from '@/components/file-tree';
import type { ContextMenuItem } from '@/components/file-tree';
import { Toolbar, LivePreview } from '@/components/editor';

// ── Types ────────────────────────────────────────────────────

interface CtxMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

// ── Main Page ─────────────────────────────────────────────────

export default function NotesPage() {
  // ── State ──────────────────────────────────────────────────
  const [vaults,         setVaults]         = useState<NotesVault[]>([]);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);
  const [tree,           setTree]           = useState<NotesItem[]>([]);
  const [selectedItem,   setSelectedItem]   = useState<NotesItem | null>(null);
  const [content,        setContent]        = useState('');
  const [viewMode,       setViewMode]       = useState<'edit' | 'preview'>('edit');
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [treeLoading,    setTreeLoading]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [ctxMenu,        setCtxMenu]        = useState<CtxMenuState | null>(null);
  const [dragOverId,     setDragOverId]     = useState<string | undefined>(undefined);
  const [importing,      setImporting]      = useState(false);

  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const importRef   = useRef<HTMLInputElement | null>(null);

  // ── Load vaults on mount ───────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/notes/vaults');
        const json = await res.json();
        const v: NotesVault[] = json.data ?? [];
        setVaults(v);
        if (v.length > 0) setCurrentVaultId(v[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load tree when vault changes ───────────────────────────
  const loadTree = useCallback(async (vaultId: string) => {
    setTreeLoading(true);
    setSelectedItem(null);
    setContent('');
    try {
      const res  = await fetch(`/api/notes/vaults/${vaultId}/items`);
      const json = await res.json();
      setTree(json.data ?? []);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentVaultId) loadTree(currentVaultId);
  }, [currentVaultId, loadTree]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod   = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === 's') { e.preventDefault(); flushSave(); }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  });

  // ── File selection ─────────────────────────────────────────
  async function selectFile(item: NotesItem) {
    if (selectedItem?.id) await flushSave();
    try {
      const res  = await fetch(`/api/notes/items/${item.id}`);
      const json = await res.json();
      setSelectedItem(json.data);
      setContent(json.data?.content ?? '');
    } catch {
      setSelectedItem(item);
      setContent(item.content ?? '');
    }
    setSidebarOpen(false);
    setViewMode('edit');
    // Focus textarea after brief delay for transition
    setTimeout(() => textareaRef.current?.focus(), 80);
  }

  // ── Auto-save ──────────────────────────────────────────────
  async function flushSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!selectedItem) return;
    setSaving(true);
    try {
      await fetch(`/api/notes/items/${selectedItem.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
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
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ content: val }),
        });
      } finally {
        setSaving(false);
      }
    }, 1200);
  }

  // ── Vault CRUD ─────────────────────────────────────────────
  async function createVault() {
    const name = prompt('Vault name:');
    if (!name?.trim()) return;
    const res  = await fetch('/api/notes/vaults', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    if (json.data) {
      setVaults(prev => [...prev, json.data]);
      setCurrentVaultId(json.data.id);
    }
  }

  async function renameVault(id: string) {
    const vault   = vaults.find(v => v.id === id);
    const newName = prompt('New vault name:', vault?.name);
    if (!newName?.trim() || newName === vault?.name) return;
    const res  = await fetch(`/api/notes/vaults/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (json.data) setVaults(prev => prev.map(v => v.id === id ? json.data : v));
  }

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

  // ── Item CRUD ──────────────────────────────────────────────
  async function createItem(parentId: string | null, itemType: 'file' | 'folder') {
    if (!currentVaultId) return;
    const name = prompt(`${itemType === 'file' ? 'Note' : 'Folder'} name:`);
    if (!name?.trim()) return;
    const res  = await fetch(`/api/notes/vaults/${currentVaultId}/items`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.trim(), item_type: itemType, parent_id: parentId }),
    });
    const json = await res.json();
    if (json.data) {
      await loadTree(currentVaultId);
      if (itemType === 'file') selectFile(json.data);
    }
  }

  async function renameItem(item: NotesItem) {
    const newName = prompt('New name:', item.name);
    if (!newName?.trim() || newName === item.name) return;
    await fetch(`/api/notes/items/${item.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: newName.trim() }),
    });
    if (currentVaultId) loadTree(currentVaultId);
    if (selectedItem?.id === item.id) setSelectedItem(s => s ? { ...s, name: newName.trim() } : s);
  }

  async function deleteItem(item: NotesItem) {
    const msg = item.item_type === 'folder'
      ? `Delete folder "${item.name}" and all its contents?`
      : `Delete "${item.name}"?`;
    if (!confirm(msg)) return;
    await fetch(`/api/notes/items/${item.id}`, { method: 'DELETE' });
    if (currentVaultId) loadTree(currentVaultId);
    if (selectedItem?.id === item.id) { setSelectedItem(null); setContent(''); }
  }

  // ── Feature 2: Move item (drag-and-drop) ───────────────────
  async function moveItem(itemId: string, newParentId: string | null) {
    if (!currentVaultId) return;
    await fetch(`/api/notes/items/${itemId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parent_id: newParentId }),
    });
    loadTree(currentVaultId);
  }

  // ── Feature 1a: Export vault as JSON ──────────────────────
  async function exportVault() {
    if (!currentVaultId) return;
    try {
      const res  = await fetch(`/api/notes/vaults/${currentVaultId}/export`);
      const json = await res.json();
      if (!json.data) return;
      const vault = vaults.find(v => v.id === currentVaultId);
      const blob  = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href     = url;
      a.download = `${vault?.name ?? 'vault'}.ohara.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    }
  }

  // ── Feature 1a: Export single note as .md ─────────────────
  function exportNote() {
    if (!selectedItem || !content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = selectedItem.name.endsWith('.md') ? selectedItem.name : `${selectedItem.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Feature 1b: Import vault from .ohara.json ─────────────
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (file.name.endsWith('.md')) {
        // Import a single .md file into current vault
        if (!currentVaultId) return alert('Select a vault first.');
        const name = file.name;
        const res  = await fetch(`/api/notes/vaults/${currentVaultId}/items`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ name, item_type: 'file', content: text }),
        });
        const json = await res.json();
        if (json.data) {
          await loadTree(currentVaultId);
          selectFile(json.data);
        }
      } else if (file.name.endsWith('.json')) {
        // Import full vault
        const res  = await fetch('/api/notes/vaults/import', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(data),
        });
        const json = await res.json();
        if (json.data?.vault) {
          // Reload vault list and switch to new vault
          const listRes  = await fetch('/api/notes/vaults');
          const listJson = await listRes.json();
          setVaults(listJson.data ?? []);
          setCurrentVaultId(json.data.vault.id);
          alert(`Imported "${json.data.vault.name}" with ${json.data.itemCount} items.`);
        }
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed — check the file format.');
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  }

  // ── Context menu builder ───────────────────────────────────
  function openContextMenu(e: React.MouseEvent, item: NotesItem) {
    const isFolder = item.item_type === 'folder';
    const menuItems: ContextMenuItem[] = isFolder
      ? [
          { label: 'New Note',   icon: Plus,       action: () => createItem(item.id, 'file') },
          { label: 'New Folder', icon: FolderPlus, action: () => createItem(item.id, 'folder') },
          { label: 'Rename',     icon: Edit2,      action: () => renameItem(item), divider: true },
          { label: 'Delete',     icon: Trash2,     action: () => deleteItem(item), danger: true },
        ]
      : [
          { label: 'Export as .md', icon: Download, action: () => {
              selectFile(item).then(() => setTimeout(exportNote, 300));
          }},
          { label: 'Rename',        icon: Edit2,    action: () => renameItem(item), divider: true },
          { label: 'Delete',        icon: Trash2,   action: () => deleteItem(item), danger: true },
        ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items: menuItems });
  }

  // ── Vault action menu (top bar ⋯ button) ───────────────────
  function openVaultMenu(e: React.MouseEvent) {
    if (!currentVaultId) return;
    const items: ContextMenuItem[] = [
      { label: 'Rename vault',     icon: Edit2,    action: () => renameVault(currentVaultId) },
      { label: 'Export vault',     icon: Download, action: exportVault },
      { label: 'Delete vault',     icon: Trash2,   action: () => deleteVault(currentVaultId), danger: true, divider: true },
    ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }

  // ── Preview mode flush ─────────────────────────────────────
  function switchViewMode(mode: 'edit' | 'preview') {
    if (mode === 'preview') flushSave();
    setViewMode(mode);
  }

  const currentVault = vaults.find(v => v.id === currentVaultId);

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-500" size={28} />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 h-[calc(100vh-64px)] flex flex-col bg-[#0a0a0a] font-sans antialiased text-white">

      {/* Hidden import input */}
      <input
        ref={importRef}
        type="file"
        accept=".md,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg"
            onClick={() => setSidebarOpen(s => !s)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Logo */}
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain flex-shrink-0" />

          {/* Vault selector */}
          {vaults.length > 0 ? (
            <select
              value={currentVaultId ?? ''}
              onChange={e => setCurrentVaultId(e.target.value)}
              className="text-sm font-semibold bg-transparent border-none focus:outline-none text-gray-200 cursor-pointer hover:text-purple-400 transition-colors min-w-0 truncate"
            >
              {vaults.map(v => (
                <option key={v.id} value={v.id} className="bg-[#121212]">{v.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-500">No vaults</span>
          )}

          {/* Vault actions */}
          {currentVaultId && (
            <button
              onClick={openVaultMenu}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors"
              title="Vault options"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Saving indicator */}
          {saving && (
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
              Saving…
            </span>
          )}

          {/* Import button */}
          <button
            onClick={() => importRef.current?.click()}
            disabled={importing}
            title="Import vault (.ohara.json) or note (.md)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[12px] font-semibold text-gray-400 hover:text-white transition-all"
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* New Vault */}
          <button
            onClick={createVault}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[12px] font-semibold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New Vault</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:relative z-40 w-72
          bg-[#0a0a0a] border-r border-white/5 flex flex-col
          transition-transform duration-300 h-full
        `}>
          {/* Sidebar header */}
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
              {currentVault?.name ?? 'Explorer'}
            </span>
            {currentVaultId && (
              <div className="flex gap-0.5">
                <button
                  onClick={() => createItem(null, 'file')}
                  title="New note"
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-purple-400 transition-colors"
                >
                  <Plus size={15} />
                </button>
                <button
                  onClick={() => createItem(null, 'folder')}
                  title="New folder"
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-purple-400 transition-colors"
                >
                  <FolderPlus size={15} />
                </button>
              </div>
            )}
          </div>

          {/* File tree — drop zone for root level */}
          <div
            className="flex-1 overflow-y-auto pb-6"
            onDragOver={e => { e.preventDefault(); setDragOverId('__root__'); }}
            onDrop={e => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) { moveItem(id, null); setDragOverId(undefined); }
            }}
          >
            {treeLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-purple-500/40" size={18} />
              </div>
            ) : tree.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FileText size={28} className="mx-auto mb-2 text-gray-700" />
                <p className="text-[12px] text-gray-600">No notes yet</p>
                <button
                  onClick={() => createItem(null, 'file')}
                  className="mt-2 text-[11px] text-purple-500 hover:text-purple-400"
                >
                  Create your first note
                </button>
              </div>
            ) : (
              tree.map(item => (
                <TreeItem
                  key={item.id}
                  item={item}
                  level={0}
                  selectedId={selectedItem?.id}
                  dragOverId={dragOverId}
                  onSelect={selectFile}
                  onContextMenu={openContextMenu}
                  onMove={moveItem}
                  onDragStart={() => {}}
                  onDragEnd={() => setDragOverId(undefined)}
                  onDragOver={setDragOverId}
                />
              ))
            )}
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main workspace ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0c]">
          {selectedItem ? (
            <>
              {/* File name bar */}
              <div className="px-6 py-2 border-b border-white/5 flex items-center gap-3 bg-[#0a0a0a]/50 flex-shrink-0">
                <FileText size={14} className="text-purple-400 flex-shrink-0" />
                <span className="text-[13px] font-semibold text-gray-200 truncate flex-1">
                  {selectedItem.name}
                </span>
                {/* Export note button */}
                {viewMode === 'edit' && (
                  <button
                    onClick={exportNote}
                    title="Export as .md"
                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>

              {/* Feature 3: Formatting toolbar (edit mode only) */}
              {viewMode === 'edit' && (
                <Toolbar
                  textareaRef={textareaRef}
                  content={content}
                  viewMode={viewMode}
                  onContentChange={handleContentChange}
                  onViewModeChange={switchViewMode}
                />
              )}

              {/* Preview toggle bar (preview mode) */}
              {viewMode === 'preview' && (
                <div className="px-4 py-1.5 border-b border-white/5 bg-[#0a0a0a]/50 flex justify-end flex-shrink-0">
                  <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={() => setViewMode('edit')}
                      className="px-3 py-1 text-[11px] font-bold rounded-md text-gray-500 hover:text-gray-300 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-[11px] font-bold rounded-md bg-purple-600 text-white shadow"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              )}

              {/* Content area */}
              <div className="flex-1 overflow-hidden relative">
                {viewMode === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    className="w-full h-full p-10 bg-transparent text-gray-200 resize-none focus:outline-none font-mono text-[14px] leading-loose placeholder:text-gray-700"
                    placeholder="Start writing… (Markdown supported)"
                    spellCheck={false}
                  />
                ) : (
                  <LivePreview content={content} fileName={selectedItem.name} />
                )}
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/4 blur-[100px] pointer-events-none" />
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4">
              <div className="p-6 bg-white/3 rounded-2xl border border-white/5">
                <BookOpen size={40} className="text-white/10" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white/60 mb-1">Select a note</h2>
                <p className="text-[13px] text-gray-600 max-w-[220px] leading-relaxed">
                  Choose a note from the sidebar or create a new one to start writing.
                </p>
              </div>
              {vaults.length === 0 && (
                <button
                  onClick={createVault}
                  className="mt-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-xl text-[13px] font-semibold hover:bg-purple-600/30 transition-all"
                >
                  Create your first vault
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
