import dayjs from 'dayjs';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, todos, routines, todoCompletions, routineCompletions } from '../db/schema';

function dateKey(d: dayjs.Dayjs) {
  return d.format('YYYY-MM-DD');
}

function ts(d: dayjs.Dayjs) {
  return d.valueOf();
}

// 과거 N일간 루틴 완료 기록 생성 (rate: 0~1 완료 확률, skipWeekend: 주말 제외)
function makeRoutineCompletions(
  routineId: number,
  days: number,
  rate: number,
  skipWeekend = false,
): { routineId: number; completedDate: string }[] {
  const records = [];
  const seed = routineId * 7919;
  for (let i = days; i >= 1; i--) {
    const d = dayjs().subtract(i, 'day');
    if (skipWeekend && (d.day() === 0 || d.day() === 6)) continue;
    const pseudo = Math.abs(Math.sin(seed + i * 13)) ;
    if (pseudo < rate) {
      records.push({ routineId, completedDate: dateKey(d) });
    }
  }
  return records;
}

// 특정 요일만 완료 기록 생성 (weekly 루틴용)
function makeWeeklyRoutineCompletions(
  routineId: number,
  days: number,
  weekdays: number[], // 0=일, 1=월, ...
  rate: number,
): { routineId: number; completedDate: string }[] {
  const records = [];
  const seed = routineId * 6271;
  for (let i = days; i >= 1; i--) {
    const d = dayjs().subtract(i, 'day');
    if (!weekdays.includes(d.day())) continue;
    const pseudo = Math.abs(Math.sin(seed + i * 17));
    if (pseudo < rate) {
      records.push({ routineId, completedDate: dateKey(d) });
    }
  }
  return records;
}

export async function seedDemoData() {
  // 이미 할 일이 있으면 스킵
  const existingTodos = db.select().from(todos).where(eq(todos.isDeleted, 0)).all();
  if (existingTodos.length > 0) return { skipped: true };

  const now = Date.now();
  const today = dayjs().startOf('day');

  // ── 카테고리 조회 ──────────────────────────────────────────────────
  const allCats = db.select().from(categories).all();
  const catMap: Record<string, number> = {};
  for (const c of allCats) catMap[c.name] = c.id;

  // 없으면 기본값으로 미분류 사용
  const catWork    = catMap['업무']  ?? catMap['미분류'] ?? 1;
  const catPersonal = catMap['개인'] ?? catMap['미분류'] ?? 1;
  const catHealth  = catMap['운동']  ?? catMap['미분류'] ?? 1;
  const catLearn   = catMap['학습']  ?? catMap['미분류'] ?? 1;
  const catShop    = catMap['쇼핑']  ?? catMap['미분류'] ?? 1;

  // ── 루틴 삽입 ──────────────────────────────────────────────────────
  const routineInserts = [
    // 운동/건강
    { categoryId: catHealth, title: '아침 스트레칭 10분',       description: '기상 후 전신 스트레칭으로 하루 시작', repeatType: 'daily',   repeatValue: null, alarmTime: 7 * 60,       urgency: 1, importance: 3, sortOrder: 1, isActive: 1, createdAt: now - 86400000 * 90, updatedAt: now },
    { categoryId: catHealth, title: '물 2L 이상 마시기',         description: '하루 권장 수분 섭취량 달성',           repeatType: 'daily',   repeatValue: null, alarmTime: null,         urgency: 1, importance: 2, sortOrder: 2, isActive: 1, createdAt: now - 86400000 * 60, updatedAt: now },
    { categoryId: catHealth, title: '러닝 또는 걷기 30분',       description: '유산소 운동으로 체력 유지',             repeatType: 'weekly',  repeatValue: '1,3,5', alarmTime: 19 * 60,   urgency: 2, importance: 4, sortOrder: 3, isActive: 1, createdAt: now - 86400000 * 80, updatedAt: now },
    // 업무
    { categoryId: catWork,   title: '오늘 업무 일정 확인',       description: '슬랙·이메일·캘린더 체크',              repeatType: 'daily',   repeatValue: null, alarmTime: 9 * 60,       urgency: 2, importance: 3, sortOrder: 1, isActive: 1, createdAt: now - 86400000 * 70, updatedAt: now },
    { categoryId: catWork,   title: '주간 목표 점검',            description: '월요일 아침 이번 주 목표 리마인드',     repeatType: 'weekly',  repeatValue: '1',   alarmTime: 9 * 60 + 30, urgency: 2, importance: 4, sortOrder: 2, isActive: 1, createdAt: now - 86400000 * 50, updatedAt: now },
    // 개인
    { categoryId: catPersonal, title: '하루 일기 쓰기',          description: '오늘 있었던 일 & 감사한 것 3가지',      repeatType: 'daily',   repeatValue: null, alarmTime: 22 * 60 + 30, urgency: 1, importance: 3, sortOrder: 1, isActive: 1, createdAt: now - 86400000 * 100, updatedAt: now },
    { categoryId: catPersonal, title: '독서 20분',               description: '취침 전 독서로 집중력 향상',            repeatType: 'daily',   repeatValue: null, alarmTime: 23 * 60,      urgency: 1, importance: 2, sortOrder: 2, isActive: 1, createdAt: now - 86400000 * 90, updatedAt: now },
    // 학습
    { categoryId: catLearn,  title: '영어 단어 암기 20개',        description: 'Anki 덱 복습 + 신규 단어',            repeatType: 'daily',   repeatValue: null, alarmTime: 8 * 60 + 30,  urgency: 1, importance: 3, sortOrder: 1, isActive: 1, createdAt: now - 86400000 * 60, updatedAt: now },
    { categoryId: catLearn,  title: '개발 공부 1시간 이상',       description: '사이드 프로젝트 or 강의 수강',          repeatType: 'daily',   repeatValue: null, alarmTime: null,         urgency: 1, importance: 4, sortOrder: 2, isActive: 1, createdAt: now - 86400000 * 45, updatedAt: now },
    // 쇼핑/집안일
    { categoryId: catShop,   title: '주간 장보기 리스트 작성',    description: '냉장고 확인 후 필요한 것 정리',          repeatType: 'weekly',  repeatValue: '0',   alarmTime: 10 * 60,      urgency: 1, importance: 2, sortOrder: 1, isActive: 1, createdAt: now - 86400000 * 30, updatedAt: now },
  ];

  const insertedRoutines: { id: number; repeatType: string; repeatValue: string | null; sortOrder: number }[] = [];
  for (const r of routineInserts) {
    const result = db.insert(routines).values(r).returning({ id: routines.id, repeatType: routines.repeatType, repeatValue: routines.repeatValue, sortOrder: routines.sortOrder }).get();
    if (result) insertedRoutines.push(result);
  }

  // ── 루틴 완료 이력 (90일) ──────────────────────────────────────────
  const allRoutineCompletions: { routineId: number; completedDate: string }[] = [];

  for (const r of insertedRoutines) {
    if (r.repeatType === 'daily') {
      // 아침 스트레칭: 꾸준 (85%)
      // 물 마시기: 비교적 꾸준 (80%)
      // 일기: 변동 (70%)
      // 독서: 들쑥날쑥 (60%)
      const rateByOrder: Record<number, number> = { 1: 0.85, 2: 0.80, 3: 0.70, 4: 0.65 };
      const rate = rateByOrder[r.sortOrder] ?? 0.72;
      allRoutineCompletions.push(...makeRoutineCompletions(r.id, 90, rate));
    } else if (r.repeatType === 'weekly') {
      const days = (r.repeatValue ?? '').split(',').map(Number);
      allRoutineCompletions.push(...makeWeeklyRoutineCompletions(r.id, 90, days, 0.78));
    }
  }

  if (allRoutineCompletions.length > 0) {
    db.insert(routineCompletions).values(allRoutineCompletions).run();
  }

  // ── 할 일 삽입 ─────────────────────────────────────────────────────
  // helper
  const dueTs = (offsetDays: number) => ts(today.add(offsetDays, 'day'));

  const todoData = [
    // ─ 오늘 ─
    { categoryId: catWork,     title: '분기 보고서 초안 작성',      description: '2분기 실적 취합 및 요약 정리',         dueDate: dueTs(0),   urgency: 3, importance: 4, isCompleted: 0, sortOrder: 1 },
    { categoryId: catWork,     title: '팀 미팅 사전 자료 검토',      description: '오후 3시 주간 회의 전 아젠다 확인',     dueDate: dueTs(0),   urgency: 3, importance: 3, isCompleted: 0, sortOrder: 2 },
    { categoryId: catPersonal, title: '부모님께 안부 전화',          description: '이번 주 안으로 꼭',                    dueDate: dueTs(0),   urgency: 1, importance: 4, isCompleted: 0, sortOrder: 1 },
    { categoryId: catHealth,   title: '정형외과 예약 전화',          description: '무릎 통증 관련 진료 예약',              dueDate: dueTs(0),   urgency: 2, importance: 3, isCompleted: 0, sortOrder: 1 },
    { categoryId: catLearn,    title: 'TypeScript 제네릭 정리',      description: '공식 문서 읽고 예제 코드 작성',          dueDate: dueTs(0),   urgency: 1, importance: 3, isCompleted: 0, sortOrder: 1 },
    { categoryId: catShop,     title: '세제 & 섬유유연제 구매',      description: '쿠팡 로켓배송',                        dueDate: dueTs(0),   urgency: 1, importance: 2, isCompleted: 0, sortOrder: 1 },
    // ─ 내일 ~ 이번 주 ─
    { categoryId: catWork,     title: '클라이언트 미팅 준비',        description: 'A사 제안 발표 자료 최종 점검',           dueDate: dueTs(1),   urgency: 4, importance: 4, isCompleted: 0, sortOrder: 3 },
    { categoryId: catPersonal, title: '친구 생일 선물 주문',         description: '다음 주 파티 전에 미리 준비',            dueDate: dueTs(3),   urgency: 3, importance: 3, isCompleted: 0, sortOrder: 2 },
    { categoryId: catHealth,   title: '러닝화 교체',                description: '6개월 이상 사용, 밑창 마모',             dueDate: dueTs(4),   urgency: 1, importance: 2, isCompleted: 0, sortOrder: 2 },
    { categoryId: catLearn,    title: '알고리즘 스터디 발표 준비',   description: '그리디 알고리즘 예제 3문제 풀기',         dueDate: dueTs(5),   urgency: 2, importance: 3, isCompleted: 0, sortOrder: 2 },
    // ─ 다음 주 이후 ─
    { categoryId: catWork,     title: '상반기 KPI 점검 보고서',      description: '목표 달성률 분석 및 하반기 전략',         dueDate: dueTs(9),   urgency: 2, importance: 4, isCompleted: 0, sortOrder: 4 },
    { categoryId: catPersonal, title: '여행 숙소 예약',              description: '7월 제주 여행 2박 3일',                  dueDate: dueTs(12),  urgency: 1, importance: 3, isCompleted: 0, sortOrder: 3 },
    { categoryId: catLearn,    title: 'AWS Solutions Architect 시험 접수', description: '7월 시험 목표',               dueDate: dueTs(14),  urgency: 1, importance: 4, isCompleted: 0, sortOrder: 3 },
    { categoryId: catShop,     title: '여름 옷 정리 및 구매',        description: '작년 여름 옷 확인 후 필요한 것 구매',    dueDate: dueTs(18),  urgency: 1, importance: 1, isCompleted: 0, sortOrder: 2 },
    // ─ 미완료(연체) ─
    { categoryId: catWork,     title: '서버 배포 테스트 완료',       description: '스테이징 환경에서 전체 플로우 테스트',    dueDate: dueTs(-3),  urgency: 4, importance: 4, isCompleted: 0, sortOrder: 5 },
    { categoryId: catLearn,    title: "독서 노트 정리 - '원씽'",     description: '챕터 1~5 핵심 요약 정리',               dueDate: dueTs(-5),  urgency: 1, importance: 2, isCompleted: 0, sortOrder: 4 },
    { categoryId: catShop,     title: '화장실 곰팡이 제거',          description: '욕실 실리콘 교체 또는 곰팡이 스프레이',   dueDate: dueTs(-4),  urgency: 2, importance: 3, isCompleted: 0, sortOrder: 3 },
    { categoryId: catPersonal, title: '치과 정기 검진 예약',         description: '6개월마다 스케일링 필요',               dueDate: dueTs(-7),  urgency: 1, importance: 3, isCompleted: 0, sortOrder: 4 },
    // ─ 완료 ─
    { categoryId: catWork,     title: '4월 정산 마감',              description: '경비 정산 및 영수증 제출',               dueDate: dueTs(-4),  urgency: 3, importance: 4, isCompleted: 1, completedAt: ts(today.subtract(2, 'day')), sortOrder: 6 },
    { categoryId: catWork,     title: '신규 팀원 온보딩 자료 준비',  description: '입사 첫 주 가이드 문서 작성',             dueDate: dueTs(-7),  urgency: 2, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(5, 'day')), sortOrder: 7 },
    { categoryId: catPersonal, title: '자동차 보험 갱신',           description: '3월 만료 전 온라인 갱신 완료',            dueDate: dueTs(-9),  urgency: 3, importance: 4, isCompleted: 1, completedAt: ts(today.subtract(7, 'day')), sortOrder: 5 },
    { categoryId: catHealth,   title: '혈액 검사 결과 확인',         description: '건강검진 결과 리포트 수령',              dueDate: dueTs(-4),  urgency: 2, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(3, 'day')), sortOrder: 3 },
    { categoryId: catLearn,    title: 'JavaScript 디자인 패턴 강의 완강', description: '패턴 15가지 모두 학습',            dueDate: dueTs(-12), urgency: 1, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(10, 'day')), sortOrder: 5 },
    { categoryId: catShop,     title: '세탁기 고무 패킹 교체',       description: '누수 방지, AS 기사 방문 예약',            dueDate: dueTs(-5),  urgency: 3, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(4, 'day')), sortOrder: 4 },
    { categoryId: catPersonal, title: '여권 갱신 신청',              description: '만료 6개월 전 재발급',                  dueDate: dueTs(-16), urgency: 2, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(14, 'day')), sortOrder: 6 },
    { categoryId: catWork,     title: '코드 리뷰 - 결제 모듈',       description: 'PR #342 리뷰 코멘트 반영 확인',          dueDate: dueTs(-2),  urgency: 3, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(1, 'day')), sortOrder: 8 },
    { categoryId: catHealth,   title: '헬스장 등록',                description: '3개월 회원권 등록',                     dueDate: dueTs(-20), urgency: 1, importance: 3, isCompleted: 1, completedAt: ts(today.subtract(18, 'day')), sortOrder: 4 },
  ];

  const insertedTodoIds: { id: number; isCompleted: number; completedAt: number | null | undefined }[] = [];
  for (const todo of todoData) {
    const result = db.insert(todos).values({
      ...todo,
      completedAt: todo.completedAt ?? null,
      description: todo.description ?? null,
      isDeleted: 0,
      createdAt: now - Math.floor(Math.random() * 86400000 * 30),
      updatedAt: now,
    }).returning({ id: todos.id, isCompleted: todos.isCompleted, completedAt: todos.completedAt }).get();
    if (result) insertedTodoIds.push(result);
  }

  // ── 완료 할 일의 todo_completions 기록 ────────────────────────────
  const todoCompletionInserts: { todoId: number; completedDate: string }[] = [];
  for (const t of insertedTodoIds) {
    if (t.isCompleted === 1 && t.completedAt) {
      todoCompletionInserts.push({
        todoId: t.id,
        completedDate: dateKey(dayjs(t.completedAt)),
      });
    }
  }

  if (todoCompletionInserts.length > 0) {
    db.insert(todoCompletions).values(todoCompletionInserts).run();
  }

  return {
    skipped: false,
    routines: insertedRoutines.length,
    todos: insertedTodoIds.length,
    routineCompletions: allRoutineCompletions.length,
    todoCompletions: todoCompletionInserts.length,
  };
}
