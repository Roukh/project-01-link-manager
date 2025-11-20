'use client';

import { Folder } from '@/lib/types';
import { useState } from 'react';

interface FolderCardProps {
  folder: Folder;
  itemCount: number;
  onFolderClick: (folderId: number) => void;
  onEdit: (folder: Folder) => void;
  onDelete: (folderId: number) => void;
  onDrop?: (e: React.DragEvent, folderId: number) => void;
}

export function FolderCard({
  folder,
  itemCount,
  onFolderClick,
  onEdit,
  onDelete,
  onDrop,
}: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop) onDrop(e, folder.id);
  };

  return (
    <div
      onClick={(e) => {
        if (!e.defaultPrevented) {
          onFolderClick(folder.id);
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative bg-gradient-to-br from-[var(--card-bg)] to-[var(--hover-bg)]
        border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg
        ${isDragOver
          ? 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(16,185,129,0.3)] scale-105'
          : 'border-[var(--border)] hover:border-[var(--accent)]'
        }
      `}
    >
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] hover:border-[var(--foreground)] transition-all"
        >
          ⋮
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border-2 border-[var(--border)] rounded-lg shadow-lg min-w-[120px] z-20 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(folder);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.id);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors text-sm text-[var(--danger)]"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="text-5xl mb-4 opacity-80 grayscale">📁</div>
        <h3 className="text-lg font-bold mb-1 break-words">{folder.name}</h3>
        <p className="text-sm text-[var(--muted)] mb-3">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </p>
        {folder.description && (
          <p className="text-xs text-[var(--muted)] line-clamp-2">
            {folder.description}
          </p>
        )}
      </div>
    </div>
  );
}
