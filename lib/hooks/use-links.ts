'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from '@/lib/types';

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLinks(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading links:', err);
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const addLink = async (link: Omit<Link, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([{
          url: link.url,
          title: link.title,
          tags: link.tags,
          description: link.description,
          folder_id: link.folder_id,
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setLinks((prev) => [data[0], ...prev]);
        return data[0];
      }
    } catch (err) {
      console.error('Error adding link:', err);
      setError('Failed to add link');
      return null;
    }
  };

  const updateLink = async (id: number, updates: Partial<Link>) => {
    try {
      const { data, error } = await supabase
        .from('links')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setLinks((prev) =>
          prev.map((link) => (link.id === id ? data[0] : link))
        );
        return data[0];
      }
    } catch (err) {
      console.error('Error updating link:', err);
      setError('Failed to update link');
      return null;
    }
  };

  const deleteLink = async (id: number) => {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLinks((prev) => prev.filter((link) => link.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting link:', err);
      setError('Failed to delete link');
      return false;
    }
  };

  return {
    links,
    loading,
    error,
    addLink,
    updateLink,
    deleteLink,
    reload: loadLinks,
  };
}
