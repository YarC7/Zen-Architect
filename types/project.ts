export interface Project {
  id: string;
  key: string;
  title: string;
  description: string;
  color: string; // HSL color
  background: {
    type: "color" | "image" | "gradient";
    value: string;
  };
  createdAt: string; // ISO date
  updatedAt: string;
}

export type ViewType = "kanban" | "list" | "timeline" | "calendar";
