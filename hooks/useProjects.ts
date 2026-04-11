import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/project';
import { DEFAULT_BOARD, BoardState } from '@/types/board';

const INDEX_KEY = 'kanban-projects-index';
const BOARD_KEY_PREFIX = 'kanban-board-';

function loadIndex(): Project[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveIndex(projects: Project[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(projects));
}

let idCounter = Date.now();
function genId() {
  return `proj-${++idCounter}`;
}

const PROJECT_COLORS = [
  '199 89% 48%',
  '142 71% 45%',
  '262 83% 58%',
  '25 95% 53%',
  '330 81% 60%',
  '0 84% 60%',
];

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadIndex);

  useEffect(() => {
    saveIndex(projects);
  }, [projects]);

  const createProject = useCallback((title: string, description: string = '') => {
    const id = genId();
    const now = new Date().toISOString();
    const project: Project = {
      id,
      title,
      description,
      color: PROJECT_COLORS[loadIndex().length % PROJECT_COLORS.length],
      createdAt: now,
      updatedAt: now,
    };

    // Initialize default board for this project
    const board: BoardState = { ...DEFAULT_BOARD, title };
    localStorage.setItem(BOARD_KEY_PREFIX + id, JSON.stringify(board));

    // Save synchronously so navigation doesn't lose data
    const updated = [...loadIndex(), project];
    saveIndex(updated);
    setProjects(updated);

    return id;
  }, []);

  const deleteProject = useCallback((id: string) => {
    localStorage.removeItem(BOARD_KEY_PREFIX + id);
    const updated = loadIndex().filter(p => p.id !== id);
    saveIndex(updated);
    setProjects(updated);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Pick<Project, 'title' | 'description'>>) => {
    const updated = loadIndex().map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveIndex(updated);
    setProjects(updated);
  }, []);

  return { projects, createProject, deleteProject, updateProject };
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
