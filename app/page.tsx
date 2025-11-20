'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { MainContent } from '@/components/main-content';
import { LinkModal } from '@/components/link-modal';
import { FolderModal } from '@/components/folder-modal';
import { MoveLinkModal } from '@/components/move-link-modal';
import { useLinks } from '@/lib/hooks/use-links';
import { useFolders } from '@/lib/hooks/use-folders';
import { Link, Folder, SortBy } from '@/lib/types';

export default function Home() {
  const { links, addLink, updateLink, deleteLink } = useLinks();
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();

  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [moveLinkModalOpen, setMoveLinkModalOpen] = useState(false);

  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [movingLink, setMovingLink] = useState<Link | null>(null);

  const [draggedLinkId, setDraggedLinkId] = useState<number | null>(null);

  const handleSaveLink = async (linkData: Omit<Link, 'id' | 'created_at'>) => {
    if (editingLink) {
      await updateLink(editingLink.id, linkData);
    } else {
      await addLink(linkData);
    }
    setLinkModalOpen(false);
    setEditingLink(null);
  };

  const handleSaveFolder = async (folderData: Omit<Folder, 'id' | 'created_at'>) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, folderData);
    } else {
      await createFolder(folderData);
    }
    setFolderModalOpen(false);
    setEditingFolder(null);
  };

  const handleMoveLink = async (folderId: number | null) => {
    if (movingLink) {
      await updateLink(movingLink.id, { folder_id: folderId });
    }
    setMoveLinkModalOpen(false);
    setMovingLink(null);
  };

  const handleDeleteLink = async (id: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      await deleteLink(id);
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (confirm('Delete this folder? All subfolders will be deleted, and links inside will move to Your Links.')) {
      await deleteFolder(folderId);
    }
  };

  const handleDragStart = (e: React.DragEvent, linkId: number) => {
    setDraggedLinkId(linkId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', linkId.toString());
  };

  const handleDragEnd = () => {
    setDraggedLinkId(null);
  };

  const handleDropOnFolder = async (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    const linkId = parseInt(e.dataTransfer.getData('text/plain'));
    if (linkId && draggedLinkId === linkId) {
      await updateLink(linkId, { folder_id: folderId });
      setDraggedLinkId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        folders={folders}
        currentFolderId={currentFolderId}
        onFolderClick={setCurrentFolderId}
        onCreateFolder={() => {
          setEditingFolder(null);
          setFolderModalOpen(true);
        }}
        linkCount={links.length}
      />

      <MainContent
        folders={folders}
        links={links}
        currentFolderId={currentFolderId}
        currentFilter={currentFilter}
        sortBy={sortBy}
        onFolderClick={setCurrentFolderId}
        onEditLink={(link) => {
          setEditingLink(link);
          setLinkModalOpen(true);
        }}
        onDeleteLink={handleDeleteLink}
        onMoveLink={(link) => {
          setMovingLink(link);
          setMoveLinkModalOpen(true);
        }}
        onEditFolder={(folder) => {
          setEditingFolder(folder);
          setFolderModalOpen(true);
        }}
        onDeleteFolder={handleDeleteFolder}
        onSortChange={setSortBy}
        onAddLink={() => {
          setEditingLink(null);
          setLinkModalOpen(true);
        }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDropOnFolder={handleDropOnFolder}
      />

      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        folders={folders}
        initialData={editingLink}
      />

      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        folders={folders}
        initialData={editingFolder}
      />

      <MoveLinkModal
        isOpen={moveLinkModalOpen}
        onClose={() => {
          setMoveLinkModalOpen(false);
          setMovingLink(null);
        }}
        onMove={handleMoveLink}
        folders={folders}
        currentLink={movingLink}
      />
    </div>
  );
}
