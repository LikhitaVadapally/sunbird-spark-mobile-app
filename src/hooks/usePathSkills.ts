import { useCallback, useMemo } from 'react';
import { useSkillLabels, useSkillProfile } from './useSkillProfile';
import { getFinishedCourseIds } from '../services/learningPath/skillAggregation';
import { computePathSkills, type PathSkill, type PathSkillSummary } from '../services/learningPath/pathSkillStatus';
import { heldCodeSet } from '../services/skill/mySkills';
import type { LearningPathModel } from '../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

export interface UsePathSkillsResult {
  summary: PathSkillSummary | undefined;
  /** Codes held from any source - the same "gained" set My Skills uses. */
  heldCodes: ReadonlySet<string>;
  /** State of one code on this path; undefined for a code outside the gained/pending sets. */
  stateOf: (code: string) => PathSkill | undefined;
  /** Display name for a leaf code, from the framework; de-slugs when no framework knows it. */
  name: (code: string) => string;
  isLoading: boolean;
  /** The skill profile failed: nothing reads as gained, so the page should say why. */
  isError: boolean;
}

/**
 * Skill progress for the path the learner is on, by the same rule as My Skills (ported from the
 * portal's `hooks/usePathSkills.ts`): gained = in the skill profile (any source, any framework -
 * codes are the key), pending = still on a course here the learner has not finished.
 *
 * The framework is used for names only.
 */
export function usePathSkills(
  model: LearningPathModel,
  summaryByCollectionId: Map<string, ViewerSummaryRecord>,
  pathSummary?: ViewerSummaryRecord
): UsePathSkillsResult {
  const { skills, frameworkIds, isLoading: profileLoading, isError } = useSkillProfile();
  const ids = useMemo(
    () => [...(model.competencyFramework ? [model.competencyFramework] : []), ...frameworkIds],
    [model.competencyFramework, frameworkIds]
  );
  const { labelOf, isLoading: labelsLoading } = useSkillLabels(ids);

  const heldCodes = useMemo(() => heldCodeSet(skills), [skills]);
  const finishedCourseIds = useMemo(
    () => getFinishedCourseIds(model, pathSummary, summaryByCollectionId),
    [model, pathSummary, summaryByCollectionId]
  );

  const summary = useMemo(() => {
    const result = computePathSkills(model, heldCodes, finishedCourseIds);
    return result.total === 0 ? undefined : result;
  }, [model, heldCodes, finishedCourseIds]);

  const stateOf = useCallback((code: string) => summary?.skills.find((s) => s.code === code), [summary]);
  const name = useCallback(
    (code: string) => labelOf(code, model.competencyFramework).name,
    [labelOf, model.competencyFramework]
  );

  return { summary, heldCodes, stateOf, name, isLoading: profileLoading || labelsLoading, isError };
}
