import { useCallback, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { AppInitializer } from '../AppInitializer';
import { useAuth } from '../contexts/AuthContext';
import {
  skillService,
  normaliseProfile,
  normaliseFrameworkMeta,
  buildSkillVocabulary,
  resolveSkillLabel,
  type SkillLabel,
  type SkillVocabulary,
  type TaxonomyFrameworkResponse,
} from '../services/skill';
import { frameworkService } from '../services/FrameworkService';
import type { CompetencyFrameworkMeta, HeldSkill } from '../types/skillServiceTypes';

const NO_SKILLS: HeldSkill[] = [];

/**
 * The learner's held skills (`POST /skill/v1/profile/read`), ported from the portal's
 * `hooks/useSkillProfile.ts`. `evidence: true` so a card can answer "what proved this?"
 * without a second round trip. Gap / recommend / role hooks are deliberately not ported
 * until roles are mapped.
 *
 * `isError` is surfaced rather than swallowed: an unreachable API and an empty profile are
 * indistinguishable otherwise, and callers fall back differently on each.
 */
export function useSkillProfile(options?: { enabled?: boolean }): {
  skills: HeldSkill[];
  /** Codes of every held skill, for O(1) "does the learner hold this?" checks. */
  heldCodes: Set<string>;
  frameworkIds: string[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
} {
  const { userId } = useAuth();
  const query = useQuery({
    queryKey: ['skillProfile', userId],
    queryFn: async () => normaliseProfile((await skillService.profileRead({ evidence: true })).data),
    enabled: (options?.enabled ?? true) && Boolean(userId) && AppInitializer.isInitialized(),
    staleTime: 60 * 1000,
  });

  // A stable empty array: a fresh `[]` per render would re-run every memo keyed on it.
  const skills: HeldSkill[] = query.data ?? NO_SKILLS;
  const heldCodes = useMemo(() => new Set(skills.map((s) => s.skillId)), [skills]);
  const frameworkIds = useMemo(
    () => Array.from(new Set(skills.map((s) => s.frameworkId).filter(Boolean))),
    [skills]
  );

  return {
    skills,
    heldCodes,
    frameworkIds,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * The skill tree of each framework, as a code -> name/parent index.
 *
 * Display names and the parent term ("Infection Prevention") live only on the taxonomy
 * framework's nested terms, so this is the one read the learner side needs. Shares its cache
 * key with `useSkillFrameworks`, so no page reads the same tree twice.
 */
export function useSkillVocabularies(frameworkIds: string[]): {
  vocabularies: Record<string, SkillVocabulary | undefined>;
  isLoading: boolean;
} {
  const ids = useMemo(() => Array.from(new Set(frameworkIds.filter(Boolean))).sort(), [frameworkIds]);

  const treeQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['taxonomyFramework', id],
      queryFn: () => frameworkService.read<TaxonomyFrameworkResponse>(id),
      enabled: Boolean(id),
      // A framework changes on publish, not per session.
      staleTime: 30 * 60 * 1000,
    })),
  });

  const vocabularies = useMemo(() => {
    const out: Record<string, SkillVocabulary | undefined> = {};
    ids.forEach((id, i) => {
      out[id] = buildSkillVocabulary(id, treeQueries[i]?.data?.data);
    });
    return out;
  }, [ids, treeQueries]);

  return { vocabularies, isLoading: treeQueries.some((q) => q.isLoading) };
}

/**
 * Name + group label for any skill code, across the given frameworks.
 *
 * `isLoading` is exposed so a page can hold a skeleton while names resolve, instead of flashing
 * de-slugged codes that then change under the learner. Once loaded, a code no framework knows
 * still de-slugs - see `resolveSkillLabel`.
 */
export function useSkillLabels(frameworkIds: string[]): {
  labelOf: (code: string, frameworkId?: string) => SkillLabel;
  isLoading: boolean;
} {
  const { vocabularies, isLoading } = useSkillVocabularies(frameworkIds);
  const labelOf = useCallback(
    (code: string, frameworkId?: string) => resolveSkillLabel(Object.values(vocabularies), code, frameworkId),
    [vocabularies]
  );
  return { labelOf, isLoading };
}

/**
 * Resolved framework meta plus the skill tree, for every given framework.
 *
 * TWO READS PER FRAMEWORK, deliberately. The competency read gives tier labels, the flat
 * leaf list and each role's required set, but NO tree and NO display names - those live on
 * the taxonomy framework's nested terms (see `useSkillVocabularies`). `useQueries` because the
 * framework count is data-dependent.
 */
export function useSkillFrameworks(frameworkIds: string[]): {
  metas: Record<string, CompetencyFrameworkMeta | undefined>;
  vocabularies: Record<string, SkillVocabulary | undefined>;
  isLoading: boolean;
} {
  const ids = useMemo(() => Array.from(new Set(frameworkIds.filter(Boolean))).sort(), [frameworkIds]);

  const metaQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['competencyFrameworkV2', id],
      queryFn: async () => normaliseFrameworkMeta((await skillService.frameworkRead(id)).data),
      enabled: Boolean(id),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const { vocabularies, isLoading: treeLoading } = useSkillVocabularies(ids);

  const metas = useMemo(() => {
    const out: Record<string, CompetencyFrameworkMeta | undefined> = {};
    ids.forEach((id, i) => {
      out[id] = metaQueries[i]?.data;
    });
    return out;
  }, [ids, metaQueries]);

  return {
    metas,
    vocabularies,
    isLoading: metaQueries.some((q) => q.isLoading) || treeLoading,
  };
}
