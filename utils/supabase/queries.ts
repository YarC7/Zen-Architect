import { createClient } from "@/utils/supabase/client";
import {
  BoardState,
  Card,
  Column,
  Label,
  Activity,
  ChecklistItem,
  Assignee,
} from "@/types/board";
import { Database } from "@/types/supabase";

const supabase = createClient();

/**
 * Fetch a complete project board from Supabase and format it as BoardState.
 * Queries by project `key` (the URL slug), then uses the internal `id`
 * for all foreign-key joins.
 */
export async function getProjectBoard(projectKey: string): Promise<BoardState> {
  // 1. Fetch project meta by key
  const { data: project, error: projectError } = (await supabase
    .from("projects")
    .select("*")
    .eq("key", projectKey)
    .single()) as {
    data: {
      id: string;
      title: string;
      background_type: string;
      background_value: string;
    } | null;
    error: Error | null;
  };

  if (projectError) throw projectError;
  if (!project) throw new Error(`Project not found: ${projectKey}`);

  // 2. Fetch columns ordered by position (exclude deleted)
  const { data: columns, error: columnsError } = await supabase
    .from("columns")
    .select("*")
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (columnsError) throw columnsError;

  // 3. Fetch cards with related data (exclude soft-deleted)
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(
      `
      *,
      card_labels (labels (*)),
      card_assignees (profiles (*)),
      card_comments (*, profiles (*)),
      checklist_items (*)
    `,
    )
    .eq("project_id", project.id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (cardsError) throw cardsError;

  // 4. Fetch unique labels for this project (exclude soft-deleted)
  const { data: labels, error: labelsError } = await supabase
    .from("labels")
    .select("*")
    .eq("project_id", project.id)
    .is("deleted_at", null);

  if (labelsError) throw labelsError;

  // 5. Fetch activities
  const { data: activities, error: activityError } = await supabase
    .from("activities")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (activityError) throw activityError;

  // --- TRANSFORM BACK TO BoardState ---

  const cardsLookup: Record<string, Card> = {};
  const archivedCards: Record<string, Card> = {};

  cards?.forEach((dbCard: any) => {
    const formattedCard: Card = {
      id: dbCard.id,
      title: dbCard.title,
      description: dbCard.description || "",
      completed: dbCard.completed,
      startDate: dbCard.start_date,
      dueDate: dbCard.due_date,
      startTime: dbCard.start_time,
      dueTime: dbCard.due_time,
      labels: dbCard.card_labels.map((cl: any) => cl.labels),
      assignees: dbCard.card_assignees.map((ca: any) => ({
        id: ca.profiles.id,
        name: ca.profiles.username || "Unknown",
        color: ca.profiles.color || "199 89% 48%",
      })),
      checklist: (dbCard.checklist_items || [])
        .filter((ci: any) => !ci.deleted_at)
        .sort((a: any, b: any) => a.position - b.position)
        .map((ci: any) => ({
          id: ci.id,
          text: ci.text,
          checked: ci.checked,
        })),
      comments: dbCard.card_comments
        .filter((cc: any) => !cc.deleted_at)
        .map((cc: any) => ({
          id: cc.id,
          author: cc.profiles.username || "System",
          text: cc.text,
          createdAt: cc.created_at,
        })),
      createdAt: dbCard.created_at,
      updatedAt: dbCard.updated_at,
    };

    if (dbCard.is_archived) {
      archivedCards[dbCard.id] = formattedCard;
    } else {
      cardsLookup[dbCard.id] = formattedCard;
    }
  });

  // Map card IDs to columns as originally expected by ZenArc UI
  const formattedColumns: Column[] = (columns || []).map((col: any) => ({
    id: col.id,
    title: col.title,
    color: col.color,
    cardIds:
      (cards || [])
        ?.filter((c: any) => c.column_id === col.id && !c.is_archived)
        .map((c: any) => c.id) || [],
  }));

  return {
    projectId: project.id,
    title: (project as any).title,
    background: {
      type: (project as any).background_type as any,
      value: (project as any).background_value,
    },
    columns: formattedColumns,
    cards: cardsLookup,
    labels: labels || [],
    archivedCards,
    activities:
      (activities || [])?.map((act: any) => ({
        id: act.id,
        type: act.type as any,
        user: "User", // In a real app, join with profile
        description: act.description,
        createdAt: act.created_at,
      })) || [],
  };
}

/**
 * Fetch all user profiles from Supabase.
 */
export async function getAllProfiles(): Promise<Assignee[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, color")
    .order("username", { ascending: true });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || p.username || "Unknown",
    color: p.color || "199 89% 48%",
  }));
}
