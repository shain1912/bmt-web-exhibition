#!/usr/bin/env node
import { createProject, deleteProject, listProjects } from './exhibition-api.mjs';

const slug = `mcp-smoke-${Date.now()}`;

const created = await createProject({
  slug,
  title: 'MCP Smoke Test',
  team_name: 'QA',
  student_names: ['MCP'],
  description: 'MCP server smoke test entry. It is deleted immediately.',
  iframe_url: 'https://example.com',
  source_url: 'https://example.com',
  stack: ['MCP', 'Supabase'],
  category: 'QA',
  active: false,
});

try {
  if (created.project.slug !== slug) {
    throw new Error('Smoke test project response did not match the requested slug.');
  }

  await listProjects();
} finally {
  await deleteProject({ id: created.project.id });
}

console.log(`MCP smoke test passed: ${slug}`);
