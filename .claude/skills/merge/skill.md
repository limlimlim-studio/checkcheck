---
name: merge
description: PR을 머지하고 브랜치 삭제 후 타겟 브랜치로 복귀 및 pull 처리. PR 번호 없으면 가장 오래된 PR, "all"이면 전체 머지.
tools: Bash
argument-hint: "[PR번호 | all]"
---

PR을 머지하고 브랜치를 정리한 뒤 타겟 브랜치로 복귀해.

## 실행 흐름

### 1. 머지 대상 결정

`$ARGUMENTS`에 따라:

- **PR 번호** (예: `101`): 해당 PR을 머지
- **`all`**: 열린 PR 전체를 생성 순서대로 순차 머지
- **비어있음**: 가장 오래된(번호 가장 작은) 열린 PR을 머지

대상 PR 목록 조회:
```bash
gh pr list --state open --json number,title,baseRefName,headRefName --jq 'sort_by(.number)'
```

PR이 없으면:
```
머지할 PR이 없습니다.
```
안내 후 중단.

### 2. 각 PR에 대해 순서대로 처리

각 PR마다:

**a. PR 정보 조회**
```bash
gh pr view {number} --json number,title,baseRefName,headRefName,state
```

**b. 머지 실행** (squash 머지)
```bash
gh pr merge {number} --squash --delete-branch
```
- `--delete-branch`: 원격 브랜치 자동 삭제
- 머지 실패 시 해당 PR 스킵하고 이유 출력 후 계속

**c. 로컬 브랜치 삭제** (존재하는 경우에만)
```bash
git branch -d {headRefName} 2>/dev/null || true
```

**d. 타겟 브랜치로 이동 및 pull**
```bash
git checkout {baseRefName}
git pull origin {baseRefName}
```

### 3. 결과 출력

각 PR마다:
```
✅ 머지: #{번호} {제목}
   브랜치 삭제: {headRefName}
   현재 브랜치: {baseRefName} (최신)
```

`all` 모드에서 여러 PR 처리 시:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
머지 완료 (3/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ #101 RootNavigator 기반 세팅
✅ #102 헤더 3-dot 메뉴 구현
✅ #103 Drawer 제거 및 정리

현재 브랜치: develop (최신)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 주의사항
- force merge, --force 옵션 절대 사용 안 함
- main/master 브랜치 직접 머지 금지 — PR을 통해서만 처리
- 머지 전 PR 상태(state)가 OPEN인지 확인
- 로컬 브랜치 삭제는 `-d`(안전 삭제)만 사용, `-D` 금지
