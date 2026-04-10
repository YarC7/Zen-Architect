import { memo, useState } from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import { KanbanCard } from './KanbanCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, Column } from '@/types/board';

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  index: number;
  onCardClick: (card: Card) => void;
  onToggleComplete: (cardId: string) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddCard: (title: string) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  column, cards, index, onCardClick, onToggleComplete, onRename, onDelete, onAddCard,
}: KanbanColumnProps) {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const { ref, handleRef, isDragging } = useSortable({
    id: column.id,
    index,
    type: 'column',
    accept: ['column', 'item'],
    collisionPriority: CollisionPriority.Low,
  });

  const submitCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
      setAddingCard(false);
    }
  };

  return (
    <div
      ref={ref}
      className={`flex flex-col w-72 min-w-[288px] rounded-xl bg-muted/50 border transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* Header */}
      <div
        ref={handleRef}
        className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing rounded-t-xl"
        // style={{ borderTop: `3px solid hsl(${column.color})` }}
      >
        {editingTitle ? (
          <Input
            autoFocus
            className="h-7 text-sm font-semibold"
            defaultValue={column.title}
            onBlur={e => { onRename(e.target.value || column.title); setEditingTitle(false); }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
        ) : (
          <h3 className="text-sm font-semibold flex-1 truncate">{column.title}</h3>
        )}
        <span className="text-xs text-muted-foreground font-medium bg-muted rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
          {cards.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingTitle(true)}>
              <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-2 px-2 py-2 min-h-[60px] overflow-y-auto max-h-[calc(100vh-220px)]">
        {cards.map((card, i) => (
          <KanbanCard key={card.id} card={card} columnId={column.id} index={i} onClick={() => onCardClick(card)} onToggleComplete={onToggleComplete} />
        ))}
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {addingCard ? (
          <div className="space-y-1.5">
            <Input
              autoFocus
              placeholder="Enter card title..."
              className="h-8 text-sm"
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitCard(); if (e.key === 'Escape') setAddingCard(false); }}
            />
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs" onClick={submitCard}>Add</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingCard(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground text-xs gap-1 h-7" onClick={() => setAddingCard(true)}>
            <Plus className="h-3.5 w-3.5" /> Add a card
          </Button>
        )}
      </div>
    </div>
  );
});
