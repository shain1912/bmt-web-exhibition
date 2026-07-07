#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createProject, deleteProject, listProjects, updateProject } from './exhibition-api.mjs';

const projectShape = {
  id: z.string().optional().describe('Required only for update_project.'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).describe('URL-safe slug, e.g. my-student-site.'),
  title: z.string().min(1),
  team_name: z.string().min(1),
  student_names: z.array(z.string()).optional().default([]),
  description: z.string().min(1),
  iframe_url: z.string().url().describe('Must be an https URL accepted by the exhibition backend.'),
  source_url: z.string().url().optional().or(z.literal('')).describe('Optional public site URL.'),
  repo_url: z.string().url().optional().or(z.literal('')).describe('Optional GitHub/repository URL.'),
  thumbnail_url: z.string().url().optional().or(z.literal('')).describe('Optional thumbnail URL.'),
  stack: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('웹 프로젝트'),
  exhibition_year: z.number().int().optional(),
  grade: z.string().optional(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
};

function text(data) {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: 'bmt-web-exhibition',
  version: '1.0.0',
});

server.registerTool(
  'list_projects',
  {
    title: 'List Exhibition Projects',
    description: 'List active projects currently displayed in the BMT web exhibition.',
    inputSchema: {},
  },
  async () => text(await listProjects()),
);

server.registerTool(
  'create_project',
  {
    title: 'Create Exhibition Project',
    description: 'Create a new website entry in the BMT iframe exhibition.',
    inputSchema: projectShape,
  },
  async (input) => text(await createProject(input)),
);

server.registerTool(
  'update_project',
  {
    title: 'Update Exhibition Project',
    description: 'Update an existing website entry. Pass the project id from list_projects.',
    inputSchema: {
      ...projectShape,
      id: z.string().min(1),
    },
  },
  async (input) => text(await updateProject(input)),
);

server.registerTool(
  'delete_project',
  {
    title: 'Delete Exhibition Project',
    description: 'Delete an exhibition project by id.',
    inputSchema: {
      id: z.string().min(1),
    },
  },
  async (input) => text(await deleteProject(input)),
);

await server.connect(new StdioServerTransport());
