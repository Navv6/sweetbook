import { getSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type { Project } from "@/types/project";

type StoredProjectRow = {
  payload?: Project | null;
};

const PROJECTS_TABLE = "projects";

export const saveProject = async (project: Project) => {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  await supabase.from(PROJECTS_TABLE).upsert({
    id: project.id,
    payload: project,
    updated_at: project.updatedAt,
  });
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("payload")
    .eq("id", projectId)
    .maybeSingle<StoredProjectRow>();

  if (error) {
    throw error;
  }

  return data?.payload ?? null;
};

export const findProjectBySweetBookIds = async (input: {
  orderUid?: string;
  bookUid?: string;
}): Promise<Project | null> => {
  if (!hasSupabaseConfig() || (!input.orderUid && !input.bookUid)) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("payload")
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<StoredProjectRow[]>();

  if (error) {
    throw error;
  }

  const matched = (data ?? []).find((row) => {
    const project = row.payload;
    if (!project) {
      return false;
    }

    return (
      (input.orderUid && project.sweetbookOrderUid === input.orderUid) ||
      (input.bookUid && project.sweetbookBookUid === input.bookUid)
    );
  });

  return matched?.payload ?? null;
};
