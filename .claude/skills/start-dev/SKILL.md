---
name: start-dev
description: 기능 설명 → 이슈 자동 정리 및 생성 → 브랜치 생성 → 개발 시작 워크플로우
tools: Bash, Glob
argument-hint: "[feature|bugfix|refactor|chore] [기능 설명]"
---

다음 워크플로우를 순서대로 실행해:

1. `$ARGUMENTS` 를 파싱해서 첫 번째 단어가 브랜치 형태(`feature`, `bugfix`, `refactor`, `chore`)이면 분리하고, 나머지 전체를 기능 설명으로 사용해.
   - 형태가 생략되면 `feature` 로 기본값 사용

2. 기능 설명을 바탕으로 GitHub 이슈 제목과 본문을 아래 규칙에 따라 직접 작성해:
   - **제목**: 간결하고 명확한 한국어 한 문장 (예: "완료된 할 일 일괄 삭제 기능 추가")
   - **본문** (마크다운):
     - `## 배경` — 왜 이 기능이 필요한지 1~2문장
     - `## 구현 내용` — 구체적인 작업 항목을 체크리스트(`- [ ]`)로 3~5개
     - `## 참고` — 관련 스크린/컴포넌트/DB 스키마 등 (해당 없으면 생략)
   - CLAUDE.md의 프로젝트 구조와 기술 스택을 참고해서 구현 내용을 현실적으로 구체화해

3. `gh issue create --title "..." --body "..."` 로 GitHub 이슈를 생성해.

4. 생성된 이슈 번호를 파싱해.

5. 이슈 제목을 영어 kebab-case로 변환해서 브랜치 이름에 사용해.
   `git checkout develop && git checkout -b {형태}/issue-{번호}/{kebab-case}` 로 브랜치 생성.

6. 최종 결과를 아래 형식으로 사용자에게 알려줘:
   ```
   이슈: #{번호} {이슈 제목}
   브랜치: {브랜치 이름}
   커밋 prefix: {형태매핑}: #{번호}
   ```

Git 컨벤션:
- 브랜치: `{형태}/issue-{번호}/{내용}` (예: `feature/issue-10/add-todo-screen`)
- 커밋: `{형태}: #{번호} {내용}` (예: `feat: #10 add todo list screen`)
- 형태 매핑: feature→feat, bugfix→fix, refactor→refactor, chore→chore
