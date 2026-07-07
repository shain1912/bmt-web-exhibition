# AGENTS.md

This repository is the BMT WEB Exhibition service for Busan Mechanical Technical High School WEB club.

Use this file as the first reference when an AI agent needs to add, list, update, delete, test, or deploy exhibition projects.

## Live Service

- Site: https://bmt-web-exhibition.netlify.app
- GitHub: https://github.com/shain1912/bmt-web-exhibition
- Supabase project ref: `hpdnfhfpobmrwgxprrhb`
- Public table: `public.web_exhibition_projects`
- Write API: Supabase Edge Function `web-exhibition-admin`

## Fastest Way To Add A Project

No clone required:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- add
```

One-line add:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- add --title "My Site" --url https://example.com --team "Team 1"
```

List active projects:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- list
```

Install globally:

```bash
npm install -g github:shain1912/bmt-web-exhibition
bmt-exhibit add
bmt-exhibit list
```

## Required Project Fields

Minimum CLI fields:

- `title`: project title
- `url`: public HTTPS URL to embed in iframe
- `team`: team name, defaults to `WEB동아리` in interactive mode

Generated/default fields:

- `slug`: generated from title if omitted
- `description`: generated from team if omitted
- `category`: defaults to `웹 프로젝트`
- `stack`: defaults to `HTML, CSS, JavaScript`
- `active`: defaults to `true`

Important constraints:

- URLs must be `https://`.
- `slug` must use lowercase English letters, numbers, and hyphens only.
- Some websites block iframe embedding with CSP or `X-Frame-Options`; in that case the `source_url` link still opens the site in a new tab.
- If a project opens in a new tab but appears blank in the iframe, assume the target site blocks embedding unless proven otherwise. The exhibition cannot bypass `X-Frame-Options` or CSP `frame-ancestors` from another site.

## Iframe Compatibility

The exhibition uses `<iframe>` for previews. Browser security can block previews even when the URL is correct.

Common blockers:

- `X-Frame-Options: DENY`
- `X-Frame-Options: SAMEORIGIN`
- CSP `frame-ancestors 'none'`
- CSP `frame-ancestors` that does not include `https://bmt-web-exhibition.netlify.app`

Recommended guidance for student sites:

- Do not set `X-Frame-Options` if the site should appear in the exhibition iframe.
- If using CSP, allow `frame-ancestors https://bmt-web-exhibition.netlify.app`.
- Always provide `source_url` so the project can open in a new tab when iframe embedding is blocked.

## CLI Commands

From the repo:

```bash
npm install
npm run add
npm run list
npm run cli:smoke
```

Direct CLI:

```bash
node cli/bmt-exhibit.mjs add
node cli/bmt-exhibit.mjs add --title "My Site" --url https://example.com --team "Team 1"
node cli/bmt-exhibit.mjs list
node cli/bmt-exhibit.mjs delete --id <project-id>
```

## MCP Tools

The repo also includes a local MCP server for AI tools that support MCP.

Run:

```bash
npm run mcp:exhibition
```

Configured in `opencode.json` as MCP server `bmt-exhibition`.

Tools:

- `list_projects`: list active exhibition projects
- `create_project`: create a project
- `update_project`: update a project by `id`
- `delete_project`: delete a project by `id`

Smoke test:

```bash
npm run mcp:smoke
```

When using opencode, restart opencode after changing `opencode.json`; config is loaded only on startup.

## Backend Architecture

There is no separate Express/Nest/backend server.

The backend is:

- Supabase Postgres for data
- Supabase Row Level Security for public reads
- Supabase Edge Function `web-exhibition-admin` for create/update/delete

The CLI and MCP are local clients. They call the deployed Edge Function with an allowed `Origin` header.

## Security Model

Current product requirement: no password for project management.

Mitigations currently in place:

- Edge Function CORS restricts writes to the live Netlify origin and local preview origins.
- Server validates all submitted URLs as `https://`.
- Delete returns `404` if the row does not exist.
- Duplicate slugs return a Korean user-facing error.
- Site has Netlify CSP and basic security headers.

Known tradeoff:

- Anyone who can use the live site or packaged CLI can add/update/delete exhibition records. If this becomes a problem, add password, Supabase Auth, Turnstile, or per-project edit tokens in the Edge Function.

## Validation Checklist

Run before deploy or after changes:

```bash
npm run build
npm run e2e
npm run cli:smoke
npm run mcp:smoke
npm audit --audit-level=moderate
```

Check test leftovers in Supabase:

```sql
select count(*)::int as active_count,
       count(*) filter (
         where slug like 'e2e-example-%'
            or slug like 'mcp-smoke-%'
            or slug like 'cli-smoke-%'
       )::int as qa_left
from public.web_exhibition_projects;
```

## Deployment

Frontend deploy:

```bash
netlify deploy --prod
```

Edge Function deploy is done through Supabase tooling/MCP. The function source lives at:

```text
supabase/functions/web-exhibition-admin/index.ts
```

Netlify config:

```text
netlify.toml
```

## Common AI Tasks

Add a project:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- add --title "TITLE" --url https://SITE_URL --team "TEAM"
```

List projects:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- list
```

Run QA:

```bash
npm run build
npm run e2e
npm run cli:smoke
npm run mcp:smoke
```

Do not edit or commit unrelated files such as `.agents/` or `skills-lock.json` unless explicitly asked.
