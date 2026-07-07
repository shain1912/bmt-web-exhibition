#!/usr/bin/env node
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createProject, deleteProject, listProjects } from '../mcp/exhibition-api.mjs';

const command = process.argv[2] || 'help';
const args = parseArgs(process.argv.slice(3));
const scripted = Object.keys(args).length > 0;

function parseArgs(values) {
  const parsed = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) continue;

    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[가-힣]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `project-${Date.now()}`;
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

async function ask(question, defaultValue = '') {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  const answer = await rl.question(`${question}${suffix}: `);
  return answer.trim() || defaultValue;
}

async function requiredValue(keys, question) {
  for (const key of keys) {
    if (args[key]) return args[key];
  }

  if (scripted) {
    throw new Error(`${keys[0]} is required. Use --${keys[0]} "..."`);
  }

  return ask(question);
}

async function optionalValue(keys, question, defaultValue = '') {
  for (const key of keys) {
    if (args[key]) return args[key];
  }

  if (scripted) return defaultValue;

  return ask(question, defaultValue);
}

async function addProject() {
  const title = await requiredValue(['title'], '작품 제목');
  const iframeUrl = await requiredValue(['url', 'iframe'], '전시 URL(https://)');
  const teamName = await optionalValue(['team'], '팀명', 'WEB동아리');
  const slug = await optionalValue(['slug'], '슬러그(영문/숫자/하이픈)', toSlug(title));
  const description = await optionalValue(['description'], '설명', `${teamName}의 웹 프로젝트입니다.`);
  const students = await optionalValue(['students'], '참여자(쉼표 구분)', '');
  const stack = await optionalValue(['stack'], '기술 스택(쉼표 구분)', 'HTML, CSS, JavaScript');
  const category = await optionalValue(['category'], '카테고리', '웹 프로젝트');
  const grade = await optionalValue(['grade'], '학년/구분', '');
  const sourceUrl = args.source || args.url || iframeUrl;
  const repoUrl = args.repo || '';

  const result = await createProject({
    slug,
    title,
    team_name: teamName,
    student_names: splitList(students),
    description,
    iframe_url: iframeUrl,
    source_url: sourceUrl,
    repo_url: repoUrl,
    stack: splitList(stack),
    category,
    grade,
    active: args.hidden ? false : true,
    featured: Boolean(args.featured),
    sort_order: Number(args.sort || 0),
  });

  console.log('\n등록 완료');
  console.log(`제목: ${result.project.title}`);
  console.log(`슬러그: ${result.project.slug}`);
  console.log('전시관: https://bmt-web-exhibition.netlify.app');
}

async function list() {
  const projects = await listProjects();
  if (!projects.length) {
    console.log('전시 중인 작품이 없습니다.');
    return;
  }

  for (const project of projects) {
    console.log(`${project.title} | ${project.team_name} | ${project.slug} | ${project.iframe_url}`);
  }
}

async function removeProject() {
  const id = args.id || await ask('삭제할 작품 id');
  await deleteProject({ id });
  console.log('삭제 완료');
}

function help() {
  console.log(`BMT WEB Exhibition CLI

Usage:
  bmt-exhibit add
  bmt-exhibit add --title "내 작품" --url https://example.com --team "1팀"
  bmt-exhibit list
  bmt-exhibit delete --id <project-id>

Local npm scripts:
  npm run add
  npm run list
`);
}

let rl;

try {
  if (command === 'add') {
    if (!scripted) rl = readline.createInterface({ input, output });
    await addProject();
  } else if (command === 'list') {
    await list();
  } else if (command === 'delete' || command === 'remove') {
    if (!args.id) rl = readline.createInterface({ input, output });
    await removeProject();
  } else {
    help();
  }
} catch (error) {
  console.error(`오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  process.exitCode = 1;
} finally {
  rl?.close();
}
