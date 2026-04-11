import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import { CalendarIcon, Plus, Trash2, X, CheckSquare, MessageSquare, History, User, Clock, Send, Hash, UserPlus, Paperclip, Tag, LayoutGrid, ChevronDown, Search, Image as ImageIcon, MoreHorizontal, UserMinus, ArrowRight, Copy, CreditCard, SquarePlus, Eye, Share2, Archive, CheckCircle2, Check } from 'lucide-react';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, LABEL_PRESETS, ChecklistItem, Comment, Activity, ASSIGNEE_COLORS, Label } from '@/types/board';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LabelPopover } from './LabelPopover';

interface CardDetailDialogProps {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string) => void;
  onAddAssignee: (cardId: string, name: string) => void;
  labels: Label[];
  onAddLabel: (name: string, color: string) => string;
  onUpdateLabel: (id: string, name: string, color: string) => void;
  onDeleteLabel: (id: string) => void;
}

let checkId = Date.now();

// Mock board members (normally would come from props/context)
const BOARD_MEMBERS = [
  { id: '1', name: 'Nguyễn Đức Cảnh', initials: 'NC', color: ASSIGNEE_COLORS[0] },
  { id: '2', name: 'Admin Zenarc', initials: 'AZ', color: ASSIGNEE_COLORS[1] },
  { id: '3', name: 'Trần Văn A', initials: 'VA', color: ASSIGNEE_COLORS[2] },
];

function MemberPopoverContent({ card, onUpdate }: { card: Card, onUpdate: (c: Card) => void }) {
  const [search, setSearch] = useState('');

  const filtered = BOARD_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (member: typeof BOARD_MEMBERS[0]) => {
    const exists = card.assignees.some(a => a.id === member.id);
    if (exists) {
      onUpdate({ ...card, assignees: card.assignees.filter(a => a.id !== member.id) });
    } else {
      onUpdate({
        ...card,
        assignees: [...card.assignees, { id: member.id, name: member.name, color: member.color }]
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="p-3 border-b bg-muted/5 flex items-center justify-center relative">
        <h3 className="text-sm font-bold text-muted-foreground">Thành viên</h3>
      </div>
      <div className="p-3 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Tìm kiếm các thành viên"
            className="pl-9 h-10 border-muted-foreground/20 focus-visible:ring-primary shadow-inner bg-muted/5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold text-muted-foreground/80 px-1 uppercase tracking-tight">Thành viên của bảng</p>
          <div className="space-y-1">
            {filtered.map(member => {
              const isActive = card.assignees.some(a => a.id === member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-muted text-sm group",
                    isActive && "bg-muted/50"
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
                    {member.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{member.name}</p>
                  </div>
                  {isActive && (
                    <div className="h-5 w-5 bg-primary/10 rounded-full flex items-center justify-center">
                      <div className="h-2 w-2 bg-primary rounded-full animate-in zoom-in-50 duration-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



export function CardDetailDialog({
  card,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onAddAssignee,
  labels,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
}: CardDetailDialogProps) {
  const [newCheckItem, setNewCheckItem] = useState('');
  const [showActivity, setShowActivity] = useState(true);
  const [localTitle, setLocalTitle] = useState(card?.title || '');
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const [isChecklistVisible, setIsChecklistVisible] = useState(card?.checklist && card.checklist.length > 0);

  useEffect(() => {
    if (card?.checklist && card.checklist.length > 0) {
      setIsChecklistVisible(true);
    }
  }, [card?.checklist]);

  useEffect(() => {
    setLocalTitle(card?.title || '');
  }, [card?.title]);

  const scrollToChecklist = () => {
    setIsChecklistVisible(true);
    setTimeout(() => {
      checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      checklistInputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = '0px';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [localTitle, open]);

  if (!card) return null;

  const toggleLabel = (label: typeof LABEL_PRESETS[0]) => {
    const has = card.labels.some(l => l.id === label.id);
    onUpdate({
      ...card,
      labels: has ? card.labels.filter(l => l.id !== label.id) : [...card.labels, label],
    });
  };

  const checklist = card.checklist || [];
  const checkedCount = checklist.filter(i => i.checked).length;
  const progress = checklist.length > 0 ? (checkedCount / checklist.length) * 100 : 0;

  const toggleCheckItem = (itemId: string) => {
    onUpdate({
      ...card,
      checklist: checklist.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i),
    });
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    onUpdate({
      ...card,
      checklist: [...checklist, { id: `chk-${++checkId}`, text: newCheckItem.trim(), checked: false }],
    });
    setNewCheckItem('');
  };

  const removeChecklist = () => {
    setIsChecklistVisible(false);
    onUpdate({ ...card, checklist: [] });
  };

  const removeCheckItem = (itemId: string) => {
    onUpdate({ ...card, checklist: checklist.filter(i => i.id !== itemId) });
  };

  const dueDate = card.dueDate ? new Date(card.dueDate) : undefined;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate);

  const mockComments: Comment[] = [
    { id: 'c1', author: 'Alice', text: 'I completed the initial repository setup. Please check the CI pipeline.', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'c2', author: 'Bob', text: 'Looks good! I will start on the landing page mockup tomorrow.', createdAt: new Date(Date.now() - 7200000).toISOString() }
  ];

  const mockActivities: Activity[] = [
    { id: 'a1', user: 'Alice', description: 'created this card', createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'create' },
    { id: 'a2', user: 'Admin', description: 'added Alice to this card', createdAt: new Date(Date.now() - 43200000).toISOString(), type: 'update' },
    { id: 'a3', user: 'Bob', description: 'moved this card to In Progress', createdAt: new Date(Date.now() - 3600000).toISOString(), type: 'move' }
  ];

  const feedItems = [
    ...(card.comments || mockComments).map(c => ({ ...c, feedType: 'comment' as const })),
    ...(card.activities || mockActivities).map(a => ({ ...a, feedType: 'activity' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" min-w-6xl h-[90vh] flex flex-col  overflow-hidden">
        {/* Top Navigation Header */}
        <div className="flex items-center justify-between  bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-transparent">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="h-8 px-3 text-xs font-bold gap-1.5 bg-muted/60 hover:bg-muted text-foreground rounded-md shadow-none">
              In Progress <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-full">
              <ImageIcon className="h-4.5 w-4.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-full">
                  <MoreHorizontal className="h-4.5 w-4.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-2xl rounded-xl border-muted/60">
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <UserMinus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Rời đi</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Di chuyển</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sao chép</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Đối xứng</span>
                  </div>
                  <Badge className="h-5 px-1.5 bg-primary/15 text-primary border-none text-[9px] font-bold uppercase rounded">MỚI</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <SquarePlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tạo mẫu</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Theo dõi</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-muted/60" />

                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Chia sẻ</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer" onClick={() => onOpenChange(false)}>
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Lưu trữ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        <DialogHeader className="sr-only">
          <DialogTitle>Chi tiết thẻ</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 h-full overflow-hidden">
            {/* Left Column: Details */}
            <div className="col-span-12 md:col-span-7 h-full overflow-y-auto custom-scrollbar space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdate({ ...card, completed: !card.completed })}
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-4 transition-all duration-300 p-0",
                      card.completed
                        ? "bg-green-400 text-white hover:bg-green-500 shadow-sm"
                        : "bg-muted/40 text-muted-foreground/20 hover:bg-muted/60 hover:text-muted-foreground/40 border border-muted-foreground/10"
                    )}
                  >
                    {card.completed ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-transparent" />
                    )}
                  </Button>
                  <div className="flex-1 w-[90%]">
                    <Textarea
                      ref={titleRef}
                      value={localTitle}
                      onChange={e => setLocalTitle(e.target.value)}
                      onBlur={() => {
                        if (card && localTitle !== card.title) {
                          onUpdate({ ...card, title: localTitle });
                        }
                      }}
                      rows={1}
                      className="text-6xl font-extrabold border hover:bg-muted/30 focus-visible:bg-muted/20 px-2 py-2 -ml-2 focus-visible:ring-0 resize-none leading-[1.2] transition-all rounded-sm bg-transparent shadow-none h-auto overflow-hidden block"
                    />
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="flex flex-wrap gap-2 py-0.5">
                  <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 shadow-sm px-3 gap-2 text-muted-foreground font-medium border-muted/60 hover:bg-muted/50 hover:text-foreground transition-all">
                        <Plus className="h-3.5 w-3.5" /> Thêm
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" align="center" side="bottom" sideOffset={10}>
                      {/* Popover List */}
                      <div className="p-1.5 space-y-0.5">
                        {[
                          {
                            icon: Tag,
                            title: 'Nhãn',
                            subtitle: 'Sắp xếp, phân loại và ưu tiên',
                            onClick: () => {
                              setLabelsOpen(true);
                              setAddMenuOpen(false);
                            }
                          },
                          {
                            icon: Clock,
                            title: 'Ngày',
                            subtitle: 'Ngày bắt đầu, ngày hết hạn và lời nhắc',
                          },
                          {
                            icon: CheckSquare,
                            title: 'Việc cần làm',
                            subtitle: 'Thêm tác vụ con',
                            onClick: () => {
                              scrollToChecklist();
                              setAddMenuOpen(false);
                            }
                          },
                          {
                            icon: User,
                            title: 'Thành viên',
                            subtitle: 'Chỉ định thành viên',
                            onClick: () => {
                              setMembersOpen(true);
                              setAddMenuOpen(false);
                            }
                          },
                          { icon: Paperclip, title: 'Đính kèm', subtitle: 'Thêm liên kết, trang, hạng mục công việc, v.v.' },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3.5 p-2 rounded-lg hover:bg-primary/5 cursor-pointer group transition-all"
                            onClick={item.onClick}
                          >
                            <div className="h-10 w-10 shrink-0 border rounded-lg flex items-center justify-center bg-background shadow-sm group-hover:border-primary/20 group-hover:shadow-md transition-all">
                              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[13px] font-bold group-hover:text-primary transition-colors">{item.title}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{item.subtitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shadow-sm px-3 gap-2 text-muted-foreground font-medium border-muted/60 hover:bg-muted/50 hover:text-foreground transition-all"
                    onClick={scrollToChecklist}
                  >
                    <CheckSquare className="h-3.5 w-3.5" /> Việc cần làm
                  </Button>

                  {/* Conditionally show "Thành viên" button only if NO assignees */}
                  {card.assignees.length === 0 && (
                    <Popover open={membersOpen} onOpenChange={setMembersOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 shadow-sm px-3 gap-2 text-muted-foreground font-medium border-muted/60 hover:bg-muted/50 hover:text-foreground transition-all">
                          <UserPlus className="h-3.5 w-3.5" /> Thành viên
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" align="center" side="bottom" sideOffset={10}>
                        <MemberPopoverContent card={card} onUpdate={onUpdate} />
                      </PopoverContent>
                    </Popover>
                  )}

                  <Button variant="outline" size="sm" className="h-8 shadow-sm px-3 gap-2 text-muted-foreground font-medium border-muted/60 hover:bg-muted/50 hover:text-foreground transition-all">
                    <Paperclip className="h-3.5 w-3.5" /> Đính kèm
                  </Button>
                </div>

                {/* Metadata Section */}
                <div className="space-y-4 pt-2">
                  {/* Assignees Section */}
                  {card.assignees.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[13px] font-bold text-muted-foreground/80">Thành viên</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {card.assignees.map(a => (
                          <div key={a.id} className="group relative">
                            <Avatar className="h-8 w-8 text-[11px] font-bold shadow-sm ring-2 ring-background transition-transform hover:scale-105">
                              <AvatarFallback className="bg-slate-800 text-white">
                                {a.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <button
                              onClick={() => onUpdate({ ...card, assignees: card.assignees.filter(ca => ca.id !== a.id) })}
                              className="absolute -top-1 -right-1 h-4 w-4 bg-muted text-muted-foreground hover:bg-destructive hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                        <Popover open={membersOpen} onOpenChange={setMembersOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-muted/40 hover:bg-muted/60 border-none rounded-full transition-all hover:scale-105 active:scale-95">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" align="center" side="right" sideOffset={12}>
                            <MemberPopoverContent card={card} onUpdate={onUpdate} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {/* Labels Section */}
                  <div className="space-y-2.5">
                    <p className="text-[13px] font-bold text-muted-foreground/80">Nhãn</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {card.labels.map(l => (
                        <Badge
                          key={l.id}
                          className="cursor-pointer text-[11px] h-7 px-3 transition-all hover:brightness-90 border-none rounded-md font-bold"
                          style={{
                            backgroundColor: `hsl(${l.color} / 0.15)`,
                            color: `hsl(${l.color})`,
                          }}
                          onClick={() => toggleLabel(l)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: `hsl(${l.color})` }} />
                          {l.name}
                        </Badge>
                      ))}
                      <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 bg-muted/40 hover:bg-muted/60 border-none rounded-md transition-all hover:scale-105 active:scale-95 text-muted-foreground">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" align="center" side="right" sideOffset={12}>
                            <LabelPopover
                              card={card}
                              onUpdate={onUpdate}
                              availableLabels={labels}
                              onCreateLabel={onAddLabel}
                              onUpdateLabel={onUpdateLabel}
                              onDeleteLabel={onDeleteLabel}
                              onClose={() => setLabelsOpen(false)}
                            />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Due Date Section */}
                  <div className="space-y-2.5">
                    <p className="text-[13px] font-bold text-muted-foreground/80">Ngày hết hạn</p>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="flex items-center gap-3 bg-muted/30 hover:bg-muted/50 px-3 py-2 rounded-md border border-transparent cursor-pointer transition-colors w-fit group">
                            <span className="text-sm font-semibold tracking-tight">
                              {dueDate ? format(dueDate, "HH:mm dd 'thg' M, yyyy") : 'Chưa thiết lập'}
                            </span>
                            {dueDate && (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white border-none py-0.5 px-2 text-[10px] font-bold uppercase rounded">
                                Hoàn tất
                              </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 shadow-2xl border-muted/60 rounded-xl overflow-hidden" align="center" side="bottom" sideOffset={12}>
                          <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={d => onUpdate({ ...card, dueDate: d ? d.toISOString().split('T')[0] : null })}
                            className="p-3"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <p className="text-sm font-bold uppercase tracking-tight">Mô tả</p>
                </div>
                <Textarea
                  value={card.description}
                  onChange={e => onUpdate({ ...card, description: e.target.value })}
                  placeholder="Thêm mô tả chi tiết hơn..."
                  className="min-h-[120px] resize-none bg-muted/10 border-muted focus-visible:ring-1 text-sm p-4 leading-relaxed rounded-xl"
                />
              </div>

              {/* Checklist */}
              {isChecklistVisible && (
                <div ref={checklistRef} className="bg-muted/10 rounded-xl p-4 border border-dashed border-muted/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-primary" />
                      <p className="text-sm font-bold uppercase tracking-tight">Việc cần làm</p>
                      {checklist.length > 0 && (
                        <span className="text-[11px] text-muted-foreground ml-2 bg-muted/50 px-2 py-0.5 rounded-full font-bold text-center">
                          {checkedCount}/{checklist.length} ({Math.round(progress)}%)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={removeChecklist}
                    >
                      Loại bỏ
                    </Button>
                  </div>
                  {checklist.length > 0 && (
                    <Progress value={progress} className="h-2 bg-muted rounded-full" />
                  )}
                  <div className="space-y-1.5">
                    {checklist.map(item => (
                      <div key={item.id} className="flex items-center gap-3 group rounded-lg hover:bg-muted/50 px-2 py-1.5 transition-colors">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleCheckItem(item.id)}
                          className="h-5 w-5 rounded-md"
                        />
                        <span
                          className={cn(
                            'text-sm flex-1 break-words transition-all duration-300',
                            item.checked && 'line-through text-muted-foreground opacity-60',
                          )}
                        >
                          {item.text}
                        </span>
                        <button
                          onClick={() => removeCheckItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={e => { e.preventDefault(); addCheckItem(); }}
                  >
                    <Input
                      ref={checklistInputRef}
                      placeholder="Thêm một hạng mục..."
                      className="h-9 text-sm bg-muted/20 border-muted focus-visible:ring-1 rounded-lg"
                      value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)}
                    />
                    <Button type="submit" size="sm" variant="secondary" className="h-9 gap-2 px-4 font-bold text-xs rounded-lg">
                      <Plus className="h-4 w-4" /> Thêm
                    </Button>
                  </form>
                </div>
              )}

              {(card.updatedAt || card.createdAt) && (
                <div className="pt-6 border-t flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground italic">
                    Cập nhật lần cuối: {format(new Date((card.updatedAt || card.createdAt)!), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Activity Feed */}
            <div className="col-span-12 md:col-span-5 h-full flex flex-col border-l pl-4 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Hoạt động</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold px-2 border-muted/50 text-muted-foreground hover:bg-muted"
                  onClick={() => setShowActivity(!showActivity)}
                >
                  {showActivity ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
                </Button>
              </div>

              <div className="flex-1 flex flex-col gap-6 min-h-0">
                {/* Comment Input */}
                <div className="space-y-3 shrink-0 ">
                  <div className="relative group">
                    <Textarea
                      placeholder="Viết bình luận..."
                      className="min-h-[100px] text-sm resize-none pr-10 focus-visible:ring-primary border-muted/60 transition-all hover:border-muted group-focus-within:border-primary/50 rounded-xl p-4"
                      spellCheck={false}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute bottom-2 right-2 h-7 w-7 text-primary hover:bg-primary/10 transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Combined Feed List */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {feedItems.map((item) => {
                    if (item.feedType === 'activity' && !showActivity) return null;

                    if (item.feedType === 'comment') {
                      const comment = item as Comment;
                      return (
                        <div key={item.id} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Avatar className="h-8 w-8 shrink-0 border shadow-sm">
                            <AvatarFallback className="bg-muted text-[10px] font-bold">
                              {comment.author.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-foreground">{comment.author}</span>
                              <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="bg-muted/30 border rounded-2xl rounded-tl-none px-2 py-2 text-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                              {comment.text}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const activity = item as Activity;
                      return (
                        <div key={item.id} className="relative pl-11 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="absolute left-[15px] top-1/2 -translate-y-1/2 w-[1px] h-full bg-muted/60" />
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border bg-background flex items-center justify-center z-10 shadow-sm border-muted/30">
                            {activity.type === 'create' && <Plus className="h-3.5 w-3.5 text-green-500" />}
                            {activity.type === 'move' && <History className="h-3.5 w-3.5 text-blue-500" />}
                            {activity.type === 'update' && <User className="h-3.5 w-3.5 text-orange-500" />}
                            {activity.type === 'comment' && <MessageSquare className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[12px] leading-relaxed">
                              <span className="font-bold text-foreground">{activity.user}</span>{' '}
                              <span className="text-muted-foreground">{activity.description}</span>
                            </p>
                            <span className="text-[9px] text-muted-foreground/60 font-medium flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
