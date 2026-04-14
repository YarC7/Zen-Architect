"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { TimelineViewType } from "../types";
import {
  getPreviousDate,
  getNextDate,
  getViewLabel,
} from "../utils/timelineUtils";

interface TimelineHeaderProps {
  viewType: TimelineViewType;
  currentDate: Date;
  onViewTypeChange: (type: TimelineViewType) => void;
  onDateChange: (date: Date) => void;
}

export function TimelineHeader({
  viewType,
  currentDate,
  onViewTypeChange,
  onDateChange,
}: TimelineHeaderProps) {
  const handlePrevious = () => {
    onDateChange(getPreviousDate(currentDate, viewType));
  };

  const handleNext = () => {
    onDateChange(getNextDate(currentDate, viewType));
  };

  const handleToday = () => {
    console.log("Today button clicked, setting date to:", new Date());
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="h-8 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-8 px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="h-8 gap-1.5"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Today</span>
        </Button>
      </div>

      <div className="text-sm font-medium text-foreground">
        {getViewLabel(currentDate, viewType)}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs text-muted-foreground">View:</span>
        <Select
          value={viewType}
          onValueChange={(value) => onViewTypeChange(value as TimelineViewType)}
        >
          <SelectTrigger className="h-8 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
