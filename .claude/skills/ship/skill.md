---
name: ship
description: 변경 사항 분석 → 커밋 메시지 자동 선택 → 커밋 → 푸시 → PR 생성까지 한 번에 처리
tools: Bash
---

변경 사항을 분석해서 커밋 메시지를 자동으로 선택한 뒤, 커밋 → 푸시 → PR 생성까지 한 번에 처리해.

1. 아래 명령어를 병렬 실행해서 현재 상태를 파악해:
   - `git status`
   - `git diff HEAD`
   - `git branch --show-current`
   - `git log --oneline -5`

2. 브랜치명에서 이슈 번호를 추출해 (패턴: `{형태}/issue-{번호}/{내용}`):
   - 번호가 있으면 `gh issue view {번호}` 로 이슈 제목과 본문을 가져와.
   - 형태 매핑: feature→feat, bugfix→fix, refactor→refactor, chore→chore

3. 변경 사항을 분석해서 **가장 적절한 커밋 메시지 1개를 자동 선택**해:
   - 형식: `{형태}: #{번호} {한국어 동사구}` (예: `feat: #10 Drawer 내비게이션 구조 추가`)
   - 변경 사항이 없으면 "커밋할 변경 사항이 없습니다." 안내 후 중단

4. `git add -A` 로 모든 변경 사항을 스테이징해.

5. 아래 형식으로 커밋해 (HEREDOC 사용):
   ```
   git commit -m "$(cat <<'EOF'
   {커밋 메시지}

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

6. `git push -u origin {브랜치명}` 으로 푸시해.

7. PR 본문을 작성하고 `gh pr create --base develop --title "..." --body "..."` 로 PR을 생성해 (HEREDOC 사용):
   - 제목: `#{이슈번호} {이슈 제목}` (이슈 없으면 커밋 메시지 기반 한국어 제목)
   - 본문 형식:
     ```
     ## 이슈
     Closes #{이슈번호}

     ## 변경 사항
     - ...

     ## 테스트
     - [ ] ...
     ```
   - 이슈가 없으면 `## 이슈` 섹션 생략

8. 결과를 아래 형식으로 출력해:
   ```
   ✅ 커밋: {커밋 메시지}
   ✅ 푸시: {브랜치명} → origin/{브랜치명}
   ✅ PR: {PR URL}

   타겟: {브랜치명} → develop
   ```

주의사항:
- `--no-verify` 옵션 절대 사용 안 함
- force push 금지
- PR 제목은 반드시 `#{이슈번호}`로 시작 (이슈 있을 때)
- 타겟 브랜치는 항상 `develop`
