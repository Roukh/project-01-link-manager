'use client';

import { Link } from '@/lib/types';
import { useState } from 'react';

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: number) => void;
  onMove: (link: Link) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, linkId: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function LinkCard({
  link,
  onEdit,
  onDelete,
  onMove,
  draggable = true,
  onDragStart,
  onDragEnd,
}: LinkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const truncateUrl = (url: string) => {
    const maxLength = 50;
    return url.length <= maxLength ? url : url.substring(0, maxLength) + '...';
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) onDragStart(e, link.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative bg-[var(--card-bg)] border-2 border-[var(--border)]
        rounded-2xl p-6 transition-all duration-300
        hover:border-[var(--foreground)] hover:-translate-y-1 hover:shadow-lg
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${draggable ? 'cursor-move' : ''}
      `}
    >
      <div className="absolute top-3 left-3">
        <button
          onClick={(e) => {
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
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card-bg)] border-2 border-[var(--border)] rounded-lg shadow-lg min-w-[120px] z-20 overflow-hidden">
              <button
                onClick={() => {
                  onEdit(link);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onMove(link);
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors text-sm"
              >
                Move to Folder
              </button>
              <button
                onClick={() => {
                  onDelete(link.id);
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

      <div className="mt-6">
        <h3 className="text-lg font-bold mb-2 break-words">{link.title}</h3>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--muted)] hover:text-[var(--accent)] break-all block mb-4"
        >
          {truncateUrl(link.url)}
        </a>

        {link.description && (
          <p className="text-sm text-[var(--muted)] mb-4 line-clamp-3">
            {link.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {link.tags.length > 0 ? (
            link.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[var(--hover-bg)] rounded-full text-xs font-medium"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="px-3 py-1 bg-[var(--hover-bg)] rounded-full text-xs font-medium text-[var(--muted)]">
              untagged
            </span>
          )}
        </div>

        <button
          onClick={() => window.open(link.url, '_blank')}
          className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Visit
        </button>
      </div>
    </div>
  );
}
