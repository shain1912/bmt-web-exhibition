import { createClient } from '@supabase/supabase-js';

export type ExhibitionProject = {
  id: string;
  slug: string;
  title: string;
  team_name: string;
  student_names: string[];
  description: string;
  iframe_url: string;
  source_url: string | null;
  repo_url: string | null;
  thumbnail_url: string | null;
  stack: string[];
  category: string;
  exhibition_year: number;
  grade: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
};

export type ExhibitionProjectInput = Omit<ExhibitionProject, 'id'> & {
  id?: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

export const supabaseFunctionUrl = supabaseUrl
  ? `${supabaseUrl}/functions/v1/web-exhibition-admin`
  : null;
