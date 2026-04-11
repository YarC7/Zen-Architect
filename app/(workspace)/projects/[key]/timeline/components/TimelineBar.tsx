import { memo, useCallback, useRef } from 'react';
import { Card } from '@/types/board';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { pixelOffsetToDays } from '../utils/dragHelpers';
import { toIsoString } from '../utils/dateUtils';

interface TimelineBarProps {
  card: Card;
  barStart: Date;
  barEnd: Date;
  rangeStart: Date;
  columnWidth: number;
  onDragMove: (cardId: string, newStart: Date, newEnd: Date) => void;
  onClick: (card: Card) => void;
}

const MIN_DURATION_DAYS = 1;
const HANDLE_WIDTH = 6;

export const TimelineBar = memo(function TimelineBar({
  card, barStart, barEnd, rangeStart, columnWidth, onDragMove, onClick,
}: TimelineBarProps) {
  const dragState = useRef<{ startX: number; origStart: Date; origEnd: Date } | null>(null);

  const startOffset = Math.round((barStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
  const duration = Math.max(Math.round((barEnd.getTime() - barStart.getTime()) / (1000 * 60 * 60 * 24)) + 1, MIN_DURATION_DAYS);
  const barLeft = startOffset * columnWidth;
  const barWidth = Math.max(duration * columnWidth, 24);
  const barColor = card.labels[0]?.color || '199 89% 48%';

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, origStart: new Date(barStart), origEnd: new Date(barEnd) };
  }, [barStart, barEnd]);

  const handlePointerMove = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    if (!dragState.current) return;

    const { startX, origStart, origEnd } = dragState.current;
    const deltaPx = e.clientX - startX;
    const deltaDays = pixelOffsetToDays(deltaPx, columnWidth);

    let newStart: Date;
    let newEnd: Date;

    if (mode === 'move') {
      newStart = new Date(origStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEnd = new Date(origEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
    } else if (mode === 'resize-start') {
      newStart = new Date(origStart.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEnd = new Date(origEnd);
      // Enforce minimum duration
      const dur = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dur < MIN_DURATION_DAYS) {
        newStart = new Date(newEnd.getTime() - MIN_DURATION_DAYS * 24 * 60 * 60 * 1000);
      }
    } else {
      newStart = new Date(origStart);
      newEnd = new Date(origEnd.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      // Enforce minimum duration
      const dur = Math.round((newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dur < MIN_DURATION_DAYS) {
        newEnd = new Date(newStart.getTime() + MIN_DURATION_DAYS * 24 * 60 * 60 * 1000);
      }
    }

    onDragMove(card.id, newStart, newEnd);
  }, [columnWidth, card.id, onDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    dragState.current = null;
  }, []);

  return (
    <div
      className="absolute top-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity flex items-center shadow-sm group/bar"
      style={{
        left: barLeft,
        width: barWidth,
        height: 28,
        backgroundColor: `hsl(${barColor})`,
      }}
      onClick={() => onClick(card)}
      title={card.title}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 cursor-ew-resize rounded-l-md hover:bg-white/20 transition-colors z-10"
        style={{ width: HANDLE_WIDTH }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-start')}
        onPointerMove={(e) => handlePointerMove(e, 'resize-start')}
        onPointerUp={(e) => handlePointerUp(e, 'resize-start')}
      />

      {/* Main draggable area */}
      <div
        className="flex items-center px-2 gap-1.5 w-full h-full"
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        onPointerMove={(e) => handlePointerMove(e, 'move')}
        onPointerUp={(e) => handlePointerUp(e, 'move')}
      >
        <span className="text-[11px] font-medium text-white truncate pointer-events-none">
          {card.title}
        </span>
        {card.assignees.length > 0 && (
          <Avatar className="h-5 w-5 shrink-0 border border-white/30 pointer-events-none">
            <AvatarFallback
              className="text-[8px] text-white"
              style={{ backgroundColor: `hsl(${card.assignees[0].color})` }}
            >
              {card.assignees[0].name[0]}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 cursor-ew-resize rounded-r-md hover:bg-white/20 transition-colors z-10"
        style={{ width: HANDLE_WIDTH }}
        onPointerDown={(e) => handlePointerDown(e, 'resize-end')}
        onPointerMove={(e) => handlePointerMove(e, 'resize-end')}
        onPointerUp={(e) => handlePointerUp(e, 'resize-end')}
      />
    </div>
  );
});
