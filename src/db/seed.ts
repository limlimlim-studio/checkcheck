/**
 * 개발용 임시 데이터 생성 (DEV only)
 *
 * ✅ 프로덕션 안전:
 *   __DEV__ 는 Metro 번들러(로컬 개발)에서만 true.
 *   eas build / 프로덕션 빌드에서는 false → 이 파일 전체가 실행되지 않음.
 *
 * ✅ 1회 실행:
 *   app_settings 테이블의 SEED_KEY로 중복 실행 방지.
 *
 * 🔄 재생성 방법 (앱 재시작 필요):
 *   Expo DevTools 또는 앱 내 DB 쿼리 실행:
 *
 *     DELETE FROM app_settings WHERE key = 'seed_v10';
 *
 *   위 한 줄만 실행하면 다음 앱 시작 시 seed 데이터가 다시 생성됨.
 *   (기존 seed 완료 기록도 함께 초기화하려면 앱 삭제 후 재설치)
 */

import { eq } from 'drizzle-orm';
import { db } from './index';
import { categories, todos, todoCompletions, routines, routineCompletions, appSettings } from './schema';

const SEED_KEY = 'seed_v10';

// 생성 기간
const SEED_DAYS = 730; // 2년 (기록 탭 잔디용)

function dateToString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export async function runDevSeed() {
  if (!__DEV__) return;

  const flag = db.select().from(appSettings).where(eq(appSettings.key, SEED_KEY)).get();
  if (flag) return;

  const allCategories = db.select().from(categories).all();
  if (allCategories.length === 0) return;

  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const catMap: Record<string, number> = {};
  for (const c of allCategories) catMap[c.name] = c.id;

  // ─────────────────────────────────────────
  // 1. 루틴 생성
  // ─────────────────────────────────────────
  const ROUTINE_DATA = [
    { categoryName: '운동', title: '아침에 한강 코스 5km 뛰기', description: '기상 직후 30분, 페이스 5:30 목표', repeatType: 'daily', repeatValue: null, urgency: 1, importance: 2 },
    { categoryName: '운동', title: '자기 전에 스트레칭하기', description: '전신 스트레칭 10분, 유튜브 루틴 따라하기', repeatType: 'daily', repeatValue: null, urgency: 0, importance: 1 },
    { categoryName: '학습', title: '영어 단어 30개 외우기', description: '어제 것 복습 20개 + 신규 10개', repeatType: 'daily', repeatValue: null, urgency: 0, importance: 2 },
    { categoryName: '학습', title: '프로그래머스 문제 1개 풀기', description: 'Level 2 이상, 풀이 후 다른 사람 코드 참고', repeatType: 'weekly', repeatValue: '1,2,3,4,5', urgency: 1, importance: 2 },
    { categoryName: '개인', title: '자기 전에 일기 쓰기', description: '오늘 감사한 것 3가지 + 내일 목표 한 줄', repeatType: 'daily', repeatValue: null, urgency: 0, importance: 1 },
    { categoryName: '업무', title: '팀 주간 회의 참석하기', description: '매주 월요일 오전 10시, 이슈 및 우선순위 공유', repeatType: 'weekly', repeatValue: '1', urgency: 2, importance: 3 },
    { categoryName: '업무', title: '오늘 배운 것 노션에 정리하기', description: 'TIL 작성 후 팀 채널에 공유', repeatType: 'weekly', repeatValue: '1,2,3,4,5', urgency: 0, importance: 1 },
    { categoryName: '개인', title: '주말에 방 청소하기', description: '청소기 돌리고 물걸레까지, 화장실 포함', repeatType: 'weekly', repeatValue: '6', urgency: 0, importance: 1 },
  ];

  const insertedRoutineIds: { id: number; categoryName: string; repeatType: string; repeatValue: string | null }[] = [];

  for (let i = 0; i < ROUTINE_DATA.length; i++) {
    const r = ROUTINE_DATA[i];
    const categoryId = catMap[r.categoryName];
    if (!categoryId) continue;
    const result = db.insert(routines).values({
      categoryId,
      title: r.title,
      description: r.description,
      repeatType: r.repeatType as 'daily' | 'weekly' | 'monthly',
      repeatValue: r.repeatValue,
      urgency: r.urgency,
      importance: r.importance,
      sortOrder: i,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: routines.id }).get();
    if (result) {
      insertedRoutineIds.push({ id: result.id, categoryName: r.categoryName, repeatType: r.repeatType, repeatValue: r.repeatValue });
    }
  }

  // ─────────────────────────────────────────
  // 2. 루틴 완료 기록 생성 (잔디용)
  // ─────────────────────────────────────────
  const ROUTINE_FREQ: Record<string, number> = {
    운동: 0.75,
    학습: 0.65,
    개인: 0.7,
    업무: 0.85,
  };

  const routineCompletionValues: { routineId: number; completedDate: string }[] = [];

  for (let i = SEED_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = dateToString(date);
    const dow = date.getDay(); // 0=일, 1=월 ...

    for (const r of insertedRoutineIds) {
      // 요일 체크
      if (r.repeatType === 'weekly' && r.repeatValue) {
        const allowedDays = r.repeatValue.split(',').map(Number);
        if (!allowedDays.includes(dow)) continue;
      }
      const freq = ROUTINE_FREQ[r.categoryName] ?? 0.6;
      if (Math.random() > freq) continue;
      routineCompletionValues.push({ routineId: r.id, completedDate: dateStr });
    }
  }

  const BATCH_RC = 200;
  for (let i = 0; i < routineCompletionValues.length; i += BATCH_RC) {
    db.insert(routineCompletions).values(routineCompletionValues.slice(i, i + BATCH_RC)).run();
  }

  // ─────────────────────────────────────────
  // 3. 오늘 할 일 생성
  // ─────────────────────────────────────────
  const TODAY_TODOS = [
    { categoryName: '업무', title: '3분기 기능 기획서 초안 잡기', description: '와이어프레임 3장 + 유저 플로우 정리, 내일 팀장님께 공유 예정', urgency: 3, importance: 3 },
    { categoryName: '업무', title: 'PR #58 코드 리뷰하기', description: '성능 관련 코멘트 위주로, 병목 구간 확인 필요', urgency: 2, importance: 2 },
    { categoryName: '학습', title: '리액트 네이티브 애니메이션 강의 듣기', description: '인프런 강의 챕터 5 — Reanimated 기초 2강', urgency: 0, importance: 2 },
    { categoryName: '개인', title: '치과에 전화해서 예약 잡기', description: '스케일링 6개월 지남, 오후 2시 이후 가능한 날로', urgency: 1, importance: 1 },
    { categoryName: '쇼핑', title: '이번 주 장보기', description: '닭가슴살, 달걀 2판, 브로콜리, 바나나, 두부', urgency: 0, importance: 1 },
  ];

  for (let i = 0; i < TODAY_TODOS.length; i++) {
    const t = TODAY_TODOS[i];
    const categoryId = catMap[t.categoryName];
    if (!categoryId) continue;
    db.insert(todos).values({
      categoryId,
      title: t.title,
      description: t.description,
      dueDate: todayTs,
      urgency: t.urgency,
      importance: t.importance,
      sortOrder: i,
      isCompleted: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  // ─────────────────────────────────────────
  // 4. 예정된 할 일 생성 (할 일 탭)
  // ─────────────────────────────────────────
  const UPCOMING_TODOS = [
    { categoryName: '업무', title: '2분기 실적 보고서 제출하기', description: '경영진 보고용, 주요 KPI 달성률 시각화 포함해서 작성', daysFromNow: 2, urgency: 3, importance: 3 },
    { categoryName: '업무', title: '클라이언트 킥오프 미팅 준비하기', description: '신규 프로젝트 요구사항 정리, 질문 목록 미리 뽑아두기', daysFromNow: 3, urgency: 2, importance: 3 },
    { categoryName: '학습', title: 'AWS SAA 시험 접수하기', description: 'Solutions Architect Associate, 다음 달 안으로 날짜 잡기', daysFromNow: 3, urgency: 2, importance: 2 },
    { categoryName: '개인', title: '엄마 생신 선물 주문하기', description: '온라인 주문이면 배송 3일 걸리니까 오늘 내로, 핸드크림 세트 고려 중', daysFromNow: 5, urgency: 2, importance: 3 },
    { categoryName: '운동', title: '새 러닝화 사러 가기', description: '발볼 넓은 거로, 나이키 인빈서블 사이즈 270 피팅 먼저', daysFromNow: 5, urgency: 0, importance: 1 },
    { categoryName: '업무', title: '다음 주 팀 워크숍 자료 만들기', description: '아이스브레이킹 게임 2종 + 상반기 회고 발표 자료', daysFromNow: 7, urgency: 1, importance: 2 },
    { categoryName: '학습', title: '원자 습관 10장까지 읽기', description: '핵심 내용 노션에 정리해두고 팀원한테 공유해보기', daysFromNow: 7, urgency: 0, importance: 2 },
    { categoryName: '개인', title: '자동차 보험 갱신하기', description: '만기일 이번 달 말, 다이렉트 3사 비교 견적 받아보기', daysFromNow: 14, urgency: 1, importance: 2 },
    { categoryName: '쇼핑', title: '봄 옷 사러 가기', description: '린넨 셔츠 2벌이랑 치노 팬츠 1벌, 유니클로랑 무인양품 둘 다 들르기', daysFromNow: 10, urgency: 0, importance: 1 },
  ];

  for (let i = 0; i < UPCOMING_TODOS.length; i++) {
    const t = UPCOMING_TODOS[i];
    const categoryId = catMap[t.categoryName];
    if (!categoryId) continue;
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + t.daysFromNow);
    dueDate.setHours(0, 0, 0, 0);
    db.insert(todos).values({
      categoryId,
      title: t.title,
      description: t.description,
      dueDate: dueDate.getTime(),
      urgency: t.urgency,
      importance: t.importance,
      sortOrder: i,
      isCompleted: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  // ─────────────────────────────────────────
  // 5. 미완료 할 일 생성
  // ─────────────────────────────────────────
  const OVERDUE_TODOS = [
    { categoryName: '업무', title: '계약서 검토하고 법무팀에 전달하기', description: '서명 전 조항 3개 확인 필요, 계속 미루면 안 됨', daysAgo: 1, urgency: 3, importance: 3 },
    { categoryName: '개인', title: '종합소득세 신고하기', description: '홈택스에서 직접 신고, 작년이랑 비슷하게 하면 될 듯', daysAgo: 2, urgency: 3, importance: 3 },
    { categoryName: '학습', title: '인프런 수료증 발급받기', description: '완강 후 수료증 PDF 저장하고 링크드인에 올리기', daysAgo: 3, urgency: 1, importance: 1 },
    { categoryName: '운동', title: 'PT 트레이너한테 연락해서 일정 잡기', description: '3주째 못 가고 있음, 이번 주 안에 꼭 다시 시작하기', daysAgo: 5, urgency: 1, importance: 2 },
    { categoryName: '개인', title: '보험 증권 한 곳에 정리해두기', description: '만기 도래 상품 3건 먼저 확인, 필요 없는 거 해지도 검토', daysAgo: 7, urgency: 2, importance: 2 },
    { categoryName: '쇼핑', title: '노트북 거치대 주문하기', description: '목 통증 때문에 오래됨, 높이 조절 되는 거로 쿠팡에서 찾아보기', daysAgo: 7, urgency: 0, importance: 1 },
    { categoryName: '업무', title: '깃허브 포트폴리오 업데이트하기', description: '최근 프로젝트 3건 README 정리해서 추가, 사이드 프로젝트도 포함', daysAgo: 14, urgency: 1, importance: 2 },
  ];

  for (let i = 0; i < OVERDUE_TODOS.length; i++) {
    const t = OVERDUE_TODOS[i];
    const categoryId = catMap[t.categoryName];
    if (!categoryId) continue;
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() - t.daysAgo);
    dueDate.setHours(0, 0, 0, 0);
    db.insert(todos).values({
      categoryId,
      title: t.title,
      description: t.description,
      dueDate: dueDate.getTime(),
      urgency: t.urgency,
      importance: t.importance,
      sortOrder: i,
      isCompleted: 0,
      createdAt: now,
      updatedAt: now,
    }).run();
  }

  // ─────────────────────────────────────────
  // 6. 완료 할 일 생성 (기록 탭 목록 + 잔디 보조)
  //    카테고리별 의미 있는 타이틀로 20개씩 과거 날짜에 분산 생성
  // ─────────────────────────────────────────
  const COMPLETED_TITLES: Record<string, string[]> = {
    업무: ['기획서 작성', '코드 리뷰', '팀 미팅', '보고서 제출', '이메일 정리', '배포 작업'],
    개인: ['독서 30분', '일기 쓰기', '방 청소', '친구 연락', '요리하기', '명상 10분'],
    운동: ['러닝 5km', '헬스장 가기', '스트레칭', '자전거 타기', '수영', '홈트레이닝'],
    학습: ['알고리즘 풀기', '영어 단어 암기', '강의 수강', '독서', 'TIL 작성', '사이드 프로젝트'],
    쇼핑: ['장보기', '생필품 구매', '온라인 주문'],
    미분류: ['메모 정리', '사진 백업', '앱 업데이트'],
  };

  const SEED_COMPLETED_PER_CAT = 20;
  const completionValues: { todoId: number; completedDate: string }[] = [];

  for (const cat of allCategories) {
    const titles = COMPLETED_TITLES[cat.name] ?? ['활동'];

    for (let i = 0; i < SEED_COMPLETED_PER_CAT; i++) {
      // 과거 1년 안에서 랜덤 날짜
      const daysAgo = Math.floor(Math.random() * Math.min(SEED_DAYS, 365)) + 1;
      const completedDate = new Date(today);
      completedDate.setDate(completedDate.getDate() - daysAgo);
      completedDate.setHours(0, 0, 0, 0);
      const completedTs = completedDate.getTime();
      const dateStr = dateToString(completedDate);

      const title = titles[i % titles.length];

      const result = db.insert(todos).values({
        categoryId: cat.id,
        title,
        sortOrder: -9998 - i,
        isCompleted: 1,
        completedAt: completedTs,
        createdAt: completedTs - 86_400_000, // 완료 1일 전 생성
        updatedAt: completedTs,
      }).returning({ id: todos.id }).get();

      if (result) {
        completionValues.push({ todoId: result.id, completedDate: dateStr });
      }
    }
  }

  const BATCH = 200;
  for (let i = 0; i < completionValues.length; i += BATCH) {
    db.insert(todoCompletions).values(completionValues.slice(i, i + BATCH)).run();
  }

  // 완료 플래그 저장
  db.insert(appSettings).values({ key: SEED_KEY, value: '1' }).run();

  console.log(`[seed v10] 루틴 ${ROUTINE_DATA.length}개, 오늘 할 일 ${TODAY_TODOS.length}개, 예정 ${UPCOMING_TODOS.length}개, 미완료 ${OVERDUE_TODOS.length}개, 완료 할 일 ${completionValues.length}개 생성 완료`);
}
