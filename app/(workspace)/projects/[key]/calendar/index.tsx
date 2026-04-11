"use client";

import { useState } from "react";
import { Card } from "@/types/board";
import { CalendarHeader, type CalendarView } from "./components/CalendarHeader";
import { MonthView } from "./components/MonthView";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";

interface CalendarViewProps {
  cards: Card[];
  onCardClick: (card: Card) => void;
  onUpdateCard: (card: Card) => void;
}

export function CalendarView({
  cards,
  onCardClick,
  onUpdateCard,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>("month");
  const [showWeekends, setShowWeekends] = useState(true);

  return (
    <div className="flex flex-col h-full max-w-full bg-card rounded-lg border overflow-auto">
      <CalendarHeader
        currentDate={currentDate}
        currentView={currentView}
        showWeekends={showWeekends}
        onDateChange={setCurrentDate}
        onViewChange={setCurrentView}
        onToday={() => setCurrentDate(new Date())}
        onToggleWeekends={() => setShowWeekends((v) => !v)}
      />

      {currentView === "month" && (
        <MonthView
          cards={cards}
          onCardClick={onCardClick}
          onUpdateCard={onUpdateCard}
          currentDate={currentDate}
          showWeekends={showWeekends}
        />
      )}

      {currentView === "week" && (
        <WeekView
          cards={cards}
          onCardClick={onCardClick}
          onUpdateCard={onUpdateCard}
          currentDate={currentDate}
          showWeekends={showWeekends}
        />
      )}

      {currentView === "day" && (
        <DayView
          cards={cards}
          onCardClick={onCardClick}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      )}
    </div>
  );
}
