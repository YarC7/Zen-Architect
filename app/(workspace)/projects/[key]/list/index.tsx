import { Card, Column } from '@/types/board';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays } from 'lucide-react';

interface ListViewProps {
  columns: Column[];
  cards: Record<string, Card>;
  filteredCardIds: (cardIds: string[]) => string[];
  onCardClick: (card: Card) => void;
  onToggleComplete: (cardId: string) => void;
}

export function ListView({ columns, cards, filteredCardIds, onCardClick, onToggleComplete }: ListViewProps) {
  return (
    <div className="space-y-6">
      {columns.map(col => {
        const visibleIds = filteredCardIds(col.cardIds);
        if (visibleIds.length === 0) return null;
        return (
          <div key={col.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${col.color})` }} />
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <span className="text-xs text-muted-foreground">({visibleIds.length})</span>
            </div>
            <div className="space-y-1">
              {visibleIds.map(id => {
                const card = cards[id];
                if (!card) return null;
                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card hover:shadow-sm cursor-pointer transition-shadow"
                    onClick={() => onCardClick(card)}
                  >
                    <Checkbox
                      checked={card.completed}
                      onCheckedChange={() => onToggleComplete(card.id)}
                      onClick={e => e.stopPropagation()}
                      className="shrink-0"
                    />
                    <span className={`flex-1 text-sm ${card.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {card.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {card.labels.map(l => (
                        <Badge
                          key={l.id}
                          className="text-[10px] px-1.5 py-0"
                          style={{ backgroundColor: `hsl(${l.color} / 0.15)`, color: `hsl(${l.color})` }}
                        >
                          {l.name}
                        </Badge>
                      ))}
                      {card.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(card.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {card.assignees.map(a => (
                        <Avatar key={a.id} className="h-5 w-5">
                          <AvatarFallback
                            className="text-[9px] text-white"
                            style={{ backgroundColor: `hsl(${a.color})` }}
                          >
                            {a.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
