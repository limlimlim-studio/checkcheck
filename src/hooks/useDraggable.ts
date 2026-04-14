import { useCallback } from 'react';

type Options = {
  reorderFn: (ids: number[]) => void;
  disabled?: boolean;
};

export function useDraggable<T extends { id: number }>({ reorderFn, disabled = false }: Options) {
  const onDragEnd = useCallback(
    ({ data }: { data: T[] }) => reorderFn(data.map((t) => t.id)),
    [reorderFn],
  );

  return {
    onDragEnd,
    activationDistance: disabled ? 9999 : 20,
    autoscrollThreshold: 80,
    autoscrollSpeed: 200,
  };
}
