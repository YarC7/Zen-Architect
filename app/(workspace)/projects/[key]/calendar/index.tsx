import { useState, useMemo } from 'react';
import { Card } from '@/types/board';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarView({ cards, onCardClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const cardsByDate = useMemo(() => {
    const map = new Map<string, Card[]>();
    cards.forEach(card => {
      if (!card.dueDate) return;
      const dateKey = card.dueDate.split('T')[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(card);
    });
    return map;
  }, [cards]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const trailingDays = Array.from({ length: firstDay }, (_, i) => ({
    day: prevMonthDays - firstDay + i + 1,
    isOtherMonth: true,
    dateKey: '',
  }));

  // Current month days
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { day, isOtherMonth: false, dateKey };
  });

  // Next month leading days
  const totalCells = trailingDays.length + currentDays.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const leadingDays = Array.from({ length: remainingCells }, (_, i) => ({
    day: i + 1,
    isOtherMonth: true,
    dateKey: '',
  }));

  const allDays = [...trailingDays, ...currentDays, ...leadingDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground min-w-[160px] text-center">
            {currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-card">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b">
          {weekdays.map(d => (
            <div key={d} className="text-xs font-semibold text-muted-foreground py-2.5 text-center bg-muted/30 border-r last:border-r-0 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((dayInfo, di) => {
              const dayCards = dayInfo.dateKey ? (cardsByDate.get(dayInfo.dateKey) || []) : [];
              const isToday = dayInfo.dateKey === todayKey;
              const isWeekend = di === 0 || di === 6;

              return (
                <div
                  key={di}
                  className={`min-h-[100px] border-r last:border-r-0 p-1.5 ${
                    dayInfo.isOtherMonth ? 'bg-muted/10' : isWeekend ? 'bg-muted/5' : ''
                  }`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : dayInfo.isOtherMonth
                          ? 'text-muted-foreground/40'
                          : 'text-foreground'
                      }`}
                    >
                      {dayInfo.day}
                    </span>
                    {dayCards.length > 0 && (
                      <span className="text-[9px] text-muted-foreground">{dayCards.length}</span>
                    )}
                  </div>

                  {/* Cards */}
                  <div className="space-y-0.5">
                    {dayCards.slice(0, 3).map(card => {
                      const barColor = card.labels[0]?.color || '199 89% 48%';
                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: `hsl(${barColor} / 0.12)` }}
                          onClick={() => onCardClick(card)}
                          title={card.title}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: `hsl(${barColor})` }}
                          />
                          <span
                            className={`text-[10px] truncate ${
                              card.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {card.title}
                          </span>
                          {card.assignees.length > 0 && (
                            <Avatar className="h-4 w-4 shrink-0 ml-auto">
                              <AvatarFallback
                                className="text-[7px] text-white"
                                style={{ backgroundColor: `hsl(${card.assignees[0].color})` }}
                              >
                                {card.assignees[0].name[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                    {dayCards.length > 3 && (
                      <span className="text-[9px] text-muted-foreground px-1.5 font-medium">
                        +{dayCards.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
