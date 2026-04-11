---
name: suggest-commit
description: 변경 사항을 분석해서 프로젝트 Git 컨벤션에 맞는 커밋 메시지를 제안
tools: Bash
argument-hint: ""
---

다음 순서로 커밋 메시지를 제안해:

1. 아래 명령어를 병렬 실행해서 현재 상태를 파악해:
   - `git status`
   - `git diff HEAD` (staged + unstaged 전체)
   - `git branch --show-current` (현재 브랜치명)
   - `git log --oneline -5` (최근 커밋 참고용)

2. 현재 브랜치명에서 이슈 번호와 형태를 추출해:
   - 브랜치 패턴: `{형태}/issue-{번호}/{내용}`
   - 형태 매핑: feature→feat, bugfix→fix, refactor→refactor, chore→chore
   - 브랜치가 패턴에 맞지 않으면 변경 내용 기반으로 형태를 추론해

3. 변경 사항을 분석해서 커밋 메시지 후보 3개를 제안해:
   - 형식: `{형태}: #{번호} {한국어 동사구}` (예: `feat: #10 할 일 목록 화면 추가`)
   - 한국어로, 간결하게, 무엇을 했는지 동사구로 작성
   - 이슈 번호가 없으면 번호 부분 생략
   - 가장 적절한 후보를 **추천**으로 표시

4. 결과를 아래 형식으로 출력해:
   ```
   커밋 메시지 제안

   1. `{메시지}` ← 추천
   2. `{메시지}`
   3. `{메시지}`

   적용하려면 /commit-push {메시지} 를 실행하세요.
   ```

Git 컨벤션:
- 커밋: `{형태}: #{번호} {내용}` (예: `feat: #10 add todo list screen`)
- 형태 매핑: feature→feat, bugfix→fix, refactor→refactor, chore→chore
- "할일" 아님, "할 일"로 띄어쓰기
