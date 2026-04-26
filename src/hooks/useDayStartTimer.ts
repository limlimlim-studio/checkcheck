import { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { runDueDateCheck } from './useTodos';

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
        const changed = await runDueDateCheck();
        if (changed) {
          queryClient.invalidateQueries({ queryKey: ['todos'] });
          queryClient.invalidateQueries({ queryKey: ['completions'], exact: false });
        }
        scheduleRef.current();
      }, delay);
    };

    scheduleRef.current();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dayStartMinutes, queryClient]);
}
