"use client";

import { Card } from "@/types/board";
import { CalendarCard } from "./CalendarCard";
import { Calendar } from "@/components/ui/calendar";
import { dateKey, getWeekDays } from "../utils/calendarUtils";

interface DayViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedCard?: Card | null;
}

export function DayView({
  cards,
  onCardClick,
  currentDate,
  onDateChange,
  selectedCard,
}: DayViewProps) {
  const today = new Date();
  const todayKey = dateKey(today);
  const currentKey = dateKey(currentDate);
  const dayName = currentDate.toLocaleDateString("en", { weekday: "long" });
  const dayCards = getCardsForDate(cards, currentKey);

  return (
    <div className="flex h-full">
      {/* Left sidebar - Mini calendar */}
      <div className="w-72 border-r p-3 overflow-y-auto bg-card shrink-0">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(d) => d && onDateChange(d)}
          className="w-full"
          modifiers={{
            hasCard: (date) => {
              const dk = dateKey(date);
              return getCardsForDate(cards, dk).length > 0;
            },
          }}
        />
      </div>

      {/* Right side - Day tasks */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Day header */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase">
            {dayName}
          </h2>
          <div className="text-3xl font-bold mt-1">
            {currentDate.getDate()}
          </div>
        </div>

        {/* Task cards */}
        <div className="space-y-2">
          {dayCards.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No tasks for this day
            </div>
          ) : (
            dayCards.map((card) => (
              <CalendarCard
                key={card.id}
                card={card}
                onClick={onCardClick}
                showAvatars
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getCardsForDate(cards: Card[], dateKey: string): Card[] {
  return cards.filter((card) => {
    if (!card.dueDate) return false;
    const cardDate = card.dueDate.split("T")[0];
    if (cardDate === dateKey) return true;
    if (card.startDate) {
      const start = card.startDate.split("T")[0];
      const end = cardDate;
      return dateKey >= start && dateKey <= end;
    }
    return false;
  });
}
