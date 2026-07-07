# BMT WEB Exhibition

부산기계공업고등학교 WEB동아리 웹사이트를 iframe으로 전시하는 React/Vite 사이트입니다.

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
