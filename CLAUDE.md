# checkcheck

카테고리 기반 할 일 관리 + 날짜별 완료 이력으로 반복 습관을 추적하는 앱

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| Framework | Expo SDK 54 (React Native 0.81, React 19) |
| 언어 | TypeScript (strict mode) |
| DB | expo-sqlite v16 + Drizzle ORM v0.45 |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand v5 |
| UI | React Native Paper v5 |

- New Architecture 활성화
- 데이터 흐름: Drizzle → TanStack Query (서버 상태) / Zustand (UI 상태만)

## 프로젝트 구조

```
src/
├── db/
│   ├── index.ts       # openDatabaseAsync + drizzle 인스턴스, initDb()
│   └── schema.ts      # Drizzle 스키마
├── hooks/             # TanStack Query 기반 CRUD 훅
├── screens/           # 화면 컴포넌트
├── stores/            # Zustand 스토어 (UI 상태)
└── types/             # 공통 타입
docs/
└── features.md        # 전체 기능 명세 상세
```

## DB 스키마

- `categories`: id, name, color, description, created_at
- `todos`: id, category_id(FK), title, description, due_date, urgency, importance, is_completed, completed_at, created_at, updated_at
- `todo_completions`: id, todo_id(FK), completed_date(YYYY-MM-DD)

> 현재 구현된 스키마에서 추가 필요: todos(due_date, urgency, importance), categories(description)

## 메뉴 구성 (하단 탭 3개)

### 1. 할일
- 미완료 / 완료 탭으로 구성
- FAB 버튼 → 바텀시트로 등록 (페이지 이동 아님)
- 등록 입력값: 제목(필수), 상세 내용, 기한, 카테고리, 시급도, 중요도
- 아이템 탭 → 바텀시트로 수정/삭제
- 완료 탭: 비우기(전체 삭제) + 개별 삭제

### 2. 기록
- 카테고리별 GitHub 잔디 스타일 UI (식물/잔디 명칭 사용 안 함)
- todo_completions 기반으로 날짜별 완료 이력 격자 시각화

### 3. 설정
- 카테고리 관리: 조회 / 생성 / 수정 / 삭제
- 카테고리 생성: 바텀시트 → 이름, 설명, 색상 입력
- 등록된 카테고리는 할일 등록 시 선택 가능

## Git 컨벤션

- 브랜치: `{형태}/issue-{번호}/{내용}` (예: `feature/issue-2/todo-screen`)
- 커밋: `{형태}: #{번호} {내용}` (예: `feat: #2 add todo list screen`)
- 형태: feature, chore, bugfix, refactor
