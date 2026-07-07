const DEFAULT_SUPABASE_URL = 'https://hpdnfhfpobmrwgxprrhb.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_lD6JDJoXUv4SFxI3s1AcPQ_jSZwjkqX';
const DEFAULT_ORIGIN = 'https://bmt-web-exhibition.netlify.app';

export function getConfig() {
  const supabaseUrl = process.env.BMT_SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.BMT_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;
  const origin = process.env.BMT_EXHIBITION_ORIGIN || DEFAULT_ORIGIN;

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    publishableKey,
    origin,
    functionUrl: `${supabaseUrl.replace(/\/$/, '')}/functions/v1/web-exhibition-admin`,
  };
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeProject(input) {
  return {
    id: cleanText(input.id) || undefined,
    slug: cleanText(input.slug).toLowerCase(),
    title: cleanText(input.title),
    team_name: cleanText(input.team_name),
    student_names: cleanList(input.student_names),
    description: cleanText(input.description),
    iframe_url: cleanText(input.iframe_url),
    source_url: cleanText(input.source_url) || null,
    repo_url: cleanText(input.repo_url) || null,
    thumbnail_url: cleanText(input.thumbnail_url) || null,
    stack: cleanList(input.stack),
    category: cleanText(input.category) || '웹 프로젝트',
    exhibition_year: Number(input.exhibition_year) || new Date().getFullYear(),
    grade: cleanText(input.grade) || null,
    featured: Boolean(input.featured),
    active: input.active !== false,
    sort_order: Number(input.sort_order) || 0,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : { error: await response.text() };

  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return body;
}

export async function listProjects() {
  const { supabaseUrl, publishableKey } = getConfig();
  const params = new URLSearchParams({
    select: '*',
    order: 'featured.desc,sort_order.asc,created_at.desc',
    active: 'eq.true',
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/web_exhibition_projects?${params.toString()}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });

  return parseResponse(response);
}

export async function createProject(input) {
  const { functionUrl, origin } = getConfig();
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify({
      action: 'create',
      project: normalizeProject(input),
    }),
  });

  return parseResponse(response);
}

export async function updateProject(input) {
  const { functionUrl, origin } = getConfig();
  const project = normalizeProject(input);

  if (!project.id) throw new Error('id is required for update_project');

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify({
      action: 'update',
      project,
      id: project.id,
    }),
  });

  return parseResponse(response);
}

export async function deleteProject({ id }) {
  const { functionUrl, origin } = getConfig();

  if (!cleanText(id)) throw new Error('id is required for delete_project');

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: JSON.stringify({
      action: 'delete',
      id,
    }),
  });

  return parseResponse(response);
}
