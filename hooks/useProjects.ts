import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Project } from "@/types/project";
import { BoardState, DEFAULT_BOARD } from "@/types/board";
import {
  useProjectsQuery,
  useUpdateProjectsMutation,
  useDeleteProjectMutation,
} from "./useTanstackQuery";

const BOARD_KEY_PREFIX = "kanban-board-";

export function loadIndex(): Project[] {
  const INDEX_KEY = "kanban-projects-index";
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveIndex(projects: Project[]) {
  const INDEX_KEY = "kanban-projects-index";
  localStorage.setItem(INDEX_KEY, JSON.stringify(projects));
}

function genId(): string {
  return uuidv4();
}

const PROJECT_COLORS = [
  "203 100% 94%", // Pastel Blue (#E3F2FD)
  "36 100% 94%", // Pastel Orange (#FFF3E0)
  "350 100% 96%", // Pastel Pink (#FFEBEE)
  "280 67% 93%", // Pastel Lavender (#F3E5F5)
  "129 44% 94%", // Pastel Green (#E8F5E9)
  "340 82% 94%", // Pastel Rose (#FCE4EC)
  "197 93% 94%", // Pastel Sky (#E1F5FE)
];

export function useProjects() {
  const { data: projects, isLoading } = useProjectsQuery();
  const updateProjectsMutation = useUpdateProjectsMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const setProjects = useCallback(
    (updater: Project[] | ((prev: Project[]) => Project[])) => {
      if (!projects) return;
      const nextProjects =
        typeof updater === "function" ? updater(projects) : updater;
      updateProjectsMutation.mutate(nextProjects);
    },
    [projects, updateProjectsMutation],
  );

  const createProject = useCallback(
    (title: string, description: string = "") => {
      const id = genId();
      const key = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const now = new Date().toISOString();
      const project: Project = {
        id,
        key,
        title,
        description,
        color: PROJECT_COLORS[(projects?.length || 0) % PROJECT_COLORS.length],
        background: {
          type: "color",
          value: "0 0% 100%",
        },
        createdAt: now,
        updatedAt: now,
      };

      // Initialize default board for this project in Supabase
      const board: BoardState = { ...DEFAULT_BOARD, title, projectId: id };
      localStorage.setItem(BOARD_KEY_PREFIX + id, JSON.stringify(board));

      setProjects((prev) => [...prev, project]);
      return key;
    },
    [projects?.length, setProjects],
  );

  const deleteProject = useCallback(
    (id: string) => {
      localStorage.removeItem(BOARD_KEY_PREFIX + id);
      // Also delete from Supabase (soft delete with cascade)
      deleteProjectMutation.mutate(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [setProjects, deleteProjectMutation],
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Pick<Project, "title" | "description">>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p,
        ),
      );
    },
    [setProjects],
  );

  return {
    projects: projects || [],
    isLoading,
    createProject,
    deleteProject,
    updateProject,
  };
}

export function loadBoardForProject(projectId: string): BoardState {
  try {
    const raw = localStorage.getItem(BOARD_KEY_PREFIX + projectId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_BOARD;
}

export function saveBoardForProject(projectId: string, state: BoardState) {
  localStorage.setItem(BOARD_KEY_PREFIX + projectId, JSON.stringify(state));
}
