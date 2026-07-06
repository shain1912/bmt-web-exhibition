import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ExhibitionProject,
  ExhibitionProjectInput,
  hasSupabaseConfig,
  supabase,
  supabaseFunctionUrl,
} from './supabase';

type LoadState = 'loading' | 'ready' | 'fallback';
type AdminMessage = { type: 'idle' | 'success' | 'error'; text: string };
type ProjectForm = {
  id: string;
  slug: string;
  title: string;
  team_name: string;
  student_names: string;
  description: string;
  iframe_url: string;
  source_url: string;
  repo_url: string;
  thumbnail_url: string;
  stack: string;
  category: string;
  exhibition_year: string;
  grade: string;
  featured: boolean;
  active: boolean;
  sort_order: string;
};

const fallbackProjects: ExhibitionProject[] = [
  {
    id: 'demo-1',
    slug: 'cad-lab-archive',
    title: 'CAD Lab Archive',
    team_name: '정밀설계팀',
    student_names: ['WEB 동아리'],
    description: '기계 설계 실습 기록을 웹 포트폴리오 형태로 정리한 아카이브입니다.',
    iframe_url: 'https://example.com',
    source_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: null,
    stack: ['React', 'TypeScript', 'Supabase'],
    category: '포트폴리오',
    exhibition_year: 2026,
    grade: '2학년',
    featured: true,
    active: true,
    sort_order: 10,
  },
  {
    id: 'demo-2',
    slug: 'cnc-simulator-note',
    title: 'CNC Simulator Note',
    team_name: '가공연구팀',
    student_names: ['WEB 동아리'],
    description: 'CNC 가공 흐름과 G-code 학습 내용을 인터랙티브 노트로 보여주는 프로젝트입니다.',
    iframe_url: 'https://example.com',
    source_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: null,
    stack: ['Vite', 'Canvas', 'CSS'],
    category: '학습도구',
    exhibition_year: 2026,
    grade: '1학년',
    featured: false,
    active: true,
    sort_order: 20,
  },
  {
    id: 'demo-3',
    slug: 'school-club-studio',
    title: 'School Club Studio',
    team_name: '전시기획팀',
    student_names: ['WEB 동아리'],
    description: '동아리 활동과 결과물을 모던한 전시관 형태로 큐레이션한 웹사이트입니다.',
    iframe_url: 'https://example.com',
    source_url: 'https://example.com',
    repo_url: 'https://github.com',
    thumbnail_url: null,
    stack: ['HTML', 'CSS', 'JavaScript'],
    category: '전시',
    exhibition_year: 2026,
    grade: '공동',
    featured: true,
    active: true,
    sort_order: 30,
  },
];

const emptyForm: ProjectForm = {
  id: '',
  slug: '',
  title: '',
  team_name: '',
  student_names: '',
  description: '',
  iframe_url: 'https://',
  source_url: '',
  repo_url: '',
  thumbnail_url: '',
  stack: '',
  category: '웹 프로젝트',
  exhibition_year: String(new Date().getFullYear()),
  grade: '',
  featured: false,
  active: true,
  sort_order: '0',
};

function listToText(value: string[]) {
  return value.join(', ');
}

function textToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function projectToForm(project: ExhibitionProject): ProjectForm {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    team_name: project.team_name,
    student_names: listToText(project.student_names),
    description: project.description,
    iframe_url: project.iframe_url,
    source_url: project.source_url ?? '',
    repo_url: project.repo_url ?? '',
    thumbnail_url: project.thumbnail_url ?? '',
    stack: listToText(project.stack),
    category: project.category,
    exhibition_year: String(project.exhibition_year),
    grade: project.grade ?? '',
    featured: project.featured,
    active: project.active,
    sort_order: String(project.sort_order),
  };
}

function formToProject(form: ProjectForm): ExhibitionProjectInput {
  return {
    id: form.id || undefined,
    slug: form.slug.trim().toLowerCase(),
    title: form.title.trim(),
    team_name: form.team_name.trim(),
    student_names: textToList(form.student_names),
    description: form.description.trim(),
    iframe_url: form.iframe_url.trim(),
    source_url: form.source_url.trim() || null,
    repo_url: form.repo_url.trim() || null,
    thumbnail_url: form.thumbnail_url.trim() || null,
    stack: textToList(form.stack),
    category: form.category.trim() || '웹 프로젝트',
    exhibition_year: Number(form.exhibition_year) || new Date().getFullYear(),
    grade: form.grade.trim() || null,
    featured: form.featured,
    active: form.active,
    sort_order: Number(form.sort_order) || 0,
  };
}

function App() {
  const [projects, setProjects] = useState<ExhibitionProject[]>(fallbackProjects);
  const [selectedSlug, setSelectedSlug] = useState(fallbackProjects[0].slug);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState<ProjectForm>(() => projectToForm(fallbackProjects[0]));
  const [adminMessage, setAdminMessage] = useState<AdminMessage>({ type: 'idle', text: '작품을 선택하거나 새 작품을 등록하세요.' });
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    if (!hasSupabaseConfig || !supabase) {
      setLoadState('fallback');
      return fallbackProjects;
    }

    const { data, error } = await supabase
      .from('web_exhibition_projects')
      .select('*')
      .eq('active', true)
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error || !data?.length) {
      setLoadState('fallback');
      setProjects(fallbackProjects);
      return fallbackProjects;
    }

    setProjects(data);
    setLoadState('ready');
    return data;
  }

  useEffect(() => {
    let ignore = false;

    async function initProjects() {
      const nextProjects = await loadProjects();
      if (ignore) return;
      setSelectedSlug(nextProjects[0].slug);
      setForm(projectToForm(nextProjects[0]));
    }

    initProjects();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = useMemo(
    () => ['전체', ...Array.from(new Set(projects.map((project) => project.category)))],
    [projects],
  );

  const visibleProjects = useMemo(() => {
    if (activeCategory === '전체') return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory, projects]);

  const selectedProject =
    visibleProjects.find((project) => project.slug === selectedSlug) ?? visibleProjects[0] ?? projects[0];

  function selectProject(project: ExhibitionProject) {
    setSelectedSlug(project.slug);
    setForm(projectToForm(project));
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
    const nextProject = category === '전체'
      ? projects[0]
      : projects.find((project) => project.category === category);
    if (nextProject) selectProject(nextProject);
  }

  function updateForm(field: keyof ProjectForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function callAdmin(action: 'create' | 'update' | 'delete', project?: ExhibitionProjectInput) {
    if (!supabaseFunctionUrl) throw new Error('Supabase 함수 URL이 설정되지 않았습니다.');

    const response = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action, project, id: project?.id }),
    });

    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? '요청에 실패했습니다.');
    return body;
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setAdminMessage({ type: 'idle', text: '저장 중입니다.' });

    try {
      const project = formToProject(form);
      const action = project.id ? 'update' : 'create';
      await callAdmin(action, project);
      const nextProjects = await loadProjects();
      const nextProject = nextProjects.find((item) => item.slug === project.slug) ?? nextProjects[0];
      selectProject(nextProject);
      setAdminMessage({ type: 'success', text: action === 'create' ? '작품을 등록했습니다.' : '작품을 수정했습니다.' });
    } catch (error) {
      setAdminMessage({ type: 'error', text: error instanceof Error ? error.message : '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!form.id) {
      setAdminMessage({ type: 'error', text: '먼저 삭제할 작품을 선택하세요.' });
      return;
    }

    if (!window.confirm(`'${form.title}' 작품을 삭제할까요?`)) return;

    setSaving(true);
    setAdminMessage({ type: 'idle', text: '삭제 중입니다.' });

    try {
      await callAdmin('delete', formToProject(form));
      const nextProjects = await loadProjects();
      const nextProject = nextProjects[0];
      if (nextProject) selectProject(nextProject);
      setAdminMessage({ type: 'success', text: '작품을 삭제했습니다.' });
    } catch (error) {
      setAdminMessage({ type: 'error', text: error instanceof Error ? error.message : '삭제에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Busan Mechanical Technical High School</p>
          <h1 id="page-title">WEB동아리 웹 전시실</h1>
          <p className="hero-lede">
            부산기계공업고등학교 학생들이 만든 웹사이트를 하나의 제도실처럼 펼쳐
            바로 관람할 수 있는 IFRAME 기반 온라인 전시관입니다.
          </p>
        </div>
        <div className="hero-card" aria-label="전시 요약">
          <span className="gauge-label">Live collection</span>
          <strong>{projects.length.toString().padStart(2, '0')}</strong>
          <span>작품 전시 중</span>
        </div>
      </section>

      <section className="exhibition-grid" aria-label="웹 프로젝트 전시">
        <aside className="project-panel">
          <div className="panel-heading">
            <p className="eyebrow">Index board</p>
            <h2>작품 선택</h2>
          </div>

          <div className="category-tabs" aria-label="카테고리 필터">
            {categories.map((category) => (
              <button
                className={category === activeCategory ? 'tab active' : 'tab'}
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="project-list">
            {visibleProjects.map((project) => (
              <button
                className={project.slug === selectedProject.slug ? 'project-card active' : 'project-card'}
                key={project.id}
                type="button"
                onClick={() => selectProject(project)}
              >
                <span className="project-kicker">
                  {project.exhibition_year} · {project.grade ?? 'WEB'}
                </span>
                <strong>{project.title}</strong>
                <span>{project.team_name}</span>
              </button>
            ))}
          </div>

          <p className="data-state">
            {loadState === 'ready'
              ? 'Supabase에서 전시 데이터를 불러왔습니다.'
              : loadState === 'fallback'
                ? 'DB 연결 실패 시 예시 데이터로 표시됩니다.'
                : '전시 데이터를 불러오는 중입니다.'}
          </p>
        </aside>

        <section className="stage" aria-label={`${selectedProject.title} 미리보기`}>
          <div className="stage-toolbar">
            <div>
              <p className="eyebrow">Now viewing</p>
              <h2>{selectedProject.title}</h2>
            </div>
            <div className="stage-actions">
              {selectedProject.source_url && (
                <a href={selectedProject.source_url} target="_blank" rel="noreferrer">
                  새 창으로 보기
                </a>
              )}
              {selectedProject.repo_url && (
                <a href={selectedProject.repo_url} target="_blank" rel="noreferrer">
                  코드 보기
                </a>
              )}
            </div>
          </div>

          <div className="iframe-frame">
            <div className="iframe-ruler" aria-hidden="true">
              <span>0</span>
              <span>320</span>
              <span>768</span>
              <span>1440</span>
            </div>
            <iframe
              key={selectedProject.slug}
              title={`${selectedProject.title} 웹사이트 미리보기`}
              src={selectedProject.iframe_url}
              loading="lazy"
              sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          </div>

          <div className="project-detail">
            <div>
              <p className="eyebrow">Project note</p>
              <p>{selectedProject.description}</p>
            </div>
            <dl>
              <div>
                <dt>팀</dt>
                <dd>{selectedProject.team_name}</dd>
              </div>
              <div>
                <dt>참여</dt>
                <dd>{selectedProject.student_names.join(', ')}</dd>
              </div>
              <div>
                <dt>기술</dt>
                <dd>{selectedProject.stack.join(' / ') || '웹'}</dd>
              </div>
            </dl>
          </div>
        </section>
      </section>

      <section className="admin-board" aria-labelledby="admin-title">
        <div className="admin-intro">
          <p className="eyebrow">Shared curator mode</p>
          <h2 id="admin-title">작품 관리</h2>
          <p>
            비밀번호를 아는 동아리 구성원은 별도 로그인 없이 작품을 올리고, 고치고, 지울 수 있습니다.
          </p>
        </div>

        <form className="admin-form" onSubmit={saveProject}>
          <label className="field span-2">
            <span>관리 비밀번호</span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="공유 비밀번호 입력"
            />
          </label>

          <div className="admin-tools span-2">
            <button type="button" onClick={() => setForm(emptyForm)}>
              새 작품 작성
            </button>
            <button type="button" disabled={!form.id || saving} onClick={deleteProject}>
              선택 작품 삭제
            </button>
          </div>

          <label className="field">
            <span>제목</span>
            <input required value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
          </label>
          <label className="field">
            <span>슬러그</span>
            <input required value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} placeholder="my-project" />
          </label>
          <label className="field">
            <span>팀명</span>
            <input required value={form.team_name} onChange={(event) => updateForm('team_name', event.target.value)} />
          </label>
          <label className="field">
            <span>참여자</span>
            <input value={form.student_names} onChange={(event) => updateForm('student_names', event.target.value)} placeholder="홍길동, 김부산" />
          </label>
          <label className="field span-2">
            <span>설명</span>
            <textarea required value={form.description} onChange={(event) => updateForm('description', event.target.value)} rows={4} />
          </label>
          <label className="field span-2">
            <span>IFRAME URL</span>
            <input required type="url" value={form.iframe_url} onChange={(event) => updateForm('iframe_url', event.target.value)} />
          </label>
          <label className="field">
            <span>새 창 URL</span>
            <input type="url" value={form.source_url} onChange={(event) => updateForm('source_url', event.target.value)} />
          </label>
          <label className="field">
            <span>GitHub URL</span>
            <input type="url" value={form.repo_url} onChange={(event) => updateForm('repo_url', event.target.value)} />
          </label>
          <label className="field">
            <span>기술 스택</span>
            <input value={form.stack} onChange={(event) => updateForm('stack', event.target.value)} placeholder="React, Supabase" />
          </label>
          <label className="field">
            <span>카테고리</span>
            <input value={form.category} onChange={(event) => updateForm('category', event.target.value)} />
          </label>
          <label className="field">
            <span>전시 연도</span>
            <input type="number" value={form.exhibition_year} onChange={(event) => updateForm('exhibition_year', event.target.value)} />
          </label>
          <label className="field">
            <span>학년/구분</span>
            <input value={form.grade} onChange={(event) => updateForm('grade', event.target.value)} />
          </label>
          <label className="field">
            <span>정렬</span>
            <input type="number" value={form.sort_order} onChange={(event) => updateForm('sort_order', event.target.value)} />
          </label>
          <label className="field">
            <span>썸네일 URL</span>
            <input type="url" value={form.thumbnail_url} onChange={(event) => updateForm('thumbnail_url', event.target.value)} />
          </label>

          <div className="check-row span-2">
            <label>
              <input type="checkbox" checked={form.featured} onChange={(event) => updateForm('featured', event.target.checked)} />
              대표 작품으로 올리기
            </label>
            <label>
              <input type="checkbox" checked={form.active} onChange={(event) => updateForm('active', event.target.checked)} />
              전시 공개
            </label>
          </div>

          <div className="admin-submit span-2">
            <p className={`admin-message ${adminMessage.type}`}>{adminMessage.text}</p>
            <button type="submit" disabled={saving}>
              {saving ? '처리 중...' : form.id ? '작품 수정' : '작품 등록'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default App;
