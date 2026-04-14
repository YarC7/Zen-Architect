import { ViewType } from "@/types/project";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Clock, CalendarDays } from "lucide-react";

interface ViewTabsProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export function ViewTabs({ activeView, setActiveView }: ViewTabsProps) {
  return (
    <Tabs
      value={activeView}
      onValueChange={(v) => setActiveView(v as ViewType)}
      className="flex-1"
    >
      <TabsList className="h-9">
        <TabsTrigger value="kanban" className="gap-1.5 text-xs px-3">
          <LayoutGrid className="h-3.5 w-3.5" /> Kanban
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-1.5 text-xs px-3">
          <List className="h-3.5 w-3.5" /> List
        </TabsTrigger>
        <TabsTrigger value="timeline" className="gap-1.5 text-xs px-3">
          <Clock className="h-3.5 w-3.5" /> Timeline
        </TabsTrigger>
        <TabsTrigger value="calendar" className="gap-1.5 text-xs px-3">
          <CalendarDays className="h-3.5 w-3.5" /> Calendar
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}