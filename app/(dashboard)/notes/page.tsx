'use client';

// ============================================================
// app/(dashboard)/notes/page.tsx
//
// COMPREHENSIVE NOTES WORKSPACE with:
//   ✓ Folder upload/download (entire folder structures)
//   ✓ Single file upload/download
//   ✓ Color-coded folders
//   ✓ File path breadcrumbs
//   ✓ Multi-file tabs (browser-style)
//   ✓ Live Preview editing mode (Obsidian-style)
//   ✓ Improved vault selector UI
//   ✓ Drag-and-drop reorganization
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, FolderPlus, Menu, X, Loader2, BookOpen,
  Download, Upload, Edit2, FileText, MoreHorizontal, ChevronRight,
  Home, Palette, XCircle, Eye, Code, Maximize2,
  ChevronDown, Folder, FolderOpen
} from 'lucide-react';
import type { NotesVault, NotesItem } from '@/types';
import JSZip from 'jszip';

// ── Types ────────────────────────────────────────────────────

interface CtxMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface TabItem {
  id: string;
  item: NotesItem;
  content: string;
  isDirty: boolean; // has unsaved changes
}

// Preset folder colors
const FOLDER_COLORS = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
];

type ViewMode = 'edit' | 'preview' | 'live';

// ── Main Page ─────────────────────────────────────────────────

export default function NotesPage() {
  // ── State ──────────────────────────────────────────────────
  const [vaults,         setVaults]         = useState<NotesVault[]>([]);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);
  const [tree,           setTree]           = useState<NotesItem[]>([]);
  const [tabs,           setTabs]           = useState<TabItem[]>([]);
  const [activeTabId,    setActiveTabId]    = useState<string | null>(null);
  const [viewMode,       setViewMode]       = useState<ViewMode>('live');
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [treeLoading,    setTreeLoading]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [ctxMenu,        setCtxMenu]        = useState<CtxMenuState | null>(null);
  const [dragOverId,     setDragOverId]     = useState<string | undefined>(undefined);
  const [importing,      setImporting]      = useState(false);
  const [colorPicker,    setColorPicker]    = useState<{ itemId: string; x: number; y: number } | null>(null);

  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef   = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

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
    try {
      const res  = await fetch(`/api/notes/vaults/${vaultId}/items`);
      const json = await res.json();
      setTree(json.data ?? []);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentVaultId) {
      loadTree(currentVaultId);
      // Close all tabs when switching vaults
      setTabs([]);
      setActiveTabId(null);
    }
  }, [currentVaultId, loadTree]);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod   = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      if (e.key === 's') { e.preventDefault(); flushSaveAllTabs(); }
      if (e.key === 'w') { e.preventDefault(); closeActiveTab(); }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  // ── Tab Management ─────────────────────────────────────────
  async function openInNewTab(item: NotesItem) {
    // Check if already open
    const existing = tabs.find(t => t.item.id === item.id);
    if (existing) {
      setActiveTabId(existing.id);
      setSidebarOpen(false);
      return;
    }

    // Fetch full content
    try {
      const res  = await fetch(`/api/notes/items/${item.id}`);
      const json = await res.json();
      const fullItem = json.data as NotesItem;
      
      const newTab: TabItem = {
        id: `tab_${Date.now()}_${Math.random()}`,
        item: fullItem,
        content: fullItem.content ?? '',
        isDirty: false,
      };

      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setSidebarOpen(false);
      setViewMode('live');
    } catch (err) {
      console.error('Failed to load file:', err);
    }
  }

  function closeTab(tabId: string) {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty && !confirm('You have unsaved changes. Close anyway?')) return;

    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      // Switch to adjacent tab or null
      const idx = tabs.findIndex(t => t.id === tabId);
      const nextTab = newTabs[idx] ?? newTabs[idx - 1] ?? null;
      setActiveTabId(nextTab?.id ?? null);
    }
  }

  function closeActiveTab() {
    if (activeTabId) closeTab(activeTabId);
  }

  function updateTabContent(tabId: string, newContent: string) {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, content: newContent, isDirty: true } : t
    ));
  }

  // ── Auto-save ──────────────────────────────────────────────
  async function flushSaveTab(tab: TabItem) {
    if (!tab.isDirty) return;
    setSaving(true);
    try {
      await fetch(`/api/notes/items/${tab.item.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: tab.content }),
      });
      setTabs(prev => prev.map(t =>
        t.id === tab.id ? { ...t, isDirty: false } : t
      ));
    } finally {
      setSaving(false);
    }
  }

  async function flushSaveAllTabs() {
    const dirtyTabs = tabs.filter(t => t.isDirty);
    for (const tab of dirtyTabs) {
      await flushSaveTab(tab);
    }
  }

  function handleContentChange(val: string) {
    if (!activeTab) return;
    updateTabContent(activeTab.id, val);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const currentTab = tabs.find(t => t.id === activeTab.id);
      if (currentTab) await flushSaveTab(currentTab);
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
      setTree([]); 
      setTabs([]);
      setActiveTabId(null);
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
      if (itemType === 'file') openInNewTab(json.data);
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
    
    // Update tab name if open
    setTabs(prev => prev.map(t =>
      t.item.id === item.id
        ? { ...t, item: { ...t.item, name: newName.trim() } }
        : t
    ));
  }

  async function deleteItem(item: NotesItem) {
    const msg = item.item_type === 'folder'
      ? `Delete folder "${item.name}" and all its contents?`
      : `Delete "${item.name}"?`;
    if (!confirm(msg)) return;
    await fetch(`/api/notes/items/${item.id}`, { method: 'DELETE' });
    if (currentVaultId) loadTree(currentVaultId);
    
    // Close tab if open
    const tab = tabs.find(t => t.item.id === item.id);
    if (tab) closeTab(tab.id);
  }

  async function setFolderColor(itemId: string, color: string | null) {
    await fetch(`/api/notes/items/${itemId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ color }),
    });
    if (currentVaultId) loadTree(currentVaultId);
    setColorPicker(null);
  }

  // ── Move item (drag-and-drop) ──────────────────────────────
  async function moveItem(itemId: string, newParentId: string | null) {
    if (!currentVaultId) return;
    await fetch(`/api/notes/items/${itemId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ parent_id: newParentId }),
    });
    loadTree(currentVaultId);
  }

  // ── Export vault as JSON ───────────────────────────────────
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

  // ── Export folder as ZIP ───────────────────────────────────
  async function exportFolderAsZip(folder: NotesItem) {
    try {
      const zip = new JSZip();
      
      async function addItemsToZip(item: NotesItem, zipFolder: JSZip) {
        if (item.item_type === 'file') {
          // Fetch content if not already loaded
          if (!item.content) {
            const res = await fetch(`/api/notes/items/${item.id}`);
            const json = await res.json();
            item = json.data;
          }
          zipFolder.file(item.name, item.content ?? '');
        } else if (item.item_type === 'folder' && item.children) {
          const subFolder = zipFolder.folder(item.name)!;
          for (const child of item.children) {
            await addItemsToZip(child, subFolder);
          }
        }
      }

      // Add all children
      if (folder.children) {
        for (const child of folder.children) {
          await addItemsToZip(child, zip);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folder.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export folder failed:', err);
      alert('Failed to export folder');
    }
  }

  // ── Export single note as .md ──────────────────────────────
  function exportNote(item: NotesItem, content: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = item.name.endsWith('.md') ? item.name : `${item.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import single .md file ─────────────────────────────────
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentVaultId) return;
    setImporting(true);
    try {
      const text = await file.text();
      const name = file.name;
      const res  = await fetch(`/api/notes/vaults/${currentVaultId}/items`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, item_type: 'file', content: text }),
      });
      const json = await res.json();
      if (json.data) {
        await loadTree(currentVaultId);
        openInNewTab(json.data);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Import entire folder ───────────────────────────────────
  async function handleFolderImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (!currentVaultId || !e.target.files) return;
    setImporting(true);
    try {
      const files = Array.from(e.target.files);
      
      // Build folder structure from file paths
      interface FolderNode {
        name: string;
        type: 'file' | 'folder';
        content?: string;
        children?: FolderNode[];
        path: string;
      }

      const root: FolderNode = { name: 'root', type: 'folder', children: [], path: '' };

      for (const file of files) {
        const relativePath = file.webkitRelativePath || file.name;
        const parts = relativePath.split('/').filter(p => p);
        
        let current = root;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const isLast = i === parts.length - 1;
          
          if (isLast) {
            // It's a file
            const content = await file.text();
            current.children!.push({
              name: part,
              type: 'file',
              content,
              path: relativePath,
            });
          } else {
            // It's a folder
            let folder = current.children!.find(c => c.name === part && c.type === 'folder');
            if (!folder) {
              folder = { name: part, type: 'folder', children: [], path: parts.slice(0, i + 1).join('/') };
              current.children!.push(folder);
            }
            current = folder;
          }
        }
      }

      // Now create items in database recursively
      async function createFromNode(node: FolderNode, parentId: string | null): Promise<void> {
        if (!node.children) return;

        for (const child of node.children) {
          const res = await fetch(`/api/notes/vaults/${currentVaultId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: child.name,
              item_type: child.type,
              parent_id: parentId,
              content: child.content ?? '',
            }),
          });
          const json = await res.json();
          
          if (child.type === 'folder' && json.data) {
            await createFromNode(child, json.data.id);
          }
        }
      }

      await createFromNode(root, null);
      await loadTree(currentVaultId);
      alert(`Imported ${files.length} files successfully!`);
    } catch (err) {
      console.error('Folder import failed:', err);
      alert('Folder import failed');
    } finally {
      setImporting(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  }

  // ── Import vault from JSON ─────────────────────────────────
  async function handleVaultImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res  = await fetch('/api/notes/vaults/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (json.data?.vault) {
        const listRes  = await fetch('/api/notes/vaults');
        const listJson = await listRes.json();
        setVaults(listJson.data ?? []);
        setCurrentVaultId(json.data.vault.id);
        alert(`Imported "${json.data.vault.name}" with ${json.data.itemCount} items.`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert('Import failed — check the file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ── Context menu builder ───────────────────────────────────
  function openContextMenu(e: React.MouseEvent, item: NotesItem) {
    const isFolder = item.item_type === 'folder';
    const menuItems: ContextMenuItem[] = isFolder
      ? [
          { label: 'New Note',   icon: Plus,       action: () => createItem(item.id, 'file') },
          { label: 'New Folder', icon: FolderPlus, action: () => createItem(item.id, 'folder') },
          { label: 'Export as ZIP', icon: Download, action: () => exportFolderAsZip(item) },
          { label: 'Set Color',  icon: Palette,    action: () => setColorPicker({ itemId: item.id, x: e.clientX, y: e.clientY }), divider: true },
          { label: 'Rename',     icon: Edit2,      action: () => renameItem(item) },
          { label: 'Delete',     icon: Trash2,     action: () => deleteItem(item), danger: true },
        ]
      : [
          { label: 'Open in New Tab', icon: Plus, action: () => openInNewTab(item) },
          { label: 'Export as .md', icon: Download, action: async () => {
              // Load content if not in current tab
              const tab = tabs.find(t => t.item.id === item.id);
              const content = tab?.content ?? (await (await fetch(`/api/notes/items/${item.id}`)).json()).data.content;
              exportNote(item, content);
          }},
          { label: 'Rename',        icon: Edit2,    action: () => renameItem(item), divider: true },
          { label: 'Delete',        icon: Trash2,   action: () => deleteItem(item), danger: true },
        ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items: menuItems });
  }

  function openVaultMenu(e: React.MouseEvent) {
    if (!currentVaultId) return;
    const items: ContextMenuItem[] = [
      { label: 'Rename vault',     icon: Edit2,    action: () => renameVault(currentVaultId) },
      { label: 'Export vault',     icon: Download, action: exportVault },
      { label: 'Delete vault',     icon: Trash2,   action: () => deleteVault(currentVaultId), danger: true, divider: true },
    ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  }

  // ── Get file path (breadcrumbs) ────────────────────────────
  function getFilePath(itemId: string): NotesItem[] {
    const path: NotesItem[] = [];
    
    function findPath(items: NotesItem[], targetId: string): boolean {
      for (const item of items) {
        if (item.id === targetId) {
          path.unshift(item);
          return true;
        }
        if (item.children && findPath(item.children, targetId)) {
          path.unshift(item);
          return true;
        }
      }
      return false;
    }

    findPath(tree, itemId);
    return path;
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

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".md" className="hidden" onChange={handleFileImport} />
      <input ref={folderInputRef} type="file" className="hidden" {...{ webkitdirectory: "", directory: "" } as any} onChange={handleFolderImport} />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg"
            onClick={() => setSidebarOpen(s => !s)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain flex-shrink-0" />

          {/* Enhanced Vault selector */}
          {vaults.length > 0 ? (
            <div className="relative group">
              <select
                value={currentVaultId ?? ''}
                onChange={e => setCurrentVaultId(e.target.value)}
                className="text-sm font-bold bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 hover:border-purple-500/40 rounded-xl px-3 py-1.5 focus:outline-none text-purple-300 cursor-pointer transition-all min-w-0 truncate pr-8 appearance-none"
              >
                {vaults.map(v => (
                  <option key={v.id} value={v.id} className="bg-[#121212]">📚 {v.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none rotate-90" size={14} />
            </div>
          ) : (
            <span className="text-sm text-gray-500">No vaults</span>
          )}

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
          {saving && (
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden sm:block">
              Saving…
            </span>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || !currentVaultId}
            title="Import file (.md)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[12px] font-semibold text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span className="hidden sm:inline">File</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={importing || !currentVaultId}
            title="Import folder"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[12px] font-semibold text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <FolderPlus size={13} />
            <span className="hidden sm:inline">Folder</span>
          </button>

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
                  selectedId={activeTab?.item.id}
                  dragOverId={dragOverId}
                  onSelect={openInNewTab}
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

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main workspace ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0c]">
          {activeTab ? (
            <>
              {/* Tabs bar */}
              <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5 bg-[#0a0a0a]/50 overflow-x-auto flex-shrink-0">
                {tabs.map(tab => (
                  <div
                    key={tab.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
                      tab.id === activeTabId
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <FileText size={12} />
                    <span className="truncate max-w-[120px]">{tab.item.name}</span>
                    {tab.isDirty && <span className="text-purple-400">•</span>}
                    <button
                      onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* File path breadcrumbs */}
              <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-[#0a0a0a]/50 flex-shrink-0">
                <Home size={12} className="text-gray-600" />
                {getFilePath(activeTab.item.id).map((item, idx, arr) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight size={12} className="text-gray-700" />
                    <span className={`text-[12px] ${idx === arr.length - 1 ? 'text-purple-400 font-semibold' : 'text-gray-500'}`}>
                      {item.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>

              {/* View mode toggle */}
              <div className="px-4 py-1.5 border-b border-white/5 bg-[#0a0a0a]/50 flex justify-between items-center flex-shrink-0">
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      viewMode === 'edit' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Code size={11} />
                    Edit
                  </button>
                  <button
                    onClick={() => setViewMode('live')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      viewMode === 'live' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Maximize2 size={11} />
                    Live
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                      viewMode === 'preview' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Eye size={11} />
                    Preview
                  </button>
                </div>

                <button
                  onClick={() => exportNote(activeTab.item, activeTab.content)}
                  title="Export as .md"
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <Download size={14} />
                </button>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden relative">
                {viewMode === 'edit' ? (
                  <textarea
                    ref={textareaRef}
                    value={activeTab.content}
                    onChange={e => handleContentChange(e.target.value)}
                    className="w-full h-full p-10 bg-transparent text-gray-200 resize-none focus:outline-none font-mono text-[14px] leading-loose placeholder:text-gray-700"
                    placeholder="Start writing… (Markdown supported)"
                    spellCheck={false}
                  />
                ) : viewMode === 'preview' ? (
                  <LivePreview content={activeTab.content} fileName={activeTab.item.name} />
                ) : (
                  <LivePreviewEditor
                    content={activeTab.content}
                    onChange={handleContentChange}
                  />
                )}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/4 blur-[100px] pointer-events-none" />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4">
              <div className="p-6 bg-white/3 rounded-2xl border border-white/5">
                <BookOpen size={40} className="text-white/10" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white/60 mb-1">No file open</h2>
                <p className="text-[13px] text-gray-600 max-w-[220px] leading-relaxed">
                  Select a note from the sidebar to start editing
                </p>
              </div>
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

      {/* Color picker */}
      {colorPicker && (
        <div
          className="fixed z-[200] bg-[#141414]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: colorPicker.x, top: colorPicker.y }}
        >
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Folder Color</div>
          <div className="grid grid-cols-4 gap-2">
            {FOLDER_COLORS.map(({ name, value }) => (
              <button
                key={value}
                onClick={() => setFolderColor(colorPicker.itemId, value)}
                className="w-8 h-8 rounded-lg border-2 border-white/10 hover:border-white/30 transition-all"
                style={{ backgroundColor: value }}
                title={name}
              />
            ))}
            <button
              onClick={() => setFolderColor(colorPicker.itemId, null)}
              className="w-8 h-8 rounded-lg border-2 border-white/10 hover:border-white/30 transition-all bg-gray-800 flex items-center justify-center"
              title="Remove color"
            >
              <XCircle size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TreeItem Component ─────────────────────────────────────────

function TreeItem({
  item,
  level,
  selectedId,
  dragOverId,
  onSelect,
  onContextMenu,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  item: NotesItem;
  level: number;
  selectedId?: string;
  dragOverId?: string;
  onSelect: (item: NotesItem) => void;
  onContextMenu: (e: React.MouseEvent, item: NotesItem) => void;
  onMove: (itemId: string, newParentId: string | null) => void;
  onDragStart: (itemId: string) => void;
  onDragEnd: () => void;
  onDragOver: (itemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isFolder   = item.item_type === 'folder';
  const isSelected = !isFolder && selectedId === item.id;
  const isDragOver = dragOverId === item.id;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    onDragStart(item.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(item.id);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === item.id) return;
    const newParentId = isFolder ? item.id : (item.parent_id ?? null);
    onMove(draggedId, newParentId);
  }

  const folderStyle = item.color ? { borderLeftColor: item.color, borderLeftWidth: '3px' } : {};

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => isFolder ? setExpanded(e => !e) : onSelect(item)}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, item); }}
        style={{ paddingLeft: `${level * 14 + 12}px`, ...folderStyle }}
        className={`
          flex items-center gap-2.5 py-[7px] pr-3 mx-2 rounded-lg cursor-pointer
          text-[13px] transition-all select-none group
          ${isSelected
            ? 'bg-purple-500/12 text-purple-400 font-semibold border border-purple-500/25 shadow-sm'
            : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
          }
          ${isDragOver ? 'ring-1 ring-purple-400/60 bg-purple-500/10' : ''}
        `}
      >
        {isFolder ? (
          expanded ? <ChevronDown size={13} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={13} className="text-gray-500 flex-shrink-0" />
        ) : (
          <span className="w-[13px] flex-shrink-0" />
        )}

        {isFolder ? (
          expanded ? <FolderOpen size={15} className="flex-shrink-0" style={{ color: item.color || '#a78bfa' }} /> : <Folder size={15} className="flex-shrink-0" style={{ color: item.color || '#a78bfa' }} />
        ) : (
          <FileText size={14} className={`flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
        )}

        <span className="truncate flex-1 leading-none">{item.name}</span>
        <span className="opacity-0 group-hover:opacity-30 text-gray-500 text-[10px] flex-shrink-0">⠿</span>
      </div>

      {isFolder && expanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map((child: NotesItem) => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              selectedId={selectedId}
              dragOverId={dragOverId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onMove={onMove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
            />
          ))}
        </div>
      )}

      {isFolder && expanded && (!item.children || item.children.length === 0) && (
        <div
          style={{ paddingLeft: `${(level + 1) * 14 + 12}px` }}
          className="py-1.5 pr-3 mx-2 text-[11px] text-gray-600 italic select-none"
        >
          Empty folder
        </div>
      )}
    </div>
  );
}

// ── ContextMenu Component ──────────────────────────────────────

function ContextMenu({ x, y, items, onClose }: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const safeX = Math.min(x, window.innerWidth  - 200);
  const safeY = Math.min(y, window.innerHeight - items.length * 36 - 16);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[200] bg-[#141414]/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/60 py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
      style={{ left: safeX, top: safeY }}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && <div className="my-1 border-t border-white/5" />}
          <button
            onClick={e => { e.stopPropagation(); item.action(); onClose(); }}
            className={`w-full px-4 py-2 text-left text-[13px] font-medium flex items-center gap-3 transition-colors ${
              item.danger
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-gray-300 hover:bg-white/8 hover:text-white'
            }`}
          >
            {item.icon && <item.icon size={14} className="flex-shrink-0 opacity-75" />}
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

// ── LivePreview Component ──────────────────────────────────────

function LivePreview({ content, fileName }: { content: string; fileName?: string }) {
  // This is the read-only preview mode (existing functionality)
  const html = parseMarkdown(content);
  const stats = getStats(content);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-10 py-10">
          {fileName && (
            <h1 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-white/10">
              {fileName.replace(/\.md$/, '')}
            </h1>
          )}
          <div className="prose-content text-gray-200" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      <div className="flex-shrink-0 border-t border-white/5 px-6 py-2 flex items-center gap-6 bg-[#0a0a0a]/40 text-[11px] text-gray-600 font-medium">
        <span>{stats.words.toLocaleString()} words</span>
        <span>{stats.characters.toLocaleString()} characters</span>
        <span>{stats.lines} lines</span>
        <span className="ml-auto text-purple-500/60">{stats.readingTime}</span>
      </div>
    </div>
  );
}

// ── LivePreviewEditor Component ────────────────────────────────
// This is the new Obsidian-style live preview mode

function LivePreviewEditor({ content, onChange }: { content: string; onChange: (val: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);

  const blocks = content.split('\n\n').filter(Boolean);

  function updateBlock(index: number, newText: string) {
    const newBlocks = [...blocks];
    newBlocks[index] = newText;
    onChange(newBlocks.join('\n\n'));
    setEditingBlock(null);
  }

  return (
    <div ref={editorRef} className="w-full h-full overflow-y-auto p-10 max-w-3xl mx-auto">
      {blocks.map((block, idx) => (
        <div key={idx} className="mb-6 group relative">
          {editingBlock === idx ? (
            <textarea
              autoFocus
              value={block}
              onChange={e => {
                const newBlocks = [...blocks];
                newBlocks[idx] = e.target.value;
                onChange(newBlocks.join('\n\n'));
              }}
              onBlur={() => setEditingBlock(null)}
              className="w-full p-3 bg-white/5 border border-purple-500/30 rounded-lg text-gray-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={block.split('\n').length}
            />
          ) : (
            <div
              onClick={() => setEditingBlock(idx)}
              className="cursor-text p-3 rounded-lg hover:bg-white/5 transition-colors"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(block) }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Markdown Parser (simplified version) ───────────────────────

function parseMarkdown(md: string): string {
  if (!md) return '';
  let html = md;

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) =>
    `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm"><code>${escapeHtml(code.trim())}</code></pre>`
  );

  // Headings
  html = html.replace(/^### (.*$)/gim,    '<h3 class="text-xl font-bold mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim,     '<h2 class="text-2xl font-bold mt-6 mb-3 text-purple-400">$1</h2>');
  html = html.replace(/^# (.*$)/gim,      '<h1 class="text-3xl font-bold mt-6 mb-4 border-b border-white/10 pb-2">$1</h1>');

  // Inline
  html = html.replace(/\*\*(.*?)\*\*/g,   '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g,       '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g,       '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-400">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 underline hover:text-blue-300" target="_blank">$1</a>');

  // Lists
  html = html.replace(/^\- (.+)$/gm,      '<li class="ml-4 my-0.5 list-disc">$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm,   '<li class="ml-4 my-0.5 list-decimal">$1</li>');

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = '<p class="my-3">' + html + '</p>';
  html = html.replace(/\n/g, '<br/>');

  return html;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m] ?? m)
  );
}

function getStats(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const lines = text.split('\n').length;
  const mins = Math.ceil(words / 200);
  const readingTime = mins <= 1 ? '< 1 min read' : `${mins} min read`;
  return { words, characters, lines, readingTime };
}