'use client';

import { Folder } from '@/lib/types';
import { ThemeToggle } from './theme-toggle';

interface SidebarProps {
  folders: Folder[];
  currentFolderId: number | null;
  onFolderClick: (folderId: number | null) => void;
  onCreateFolder: () => void;
  linkCount: number;
}

export function Sidebar({
  folders,
  currentFolderId,
  onFolderClick,
  onCreateFolder,
  linkCount,
}: SidebarProps) {
  const getFoldersInParent = (parentId: number | null) => {
    return folders.filter((f) => f.parent_folder_id === parentId);
  };

  const renderFolderTree = (parentId: number | null = null, level: number = 0) => {
    const subfolders = getFoldersInParent(parentId);

    return subfolders.map((folder) => {
      const isActive = currentFolderId === folder.id;
      const hasChildren = folders.some((f) => f.parent_folder_id === folder.id);

      return (
        <div key={folder.id}>
          <button
            onClick={() => onFolderClick(folder.id)}
            className={`
              w-full text-left px-4 py-2 rounded-lg transition-all
              ${isActive
                ? 'bg-[var(--accent)] text-white font-medium'
                : 'hover:bg-[var(--hover-bg)] text-[var(--foreground)]'
              }
            `}
            style={{ paddingLeft: `${level * 1 + 1}rem` }}
          >
            <span className="mr-2">{hasChildren ? '📂' : '📁'}</span>
            {folder.name}
          </button>
          {hasChildren && (
            <div className="mt-1">
              {renderFolderTree(folder.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className="w-64 h-screen bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col sticky top-0">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Link Manager</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-[var(--muted)]">
          {linkCount} {linkCount === 1 ? 'link' : 'links'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={() => onFolderClick(null)}
          className={`
            w-full text-left px-4 py-2 rounded-lg mb-4 transition-all
            ${currentFolderId === null
              ? 'bg-[var(--accent)] text-white font-medium'
              : 'hover:bg-[var(--hover-bg)] text-[var(--foreground)]'
            }
          `}
        >
          <span className="mr-2">🏠</span>
          Your Links
        </button>

        <div className="space-y-1">
          <div className="text-xs uppercase text-[var(--muted)] px-4 mb-2 font-semibold">
            Folders
          </div>
          {renderFolderTree()}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={onCreateFolder}
          className="w-full px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          + Create Folder
        </button>
      </div>
    </aside>
  );
}
