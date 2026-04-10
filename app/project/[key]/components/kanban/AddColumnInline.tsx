import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface AddColumnInlineProps {
  onAddColumn: (title: string) => void;
}

export function AddColumnInline({ onAddColumn }: AddColumnInlineProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const submit = () => {
    if (title.trim()) {
      onAddColumn(title.trim());
      setTitle('');
      setAdding(false);
    }
  };

  if (adding) {
    return (
      <div className="w-72 min-w-[288px] rounded-xl bg-muted/50 border p-2 space-y-2">
        <Input
          autoFocus
          placeholder="Enter list title..."
          className="h-8 text-sm"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') { setAdding(false); setTitle(''); }
          }}
        />
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="h-8 text-xs" onClick={submit}>Add list</Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setAdding(false); setTitle(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-72 min-w-[288px] rounded-xl bg-muted/30 hover:bg-muted/50 border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 p-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
    >
      <Plus className="h-4 w-4" />
      Add another list
    </button>
  );
}
