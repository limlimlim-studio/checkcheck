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

3. 각 단계별로 GitHub 이슈를 순서대로 생성해 (`gh issue create`):
   - 제목: `[Phase N] {단계 제목}` 형식
   - 본문: 해당 단계의 구현 항목 체크리스트
   - CLAUDE.md 프로젝트 컨벤션 준수

4. `.claude/phase-map.json`에 저장:
   ```json
   {
     "planFile": "{플랜 파일명}",
     "phases": [
       {
         "number": 1,
         "title": "{단계 제목}",
         "issueNumber": {이슈번호},
         "branch": "feature/issue-{번호}/{kebab-title}",
         "status": "pending"
       }
     ]
   }
   ```

5. 1단계 구현 시작 (아래 "단계 구현" 참고)

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
- 브랜치: `feature/issue-{번호}/{kebab-case-title}`
- 커밋 prefix: `feat: #{번호}`
- PR 타겟: 항상 `develop`
- 이슈 제목에 `[Phase N]` 접두사 포함
