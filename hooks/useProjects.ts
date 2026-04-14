import { useCallback, useMemo } from "react";
import { Project } from "@/types/project";
import { BoardState, DEFAULT_BOARD } from "@/types/board";
import {
  useProjectsQuery,
  useUpdateProjectsMutation,
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

let idCounter = Date.now();
function genId() {
  return `proj-${++idCounter}`;
}

const PROJECT_COLORS = [
  "199 89% 48%",
  "142 71% 45%",
  "262 83% 58%",
  "25 95% 53%",
  "330 81% 60%",
  "0 84% 60%",
];

export function useProjects() {
  const { data: projects, isLoading } = useProjectsQuery();
  const updateProjectsMutation = useUpdateProjectsMutation();

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
      const now = new Date().toISOString();
      const project: Project = {
        id,
        title,
        description,
        color: PROJECT_COLORS[(projects?.length || 0) % PROJECT_COLORS.length],
        createdAt: now,
        updatedAt: now,
      };

      // Initialize default board for this project
      const board: BoardState = { ...DEFAULT_BOARD, title };
      localStorage.setItem(BOARD_KEY_PREFIX + id, JSON.stringify(board));

      setProjects((prev) => [...prev, project]);
      return id;
    },
    [projects?.length, setProjects],
  );

  const deleteProject = useCallback(
    (id: string) => {
      localStorage.removeItem(BOARD_KEY_PREFIX + id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [setProjects],
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
