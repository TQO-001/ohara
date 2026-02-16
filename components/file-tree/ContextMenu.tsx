'use client';

// ============================================================
// components/file-tree/ContextMenu.tsx
//
// Right-click context menu for files and folders.
// Closes automatically on outside click or Escape key.
// ============================================================

import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  danger?: boolean;   // renders in red
  divider?: boolean;  // show a divider BEFORE this item
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Position so menu doesn't go off-screen
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
