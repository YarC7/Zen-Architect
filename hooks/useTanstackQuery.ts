import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Project } from "@/types/project";
import { getProjectBoard, getAllProfiles } from "@/utils/supabase/queries";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

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

export const profileKeys = {
  all: ["profiles"] as const,
};

// --- Project Hooks ---

/**
 * Fetch all projects from Supabase
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      console.log("Fetching projects from Supabase...");
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      const formattedProjects: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        key:
          p.key ||
          p.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        title: p.title,
        description: p.description || "",
        color: p.color || "199 89% 48%",
        background: {
          type: (p.background_type as any) || "color",
          value: p.background_value || "0 0% 100%",
        },
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      console.log("Projects received & formatted:", formattedProjects);
      return formattedProjects;
    },
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Create or Update project in Supabase
 */
export function useUpdateProjectsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projects: Project[]) => {
      // TODO: Temporarily bypass auth check for testing purposes
      // In production, we need proper auth flow
      const userId = "temp-user-id";

      for (const project of projects) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectData: any = {
          id: project.id,
          key: project.key,
          title: project.title,
          background_type: project.background.type,
          background_value: project.background.value,
          owner_id: userId, // Temp: Use placeholder user ID
        };

        const { error } = await supabase.from("projects").upsert(projectData);

        if (error) throw error;
      }
      return projects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Delete a project from Supabase (hard delete, cascades via DB triggers)
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectKey: string) => {
      // Hard delete the project by key (DB should have ON DELETE CASCADE for related tables)
      const { error: projectError } = await supabase
        .from("projects")
        .delete()
        .eq("key", projectKey);

      if (projectError) throw projectError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
    onError: () => {
      toast.error("Failed to delete project. Please try again.");
    },
  });
}

// --- Board Hooks ---

/**
 * Fetch board state for a specific project by key
 */
export function useBoardQuery(projectKey: string) {
  return useQuery({
    queryKey: boardKeys.detail(projectKey),
    queryFn: () => getProjectBoard(projectKey),
    enabled: !!projectKey,
    // Disabled auto-refetch to preserve optimistic updates
    // Mutations handle all data changes with optimistic UI
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Cache is fresh after optimistic mutations
  });
}

/**
 * Fetch all user profiles for assignee selection
 */
export function useProfilesQuery() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => getAllProfiles(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
