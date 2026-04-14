import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types/project";
import {
  loadIndex,
  saveIndex,
  loadBoardForProject,
  saveBoardForProject,
} from "@/hooks/useProjects";
import { BoardState, DEFAULT_BOARD } from "@/types/board";

function normalizeBoard(state: BoardState): BoardState {
  return {
    ...state,
    labels: state.labels ?? DEFAULT_BOARD.labels,
    background: state.background ?? DEFAULT_BOARD.background,
    archivedCards: state.archivedCards ?? {},
    activities: state.activities ?? [],
  };
}

// --- Key Factories ---
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
};

export const boardKeys = {
  all: ["boards"] as const,
  detail: (projectId: string) =>
    [...boardKeys.all, "detail", projectId] as const,
};

// --- Project Hooks ---

/**
 * Fetch all projects from localStorage
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: () => loadIndex() as Project[],
  });
}

/**
 * Save/Update projects index to localStorage
 */
export function useUpdateProjectsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projects: Project[]) => {
      saveIndex(projects);
      return projects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// --- Board Hooks ---

/**
 * Fetch board state for a specific project
 */
export function useBoardQuery(projectId: string) {
  return useQuery({
    queryKey: boardKeys.detail(projectId),
    queryFn: () => normalizeBoard(loadBoardForProject(projectId)),
    enabled: !!projectId,
  });
}

/**
 * Save/Update board state to localStorage
 */
export function useUpdateBoardMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (board: BoardState) => {
      saveBoardForProject(projectId, board);
      return board;
    },
    // Chúng ta sử dụng onMutate để thực hiện Optimistic Update cho trải nghiệm mượt mà
    onMutate: async (newBoard) => {
      await queryClient.cancelQueries({
        queryKey: boardKeys.detail(projectId),
      });
      const previousBoard = queryClient.getQueryData(
        boardKeys.detail(projectId),
      );
      queryClient.setQueryData(boardKeys.detail(projectId), newBoard);
      return { previousBoard };
    },
    onError: (err, newBoard, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          boardKeys.detail(projectId),
          context.previousBoard,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(projectId) });
    },
  });
}
