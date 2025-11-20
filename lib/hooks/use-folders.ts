'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder } from '@/lib/types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setFolders(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const createFolder = async (folder: Omit<Folder, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: folder.name,
          description: folder.description,
          parent_folder_id: folder.parent_folder_id,
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setFolders((prev) => [...prev, data[0]]);
        return data[0];
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      return null;
    }
  };

  const updateFolder = async (id: number, updates: Partial<Folder>) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setFolders((prev) =>
          prev.map((folder) => (folder.id === id ? data[0] : folder))
        );
        return data[0];
      }
    } catch (err) {
      console.error('Error updating folder:', err);
      setError('Failed to update folder');
      return null;
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError('Failed to delete folder');
      return false;
    }
  };

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    reload: loadFolders,
  };
}
