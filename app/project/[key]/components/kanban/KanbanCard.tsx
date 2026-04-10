import { memo } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon, CheckSquare, Circle, CheckCircle2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Card } from '@/types/board';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  card: Card;
  columnId: string;
  index: number;
  onClick: () => void;
  onToggleComplete: (cardId: string) => void;
}

export const KanbanCard = memo(function KanbanCard({ card, columnId, index, onClick, onToggleComplete }: KanbanCardProps) {
  const { ref, isDragging } = useSortable({
    id: card.id,
    index,
    group: columnId,
    type: 'item',
    collisionPriority: CollisionPriority.High,
  });

  const dueDate = card.dueDate ? new Date(card.dueDate) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);
  const checklist = card.checklist || [];
  const checkedCount = checklist.filter(i => i.checked).length;
  const completed = card.completed ?? false;

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-sm cursor-pointer transition-all hover:shadow-md hover:border-primary/20',
        isDragging && 'opacity-40 shadow-lg ring-2 ring-primary/20',
        completed && 'opacity-70',
      )}
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map(l => (
            <span
              key={l.id}
              className="h-1.5 w-8 rounded-full inline-block"
              style={{ backgroundColor: `hsl(${l.color})` }}
              title={l.name}
            />
          ))}
        </div>
      )}

      {/* Title with checkbox */}
      <div className="flex items-start gap-2">
        <button
          onClick={e => {
            e.stopPropagation();
            onToggleComplete(card.id);
          }}
          className="mt-0.5 shrink-0 transition-colors"
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
          )}
        </button>
        <p className={cn(
          'text-sm font-medium leading-snug transition-all duration-200 flex-1 min-w-0 break-all line-clamp-3',
          completed && 'line-through text-muted-foreground',
        )}>
          {card.title}
        </p>
      </div>

      {/* Footer meta */}
      {(card.dueDate || card.assignees.length > 0 || checklist.length > 0) && (
        <div className="flex items-center justify-between mt-2.5 gap-2 flex-wrap">
          {card.dueDate && dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] rounded px-1.5 py-0.5',
              isOverdue ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground',
            )}>
              <CalendarIcon className="h-3 w-3" />
              {format(dueDate, 'MMM d')}
            </div>
          )}
          {checklist.length > 0 && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] rounded px-1.5 py-0.5',
              checkedCount === checklist.length ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
            )}>
              <CheckSquare className="h-3 w-3" />
              {checkedCount}/{checklist.length}
            </div>
          )}
          {card.assignees.length > 0 && (
            <div className="flex -space-x-1.5 ml-auto">
              {card.assignees.slice(0, 3).map(a => (
                <Avatar key={a.id} className="h-5 w-5 text-[9px] ring-2 ring-card">
                  <AvatarFallback style={{ backgroundColor: `hsl(${a.color})`, color: 'white', fontSize: '9px' }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.assignees.length > 3 && (
                <Avatar className="h-5 w-5 text-[9px] ring-2 ring-card">
                  <AvatarFallback className="bg-muted text-muted-foreground" style={{ fontSize: '9px' }}>
                    +{card.assignees.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
