/**
 * 개발용 임시 데이터 생성 (DEV only)
 *
 * ✅ 프로덕션 안전:
 *   __DEV__ 는 Metro 번들러(로컬 개발)에서만 true.
 *   eas build / 프로덕션 빌드에서는 false → 이 파일 전체가 실행되지 않음.
 *
 * ✅ 1회 실행:
 *   app_settings 테이블의 'seed_v1' 키로 중복 실행 방지.
 *
 * 🔄 재생성 방법 (앱 재시작 필요):
 *   Expo DevTools 또는 앱 내 DB 쿼리 실행:
 *
 *     DELETE FROM app_settings WHERE key = 'seed_v3';
 *
 *   위 한 줄만 실행하면 다음 앱 시작 시 seed 데이터가 다시 생성됨.
 *   (기존 seed 완료 기록도 함께 초기화하려면 앱 삭제 후 재설치)
 */

import { eq } from 'drizzle-orm';
import { db } from './index';
import { categories, todos, todoCompletions, appSettings } from './schema';

const SEED_KEY = 'seed_v6';

// 카테고리별 하루 완료 확률 (0~1) — 다양한 패턴 연출
const CATEGORY_FREQUENCY: Record<string, number> = {
  default: 0.5,
  업무: 0.8,
  개인: 0.65,
  운동: 0.7,
  학습: 0.6,
  쇼핑: 0.3,
};

// 하루 최대 완료 수 (1~max 랜덤)
const MAX_PER_DAY = 4;

// 생성 기간 (일)
const SEED_DAYS = 730; // 2년

function dateToString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export async function runDevSeed() {
  if (!__DEV__) return;

  // 이미 실행됐으면 스킵
  const flag = db.select().from(appSettings).where(eq(appSettings.key, SEED_KEY)).get();
  if (flag) return;

  const allCategories = db.select().from(categories).all();
  if (allCategories.length === 0) return;

  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 카테고리별 시드 todo 1개씩 생성 (잔디용)
  const seedTodoIds: Record<number, number> = {};
  for (const cat of allCategories) {
    const result = db.insert(todos).values({
      categoryId: cat.id,
      title: `[seed] ${cat.name} 활동`,
      sortOrder: -9999,
      isCompleted: 1,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: todos.id }).get();
    if (result) seedTodoIds[cat.id] = result.id;
  }

  // 완료 탭 확인용 — 최근 400일에 걸쳐 다양한 날짜의 완료 todo 생성 (1/6/12개월 필터 테스트)
  const COMPLETED_TODO_TITLES: Record<string, string[]> = {
    업무: ['기획서 작성', '팀 미팅 참석', '코드 리뷰', '보고서 제출', '이메일 정리', '주간 회의'],
    개인: ['독서 30분', '일기 쓰기', '방 청소', '친구 연락', '영화 보기', '요리하기'],
    운동: ['러닝 5km', '헬스장', '스트레칭', '자전거 타기', '수영', '요가'],
    학습: ['알고리즘 풀기', '영어 단어 암기', '강의 수강', '책 읽기', 'TIL 작성', '사이드 프로젝트'],
    쇼핑: ['장보기', '생필품 구매', '온라인 주문'],
    미분류: ['메모 정리', '사진 백업', '앱 업데이트'],
  };

  const completedTodoValues: {
    categoryId: number; title: string; sortOrder: number;
    isCompleted: number; completedAt: number; createdAt: number; updatedAt: number;
  }[] = [];

  for (let daysAgo = 0; daysAgo <= 400; daysAgo++) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const ts = date.getTime() + 9 * 60 * 60 * 1000; // 오전 9시 기준

    for (const cat of allCategories) {
      const titles = COMPLETED_TODO_TITLES[cat.name] ?? COMPLETED_TODO_TITLES['미분류'];
      // 날짜마다 0~3개 랜덤 생성
      const count = Math.floor(Math.random() * 4);
      const shuffled = [...titles].sort(() => Math.random() - 0.5).slice(0, count);
      for (const title of shuffled) {
        const offset = Math.floor(Math.random() * 8 * 60 * 60 * 1000); // 최대 8시간 내 랜덤
        completedTodoValues.push({
          categoryId: cat.id,
          title,
          sortOrder: -9998,
          isCompleted: 1,
          completedAt: ts + offset,
          createdAt: ts,
          updatedAt: ts + offset,
        });
      }
    }
  }

  const BATCH_TODO = 50;
  for (let i = 0; i < completedTodoValues.length; i += BATCH_TODO) {
    db.insert(todos).values(completedTodoValues.slice(i, i + BATCH_TODO)).run();
  }

  // 지난 2년 completions 생성 (잔디용)
  const completionValues: { todoId: number; completedDate: string }[] = [];

  for (let i = SEED_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = dateToString(date);

    for (const cat of allCategories) {
      const todoId = seedTodoIds[cat.id];
      if (!todoId) continue;

      const freq = CATEGORY_FREQUENCY[cat.name] ?? CATEGORY_FREQUENCY.default;
      if (Math.random() > freq) continue;

      const count = Math.floor(Math.random() * MAX_PER_DAY) + 1;
      for (let c = 0; c < count; c++) {
        completionValues.push({ todoId, completedDate: dateStr });
      }
    }
  }

  // 배치 삽입
  const BATCH = 200;
  for (let i = 0; i < completionValues.length; i += BATCH) {
    db.insert(todoCompletions).values(completionValues.slice(i, i + BATCH)).run();
  }

  // 미완료 탭 확인용 — 기한이 지난 미완료 할 일 생성
  const OVERDUE_TODO_TITLES: Record<string, string[]> = {
    업무: ['분기 보고서 작성', '클라이언트 미팅 준비', '계약서 검토'],
    개인: ['세금 신고', '보험 갱신', '치과 예약'],
    운동: ['PT 예약', '러닝화 구매'],
    학습: ['온라인 강의 완료', '자격증 신청'],
    쇼핑: ['냉장고 정리', '청소 용품 구매'],
    미분류: ['차 점검 예약', '공과금 납부'],
  };

  const overdueDaysAgo = [1, 3, 5, 7, 14, 21];
  for (const daysAgo of overdueDaysAgo) {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() - daysAgo);
    dueDate.setHours(0, 0, 0, 0);

    for (const cat of allCategories) {
      const titles = OVERDUE_TODO_TITLES[cat.name] ?? OVERDUE_TODO_TITLES['미분류'];
      const title = titles[daysAgo % titles.length];
      db.insert(todos).values({
        categoryId: cat.id,
        title: `[미완료] ${title}`,
        dueDate: dueDate.getTime(),
        urgency: Math.floor(Math.random() * 3),
        importance: Math.floor(Math.random() * 3),
        sortOrder: -9997,
        isCompleted: 0,
        createdAt: now,
        updatedAt: now,
      }).run();
    }
  }

  // 완료 플래그 저장
  db.insert(appSettings).values({ key: SEED_KEY, value: '1' }).run();

  console.log(`[seed] todo ${completedTodoValues.length}개, completion ${completionValues.length}개, 미완료 ${overdueDaysAgo.length * allCategories.length}개 생성 완료`);
}
