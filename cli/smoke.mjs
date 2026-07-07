#!/usr/bin/env node
import { deleteProject, listProjects } from '../mcp/exhibition-api.mjs';
import { spawnSync } from 'node:child_process';

const slug = `cli-smoke-${Date.now()}`;
const result = spawnSync(
  process.execPath,
  [
    'cli/bmt-exhibit.mjs',
    'add',
    '--title',
    'CLI Smoke Test',
    '--slug',
    slug,
    '--url',
    'https://example.com',
    '--team',
    'QA',
    '--description',
    'CLI smoke test entry.',
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout);
  process.exit(result.status || 1);
}

const inactiveProjects = await fetchInactiveBySlug(slug);
const project = inactiveProjects[0];

if (!project) {
  throw new Error('CLI smoke test project was not created.');
}

await listProjects();
await deleteProject({ id: project.id });
console.log(`CLI smoke test passed: ${slug}`);

async function fetchInactiveBySlug(projectSlug) {
  const { getConfig } = await import('../mcp/exhibition-api.mjs');
  const { supabaseUrl, publishableKey } = getConfig();
  const params = new URLSearchParams({
    select: '*',
    slug: `eq.${projectSlug}`,
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/web_exhibition_projects?${params.toString()}`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not verify CLI smoke test project: ${response.status}`);
  }

  return response.json();
}
