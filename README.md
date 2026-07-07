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
