import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const passwordHash = '70feaf3a09d1199f9ce9cf195f0b95d18fc55fb6093e5588d5e428b70e01be22';

type ProjectPayload = {
  id?: string;
  slug?: string;
  title?: string;
  team_name?: string;
  student_names?: string[];
  description?: string;
  iframe_url?: string;
  source_url?: string | null;
  repo_url?: string | null;
  thumbnail_url?: string | null;
  stack?: string[];
  category?: string;
  exhibition_year?: number;
  grade?: string | null;
  featured?: boolean;
  active?: boolean;
  sort_order?: number;
};

async function sha256(value: string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanNullableUrl(value: unknown) {
  const text = cleanText(value);
  return text.length ? text : null;
}

function cleanList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function normalizeProject(project: ProjectPayload) {
  const iframeUrl = cleanText(project.iframe_url);
  const slug = cleanText(project.slug).toLowerCase();

  if (!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
    throw new Error('slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  }

  if (!cleanText(project.title) || !cleanText(project.team_name) || !cleanText(project.description)) {
    throw new Error('제목, 팀명, 설명은 필수입니다.');
  }

  if (!iframeUrl.match(/^https?:\/\//)) {
    throw new Error('iframe URL은 http:// 또는 https://로 시작해야 합니다.');
  }

  return {
    slug,
    title: cleanText(project.title),
    team_name: cleanText(project.team_name),
    student_names: cleanList(project.student_names),
    description: cleanText(project.description),
    iframe_url: iframeUrl,
    source_url: cleanNullableUrl(project.source_url),
    repo_url: cleanNullableUrl(project.repo_url),
    thumbnail_url: cleanNullableUrl(project.thumbnail_url),
    stack: cleanList(project.stack),
    category: cleanText(project.category) || '웹 프로젝트',
    exhibition_year: Number(project.exhibition_year) || new Date().getFullYear(),
    grade: cleanNullableUrl(project.grade),
    featured: Boolean(project.featured),
    active: project.active !== false,
    sort_order: Number(project.sort_order) || 0,
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST 요청만 허용됩니다.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase 함수 환경 변수가 설정되지 않았습니다.' }, 500);
  }

  try {
    const { password, action, project, id } = await req.json();

    if (await sha256(String(password ?? '')) !== passwordHash) {
      return json({ error: '비밀번호가 맞지 않습니다.' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'create') {
      const payload = normalizeProject(project ?? {});
      const { data, error } = await admin
        .from('web_exhibition_projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return json({ project: data });
    }

    if (action === 'update') {
      const projectId = cleanText(project?.id ?? id);
      if (!projectId) throw new Error('수정할 작품 ID가 없습니다.');

      const payload = normalizeProject(project ?? {});
      const { data, error } = await admin
        .from('web_exhibition_projects')
        .update(payload)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return json({ project: data });
    }

    if (action === 'delete') {
      const projectId = cleanText(id ?? project?.id);
      if (!projectId) throw new Error('삭제할 작품 ID가 없습니다.');

      const { error } = await admin
        .from('web_exhibition_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.' }, 400);
  }
});
