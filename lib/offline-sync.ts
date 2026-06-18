import { getOps, deleteOp, updateOp, type PendingOp } from "@/lib/offline-queue";

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export async function syncPendingOps(): Promise<SyncResult> {
  const ops = await getOps();
  if (!ops.length) return { synced: 0, failed: 0, errors: [] };

  let res: Response;
  try {
    res = await fetch("/api/offline/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ops }),
    });
  } catch {
    return { synced: 0, failed: ops.length, errors: ["Network error during sync"] };
  }

  if (!res.ok) {
    return { synced: 0, failed: ops.length, errors: [`Server error: ${res.status}`] };
  }

  const { results } = (await res.json()) as {
    results: { id: string; success: boolean; error?: string }[];
  };

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.success) {
      await deleteOp(result.id);
      synced++;
    } else {
      const op = ops.find((o: PendingOp) => o.id === result.id);
      await updateOp(result.id, {
        status: "failed",
        error: result.error,
        retries: (op?.retries ?? 0) + 1,
      });
      failed++;
      if (result.error) errors.push(result.error);
    }
  }

  return { synced, failed, errors };
}
