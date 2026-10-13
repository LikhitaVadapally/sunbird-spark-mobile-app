/**
 * The skill codes a content node is tagged with: its own `skill` codes, falling back to
 * `se_skills` only when `skill` is empty. Mirrors the portal's `skillSource` in
 * `services/learningPath/learningPathMapper.ts` (upstream/learning_path): `skill` holds the
 * competency-framework codes the skill profile is keyed by, while older content carries
 * only `se_skills`.
 */
export function skillSource(node: { skill?: string[]; se_skills?: string[] } | undefined | null): string[] {
  const own = (node?.skill ?? []).filter(Boolean);
  const codes = own.length > 0 ? own : (node?.se_skills ?? []).filter(Boolean);
  return Array.from(new Set(codes));
}
