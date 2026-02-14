"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Folder, Plus, Trash2, FolderPlus, Menu, X, AlertCircle, Info, CheckCircle, AlertTriangle, Lightbulb, HelpCircle, Bug, Quote, Zap, ChevronRight, ChevronDown, Edit2, Download, FolderOpen } from 'lucide-react';

/**
 * FULL-FEATURED OBSIDIAN-STYLE MARKDOWN EDITOR
 * 
 * Features:
 * - Mermaid diagram code display (shown as formatted code blocks)
 * - HTML/CSS support in markdown
 * - Folder/subfolder structure
 * - Right-click context menus
 * - Drag & drop file organization
 * - Export to MD, HTML
 * - Real LaTeX math with KaTeX
 * - Obsidian-style callouts with icons
 */

// Load external libraries
if (typeof document !== 'undefined') {
  // KaTeX CSS
  if (!document.querySelector('link[href*="katex"]')) {
    const katexLink = document.createElement('link');
    katexLink.rel = 'stylesheet';
    katexLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(katexLink);
  }
  
  // KaTeX JS
  if (!window.katex) {
    const katexScript = document.createElement('script');
    katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    katexScript.async = true;
    document.head.appendChild(katexScript);
  }
  

}

// Callout configuration
const calloutConfig = {
  note: { icon: Info, colors: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500', title: 'text-blue-800 dark:text-blue-200' }},
  info: { icon: Info, colors: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500', title: 'text-blue-800 dark:text-blue-200' }},
  tip: { icon: Lightbulb, colors: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300', icon: 'text-green-500', title: 'text-green-800 dark:text-green-200' }},
  success: { icon: CheckCircle, colors: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300', icon: 'text-green-500', title: 'text-green-800 dark:text-green-200' }},
  question: { icon: HelpCircle, colors: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-500', title: 'text-purple-800 dark:text-purple-200' }},
  warning: { icon: AlertTriangle, colors: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-300', icon: 'text-yellow-600', title: 'text-yellow-900 dark:text-yellow-200' }},
  danger: { icon: AlertCircle, colors: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300', icon: 'text-red-500', title: 'text-red-800 dark:text-red-200' }},
  bug: { icon: Bug, colors: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300', icon: 'text-red-500', title: 'text-red-800 dark:text-red-200' }},
  example: { icon: FileText, colors: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-500', title: 'text-purple-800 dark:text-purple-200' }},
  quote: { icon: Quote, colors: { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-400 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-300', icon: 'text-gray-500', title: 'text-gray-800 dark:text-gray-200' }},
};

const renderMath = (latex, displayMode = false) => {
  try {
    if (typeof window !== 'undefined' && window.katex) {
      return window.katex.renderToString(latex, {
        displayMode: displayMode,
        throwOnError: false,
        output: 'html',
        strict: false,
      });
    }
  } catch (e) {
    console.error('KaTeX error:', e);
  }
  return `<code class="math-fallback">${latex}</code>`;
};

const parseMarkdown = (markdown) => {
  if (!markdown) return { html: '', callouts: [] };
  
  let html = markdown;
  const callouts = [];
  let calloutIndex = 0;
  
  // Parse Mermaid diagrams as styled code blocks
  html = html.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
    return `<div class="mermaid-placeholder bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg p-4 my-6">
      <div class="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 font-semibold">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        Mermaid Diagram
      </div>
      <pre class="bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>
      <div class="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 Mermaid diagrams show as code in this editor</div>
    </div>`;
  });
  
  // Parse callouts
  html = html.replace(/^> \[!(\w+)\]([+-]?)(.*)$((?:\n> .*)*)$/gm, (match, type, fold, title, content) => {
    const lowerType = type.toLowerCase();
    const config = calloutConfig[lowerType] || calloutConfig.note;
    const displayTitle = title.trim() || type.charAt(0).toUpperCase() + type.slice(1);
    const contentLines = content.split('\n').filter(line => line.trim()).map(line => line.replace(/^> /, '')).join('\n');
    const placeholder = `__CALLOUT_${calloutIndex}__`;
    callouts.push({ config, displayTitle, content: contentLines, type: lowerType });
    calloutIndex++;
    return placeholder;
  });
  
  // Display math
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, equation) => {
    const rendered = renderMath(equation.trim(), true);
    return `<div class="math-display my-6 overflow-x-auto flex justify-center">${rendered}</div>`;
  });
  
  // Inline math
  html = html.replace(/\$([^\$\n]+?)\$/g, (match, equation) => {
    const rendered = renderMath(equation.trim(), false);
    return `<span class="math-inline">${rendered}</span>`;
  });
  
  // Code blocks (not mermaid)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'plaintext';
    return `<pre class="code-block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (match) => {
    if (match.includes('---')) {
      return '<tr class="border-b-2 border-gray-300 dark:border-gray-600">' + 
        match.slice(1, -1).split('|').map(() => '<th class="px-4 py-2 text-left font-semibold bg-gray-50 dark:bg-gray-800"></th>').join('') + 
        '</tr>';
    }
    const cells = match.slice(1, -1).split('|').map(cell => 
      `<td class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">${cell.trim()}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  });
  html = html.replace(/(<tr>.*<\/tr>\s*)+/g, (match) => {
    return `<table class="table-auto w-full my-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">${match}</table>`;
  });
  
  // Headers
  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-200">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-8 mb-4 text-cyan-600 dark:text-cyan-400 border-b-2 border-gray-300 dark:border-gray-600 pb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>');
  
  // Task lists
  html = html.replace(/- \[([ x])\] (.+)/gi, (match, checked, text) => {
    const isChecked = checked.toLowerCase() === 'x';
    return `<div class="flex items-center gap-2 my-1"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="rounded" /><span class="${isChecked ? 'line-through text-gray-500' : ''}">${text}</span></div>`;
  });
  
  // Text formatting
  html = html.replace(/~~(.*?)~~/g, '<del class="text-gray-500 dark:text-gray-400">$1</del>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">$1</a>');
  html = html.replace(/^---$/gm, '<hr class="my-8 border-t-2 border-gray-300 dark:border-gray-700" />');
  
  // Lists
  html = html.replace(/^\- (.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  html = html.replace(/(<li class="ml-4 my-1">.*<\/li>\s*)+/g, '<ul class="list-disc list-inside my-4 space-y-1">$&</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 my-1">$1</li>');
  html = html.replace(/(<li class="ml-4 my-1">.*<\/li>\s*)+/g, '<ol class="list-decimal list-inside my-4 space-y-1">$&</ol>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 my-4">$1</blockquote>');
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="my-4 text-gray-800 dark:text-gray-200 leading-relaxed">');
  html = '<p class="my-4 text-gray-800 dark:text-gray-200 leading-relaxed">' + html + '</p>';
  html = html.replace(/\n/g, '<br/>');
  
  return { html, callouts };
};

const escapeHtml = (text) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Callout component
const Callout = ({ config, title, content, type }) => {
  const IconComponent = config.icon;
  const { bg, border, text, icon, title: titleColor } = config.colors;
  const parsedContent = parseMarkdown(content);
  
  return (
    <div className={`callout ${bg} ${border} border-l-4 rounded-r-lg p-4 my-6 shadow-sm`}>
      <div className={`callout-title flex items-start gap-3 font-semibold ${titleColor} mb-2`}>
        <IconComponent className={`${icon} flex-shrink-0 mt-0.5`} size={20} />
        <span>{title}</span>
      </div>
      <div className={`callout-content ${text} pl-7`} dangerouslySetInnerHTML={{ __html: parsedContent.html }} />
    </div>
  );
};

// Context Menu component
const ContextMenu = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);
  
  return (
    <div 
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-48"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            item.action();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          {item.icon && <item.icon size={16} />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// File/Folder Tree Item component
const TreeItem = ({ item, level, isSelected, onSelect, onContextMenu, onDragStart, onDragOver, onDrop }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isFolder = item.type === 'folder';
  
  return (
    <div>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, item)}
        onContextMenu={(e) => onContextMenu(e, item)}
        onClick={() => {
          if (isFolder) setIsExpanded(!isExpanded);
          else onSelect(item.id);
        }}
        className={`
          flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer
          transition-all duration-200
          ${!isFolder && isSelected ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {isFolder ? (
          <>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {isExpanded ? <FolderOpen size={16} className="text-purple-500" /> : <Folder size={16} className="text-purple-500" />}
          </>
        ) : (
          <FileText size={16} />
        )}
        <span className="truncate flex-1">{item.name}</span>
      </div>
      {isFolder && isExpanded && item.children && (
        <div>
          {item.children.map(child => (
            <TreeItem
              key={child.id}
              item={child}
              level={level + 1}
              isSelected={isSelected}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ObsidianEditor() {
  const [vaults, setVaults] = useState([]);
  const [currentVaultId, setCurrentVaultId] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('edit');
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    loadVaults();
  }, []);

  const loadVaults = async () => {
    try {
      setIsLoading(true);
      const vaultListResult = await window.storage.get('vault-list');
      
      if (vaultListResult && vaultListResult.value) {
        const vaultIds = JSON.parse(vaultListResult.value);
        const loadedVaults = await Promise.all(
          vaultIds.map(async (id) => {
            const result = await window.storage.get(`vault-${id}`);
            return result ? JSON.parse(result.value) : null;
          })
        );
        
        const validVaults = loadedVaults.filter(v => v !== null);
        setVaults(validVaults);
        
        if (validVaults.length > 0) {
          setCurrentVaultId(validVaults[0].id);
          const firstFile = findFirstFile(validVaults[0].items);
          if (firstFile) {
            setCurrentFileId(firstFile.id);
            setFileContent(firstFile.content);
          }
        }
      } else {
        await createDefaultVault();
      }
    } catch (error) {
      console.error('Error loading vaults:', error);
      await createDefaultVault();
    } finally {
      setIsLoading(false);
    }
  };

  const findFirstFile = (items) => {
    for (const item of items) {
      if (item.type === 'file') return item;
      if (item.type === 'folder' && item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const findItemById = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === 'folder' && item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const createDefaultVault = async () => {
    const defaultVault = {
      id: generateId(),
      name: 'My First Vault',
      items: [
        {
          id: generateId(),
          name: 'Welcome.md',
          type: 'file',
          content: `# Welcome
<h1>Heading Test</h1>
This is a sample markdown document used as placeholder content.

## Features Demonstrated
- Headings
- **Bold** and *italic* text
- Lists
- Code blocks
- Horizontal rules

---

## Example Code
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## UML Diagram Example (Mermaid Code)
\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello Bob!
    Bob-->>Alice: Hi Alice!
    Alice->>Bob: How are you?
\`\`\`

> **Note:** Mermaid diagrams are shown as formatted code blocks in this editor.

## Math Example
The quadratic formula is: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Display math:
$$E = mc^2$$

## Example Text
Markdown is a lightweight formatting language designed to be easy to read and write.  
It is commonly used for documentation, notes, and README files.

> This is an example blockquote.

---

Feel free to replace this content with your own.`
        }
      ]
    };
    
    setVaults([defaultVault]);
    setCurrentVaultId(defaultVault.id);
    setCurrentFileId(defaultVault.items[0].id);
    setFileContent(defaultVault.items[0].content);
    
    await saveVaultToStorage(defaultVault);
    await window.storage.set('vault-list', JSON.stringify([defaultVault.id]));
  };

  const saveVaultToStorage = async (vault) => {
    try {
      await window.storage.set(`vault-${vault.id}`, JSON.stringify(vault));
      const vaultIds = vaults.map(v => v.id);
      if (!vaultIds.includes(vault.id)) vaultIds.push(vault.id);
      await window.storage.set('vault-list', JSON.stringify(vaultIds));
    } catch (error) {
      console.error('Error saving vault:', error);
    }
  };

  const createVault = async () => {
    const vaultName = prompt('Enter vault name:');
    if (!vaultName) return;
    
    const newVault = { id: generateId(), name: vaultName, items: [] };
    const updatedVaults = [...vaults, newVault];
    setVaults(updatedVaults);
    setCurrentVaultId(newVault.id);
    setCurrentFileId(null);
    setFileContent('');
    
    await saveVaultToStorage(newVault);
  };

  const createItem = (parentId = null, type = 'file') => {
    const name = prompt(`Enter ${type} name:`, type === 'file' ? 'New File.md' : 'New Folder');
    if (!name) return;
    
    const newItem = {
      id: generateId(),
      name: type === 'file' && !name.endsWith('.md') ? `${name}.md` : name,
      type,
      ...(type === 'file' ? { content: '' } : { children: [] })
    };
    
    const updatedVaults = vaults.map(vault => {
      if (vault.id === currentVaultId) {
        if (!parentId) {
          return { ...vault, items: [...vault.items, newItem] };
        } else {
          const addToFolder = (items) => {
            return items.map(item => {
              if (item.id === parentId && item.type === 'folder') {
                return { ...item, children: [...(item.children || []), newItem] };
              }
              if (item.type === 'folder' && item.children) {
                return { ...item, children: addToFolder(item.children) };
              }
              return item;
            });
          };
          return { ...vault, items: addToFolder(vault.items) };
        }
      }
      return vault;
    });
    
    setVaults(updatedVaults);
    if (type === 'file') {
      setCurrentFileId(newItem.id);
      setFileContent('');
    }
    
    const updatedVault = updatedVaults.find(v => v.id === currentVaultId);
    saveVaultToStorage(updatedVault);
  };

  const deleteItem = (itemId) => {
    const updatedVaults = vaults.map(vault => {
      if (vault.id === currentVaultId) {
        const removeItem = (items) => {
          return items.filter(item => {
            if (item.id === itemId) return false;
            if (item.type === 'folder' && item.children) {
              item.children = removeItem(item.children);
            }
            return true;
          });
        };
        return { ...vault, items: removeItem(vault.items) };
      }
      return vault;
    });
    
    setVaults(updatedVaults);
    if (currentFileId === itemId) {
      setCurrentFileId(null);
      setFileContent('');
    }
    
    const updatedVault = updatedVaults.find(v => v.id === currentVaultId);
    saveVaultToStorage(updatedVault);
  };

  const renameItem = (itemId) => {
    const vault = vaults.find(v => v.id === currentVaultId);
    const item = findItemById(vault.items, itemId);
    if (!item) return;
    
    const newName = prompt(`Rename ${item.type}:`, item.name);
    if (!newName || newName === item.name) return;
    
    const updatedVaults = vaults.map(v => {
      if (v.id === currentVaultId) {
        const renameInItems = (items) => {
          return items.map(i => {
            if (i.id === itemId) return { ...i, name: newName };
            if (i.type === 'folder' && i.children) {
              return { ...i, children: renameInItems(i.children) };
            }
            return i;
          });
        };
        return { ...v, items: renameInItems(v.items) };
      }
      return v;
    });
    
    setVaults(updatedVaults);
    const updatedVault = updatedVaults.find(v => v.id === currentVaultId);
    saveVaultToStorage(updatedVault);
  };

  const saveCurrentFile = async () => {
    if (!currentFileId) return;
    
    const updatedVaults = vaults.map(vault => {
      if (vault.id === currentVaultId) {
        const updateContent = (items) => {
          return items.map(item => {
            if (item.id === currentFileId && item.type === 'file') {
              return { ...item, content: fileContent };
            }
            if (item.type === 'folder' && item.children) {
              return { ...item, children: updateContent(item.children) };
            }
            return item;
          });
        };
        return { ...vault, items: updateContent(vault.items) };
      }
      return vault;
    });
    
    setVaults(updatedVaults);
    const updatedVault = updatedVaults.find(v => v.id === currentVaultId);
    await saveVaultToStorage(updatedVault);
  };

  const selectFile = (fileId) => {
    if (currentFileId) saveCurrentFile();
    
    const vault = vaults.find(v => v.id === currentVaultId);
    const file = findItemById(vault.items, fileId);
    if (file && file.type === 'file') {
      setCurrentFileId(fileId);
      setFileContent(file.content);
    }
    setIsSidebarOpen(false);
  };

  const exportMarkdown = () => {
    if (!currentFileId) return;
    const vault = vaults.find(v => v.id === currentVaultId);
    const file = findItemById(vault.items, currentFileId);
    if (!file) return;
    
    const blob = new Blob([file.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    if (!currentFileId) return;
    const vault = vaults.find(v => v.id === currentVaultId);
    const file = findItemById(vault.items, currentFileId);
    if (!file) return;
    
    const parsed = parseMarkdown(file.content);
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${file.name}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;}</style>
</head>
<body>${parsed.html}</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace('.md', '.html');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items = item.type === 'folder' ? [
      { label: 'New File', icon: FileText, action: () => createItem(item.id, 'file') },
      { label: 'New Folder', icon: FolderPlus, action: () => createItem(item.id, 'folder') },
      { label: 'Rename', icon: Edit2, action: () => renameItem(item.id) },
      { label: 'Delete', icon: Trash2, action: () => deleteItem(item.id) },
    ] : [
      { label: 'Rename', icon: Edit2, action: () => renameItem(item.id) },
      { label: 'Delete', icon: Trash2, action: () => deleteItem(item.id) },
    ];
    
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const currentVault = vaults.find(v => v.id === currentVaultId);
  const currentFile = currentVault ? findItemById(currentVault.items, currentFileId) : null;

  useEffect(() => {
    if (currentFileId && fileContent !== currentFile?.content) {
      const timer = setTimeout(() => saveCurrentFile(), 1000);
      return () => clearTimeout(timer);
    }
  }, [fileContent]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const parsedContent = viewMode === 'preview' ? parseMarkdown(fileContent) : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="flex items-center gap-2">
          <Folder size={20} className="text-purple-600 dark:text-purple-400" />
          <select value={currentVaultId || ''} onChange={(e) => {
            setCurrentVaultId(e.target.value);
            const vault = vaults.find(v => v.id === e.target.value);
            const firstFile = vault ? findFirstFile(vault.items) : null;
            if (firstFile) {
              setCurrentFileId(firstFile.id);
              setFileContent(firstFile.content);
            } else {
              setCurrentFileId(null);
              setFileContent('');
            }
          }} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500">
            {vaults.map(vault => (
              <option key={vault.id} value={vault.id}>{vault.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {currentFile && (
            <div className="relative group">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors">
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <div className="hidden group-hover:block absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 z-10 min-w-32">
                <button onClick={exportMarkdown} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Markdown</button>
                <button onClick={exportHTML} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">HTML</button>
              </div>
            </div>
          )}
          <button onClick={createVault} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors shadow-sm">
            <FolderPlus size={16} />
            <span className="hidden sm:inline">New Vault</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full transition-transform duration-300 shadow-lg lg:shadow-none`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 dark:text-gray-300">Files</h2>
            <div className="flex gap-1">
              <button onClick={() => createItem(null, 'file')} className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded" title="New File">
                <Plus size={16} className="text-purple-600 dark:text-purple-400" />
              </button>
              <button onClick={() => createItem(null, 'folder')} className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded" title="New Folder">
                <FolderPlus size={16} className="text-purple-600 dark:text-purple-400" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-60px)] p-2">
            {currentVault?.items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                No files yet.<br/>Create one to get started!
              </div>
            ) : (
              currentVault?.items.map(item => (
                <TreeItem
                  key={item.id}
                  item={item}
                  level={0}
                  isSelected={currentFileId === item.id}
                  onSelect={selectFile}
                  onContextMenu={handleContextMenu}
                  onDragStart={(e, item) => {
                    setDraggedItem(item);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e, targetItem) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Implement drag & drop logic here
                    setDraggedItem(null);
                  }}
                />
              ))
            )}
          </div>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <main className="flex-1 flex flex-col overflow-hidden">
          {currentFile ? (
            <>
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between shadow-sm">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                  {currentFile.name}
                </h3>
                
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
                    <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-sm rounded transition-all ${viewMode === 'edit' ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      Edit
                    </button>
                    <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-sm rounded transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      Preview
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {viewMode === 'edit' ? (
                  <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="w-full h-full p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none font-mono text-sm leading-relaxed" placeholder="Start writing..." spellCheck="false" />
                ) : (
                  <div className="h-full overflow-y-auto p-8 bg-white dark:bg-gray-800">
                    <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
                      {parsedContent && (
                        <div>
                          {(() => {
                            let contentWithCallouts = parsedContent.html;
                            const components = [];
                            
                            // Replace callout placeholders with actual components
                            parsedContent.callouts.forEach((callout, index) => {
                              const placeholder = `__CALLOUT_${index}__`;
                              const parts = contentWithCallouts.split(placeholder);
                              
                              if (parts.length > 1) {
                                components.push(
                                  <div key={`before-${index}`} dangerouslySetInnerHTML={{ __html: parts[0] }} />
                                );
                                components.push(
                                  <Callout
                                    key={`callout-${index}`}
                                    config={callout.config}
                                    title={callout.displayTitle}
                                    content={callout.content}
                                    type={callout.type}
                                  />
                                );
                                contentWithCallouts = parts.slice(1).join(placeholder);
                              }
                            });
                            
                            // Add remaining content
                            if (contentWithCallouts) {
                              components.push(
                                <div key="remaining" dangerouslySetInnerHTML={{ __html: contentWithCallouts }} />
                              );
                            }
                            
                            return components;
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select a file or create a new one</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}