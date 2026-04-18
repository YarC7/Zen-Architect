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
  // Create a timeout promise to prevent hanging queries
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("getProjectBoard timed out after 15 seconds")),
      15000,
    );
  });

  // 1. Fetch project meta by key
  const projectPromise = (async () => {
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
        owner_id: string;
      } | null;
      error: Error | null;
    };

    if (projectError) throw projectError;
    if (!project) throw new Error(`Project not found: ${projectKey}`);

    return project;
  })();

  // Execute both the timeout and the query, whichever resolves first wins
  const project = await Promise.race([projectPromise, timeoutPromise]);

  // Fetch other data in parallel with a timeout
  const otherDataPromise = Promise.all([
    // 2. Fetch columns ordered by position (exclude deleted)
    supabase
      .from("columns")
      .select("*")
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("position", { ascending: true }),

    // 3. Fetch cards with related data (exclude soft-deleted)
    supabase
      .from("cards")
      .select(
        `
        *,
        card_labels (labels (*)),
        card_assignees (profiles!profile_id (*)),
        card_comments (*, profiles!profile_id (*)),
        checklist_items (*)
      `,
      )
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .order("position", { ascending: true }),

    // 4. Fetch unique labels for this project (exclude soft-deleted)
    supabase
      .from("labels")
      .select("*")
      .eq("project_id", project.id)
      .is("deleted_at", null),

    // 5. Fetch activities with user profiles
    supabase
      .from("activities")
      .select("*, profiles!user_id(*)")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
  ]);

  const timeoutPromise2 = new Promise<never>((_, reject) => {
    setTimeout(
      () =>
        reject(
          new Error("getProjectBoard data fetch timed out after 15 seconds"),
        ),
      15000,
    );
  });

  const [columnsResult, cardsResult, labelsResult, activitiesResult] =
    await Promise.race([otherDataPromise, timeoutPromise2]);

  if (columnsResult.error) throw columnsResult.error;
  if (cardsResult.error) throw cardsResult.error;
  if (labelsResult.error) throw labelsResult.error;
  if (activitiesResult.error) throw activitiesResult.error;

  const columns = columnsResult.data;
  const cards = cardsResult.data;
  const labels = labelsResult.data;
  const activities = activitiesResult.data;

  // --- TRANSFORM BACK TO BoardState ---
  // Add safeguards to prevent infinite loops or crashes
  const MAX_CARDS_PER_PROJECT = 10000; // Reasonable upper limit
  const cardsLookup: Record<string, Card> = {};
  const archivedCards: Record<string, Card> = {};

  cards?.slice(0, MAX_CARDS_PER_PROJECT).forEach((dbCard: any) => {
    const formattedCard: Card = {
      id: dbCard.id,
      title: dbCard.title,
      description: dbCard.description || "",
      completed: dbCard.completed,
      startDate: dbCard.start_date,
      dueDate: dbCard.due_date,
      startTime: dbCard.start_time,
      dueTime: dbCard.due_time,
      labels: Array.isArray(dbCard.card_labels)
        ? dbCard.card_labels.map((cl: any) => cl.labels)
        : [],
      assignees: Array.isArray(dbCard.card_assignees)
        ? dbCard.card_assignees.map((ca: any) => ({
            id: ca.profiles.id,
            name: ca.profiles.full_name || ca.profiles.username || "Unknown",
            color: ca.profiles.color || "199 89% 48%",
            avatarUrl: ca.profiles.avatar_url,
          }))
        : [],
      checklist: Array.isArray(dbCard.checklist_items)
        ? dbCard.checklist_items
            .filter((ci: any) => !ci.deleted_at)
            .sort((a: any, b: any) => a.position - b.position)
            .map((ci: any) => ({
              id: ci.id,
              text: ci.text,
              checked: ci.checked,
            }))
        : [],
      comments: Array.isArray(dbCard.card_comments)
        ? dbCard.card_comments
            .filter((cc: any) => !cc.deleted_at)
            .map((cc: any) => ({
              id: cc.id,
              author: cc.profiles?.full_name || cc.profiles?.username || "System",
              text: cc.text,
              authorAvatarUrl: cc.profiles?.avatar_url,
              createdAt: cc.created_at,
            }))
        : [],
      activities: [], // Will be populated below
      createdAt: dbCard.created_at,
      updatedAt: dbCard.updated_at,
    };

    if (dbCard.is_archived) {
      archivedCards[dbCard.id] = formattedCard;
    } else {
      cardsLookup[dbCard.id] = formattedCard;
    }
  });

  // Map card-level activities from the activities table
  const formattedActivities =
    (activities || [])?.map((act: any) => ({
      id: act.id,
      type: act.type as any,
      user: act.profiles?.full_name || act.profiles?.username || "User",
      userId: act.user_id,
      userAvatarUrl: act.profiles?.avatar_url,
      description: act.description,
      createdAt: act.created_at,
      cardId: act.card_id, // Include card_id to map to cards
    })) || [];

  // Assign card-level activities to their respective cards
  formattedActivities.forEach((activity: any) => {
    if (activity.cardId && cardsLookup[activity.cardId]) {
      cardsLookup[activity.cardId].activities?.push({
        id: activity.id,
        type: activity.type,
        user: activity.user,
        userId: activity.userId,
        description: activity.description,
        createdAt: activity.createdAt,
      });
    }
    if (activity.cardId && archivedCards[activity.cardId]) {
      archivedCards[activity.cardId].activities?.push({
        id: activity.id,
        type: activity.type,
        user: activity.user,
        userId: activity.userId,
        description: activity.description,
        createdAt: activity.createdAt,
      });
    }
  });

  // Safely map card IDs to columns as originally expected by ZenArc UI
  const formattedColumns: Column[] = (columns || []).map((col: any) => ({
    id: col.id,
    title: col.title,
    color: col.color,
    cardIds: Array.isArray(cards)
      ? cards
          .filter((c: any) => c.column_id === col.id && !c.is_archived)
          .map((c: any) => c.id)
          .slice(0, 1000) // Limit card IDs per column to prevent memory issues
      : [],
  }));

  // Filter out card-level activities for project-level activities
  const projectActivities = formattedActivities.filter(
    (act: any) => !act.cardId,
  );

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
    activities: projectActivities,
    ownerId: project.owner_id,
  };
}

/**
 * Fetch all user profiles from Supabase.
 */
export async function getAllProfiles(): Promise<Assignee[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, color, avatar_url")
    .order("username", { ascending: true });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || p.username || "Unknown",
    color: p.color || "199 89% 48%",
    avatarUrl: p.avatar_url,
  }));
}
