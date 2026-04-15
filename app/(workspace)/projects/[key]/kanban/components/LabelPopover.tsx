import React, { useState } from 'react';
import { X, Search, Plus, ChevronLeft, Check, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label, Card } from '@/types/board';
import { cn } from '@/lib/utils';

interface LabelPopoverProps {
  card: Card;
  onUpdate: (card: Card) => void;
  onClose?: () => void;
  availableLabels: Label[];
  onCreateLabel: (name: string, color: string, card?: Card) => string;
  onUpdateLabel: (id: string, name: string, color: string) => void;
  onDeleteLabel: (id: string) => void;
}

type ViewState = 'list' | 'create' | 'edit';

export function LabelPopover({ 
  card, 
  onUpdate, 
  onClose, 
  availableLabels, 
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel
}: LabelPopoverProps) {
  const [view, setView] = useState<ViewState>('list');
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [search, setSearch] = useState('');
  const [labelTitle, setLabelTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('158 64% 52%'); // Default green

  const filtered = availableLabels.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleLabel = (label: Label) => {
    const has = card.labels.some(l => l.id === label.id);
    onUpdate({
      ...card,
      labels: has ? card.labels.filter(l => l.id !== label.id) : [...card.labels, label],
    });
  };

  const colorPalette = [
    '158 53% 82%', '48 89% 80%', '36 100% 80%', '0 100% 88%', '270 100% 90%', '0 0% 90%',
    '158 64% 52%', '48 89% 60%', '36 100% 60%', '355 65% 65%', '270 67% 75%', '0 0% 75%',
    '158 75% 35%', '48 89% 40%', '28 100% 45%', '5 78% 50%', '270 60% 55%', '270 60% 45%',
    '217 100% 90%', '190 100% 88%', '80 60% 80%', '330 100% 92%', '0 0% 85%', '0 0% 70%',
    '217 80% 60%', '190 60% 60%', '80 60% 55%', '330 60% 65%', '0 0% 55%', '0 0% 40%',
  ];

  const handleCreate = () => {
    if (!labelTitle.trim()) return;
    onCreateLabel(labelTitle, selectedColor, card);
    setLabelTitle('');
    setView('list');
  };

  const handleUpdate = () => {
    if (!editingLabel || !labelTitle.trim()) return;
    onUpdateLabel(editingLabel.id, labelTitle, selectedColor);
    setView('list');
    setEditingLabel(null);
    setLabelTitle('');
  };

  const handleDelete = () => {
    if (!editingLabel) return;
    onDeleteLabel(editingLabel.id);
    setView('list');
    setEditingLabel(null);
    setLabelTitle('');
  };

  const openEdit = (label: Label) => {
    setEditingLabel(label);
    setLabelTitle(label.name);
    setSelectedColor(label.color);
    setView('edit');
  };

  const openCreate = () => {
    setLabelTitle('');
    setSelectedColor('158 64% 52%');
    setView('create');
  };

  if (view === 'create' || view === 'edit') {
    const isEdit = view === 'edit';
    return (
      <div className="w-[300px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
          <button 
            className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
            onClick={() => {
              setView('list');
              setEditingLabel(null);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
            {isEdit ? 'Chỉnh sửa nhãn' : 'Tạo nhãn mới'}
          </span>
          <button className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview Window */}
          <div className="p-3 bg-muted/30 rounded-lg border border-muted/50">
            <div 
              className="w-full h-8 rounded shadow-sm border border-black/5 flex items-center px-3" 
              style={{ backgroundColor: `hsl(${selectedColor})` }} 
            >
               <span className="text-[11px] font-bold text-white drop-shadow-sm truncate">
                {labelTitle || 'Phát hiện nhãn'}
               </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Tiêu đề</label>
            <Input 
              value={labelTitle}
              onChange={(e) => setLabelTitle(e.target.value)}
              className="h-9 border-muted-foreground/20 focus-visible:ring-primary shadow-sm"
              placeholder="Nhập tên nhãn..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Chọn một màu</label>
            <div className="grid grid-cols-5 gap-1.5">
              {colorPalette.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color)}
                  className="aspect-video w-full rounded shadow-sm hover:brightness-95 active:scale-95 transition-all relative group"
                  style={{ backgroundColor: `hsl(${color})` }}
                >
                  {selectedColor === color && (
                    <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-sm animate-in zoom-in-50" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </button>
              ))}
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full h-8 text-[11px] font-medium text-muted-foreground bg-muted/5 border-muted/60 hover:bg-muted hover:text-foreground border-dashed"
              >
                Gỡ bỏ màu
              </Button>
            </div>
          </div>          
          
          <div className="flex flex-col gap-2 pt-2">
            <Button 
                className="w-full h-10 font-bold text-sm shadow-md bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={isEdit ? handleUpdate : handleCreate}
                disabled={!labelTitle.trim()}
            >
              {isEdit ? 'Lưu' : 'Tạo'}
            </Button>
            
            {isEdit && (
              <Button 
                variant="ghost"
                className="w-full h-10 font-bold text-sm text-destructive hover:bg-destructive/10 hover:text-destructive" 
                onClick={handleDelete}
              >
                Xóa
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[300px] animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="p-3 border-b bg-muted/5 flex items-center justify-between">
        <div className="w-8" />
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-tight">Nhãn</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="p-3 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Tìm nhãn..."
            className="h-10 pl-9 border-muted-foreground/20 focus-visible:ring-primary shadow-inner bg-muted/5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Nhãn</p>
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map(label => {
                const isSelected = card.labels.some(l => l.id === label.id);
                return (
                  <div key={label.id} className="flex items-center gap-2 group">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLabel(label)}
                      className="h-5 w-5 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div
                      onClick={() => toggleLabel(label)}
                      className="flex-1 h-9 rounded-md flex items-center px-3 cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] relative overflow-hidden group/label shadow-sm"
                      style={{ backgroundColor: `hsl(${label.color} / 0.15)` }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full mr-3 shrink-0" style={{ backgroundColor: `hsl(${label.color})` }} />
                      <span className="text-[12px] font-bold truncate pr-6" style={{ color: `hsl(${label.color})` }}>{label.name}</span>
                      {isSelected && (
                        <Check 
                          className="absolute right-3 h-3.5 w-3.5 animate-in zoom-in-50 duration-200" 
                          style={{ color: `hsl(${label.color})` }} 
                        />
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(label);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })
            ) : (
                <div className="py-8 text-center text-sm text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-muted/60">
                    Không tìm thấy nhãn
                </div>
            )}
          </div>
        </div>

        <div className="pt-1">
          <Button 
            variant="secondary" 
            className="w-full h-10 text-sm font-bold bg-muted/60 hover:bg-muted text-foreground rounded-xl shadow-none border border-muted-foreground/5 gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Tạo nhãn mới
          </Button>
        </div>
      </div>
    </div>
  );
}
