export interface Project {
  id: string;
  title: string;
  description: string;
  color: string; // HSL color
  createdAt: string; // ISO date
  updatedAt: string;
}

export type ViewType = 'kanban' | 'list' | 'timeline' | 'calendar';
