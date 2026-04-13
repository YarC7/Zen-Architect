import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, Plus, X, Settings } from "lucide-react";
import { LABEL_PRESETS, Assignee, BoardBackground, Activity, Card, Label } from "@/types/board";

interface BoardHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onAddColumn: (title: string) => void;
  allAssignees: Assignee[];
  filterLabel: string | null;
  filterAssignee: string | null;
  onFilterLabel: (id: string | null) => void;
  onFilterAssignee: (id: string | null) => void;
  hideControls?: boolean;
  background?: BoardBackground;
  onOpenSettings?: () => void;
  labels?: Label[];
  onAddLabel?: (name: string, color: string) => void;
  onUpdateLabel?: (id: string, name: string, color: string) => void;
  onDeleteLabel?: (id: string) => void;
  archivedCards?: Record<string, Card>;
  onRestoreCard?: (cardId: string) => void;
  onDeleteArchivedCard?: (cardId: string) => void;
  activities?: Activity[];
}

export function BoardHeader({
  title,
  onTitleChange,
  onAddColumn,
  allAssignees,
  filterLabel,
  filterAssignee,
  onFilterLabel,
  onFilterAssignee,
  hideControls = false,
  onOpenSettings,
  labels,
  onAddLabel,
  onUpdateLabel,
  onDeleteLabel,
  archivedCards,
  onRestoreCard,
  onDeleteArchivedCard,
  activities,
}: BoardHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [showAddCol, setShowAddCol] = useState(false);

  const hasFilter = filterLabel || filterAssignee;
  const archivedCount = archivedCards ? Object.keys(archivedCards).length : 0;

  return (
    <header className="flex items-center gap-3 px-6 py-4 border-b bg-card flex-wrap">
      {editing ? (
        <Input
          autoFocus
          className="text-xl font-bold w-64 h-9"
          defaultValue={title}
          onBlur={(e) => {
            onTitleChange(e.target.value || title);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      ) : (
        <h1
          className="text-xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
          onClick={() => setEditing(true)}
        >
          {title}
        </h1>
      )}

      {!hideControls && (
        <>
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
            <PopoverContent className="w-64 space-y-3" align="start">
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
                          filterLabel === l.id ? "white" : `hsl(${l.color})`,
                      }}
                      onClick={() =>
                        onFilterLabel(filterLabel === l.id ? null : l.id)
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
                          onFilterAssignee(
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
                    onFilterLabel(null);
                    onFilterAssignee(null);
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            {showAddCol ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newColTitle.trim()) {
                    onAddColumn(newColTitle.trim());
                    setNewColTitle("");
                    setShowAddCol(false);
                  }
                }}
              >
                <Input
                  autoFocus
                  placeholder="Column name"
                  className="h-8 w-40"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  onBlur={() => {
                    if (!newColTitle.trim()) setShowAddCol(false);
                  }}
                />
                <Button size="sm" type="submit" className="h-8">
                  Add
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowAddCol(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Column
              </Button>
            )}
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onOpenSettings}
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
                {archivedCount > 0 && (
                  <span className="ml-1 rounded-full bg-orange-500 text-white h-4 w-4 text-[10px] flex items-center justify-center">
                    {archivedCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </header>
  );
}
