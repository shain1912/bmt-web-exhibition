import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const allowedOrigins = [
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'https://bmt-web-exhibition.netlify.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '';
  const isNetlifyDeploy = /^https:\/\/[a-z0-9-]+--bmt-web-exhibition\.netlify\.app$/.test(origin);
  const allowedOrigin = allowedOrigins.includes(origin) || isNetlifyDeploy ? origin : '';

  return {
    allowed: Boolean(allowedOrigin),
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  };
}

const fallbackHeaders = {
  'Access-Control-Allow-Origin': 'https://bmt-web-exhibition.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function json(req: Request, body: unknown, status = 200) {
  const { headers } = getCorsHeaders(req);

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(headers['Access-Control-Allow-Origin'] ? headers : fallbackHeaders),
      'Content-Type': 'application/json',
    },
  });
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOptionalUrl(value: unknown, fieldName: string) {
  const text = cleanText(value);
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${fieldName}은 올바른 URL이어야 합니다.`);
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${fieldName}은 https:// URL만 사용할 수 있습니다.`);
  }

  return url.toString();
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
  const slug = cleanText(project.slug).toLowerCase();

  if (!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) {
    throw new Error('slug는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  }

  if (!cleanText(project.title) || !cleanText(project.team_name) || !cleanText(project.description)) {
    throw new Error('제목, 팀명, 설명은 필수입니다.');
  }

  const iframeUrl = cleanOptionalUrl(project.iframe_url, 'IFRAME URL');
  if (!iframeUrl) throw new Error('IFRAME URL은 필수입니다.');

  return {
    slug,
    title: cleanText(project.title),
    team_name: cleanText(project.team_name),
    student_names: cleanList(project.student_names),
    description: cleanText(project.description),
    iframe_url: iframeUrl,
    source_url: cleanOptionalUrl(project.source_url, '새 창 URL'),
    repo_url: cleanOptionalUrl(project.repo_url, 'GitHub URL'),
    thumbnail_url: cleanOptionalUrl(project.thumbnail_url, '썸네일 URL'),
    stack: cleanList(project.stack),
    category: cleanText(project.category) || '웹 프로젝트',
    exhibition_year: Number(project.exhibition_year) || new Date().getFullYear(),
    grade: cleanText(project.grade) || null,
    featured: Boolean(project.featured),
    active: project.active !== false,
    sort_order: Number(project.sort_order) || 0,
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  const { allowed, headers } = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { status: allowed ? 200 : 403, headers });
  if (!allowed) return json(req, { error: '허용되지 않은 출처의 요청입니다.' }, 403);
  if (req.method !== 'POST') return json(req, { error: 'POST 요청만 허용됩니다.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json(req, { error: 'Supabase 함수 환경 변수가 설정되지 않았습니다.' }, 500);
  }

  try {
    const { action, project, id } = await req.json();

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'create') {
      const payload = normalizeProject(project ?? {});
      const { data, error } = await admin
        .from('web_exhibition_projects')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return json(req, { project: data });
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
      return json(req, { project: data });
    }

    if (action === 'delete') {
      const projectId = cleanText(id ?? project?.id);
      if (!projectId) throw new Error('삭제할 작품 ID가 없습니다.');

      const { data, error } = await admin
        .from('web_exhibition_projects')
        .delete()
        .eq('id', projectId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) return json(req, { error: '삭제할 작품을 찾을 수 없습니다.' }, 404);
      return json(req, { ok: true });
    }

    return json(req, { error: '알 수 없는 작업입니다.' }, 400);
  } catch (error) {
    const errorCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : '';

    if (errorCode === '23505' || errorMessage.includes('duplicate key')) {
      return json(req, { error: '이미 사용 중인 슬러그입니다. 다른 슬러그를 입력하세요.' }, 409);
    }

    return json(req, { error: errorMessage || '요청 처리 중 오류가 발생했습니다.' }, 400);
  }
});
