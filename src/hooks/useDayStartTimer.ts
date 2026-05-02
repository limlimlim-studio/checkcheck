import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { runDueDateCheck } from './useTodos';
import { computeEffectiveToday } from '../db';
import { useDayStartStore } from '../stores/dayStartStore';

export function useDayStartTimer(dayStartMinutes: number) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<() => void>(() => {});

  useEffect(() => {
    scheduleRef.current = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const now = dayjs();
      let next = now.startOf('day').add(dayStartMinutes, 'minute');
      if (!now.isBefore(next)) next = next.add(1, 'day');
      const delay = next.valueOf() - now.valueOf();

      if (__DEV__) {
        console.log(
          `[DayStartTimer] 다음 실행: ${next.format('HH:mm')} ` +
          `(${Math.ceil(delay / 1000 / 60)}분 후)`,
        );
      }

      timerRef.current = setTimeout(async () => {
        if (__DEV__) console.log('[DayStartTimer] 할 일 정리 실행');
        // effectiveToday 먼저 갱신 → 이후 쿼리 re-fetch 시 새 날짜 기준으로 동작
        const newEffective = computeEffectiveToday();
        const current = useDayStartStore.getState().effectiveToday;
        if (newEffective > current) {
          useDayStartStore.getState().setEffectiveToday(newEffective);
        }
        await runDueDateCheck();
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
        scheduleRef.current();
      }, delay);
    };

    scheduleRef.current();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dayStartMinutes, queryClient]);
}
