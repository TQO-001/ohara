'use client';

// ============================================================
// components/file-tree/TreeItem.tsx
//
// Recursive file/folder tree item with:
//   - Expand / collapse for folders
//   - Selection highlighting for files
//   - Right-click context menu trigger
//   - HTML5 drag-and-drop for reorganising notes
//     (drop on folder → moves inside, drop on file → makes sibling)
// ============================================================

import React, { useState } from 'react';
import { FileText, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import type { NotesItem } from '@/types';

interface TreeItemProps {
  item: NotesItem;
  level: number;
  selectedId?: string;
  dragOverId?: string;                            // which item is currently being hovered over
  onSelect: (item: NotesItem) => void;
  onContextMenu: (e: React.MouseEvent, item: NotesItem) => void;
  onMove: (itemId: string, newParentId: string | null) => void;
  onDragStart: (itemId: string) => void;
  onDragEnd: () => void;
  onDragOver: (itemId: string) => void;
}

export default function TreeItem({
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
}: TreeItemProps) {
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

    // Drop onto folder → move inside that folder
    // Drop onto file   → move to same parent as that file
    const newParentId = isFolder ? item.id : (item.parent_id ?? null);
    onMove(draggedId, newParentId);
  }

  return (
    <div>
      {/* ── Row ─────────────────────────────────────────────── */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => isFolder ? setExpanded(e => !e) : onSelect(item)}
        onContextMenu={e => { e.preventDefault(); onContextMenu(e, item); }}
        style={{ paddingLeft: `${level * 14 + 12}px` }}
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
        {/* Folder chevron / file indent */}
        {isFolder ? (
          expanded
            ? <ChevronDown size={13} className="text-gray-500 flex-shrink-0" />
            : <ChevronRight size={13} className="text-gray-500 flex-shrink-0" />
        ) : (
          <span className="w-[13px] flex-shrink-0" /> // indent spacer
        )}

        {/* Icon */}
        {isFolder
          ? (expanded
              ? <FolderOpen size={15} className="text-purple-400/80 flex-shrink-0" />
              : <Folder     size={15} className="text-purple-400/60 flex-shrink-0" />)
          : <FileText size={14} className={`flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-400'}`} />
        }

        {/* Name */}
        <span className="truncate flex-1 leading-none">{item.name}</span>

        {/* Drag handle hint on hover */}
        <span className="opacity-0 group-hover:opacity-30 text-gray-500 text-[10px] flex-shrink-0">⠿</span>
      </div>

      {/* ── Children (folders only) ──────────────────────────── */}
      {isFolder && expanded && item.children && item.children.length > 0 && (
        <div>
          {item.children.map(child => (
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

      {/* Empty folder hint */}
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
