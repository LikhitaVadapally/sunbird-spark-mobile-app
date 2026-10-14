import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { collectionHierarchyQueryOptions } from './useCollection';
import { useUserEnrollmentList } from './useUserEnrollment';
import { useViewerSummary } from './useViewerSummary';
import { useSkillLabels, useSkillProfile } from './useSkillProfile';
import { buildCourseSummaryMapForContext, getPathSummary, parseCourseContextId } from '../services/viewer/summaryMapper';
import { parseLearningPath } from '../services/learningPath/learningPathMapper';
import { buildPathSkillSummary } from '../services/learningPath/skillAggregation';
import { aggregateMySkills, buildMySkills, heldCodeSet, withSourceNames } from '../services/skill/mySkills';
import { withSkillCodes } from '../services/skill/skillCodes';
import { isLearningPathCategory } from '../utils/isLearningPath';
import type { PathSkillSummary, SkillAggregate } from '../services/learningPath/skillAggregation';
import type { MySkillEntry } from '../services/skill/mySkills';
import type { SkillLabel } from '../services/skill';
import type { CollectionData, TrackableCollection } from '../types/collectionTypes';

/** Most-recent-activity ordering; `enrolledDate` arrives as either an epoch or an ISO string. */
function recencyOf(course: TrackableCollection): number {
  const enrolled = course.enrolledDate;
  if (typeof enrolled === 'number') return enrolled;
  const parsed = enrolled ? new Date(enrolled).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

interface EnrolledPath {
  pathId: string;
  contextId?: string;
  name: string;
}

export interface MySkillsEntry {
  path: EnrolledPath;
  /** Undefined until this path's hierarchy resolves. */
  summary?: PathSkillSummary;
  isLoading: boolean;
  isError: boolean;
}

export interface UseMySkillsResult {
  entries: MySkillsEntry[];
  summaries: PathSkillSummary[];
  /** Every gained and pending skill, by the rule in `services/skill/mySkills.ts`. */
  skills: MySkillEntry[];
  /** Codes held from any source - the "already gained" baseline for suggestions and paths. */
  heldCodes: ReadonlySet<string>;
  aggregate: SkillAggregate;
  /** Display name + group for a code. */
  labelOf: (code: string, frameworkId?: string) => SkillLabel;
  /** True while framework names load - render skeletons rather than de-slugged codes. */
  labelsLoading: boolean;
  /** Paths whose hierarchy has resolved — drives the "Analyzed X of Y" indicator. */
  analyzedCount: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  /** The skill profile failed: gained skills are unknown, so pending may include held skills. */
  profileError: boolean;
  refetch: () => void;
}

/**
 * Every skill the learner has gained (from the skill profile, any source) or still has pending
 * (on unfinished courses in enrolled Learning Paths) - ported from the portal's `useMySkills`.
 *
 * Pending skills live only in each path's hierarchy, so this fans out one hierarchy
 * query per enrolled path. They share `useCollection`'s cache keys, so a path
 * already opened elsewhere costs nothing, and results stream in individually —
 * the page renders each card as its query lands rather than blocking on all N.
 */
export function useMySkills(options?: { enabled?: boolean }): UseMySkillsResult {
  // Defaults to true so existing callers (MySkillsPage) are unaffected. The
  // Learning Progress card on My Learning passes `false` while the Courses tab
  // is selected — this hook fans out one hierarchy query PER enrolled path, so
  // running it for a screen that isn't showing skills is pure waste.
  const enabled = options?.enabled ?? true;
  const { userId, isAuthenticated } = useAuth();
  const enrolments = useUserEnrollmentList(userId, { enabled: enabled && isAuthenticated && !!userId });
  const { data: summaryRecords = [], isLoading: summaryLoading } = useViewerSummary();
  const profile = useSkillProfile({ enabled });

  const paths = useMemo<EnrolledPath[]>(() => {
    const courses = enrolments.data?.data?.courses ?? [];
    return courses
      // A Learning Path enrolment fans out one record per course under a composite
      // "<lpBatchId>:<courseId>" batchId — the path's own record represents it.
      .filter((c) => !parseCourseContextId(c.batchId))
      .filter((c) => isLearningPathCategory(c.content?.primaryCategory))
      .slice()
      .sort((a, b) => recencyOf(b) - recencyOf(a))
      .map((c) => ({ pathId: c.courseId ?? c.collectionId ?? '', contextId: c.batchId, name: c.content?.name ?? '' }))
      .filter((p) => !!p.pathId);
  }, [enrolments.data]);

  const hierarchyQueries = useQueries({
    queries: paths.map((path) => ({ ...collectionHierarchyQueryOptions(path.pathId), enabled })),
  });

  const models = useMemo(
    () =>
      hierarchyQueries.map((query) => {
        const root = (query?.data as CollectionData | null | undefined)?.hierarchyRoot;
        return root ? parseLearningPath(root) : null;
      }),
    [hierarchyQueries]
  );

  // Every framework in play: the profile's for gained names, each path's for its tags.
  const frameworkIds = useMemo(
    () => [
      ...profile.frameworkIds,
      ...models.map((m) => m?.competencyFramework).filter((id): id is string => Boolean(id)),
    ],
    [profile.frameworkIds, models]
  );
  const { labelOf, codeOf, isLoading: labelsLoading } = useSkillLabels(enabled ? frameworkIds : []);

  const entries = useMemo<MySkillsEntry[]>(
    () =>
      paths.map((path, i) => {
        const query = hierarchyQueries[i];
        const model = models[i];

        if (!model) {
          return { path, isLoading: !!query?.isLoading || summaryLoading, isError: !!query?.isError };
        }

        const pathSummary = getPathSummary(summaryRecords, path.pathId, path.contextId);
        // Scoped per path, NOT a single shared `indexSummaryByCollectionId` map:
        // that one is unscoped ("later records win on duplicate keys"), so when
        // two enrolled paths share a course, one path's progress leaked into the
        // other's skill summary. Matches what `useLearningPath` does for the
        // equivalent single-path computation.
        const summaryByCollectionId = buildCourseSummaryMapForContext(summaryRecords, path.contextId);
        // USF paths are tagged by skill NAME; the profile holds codes. Match on codes.
        const summary = buildPathSkillSummary(
          withSkillCodes(model, codeOf),
          pathSummary,
          summaryByCollectionId,
          path.contextId
        );
        return { path, summary, isLoading: false, isError: false };
      }),
    [paths, hierarchyQueries, models, codeOf, summaryRecords, summaryLoading]
  );

  const summaries = useMemo(
    () => entries.map((e) => e.summary).filter((s): s is PathSkillSummary => !!s),
    [entries]
  );
  // Evidence names its course by id; the enrolment list already has the names.
  const courseNames = useMemo(
    () =>
      new Map(
        (enrolments.data?.data?.courses ?? [])
          .filter((c) => c.content?.name)
          .map((c) => [c.courseId, c.content?.name ?? ''] as const)
      ),
    [enrolments.data]
  );
  const skills = useMemo(
    () => withSourceNames(buildMySkills(profile.skills, summaries), courseNames),
    [profile.skills, summaries, courseNames]
  );
  const heldCodes = useMemo(() => heldCodeSet(profile.skills), [profile.skills]);
  const aggregate = useMemo(() => aggregateMySkills(skills, summaries), [skills, summaries]);

  return {
    entries,
    summaries,
    skills,
    heldCodes,
    aggregate,
    labelOf,
    labelsLoading,
    analyzedCount: summaries.length,
    totalCount: paths.length,
    // Pending is "tagged minus held", so it cannot be shown before the profile lands without
    // flashing skills the learner already holds as pending.
    isLoading: enrolments.isLoading || summaryLoading || profile.isLoading,
    isError: enrolments.isError,
    profileError: profile.isError,
    refetch: () => {
      void enrolments.refetch();
      void profile.refetch();
    },
  };
}
