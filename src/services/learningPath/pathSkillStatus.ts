import type { LearningPathModel } from '../../types/learningPathTypes';
import { derivePathSkillCodes, splitPathSkills } from './skillAggregation';

export type SkillState = 'held' | 'pending';

export interface PathSkill {
  code: string;
  state: SkillState;
}

export interface PathSkillSummary {
  /** Held first, then pending - the same set My Skills counts for this path. */
  skills: PathSkill[];
  held: number;
  total: number;
}

/**
 * Per-skill status for the Learning Path the learner is on, by the same rule as My Skills
 * (`services/skill/mySkills.ts`), so the counts on both pages always agree.
 *
 * Held = in the learner's skill profile, from ANY source. Pending = still on a course here the
 * learner has not finished. A skill on a finished course that the profile does not record is in
 * neither list - the profile is the truth for "gained", and nothing here is left to do about it.
 *
 * Binary on purpose. A former "in progress" state (the best course percentage) made a half-watched
 * course look like a half-held skill; the evidence model has no such thing, so neither does this.
 */
export function computePathSkills(
  model: LearningPathModel,
  heldCodes: ReadonlySet<string>,
  finishedCourseIds: ReadonlySet<string>
): PathSkillSummary {
  const { gained, pending } = splitPathSkills(derivePathSkillCodes(model, finishedCourseIds), heldCodes);
  const skills: PathSkill[] = [
    ...gained.map((code) => ({ code, state: 'held' as const })),
    ...pending.map((code) => ({ code, state: 'pending' as const })),
  ];
  return { skills, held: gained.length, total: skills.length };
}
