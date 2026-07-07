# BMT WEB Exhibition

부산기계공업고등학교 WEB동아리 웹사이트를 iframe으로 전시하는 React/Vite 사이트입니다.

## AI Quick Start

다른 AI가 이 서비스를 써서 작품을 바로 올려야 하면 이 명령을 사용하면 됩니다.

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- add
```

한 줄 등록:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- add --title "내 작품" --url https://example.com --team "1팀"
```

목록 보기:

```bash
npm exec --yes github:shain1912/bmt-web-exhibition -- list
```

AI/자동화 작업자는 `AGENTS.md`를 먼저 읽으면 됩니다.

## Run

```bash
npm install
npm run dev
```

## Validate

```bash
npm run build
npm run e2e
```

## Easy CLI

학생들은 MCP를 몰라도 CLI로 바로 작품을 올릴 수 있습니다.

### 가장 쉬운 방법

```bash
git clone https://github.com/shain1912/bmt-web-exhibition.git
cd bmt-web-exhibition
npm install
npm run add
```

질문에 답하면 자동으로 전시관에 등록됩니다.

### 한 줄 등록

```bash
npm run add -- --title "내 작품" --url https://example.com --team "1팀"
```

### 전역 설치

```bash
npm install -g github:shain1912/bmt-web-exhibition
bmt-exhibit add
```

### 목록 보기

```bash
npm run list
```

또는 전역 설치 후:

```bash
bmt-exhibit list
```

## Iframe Compatibility

전시관은 iframe으로 사이트를 보여주지만, 모든 사이트가 iframe 표시를 허용하는 것은 아닙니다.

iframe이 비어 보이는 흔한 원인:

- 대상 사이트가 `X-Frame-Options: DENY` 또는 `SAMEORIGIN`을 보냄
- 대상 사이트의 CSP에 `frame-ancestors 'none'` 또는 제한된 도메인이 있음
- 로그인/쿠키/브라우저 저장소가 필요한 앱이 sandbox 환경에서 깨짐

이 경우 전시관의 `새 창으로 보기`는 정상 동작합니다. iframe 안에서도 보여야 하는 학생 작품은 배포 사이트에서 iframe 차단 헤더를 제거해야 합니다.

Netlify 학생 사이트에서 iframe 허용이 필요하면 보통 별도 `X-Frame-Options`를 넣지 말고, CSP를 쓰는 경우 `frame-ancestors https://bmt-web-exhibition.netlify.app`를 허용해야 합니다.

## Exhibition MCP

이 repo에는 작품 등록을 쉽게 하기 위한 로컬 MCP 서버가 포함되어 있습니다.

```bash
npm run mcp:exhibition
```

제공 도구:

- `list_projects`: 전시 작품 목록 조회
- `create_project`: 새 작품 등록
- `update_project`: 기존 작품 수정
- `delete_project`: 작품 삭제

스모크 테스트:

```bash
npm run mcp:smoke
```

## Backend

별도 백엔드 서버는 필요하지 않습니다. 현재 구조에서는 Supabase가 DB이고, Supabase Edge Function `web-exhibition-admin`이 쓰기 API 역할을 합니다. MCP 서버는 백엔드가 아니라 로컬 자동화 클라이언트이며, Edge Function을 호출해 작품을 등록합니다.

보안상 완전 공개 등록/수정/삭제가 부담되면 비밀번호, Supabase Auth, Turnstile 같은 보호 장치를 Edge Function에 다시 추가해야 합니다.
