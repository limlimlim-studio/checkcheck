---
name: task
description: 플랜을 단계별 이슈로 분리 → 단계별 구현 → 사용자 검증 후 PR. /task init으로 시작, /task next로 다음 단계 진행.
tools: Bash, Read, Write, Glob, Edit
argument-hint: "[init | next | 단계번호 | status | done]"
---

## 역할
플랜 파일을 읽어 논리적 단계로 구분하고, 단계마다 GitHub 이슈 생성 → 브랜치 생성 → 구현 → 사용자 검증 대기 → PR 흐름으로 진행한다.
단계 상태는 `.claude/phase-map.json`에 저장해 대화가 끊겨도 이어서 진행할 수 있다.

---

## 실행 흐름

### `$ARGUMENTS`가 `init`이거나 비어있고 phase-map이 없을 때 → 초기화 모드

1. `.claude/plans/` 에서 가장 최근 수정된 플랜 파일을 찾아 읽어.

2. 플랜 내용을 분석해서 **논리적으로 독립 검증 가능한 3~5개 단계**로 그룹핑해:
   - 각 단계는 빌드/실행으로 검증 가능한 단위여야 함
   - 단계 제목은 한국어로 간결하게 (예: "기반 세팅", "광고 배너 구현", "인앱 구매 구현")
   - 각 단계에 포함되는 플랜 항목 명시

3. **메인 이슈 먼저 생성** (`gh issue create`):
   - 제목: 플랜 전체를 아우르는 기능 제목 (예: "내비게이션 구조 개편")
   - 본문: 배경/목적 + 전체 단계 목록 (체크리스트 형식)
   - `[Phase N] {제목}` 형식으로 각 서브 이슈를 예고
   - 생성된 이슈 번호를 `mainIssueNumber`로 저장

4. **각 단계별 서브 이슈 생성** (`gh issue create`):
   - 제목: `[Phase N] {단계 제목}` 형식
   - 본문 첫 줄: `Part of #{{mainIssueNumber}}` (메인 이슈 연결)
   - 본문: 해당 단계의 구현 항목 체크리스트
   - CLAUDE.md 프로젝트 컨벤션 준수

5. `.claude/phase-map.json`에 저장:
   ```json
   {
     "planFile": "{플랜 파일명}",
     "mainIssueNumber": {메인이슈번호},
     "phases": [
       {
         "number": 1,
         "title": "{단계 제목}",
         "issueNumber": {서브이슈번호},
         "branch": "feature/issue-{메인번호}/{kebab-title}",
         "status": "pending"
       }
     ]
   }
   ```
   - 브랜치명은 메인 이슈 번호 기준으로 생성 (`feature/issue-{mainIssueNumber}/...`)
   - 커밋 prefix도 메인 이슈 번호 기준 (`feat: #{mainIssueNumber}`)

6. 1단계 구현 시작 (아래 "단계 구현" 참고)

---

### `$ARGUMENTS`가 숫자, `next`, 또는 비어있고 phase-map이 있을 때 → 단계 구현 모드

1. `.claude/phase-map.json`을 읽어.
   - 인자가 숫자면 해당 단계 선택
   - 인자가 `next` 또는 없으면 현재 `in_progress` 단계를 `"done"`으로 먼저 업데이트 후, `status: "pending"`인 첫 번째 단계를 선택

2. 이전 단계가 `"done"` 또는 1단계면 진행. 아니면:
   ```
   이전 단계가 아직 완료되지 않았습니다.
   검증이 끝났으면 /apply 를 실행해 주세요.
   ```
   로 안내하고 중단.

3. **브랜치 생성**:
   ```
   git checkout develop && git pull origin develop
   git checkout -b {branch}
   ```

4. **해당 단계의 모든 구현 항목을 완료**해. 플랜 파일과 이슈 내용을 참고.

5. `.claude/phase-map.json`에서 해당 단계 `status`를 `"in_progress"`로 업데이트.

6. 구현 완료 후 아래 형식으로 출력:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Phase {N} 구현 완료: {단계 제목}
   브랜치: {branch}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   검증 항목:
   {이 단계에서 확인해야 할 항목들을 체크리스트로}

   검증이 완료되면:
   /apply

   PR 머지 후 다음 단계: /task next
   (마지막 단계라면 /task done)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

---

### `$ARGUMENTS`가 `all`일 때 → 자동 전체 완료 모드

모든 `pending` 단계가 없어질 때까지 아래 루프를 반복해:

1. `.claude/phase-map.json`을 읽어 다음 `pending` 단계를 찾아.
   - 없으면 루프 종료 → `done` 흐름으로 이동

2. 현재 `in_progress` 단계가 있으면 `"done"`으로 업데이트.

3. **브랜치 생성**:
   ```
   git checkout develop && git pull origin develop
   git checkout -b {branch}
   ```

4. **해당 단계의 모든 구현 항목을 완료**해. 플랜 파일과 이슈 내용을 참고.

5. `.claude/phase-map.json`에서 해당 단계 `status`를 `"in_progress"`로 업데이트.

6. **apply**: 변경 사항을 커밋 → 푸시 → PR 생성 (apply 스킬 로직과 동일하게 직접 실행):
   - `git add -A`
   - `git commit -m "feat: #{mainIssueNumber} {단계 제목}"`
   - `git push -u origin {branch}`
   - `gh pr create --base develop --title "#{subIssueNumber} {이슈 제목}" --body "..."`

7. **merge**: PR을 squash 머지하고 브랜치 삭제 후 develop으로 복귀 (merge 스킬 로직과 동일하게 직접 실행):
   - `gh pr merge {pr번호} --squash --delete-branch`
   - `git branch -d {branch} 2>/dev/null || true`
   - `git checkout develop && git pull origin develop`

8. 해당 단계 `status`를 `"done"`으로 업데이트.

9. 진행 상황 출력:
   ```
   ✅ Phase {N} 완료: {단계 제목}
      커밋: feat: #{mainIssueNumber} {단계 제목}
      PR: {PR URL} → merged
   ```

10. 1번으로 돌아가 반복.

루프 종료 후 `done` 흐름 실행.

---

### `$ARGUMENTS`가 `done`일 때

`.claude/phase-map.json`의 모든 단계 `status`를 확인하고 완료 요약 출력:
```
전체 구현 완료!

완료된 단계:
- Phase 1: {제목} → PR #{번호}
- Phase 2: {제목} → PR #{번호}
...

플랜 파일: {파일명}
```

---

### `$ARGUMENTS`가 `status`일 때

현재 phase-map 상태를 표로 출력:
```
Phase  제목                  이슈  브랜치              상태
1      기반 세팅              #49   feature/issue-49/…  ✅ done
2      광고 배너 구현         #50   feature/issue-50/…  🔄 in_progress
3      인앱 구매 구현         #51   feature/issue-51/…  ⏳ pending
```

---

## 단계 완료 처리
`/task next` 실행 시 자동으로 현재 `in_progress` 단계를 `"done"` 처리 후 다음 pending 단계 시작.

---

## Git/GitHub 컨벤션
- 브랜치: `feature/issue-{mainIssueNumber}/{kebab-case-title}` (메인 이슈 번호 기준)
- 커밋 prefix: `feat: #{mainIssueNumber}` (메인 이슈 번호 기준)
- PR 타겟: 항상 `develop`
- PR 본문에 서브 이슈 `Closes #{subIssueNumber}` 포함

## 이슈 구조 예시

```
메인 이슈 #100: 내비게이션 구조 개편
  ├── 서브 이슈 #101: [Phase 1] RootNavigator 기반 세팅  (Part of #100)
  ├── 서브 이슈 #102: [Phase 2] 3-dot 메뉴 구현          (Part of #100)
  └── 서브 이슈 #103: [Phase 3] Drawer 제거 및 정리      (Part of #100)

브랜치: feature/issue-100/navigation-restructure
커밋:   feat: #100 RootNavigator 기반 세팅
PR:     Closes #101
```
