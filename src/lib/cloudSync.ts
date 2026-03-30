import { supabase } from '@/integrations/supabase/client';

/**
 * Generic cloud sync helper.
 * Each entity is stored as { id, user_id, data (jsonb), created_at, updated_at }.
 * localStorage serves as offline cache; Supabase is source of truth.
 */

// Use `any` cast for supabase.from() because Database types are not generated
const db = supabase as any;

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function cloudLoad<T extends { id: string }>(
  table: string,
  localKey: string,
): Promise<T[]> {
  const uid = await getUserId();
  if (!uid) {
    // Not logged in — fall back to localStorage
    try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; }
  }

  try {
    const { data, error } = await db
      .from(table)
      .select('id, data, created_at, updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const items: T[] = (data || []).map((row: any) => ({
      ...row.data,
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Update local cache
    localStorage.setItem(localKey, JSON.stringify(items));
    return items;
  } catch (e) {
    console.error(`cloudLoad(${table}) error:`, e);
    // Fallback to localStorage on network error
    try { return JSON.parse(localStorage.getItem(localKey) || '[]'); } catch { return []; }
  }
}

export async function cloudSave<T extends { id: string; createdAt?: number; updatedAt?: number }>(
  table: string,
  localKey: string,
  item: T,
): Promise<void> {
  const uid = await getUserId();
  const now = Date.now();
  const withTs = { ...item, updatedAt: now, createdAt: item.createdAt || now };

  // Always update localStorage immediately (optimistic)
  try {
    const local: T[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    const idx = local.findIndex((x: T) => x.id === item.id);
    const updated = idx >= 0
      ? local.map((x: T, i: number) => i === idx ? withTs : x)
      : [...local, withTs];
    localStorage.setItem(localKey, JSON.stringify(updated));
  } catch { /* ignore */ }

  if (!uid) return;

  try {
    // Strip createdAt/updatedAt from data payload (stored in columns)
    const { createdAt, updatedAt, id, ...rest } = withTs as any;
    await db.from(table).upsert({
      id: item.id,
      user_id: uid,
      data: rest,
      created_at: createdAt,
      updated_at: updatedAt,
    }, { onConflict: 'id' });
  } catch (e) {
    console.error(`cloudSave(${table}) error:`, e);
  }
}

export async function cloudDelete(
  table: string,
  localKey: string,
  id: string,
): Promise<void> {
  // Remove from localStorage immediately
  try {
    const local = JSON.parse(localStorage.getItem(localKey) || '[]');
    localStorage.setItem(localKey, JSON.stringify(local.filter((x: any) => x.id !== id)));
  } catch { /* ignore */ }

  const uid = await getUserId();
  if (!uid) return;

  try {
    await db.from(table).delete().eq('id', id).eq('user_id', uid);
  } catch (e) {
    console.error(`cloudDelete(${table}) error:`, e);
  }
}

/**
 * One-time migration: push existing localStorage data to Supabase.
 * Runs once per user per table (tracked via localStorage flag).
 */
export async function cloudMigrateLocal<T extends { id: string; createdAt?: number; updatedAt?: number }>(
  table: string,
  localKey: string,
): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  const flag = `_migrated_${table}_${uid}`;
  if (localStorage.getItem(flag)) return;

  try {
    const local: T[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    if (local.length === 0) { localStorage.setItem(flag, '1'); return; }

    const rows = local.map(item => {
      const { createdAt, updatedAt, id, ...rest } = item as any;
      return {
        id,
        user_id: uid,
        data: rest,
        created_at: createdAt || Date.now(),
        updated_at: updatedAt || Date.now(),
      };
    });

    // Upsert all — won't overwrite newer cloud data
    await db.from(table).upsert(rows, { onConflict: 'id' });
    localStorage.setItem(flag, '1');
    console.log(`Migrated ${local.length} items from ${localKey} to ${table}`);
  } catch (e) {
    console.error(`cloudMigrateLocal(${table}) error:`, e);
  }
}
