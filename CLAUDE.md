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
- `todos`: id, category_id(FK), title, description, due_date(필수), urgency, importance, is_completed, completed_at, created_at, updated_at
- `routines`: id, category_id(FK), title, description, repeat_type(daily/weekly/monthly), repeat_value, urgency, importance, created_at, updated_at
- `routine_completions`: id, routine_id(FK), completed_date(YYYY-MM-DD)
- `todo_completions`: id, todo_id(FK), completed_date(YYYY-MM-DD)

## 메뉴 구성 (하단 탭 3개)

### 1. 할 일
- 서브탭 4개: 오늘 / 할 일 / 미완료 / 완료
- **오늘**: 루틴(오늘 해당) + 기한==오늘인 할 일 필터 뷰
- **할 일**: 기한 >= 오늘인 단발 할 일 필터 뷰
- **미완료**: 기한 < 오늘이며 미완료인 항목
- **완료**: 완료된 항목 (날짜별 그룹)
- 모든 리스트 드래그 순서 변경 가능
- FAB 버튼 → 새 화면으로 등록
- 등록 입력값: 제목(필수), 상세 내용, 기한(필수, 기본값 오늘), 카테고리, 긴급도, 중요도
- Appbar 헤더 없음, react-native-tab-view 기반 탭

### 2. 기록
- 카테고리별 GitHub 잔디 스타일 UI (식물/잔디 명칭 사용 안 함)
- todo_completions 기반으로 날짜별 완료 이력 격자 시각화

### 3. 설정
- 카테고리 관리: 조회 / 생성 / 수정 / 삭제 / 드래그 순서 변경
- 루틴 관리: 조회 / 생성 / 수정 / 삭제 / 드래그 순서 변경
- 루틴 반복 주기: 매일 / 매주(요일 선택) / 매월(날짜 선택)

## Git 컨벤션

- 브랜치: `{형태}/issue-{번호}/{내용}` (예: `feature/issue-2/todo-screen`)
- 커밋: `{형태}: #{번호} {내용}` (예: `feat: #2 add todo list screen`)
- 형태: feature, chore, bugfix, refactor
