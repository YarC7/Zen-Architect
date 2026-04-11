import { memo, useCallback, useRef } from 'react';
import { Card } from '@/types/board';

interface UndatedCardDraggableProps {
  card: Card;
  onDragStart: (card: Card, startX: number, startY: number) => void;
  onCardClick: (card: Card) => void;
}

export const UndatedCardDraggable = memo(function UndatedCardDraggable({
  card, onDragStart, onCardClick,
}: UndatedCardDraggableProps) {
  const pointerRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointerRef.current = e.pointerId;
    onDragStart(card, e.clientX, e.clientY);
  }, [card, onDragStart]);

  return (
    <div
      className="h-[44px] border-b px-3 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-all"
      onClick={() => onCardClick(card)}
      onPointerDown={handlePointerDown}
    >
      <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/30" />
      <span className="text-sm truncate text-muted-foreground">{card.title}</span>
    </div>
  );
});
