/**
 * Granular Supabase write operations for board data.
 * Each function performs a single targeted DB operation.
 * Used by useBoardForProject to persist changes immediately.
 */

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// ─── Project ─────────────────────────────────────────────────────────

export async function dbUpdateProject(
  projectId: string,
  updates: {
    title?: string;
    background_type?: "color" | "image" | "gradient";
    background_value?: string;
  },
) {
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId);
  if (error) throw error;
}

// ─── Columns ─────────────────────────────────────────────────────────

export async function dbInsertColumn(data: {
  id: string;
  project_id: string;
  title: string;
  color: string;
  position: number;
  owner_id: string;
}) {
  const { error } = await supabase.from("columns").insert(data);
  if (error) throw error;
}

export async function dbUpdateColumn(
  colId: string,
  updates: { title?: string; color?: string; position?: number },
) {
  const { error } = await supabase
    .from("columns")
    .update(updates)
    .eq("id", colId);
  if (error) throw error;
}

export async function dbDeleteColumn(colId: string) {
  const { error } = await supabase
    .from("columns")
    .delete()
    .eq("id", colId);
  if (error) throw error;
}

export async function dbReorderColumns(
  updates: { id: string; position: number }[],
) {
  await Promise.all(
    updates.map(({ id, position }) =>
      supabase
        .from("columns")
        .update({ position })
        .eq("id", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
}

// ─── Cards ───────────────────────────────────────────────────────────

export async function dbInsertCard(data: {
  id: string;
  project_id: string;
  column_id: string;
  title: string;
  description?: string;
  completed?: boolean;
  is_archived?: boolean;
  position: number;
  owner_id: string;
}) {
  const { error } = await supabase.from("cards").insert(data);
  if (error) throw error;
}

export async function dbUpdateCard(
  cardId: string,
  updates: Partial<{
    column_id: string;
    project_id: string;
    title: string;
    description: string | null;
    start_date: string | null;
    due_date: string | null;
    start_time: string | null;
    due_time: string | null;
    completed: boolean;
    is_archived: boolean;
    position: number;
  }>,
) {
  const { error } = await supabase
    .from("cards")
    .update(updates)
    .eq("id", cardId);
  if (error) throw error;
}

export async function dbDeleteCard(cardId: string) {
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);
  if (error) throw error;
}

export async function dbDeleteCards(cardIds: string[]) {
  if (cardIds.length === 0) return;
  const { error } = await supabase
    .from("cards")
    .delete()
    .in("id", cardIds);
  if (error) throw error;
}

export async function dbBatchUpdateCards(
  updates: { id: string; column_id: string; position: number }[],
) {
  await Promise.all(
    updates.map(({ id, column_id, position }) =>
      supabase
        .from("cards")
        .update({ column_id, position })
        .eq("id", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
}

// ─── Labels ──────────────────────────────────────────────────────────

export async function dbInsertLabel(data: {
  id: string;
  project_id: string;
  name: string;
  color: string;
  owner_id: string;
}) {
  const { error } = await supabase.from("labels").insert(data);
  if (error) throw error;
}

export async function dbUpdateLabel(
  labelId: string,
  updates: { name?: string; color?: string },
) {
  const { error } = await supabase
    .from("labels")
    .update(updates)
    .eq("id", labelId);
  if (error) throw error;
}

export async function dbDeleteLabel(labelId: string) {
  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", labelId);
  if (error) throw error;
}

// ─── Card Labels (junction) ──────────────────────────────────────────

export async function dbSyncCardLabels(
  cardId: string,
  labelIds: string[],
) {
  const { error: delErr } = await supabase
    .from("card_labels")
    .delete()
    .eq("card_id", cardId);
  if (delErr) throw delErr;

  if (labelIds.length > 0) {
    const { error: insErr } = await supabase
      .from("card_labels")
      .insert(labelIds.map((lid) => ({ card_id: cardId, label_id: lid })));
    if (insErr) throw insErr;
  }
}

// ─── Card Assignees (junction) ───────────────────────────────────────

export async function dbSyncCardAssignees(
  cardId: string,
  profileIds: string[],
) {
  const { error: delErr } = await supabase
    .from("card_assignees")
    .delete()
    .eq("card_id", cardId);
  if (delErr) throw delErr;

  if (profileIds.length > 0) {
    const { error: insErr } = await supabase
      .from("card_assignees")
      .insert(
        profileIds.map((pid) => ({ card_id: cardId, profile_id: pid })),
      );
    if (insErr) throw insErr;
  }
}

// ─── Checklist Items ─────────────────────────────────────────────────

export async function dbSyncChecklistItems(
  cardId: string,
  items: { id: string; text: string; checked: boolean }[],
  ownerId: string,
) {
  // Get existing
  const { data: existing } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("card_id", cardId);

  const existingIds = new Set((existing || []).map((e: any) => e.id));
  const currentIds = new Set(items.map((i) => i.id));

  // Soft delete removed items
  const toDelete = [...existingIds].filter(
    (id) => !currentIds.has(id as string),
  ) as string[];
  if (toDelete.length > 0) {
    await supabase
      .from("checklist_items")
      .delete()
      .in("id", toDelete);
  }

  // Upsert current items (parallel)
  if (items.length > 0) {
    await Promise.all(
      items.map((item, i) =>
        supabase
          .from("checklist_items")
          .upsert({
            id: item.id,
            card_id: cardId,
            text: item.text,
            checked: item.checked,
            position: i,
            owner_id: ownerId,
          })
          .then(({ error }) => {
            if (error) throw error;
          }),
      ),
    );
  }
}


// ─── Activities (non-critical — never throw) ─────────────────────────

export async function dbInsertActivity(data: {
  id: string;
  project_id: string;
  card_id?: string | null;
  type: string;
  description: string;
  user_id: string;
  created_at: string;
}) {
  const { error } = await supabase.from("activities").upsert(data);
  if (error) console.warn("Could not persist activity", data.id, error);
}
