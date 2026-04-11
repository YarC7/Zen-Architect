import { useMemo, useState } from 'react';
import { Card } from '@/types/board';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface TimelineViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
}

type ZoomLevel = 'days' | 'weeks' | 'months';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function TimelineView({ cards, onCardClick }: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('weeks');

  // Cards with due dates - give each a "start" (dueDate - 3 days or dueDate) and "end" (dueDate)
  const timelineCards = useMemo(() => {
    return cards
      .filter(c => c.dueDate)
      .map(c => {
        const end = new Date(c.dueDate!);
        // Simulate a duration: cards without explicit start get 3-day bars
        const start = addDays(end, -3);
        return { card: c, start, end };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [cards]);

  const cardsWithoutDates = cards.filter(c => !c.dueDate);

  // Calculate timeline range
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (timelineCards.length === 0) {
      const today = new Date();
      const s = addDays(today, -7);
      const e = addDays(today, 21);
      return { rangeStart: s, rangeEnd: e, totalDays: 28 };
    }
    const allStarts = timelineCards.map(c => c.start.getTime());
    const allEnds = timelineCards.map(c => c.end.getTime());
    const minDate = new Date(Math.min(...allStarts));
    const maxDate = new Date(Math.max(...allEnds));
    const s = addDays(minDate, -5);
    const e = addDays(maxDate, 7);
    return { rangeStart: s, rangeEnd: e, totalDays: Math.max(daysBetween(s, e), 14) };
  }, [timelineCards]);

  // Column config based on zoom
  const columnWidth = zoom === 'days' ? 40 : zoom === 'weeks' ? 20 : 8;
  const headerHeight = 52;
  const rowHeight = 44;
  const today = new Date();
  const todayOffset = daysBetween(rangeStart, today);

  // Generate header dates
  const headerDates = useMemo(() => {
    const dates: { label: string; sublabel?: string; span: number; offset: number }[] = [];

    if (zoom === 'days') {
      for (let i = 0; i < totalDays; i++) {
        const d = addDays(rangeStart, i);
        dates.push({
          label: String(d.getDate()),
          sublabel: i === 0 || d.getDate() === 1
            ? d.toLocaleDateString('en', { month: 'short' })
            : undefined,
          span: 1,
          offset: i,
        });
      }
    } else if (zoom === 'weeks') {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(rangeStart, i);
        const weekEnd = Math.min(i + (6 - d.getDay()), totalDays - 1);
        const span = weekEnd - i + 1;
        dates.push({
          label: formatDateShort(d),
          span,
          offset: i,
        });
        i = weekEnd + 1;
      }
    } else {
      let i = 0;
      while (i < totalDays) {
        const d = addDays(rangeStart, i);
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const remaining = daysInMonth - d.getDate() + 1;
        const span = Math.min(remaining, totalDays - i);
        dates.push({
          label: d.toLocaleDateString('en', { month: 'short', year: 'numeric' }),
          span,
          offset: i,
        });
        i += span;
      }
    }
    return dates;
  }, [rangeStart, totalDays, zoom]);

  const totalWidth = totalDays * columnWidth;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No cards to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none rounded-l-md text-xs ${zoom === 'days' ? 'bg-muted' : ''}`}
            onClick={() => setZoom('days')}
          >
            Days
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none text-xs border-x ${zoom === 'weeks' ? 'bg-muted' : ''}`}
            onClick={() => setZoom('weeks')}
          >
            Weeks
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 rounded-none rounded-r-md text-xs ${zoom === 'months' ? 'bg-muted' : ''}`}
            onClick={() => setZoom('months')}
          >
            Months
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <div className="flex">
          {/* Left panel: card names */}
          <div className="shrink-0 w-56 border-r bg-muted/30 z-10 sticky left-0">
            <div className="h-[52px] border-b px-3 flex items-center">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task</span>
            </div>
            {timelineCards.map(({ card }) => (
              <div
                key={card.id}
                className="h-[44px] border-b px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onCardClick(card)}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${card.completed ? 'bg-green-500' : 'bg-primary'}`} />
                <span className={`text-sm truncate ${card.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {card.title}
                </span>
              </div>
            ))}
            {cardsWithoutDates.length > 0 && (
              <>
                <div className="h-[32px] px-3 flex items-center border-b bg-muted/20">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">No date</span>
                </div>
                {cardsWithoutDates.map(card => (
                  <div
                    key={card.id}
                    className="h-[44px] border-b px-3 flex items-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onCardClick(card)}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground/30" />
                    <span className="text-sm truncate text-muted-foreground">{card.title}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right panel: Gantt bars */}
          <div className="flex-1 overflow-x-auto">
            <div style={{ width: totalWidth, minWidth: '100%' }}>
              {/* Header */}
              <div className="flex h-[52px] border-b bg-muted/20">
                {headerDates.map((h, i) => (
                  <div
                    key={i}
                    className="border-r flex flex-col items-center justify-center"
                    style={{ width: h.span * columnWidth }}
                  >
                    {h.sublabel && (
                      <span className="text-[9px] text-muted-foreground">{h.sublabel}</span>
                    )}
                    <span className="text-xs font-medium text-muted-foreground">{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="relative">
                {/* Today marker */}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10"
                    style={{ left: todayOffset * columnWidth }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-destructive" />
                  </div>
                )}

                {/* Grid lines */}
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-border/30"
                    style={{ left: i * columnWidth, width: 1 }}
                  />
                ))}

                {/* Card bars */}
                {timelineCards.map(({ card, start, end }, rowIndex) => {
                  const startOffset = daysBetween(rangeStart, start);
                  const duration = daysBetween(start, end) + 1;
                  const barLeft = startOffset * columnWidth;
                  const barWidth = Math.max(duration * columnWidth, 24);
                  const barColor = card.labels[0]?.color || '199 89% 48%';

                  return (
                    <div
                      key={card.id}
                      className="h-[44px] border-b relative"
                    >
                      <div
                        className="absolute top-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity flex items-center px-2 gap-1.5 shadow-sm"
                        style={{
                          left: barLeft,
                          width: barWidth,
                          height: 28,
                          backgroundColor: `hsl(${barColor})`,
                        }}
                        onClick={() => onCardClick(card)}
                        title={card.title}
                      >
                        <span className="text-[11px] font-medium text-white truncate">
                          {card.title}
                        </span>
                        {card.assignees.length > 0 && (
                          <Avatar className="h-5 w-5 shrink-0 border border-white/30">
                            <AvatarFallback
                              className="text-[8px] text-white"
                              style={{ backgroundColor: `hsl(${card.assignees[0].color})` }}
                            >
                              {card.assignees[0].name[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* No-date rows (empty) */}
                {cardsWithoutDates.length > 0 && (
                  <>
                    <div className="h-[32px] border-b bg-muted/10" />
                    {cardsWithoutDates.map(card => (
                      <div key={card.id} className="h-[44px] border-b" />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
