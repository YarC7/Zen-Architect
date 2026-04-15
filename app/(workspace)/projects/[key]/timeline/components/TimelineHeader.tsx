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
import { ChevronLeft, ChevronRight, CalendarDays, ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TimelineViewType } from "../types";
import {
  getPreviousDate,
  getNextDate,
  getViewLabel,
} from "../utils/timelineUtils";

interface TimelineHeaderProps {
  viewType: TimelineViewType;
  currentDate: Date;
  zoom: number;
  onViewTypeChange: (type: TimelineViewType) => void;
  onDateChange: (date: Date) => void;
  onZoomChange: (zoom: number) => void;
}

export function TimelineHeader({
  viewType,
  currentDate,
  zoom,
  onViewTypeChange,
  onZoomChange,
}: Omit<TimelineHeaderProps, "onDateChange">) {

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="text-sm font-semibold text-foreground bg-accent/30 px-3 py-1 rounded-md border border-border/50 shadow-sm ml-auto">
        {getViewLabel(currentDate, viewType)}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">View:</span>
        <Select
          value={viewType}
          onValueChange={(value) => onViewTypeChange(value as TimelineViewType)}
        >
          <SelectTrigger className="h-8 w-[100px] bg-background shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Days</SelectItem>
            <SelectItem value="week">Weeks</SelectItem>
            <SelectItem value="month">Months</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 pl-2 border-l border-border ml-2">
          <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={0.5}
            max={2}
            step={0.1}
            className="w-24 pointer-events-auto"
            onValueChange={([val]) => onZoomChange(val)}
          />
          <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
