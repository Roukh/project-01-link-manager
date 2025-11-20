'use client';

import { Link, Folder, SortBy } from '@/lib/types';
import { LinkCard } from './link-card';
import { FolderCard } from './folder-card';
import { Breadcrumbs } from './breadcrumbs';

interface MainContentProps {
  folders: Folder[];
  links: Link[];
  currentFolderId: number | null;
  currentFilter: string;
  sortBy: SortBy;
  onFolderClick: (folderId: number | null) => void;
  onEditLink: (link: Link) => void;
  onDeleteLink: (id: number) => void;
  onMoveLink: (link: Link) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: number) => void;
  onSortChange: (sortBy: SortBy) => void;
  onAddLink: () => void;
  onDragStart: (e: React.DragEvent, linkId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDropOnFolder: (e: React.DragEvent, folderId: number) => void;
}

export function MainContent({
  folders,
  links,
  currentFolderId,
  currentFilter,
  sortBy,
  onFolderClick,
  onEditLink,
  onDeleteLink,
  onMoveLink,
  onEditFolder,
  onDeleteFolder,
  onSortChange,
  onAddLink,
  onDragStart,
  onDragEnd,
  onDropOnFolder,
}: MainContentProps) {
  const getFoldersInParent = (parentId: number | null) => {
    return folders.filter((f) => f.parent_folder_id === parentId);
  };

  const getLinksInFolder = () => {
    return links.filter((l) => {
      const folderMatch = l.folder_id === currentFolderId;
      const tagMatch = currentFilter === 'all' || l.tags.includes(currentFilter);
      return folderMatch && tagMatch;
    });
  };

  const getFolderItemCount = (folderId: number) => {
    const linkCount = links.filter((l) => l.folder_id === folderId).length;
    const subfolderCount = folders.filter((f) => f.parent_folder_id === folderId).length;
    return linkCount + subfolderCount;
  };

  const getSortedItems = () => {
    const currentFolders = [...getFoldersInParent(currentFolderId)];
    const currentLinks = [...getLinksInFolder()];

    if (sortBy === 'alpha') {
      currentFolders.sort((a, b) => a.name.localeCompare(b.name));
      currentLinks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'items') {
      currentFolders.sort((a, b) => getFolderItemCount(b.id) - getFolderItemCount(a.id));
    } else {
      currentFolders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      currentLinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return { folders: currentFolders, links: currentLinks };
  };

  const { folders: sortedFolders, links: sortedLinks } = getSortedItems();

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    links.forEach((link) => {
      link.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  };

  const allTags = getAllTags();

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">
              {currentFolderId
                ? folders.find((f) => f.id === currentFolderId)?.name || 'Your Links'
                : 'Your Links'}
            </h2>
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortBy)}
                className="px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--card-bg)] hover:border-[var(--foreground)] transition-colors cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="alpha">Sort Alphabetically</option>
                <option value="items">Sort by Item Count</option>
              </select>
              <button
                onClick={onAddLink}
                className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                + Add Link
              </button>
            </div>
          </div>

          <Breadcrumbs
            currentFolderId={currentFolderId}
            folders={folders}
            onNavigate={onFolderClick}
          />

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-[var(--muted)] py-2">Filter:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium transition-all
                    ${currentFilter === tag
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'border-2 border-[var(--border)] hover:border-[var(--foreground)]'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {sortedFolders.length === 0 && sortedLinks.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)]">
            <p className="text-lg">
              {currentFilter === 'all'
                ? 'No items here yet.'
                : `No links found with tag "${currentFilter}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                itemCount={getFolderItemCount(folder.id)}
                onFolderClick={onFolderClick}
                onEdit={onEditFolder}
                onDelete={onDeleteFolder}
                onDrop={onDropOnFolder}
              />
            ))}
            {sortedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onEdit={onEditLink}
                onDelete={onDeleteLink}
                onMove={onMoveLink}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
