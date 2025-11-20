export interface Link {
  id: number;
  url: string;
  title: string;
  tags: string[];
  description?: string;
  folder_id: number | null;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  description?: string;
  parent_folder_id: number | null;
  created_at: string;
}

export type SortBy = 'date' | 'alpha' | 'items';
export type FilterTag = 'all' | string;
