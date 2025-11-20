'use client';

import { Link, Folder } from '@/lib/types';
import { useState, useEffect } from 'react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Omit<Link, 'id' | 'created_at'>) => void;
  folders: Folder[];
  initialData?: Link | null;
}

export function LinkModal({ isOpen, onClose, onSave, folders, initialData }: LinkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url);
      setTitle(initialData.title);
      setTags(initialData.tags.join(', '));
      setDescription(initialData.description || '');
      setFolderId(initialData.folder_id);
    } else {
      setUrl('');
      setTitle('');
      setTags('');
      setDescription('');
      setFolderId(null);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    onSave({
      url,
      title,
      tags: tagsArray,
      description,
      folder_id: folderId,
    });

    setUrl('');
    setTitle('');
    setTags('');
    setDescription('');
    setFolderId(null);
  };

  if (!isOpen) return null;

  const generateFolderOptions = (parentId: number | null = null, prefix = ''): JSX.Element[] => {
    const subfolders = folders.filter((f) => f.parent_folder_id === parentId);
    let options: JSX.Element[] = [];

    subfolders.forEach((folder) => {
      options.push(
        <option key={folder.id} value={folder.id}>
          {prefix}{folder.name}
        </option>
      );
      options = options.concat(generateFolderOptions(folder.id, prefix + '  '));
    });

    return options;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card-bg)] rounded-xl p-8 w-full max-w-md shadow-2xl animate-[modalSlideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Link' : 'Add New Link'}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl w-8 h-8 flex items-center justify-center hover:text-[var(--danger)] transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--background)] focus:border-[var(--foreground)] outline-none transition-colors"
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--background)] focus:border-[var(--foreground)] outline-none transition-colors"
                placeholder="My Awesome Link"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--background)] focus:border-[var(--foreground)] outline-none transition-colors"
                placeholder="work, tutorial, reference"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--background)] focus:border-[var(--foreground)] outline-none transition-colors resize-none"
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Folder (optional)</label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border-2 border-[var(--border)] rounded-lg bg-[var(--background)] focus:border-[var(--foreground)] outline-none transition-colors cursor-pointer"
              >
                <option value="">Your Links (Root)</option>
                {generateFolderOptions()}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-[var(--border)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              {initialData ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
