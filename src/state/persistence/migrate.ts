/**
 * Schema migrations (spec §4.7): an array of functions, one per version step. `MIGRATIONS[i]` upgrades schema
 * `i + 1` to `i + 2`.
 */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONS: readonly Migration[] = [
  // 1 → 2 (M4 audio): settings gain per-bus volumes and a per-layer ambience mix. Existing users keep everything else.
  (data) => {
    const settings = (typeof data.settings === "object" && data.settings !== null ? data.settings : {}) as Record<string, unknown>;
    return {
      ...data,
      settings: { ...settings, volumes: { music: 0.5, ambience: 0.35, ui: 0.7 }, ambienceMix: {} },
    };
  },
];

/** Stored data written by a NEWER build of the app. It must never be overwritten by an older one. */
export class NewerSchemaError extends Error {}

/** Upgrade parsed storage data to the current schema, or throw if it is not something we can read. */
export function migrate(data: unknown, migrations: readonly Migration[] = MIGRATIONS): unknown {
  if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error("stored data is not an object");
  let current = data as Record<string, unknown>;
  const target = migrations.length + 1;
  let version = current.schema;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) throw new Error("stored data has no schema version");
  // Data from a NEWER app than this one: do not guess. It is backed up and the user starts fresh.
  if (version > target) throw new NewerSchemaError(`stored data is from a newer version (${version} > ${target})`);
  while (version < target) {
    const step = migrations[version - 1];
    if (!step) throw new Error(`no migration from schema ${version}`);
    current = { ...step(current), schema: version + 1 };
    version += 1;
  }
  return current;
}
