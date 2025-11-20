'use client';

import { Folder } from '@/lib/types';

interface BreadcrumbsProps {
  currentFolderId: number | null;
  folders: Folder[];
  onNavigate: (folderId: number | null) => void;
}

export function Breadcrumbs({ currentFolderId, folders, onNavigate }: BreadcrumbsProps) {
  const getFolderPath = (folderId: number | null): Folder[] => {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentId: number | null = folderId;

    while (currentId) {
      const folder = folders.find((f) => f.id === currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parent_folder_id;
    }

    return path;
  };

  if (!currentFolderId) return null;

  const path = getFolderPath(currentFolderId);

  return (
    <div className="mb-4 px-3 py-2 bg-[var(--card-bg)] rounded-lg text-sm text-[var(--muted)]">
      <button
        onClick={() => onNavigate(null)}
        className="hover:text-[var(--foreground)] transition-colors"
      >
        Your Links
      </button>
      {path.map((folder) => (
        <span key={folder.id}>
          <span className="mx-2">/</span>
          <button
            onClick={() => onNavigate(folder.id)}
            className="hover:text-[var(--foreground)] transition-colors"
          >
            {folder.name}
          </button>
        </span>
      ))}
    </div>
  );
}
