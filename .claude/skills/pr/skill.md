---
name: pr
description: 현재 브랜치에서 develop 브랜치로 PR 생성
tools: Bash
argument-hint: ""
---

다음 순서로 PR을 생성해:

1. 아래 명령어를 병렬 실행해서 현재 상태를 파악해:
   - `git branch --show-current` (현재 브랜치명)
   - `git log develop..HEAD --oneline` (develop 이후 커밋 목록)
   - `git diff develop...HEAD --stat` (변경된 파일 목록)

2. 현재 브랜치명에서 이슈 번호와 형태를 추출해:
   - 브랜치 패턴: `{형태}/issue-{번호}/{내용}`
   - 이슈 번호를 찾으면 `gh issue view {번호}` 로 이슈 제목과 본문을 가져와.

3. PR 제목과 본문을 작성해:
   - **제목**: `#{이슈번호} {이슈 제목}` (이슈 없으면 커밋 내역 기반으로 한국어 제목 작성)
   - **본문** (마크다운):
     - `## 변경 사항` — 변경된 내용을 불릿으로 간결하게 정리
     - `## 테스트` — 확인해야 할 항목 체크리스트 (`- [ ]`)
     - `Closes #{이슈번호}` — 이슈 자동 닫기 (이슈가 있을 때만)

4. 원격에 아직 푸시되지 않은 경우 `git push -u origin {브랜치명}` 먼저 실행해.

5. `gh pr create --base develop --title "..." --body "..."` 로 PR을 생성해.
   - HEREDOC을 사용해서 본문 포맷이 깨지지 않게 해.

6. 결과를 아래 형식으로 출력해:
   ```
   PR 생성 완료

   #{이슈번호} {PR 제목}
   {PR URL}

   타겟: {브랜치명} → develop
   ```

주의사항:
- 타겟 브랜치는 항상 `develop`
- force push 금지
- PR 제목에 이슈 번호 반드시 포함
