import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { computeEffectiveToday, autoCompleteCheckedTodosBeforeDate } from '../db';
import { useDayStartStore } from '../stores/dayStartStore';

export function useDayStartTimer(dayStartMinutes: number) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRef = useRef<() => void>(() => {});

  // 앱 시작 시: 이전 날 미처리 체크 항목 자동 완료
  useEffect(() => {
    const effectiveToday = useDayStartStore.getState().effectiveToday;
    autoCompleteCheckedTodosBeforeDate(effectiveToday);
  }, []);

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

      timerRef.current = setTimeout(() => {
        const newEffective = computeEffectiveToday();
        // 하루 전환 시: 직전 날 체크된 할 일 자동 완료
        autoCompleteCheckedTodosBeforeDate(newEffective);
        const current = useDayStartStore.getState().effectiveToday;
        if (newEffective > current) {
          useDayStartStore.getState().setEffectiveToday(newEffective);
        }
        queryClient.invalidateQueries({ queryKey: ['todos'] });
        queryClient.invalidateQueries({ queryKey: ['todayCompletionIds'] });
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
