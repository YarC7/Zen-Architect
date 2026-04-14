"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { Assignee } from "@/types/board";
import { LABEL_PRESETS } from "@/types/board";

interface FiltersPanelProps {
  filterLabel: string | null;
  filterAssignee: string | null;
  allAssignees: Assignee[];
  setFilterLabel: (label: string | null) => void;
  setFilterAssignee: (assignee: string | null) => void;
}

export function FiltersPanel({
  filterLabel,
  filterAssignee,
  allAssignees,
  setFilterLabel,
  setFilterAssignee,
}: FiltersPanelProps) {
  const hasFilter = Boolean(filterLabel || filterAssignee);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={hasFilter ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          {hasFilter && (
            <span className="ml-1 rounded-full bg-primary-foreground text-primary h-4 w-4 text-[10px] flex items-center justify-center">
              {(filterLabel ? 1 : 0) + (filterAssignee ? 1 : 0)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="end">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
            Labels
          </p>
          <div className="flex flex-wrap gap-1">
            {LABEL_PRESETS.map((l) => (
              <Badge
                key={l.id}
                className="cursor-pointer text-[11px]"
                style={{
                  backgroundColor:
                    filterLabel === l.id
                      ? `hsl(${l.color})`
                      : `hsl(${l.color} / 0.15)`,
                  color:
                    filterLabel === l.id
                      ? "white"
                      : `hsl(${l.color})`,
                }}
                onClick={() =>
                  setFilterLabel(filterLabel === l.id ? null : l.id)
                }
              >
                {l.name}
              </Badge>
            ))}
          </div>
        </div>
        {allAssignees.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              Assignees
            </p>
            <div className="flex flex-wrap gap-1">
              {allAssignees.map((a) => (
                <Badge
                  key={a.id}
                  variant={
                    filterAssignee === a.id ? "default" : "outline"
                  }
                  className="cursor-pointer text-[11px]"
                  onClick={() =>
                    setFilterAssignee(
                      filterAssignee === a.id ? null : a.id,
                    )
                  }
                >
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setFilterLabel(null);
              setFilterAssignee(null);
            }}
          >
            <X className="h-3 w-3 mr-1" /> Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}