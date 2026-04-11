---
name: commit-push
description: 제안된 커밋 메시지로 staged 변경사항을 커밋하고 원격에 푸시
tools: Bash
argument-hint: "[커밋 메시지]"
---

다음 순서로 커밋 후 푸시해:

1. `$ARGUMENTS` 를 커밋 메시지로 사용해.
   - 인자가 없으면 사용자에게 "커밋 메시지를 인자로 전달해 주세요. (예: /commit-push feat: #10 설정 화면 앱 정보 추가)" 라고 안내하고 중단해.

2. `git status` 와 `git diff HEAD` 로 현재 변경 사항을 확인해.
   - 변경 사항이 없으면 "커밋할 변경 사항이 없습니다." 라고 안내하고 중단해.

3. `git add -A` 로 모든 변경 사항을 스테이징해.

4. 아래 형식으로 커밋해 (HEREDOC 사용):
   ```
   git commit -m "$(cat <<'EOF'
   {커밋 메시지}

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   EOF
   )"
   ```

5. 현재 브랜치명을 확인하고 `git push -u origin {브랜치명}` 으로 푸시해.

6. 결과를 아래 형식으로 출력해:
   ```
   커밋: {커밋 메시지}
   브랜치: {브랜치명} → origin/{브랜치명}

   PR을 생성하려면 /pr 을 실행하세요.
   ```

주의사항:
- `--no-verify` 옵션은 절대 사용하지 않음
- force push 금지
