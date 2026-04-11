"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarSync, CalendarRange } from "lucide-react";

export type CalendarView = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentDate: Date;
  currentView: CalendarView;
  showWeekends: boolean;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onToday: () => void;
  onToggleWeekends: () => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function CalendarHeader({
  currentDate,
  currentView,
  showWeekends,
  onDateChange,
  onViewChange,
  onToday,
  onToggleWeekends,
}: CalendarHeaderProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goPrev = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(month - 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const goNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(month + 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const displayLabel = (() => {
    if (currentView === "day") {
      return `${MONTH_NAMES[month]} ${currentDate.getDate()}, ${year}`;
    }
    return `${MONTH_NAMES[month]} ${year}`;
  })();

  // Pre-compute dropdown options
  const dropdownItems = useMemo(() => {
    if (currentView === "month") {
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${MONTH_NAMES[i]} ${year}`,
        value: `m:${year}-${i}`,
      }));
    }
    if (currentView === "week") {
      const items: { label: string; value: string }[] = [];
      for (let offset = -2; offset <= 2; offset++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + offset * 7);
        const start = getWeekStart(d);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        items.push({
          label: `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`,
          value: `w:${start.getTime()}`,
        });
      }
      return items;
    }
    // day view
    const items: { label: string; value: string }[] = [];
    for (let offset = -7; offset <= 7; offset++) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + offset);
      const dayName = d.toLocaleDateString("en", { weekday: "short" });
      items.push({
        label: `${dayName}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
        value: `d:${d.getTime()}`,
      });
    }
    return items;
  }, [currentView, currentDate, year, month]);

  const handleDateSelect = (val: string) => {
    const [type, rest] = val.split(":");
    if (type === "m") {
      const [y, m] = rest.split("-").map(Number);
      const newDate = new Date(currentDate);
      newDate.setFullYear(y, m, 1);
      onDateChange(newDate);
    } else {
      onDateChange(new Date(Number(rest)));
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-2">
        {/* Month/Year/Week/Day Dropdown */}
        <Select
          value={dropdownItems[0]?.value}
          onValueChange={handleDateSelect}
        >
          <SelectTrigger className="h-8 w-auto border-0 shadow-none gap-1 px-2 font-semibold text-sm hover:bg-muted/50">
            <SelectValue>{displayLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[160px]">
            {dropdownItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Navigation */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-medium"
          onClick={onToday}
        >
          Today
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* View Selector */}
        <div className="h-5 w-px bg-border mx-1" />
        <Select
          value={currentView}
          onValueChange={(v) => onViewChange(v as CalendarView)}
        >
          <SelectTrigger className="h-8 w-auto border-0 shadow-none gap-1 px-2 text-sm hover:bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[80px]">
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>

        {/* Weekend Toggle - only for month/week views */}
        {(currentView === "month" || currentView === "week") && (
          <Button
            variant={showWeekends ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onToggleWeekends}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Weekends
          </Button>
        )}
      </div>

      {/* Sync Button */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-xs hidden sm:flex">
        <CalendarSync className="h-4 w-4" />
        <span>Sync to personal calendar</span>
      </Button>
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
