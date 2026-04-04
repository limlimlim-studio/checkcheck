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
 *     DELETE FROM app_settings WHERE key = 'seed_v1';
 *
 *   위 한 줄만 실행하면 다음 앱 시작 시 seed 데이터가 다시 생성됨.
 *   (기존 seed 완료 기록도 함께 초기화하려면 앱 삭제 후 재설치)
 */

import { eq } from 'drizzle-orm';
import { db } from './index';
import { categories, todos, todoCompletions, appSettings } from './schema';

const SEED_KEY = 'seed_v2';

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

  // 카테고리별 시드 todo 1개씩 생성
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

  // 지난 365일 completions 생성
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

  // 완료 플래그 저장
  db.insert(appSettings).values({ key: SEED_KEY, value: '1' }).run();

  console.log(`[seed] ${completionValues.length}개 completion 생성 완료`);
}
