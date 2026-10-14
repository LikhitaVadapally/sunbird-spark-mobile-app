import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMySkills } from './useMySkills';
import { LP_HIERARCHY_NO_ASSESSMENTS } from '../services/learningPath/__fixtures__/lpHierarchyNoAssessments.fixture';
import type { HeldSkill } from '../types/skillServiceTypes';

const LP_ID = LP_HIERARCHY_NO_ASSESSMENTS.identifier;

let mockCourses: Array<Record<string, unknown>> = [];

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ userId: 'u1', isAuthenticated: true }),
}));

vi.mock('./useUserEnrollment', () => ({
  useUserEnrollmentList: () => ({
    data: { data: { courses: mockCourses } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('./useViewerSummary', () => ({
  useViewerSummary: () => ({ data: [], isLoading: false }),
}));

let mockHeld: HeldSkill[] = [];
// USF names -> codes, as the framework vocabulary would resolve them.
const USF_CODES: Record<string, string> = { 'python programming': 'pp', 'java programming': 'jp', javascript: 'js' };
let mockProfileError = false;
const profileEnabled: Array<boolean | undefined> = [];
vi.mock('./useSkillProfile', () => ({
  useSkillProfile: (options?: { enabled?: boolean }) => {
    profileEnabled.push(options?.enabled);
    return { skills: mockHeld, frameworkIds: [], isLoading: false, isError: mockProfileError, refetch: vi.fn() };
  },
  useSkillLabels: () => ({
    labelOf: (code: string) => ({ name: code, resolved: false }),
    codeOf: (tag: string) => USF_CODES[tag.toLowerCase()] ?? tag,
    isLoading: false,
  }),
}));

vi.mock('./useCollection', () => ({
  collectionHierarchyQueryOptions: (collectionId: string | undefined) => ({
    queryKey: ['collection-hierarchy', collectionId],
    queryFn: async () => ({ id: collectionId, hierarchyRoot: LP_HIERARCHY_NO_ASSESSMENTS, children: [] }),
    enabled: !!collectionId,
  }),
}));

function learningPathEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    courseId: LP_ID,
    collectionId: LP_ID,
    batchId: 'batch-1',
    userId: 'u1',
    enrolledDate: '2026-01-01',
    content: { primaryCategory: 'Learning Path', name: 'TLP-1' },
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMySkills', () => {
  beforeEach(() => {
    mockCourses = [];
    mockHeld = [];
    mockProfileError = false;
    profileEnabled.length = 0;
  });

  // Asha: a skill from a standalone course or an external certificate needs no Learning Path.
  it('lists profile skills as gained even with no enrolled paths', () => {
    mockHeld = [{ skillId: 'nrp', frameworkId: 'fw', sourceType: 'EXTERNAL', evidence: [] }];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.skills).toEqual([expect.objectContaining({ code: 'nrp', gained: true, source: 'external' })]);
    expect(result.current.aggregate.gainedSkills).toBe(1);
    expect(result.current.heldCodes.has('nrp')).toBe(true);
  });

  it('surfaces a profile failure without failing the whole page', () => {
    mockProfileError = true;
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.profileError).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('returns no paths when there are no enrollments', () => {
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(0);
    expect(result.current.entries).toEqual([]);
  });

  it('excludes non-Learning-Path enrollments and the composite per-course records', () => {
    mockCourses = [
      learningPathEnrollment({ courseId: 'course-1', batchId: 'b2', content: { primaryCategory: 'Course', name: 'A Course' } }),
      learningPathEnrollment({ batchId: 'lp-batch:course-x' }),
    ];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(0);
  });

  it('builds the skill summary for an enrolled Learning Path and lists its unfinished skills as pending', async () => {
    mockCourses = [learningPathEnrollment()];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.totalCount).toBe(1);
    await waitFor(() => expect(result.current.analyzedCount).toBe(1));

    const summary = result.current.entries[0]?.summary;
    expect(summary?.pathId).toBe(LP_ID);
    expect(summary?.taughtCodes.length).toBeGreaterThan(0);
    expect(result.current.skills.every((s) => !s.gained)).toBe(true);
    expect(result.current.aggregate.pendingSkills).toBe(summary?.unfinishedCodes.length);
  });

  // USF paths are tagged by NAME; the profile holds the CODE the skill service awarded.
  it('matches a USF path tag to the held code, so an earned skill is gained, not pending', async () => {
    mockCourses = [learningPathEnrollment()];
    mockHeld = [{ skillId: 'pp', frameworkId: 'USF', sourceType: 'COURSE', evidence: [] }];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    await waitFor(() => expect(result.current.analyzedCount).toBe(1));

    expect(result.current.entries[0]?.summary?.taughtCodes).toEqual(expect.arrayContaining(['pp', 'jp', 'js']));
    const pp = result.current.skills.filter((s) => s.code === 'pp');
    expect(pp).toEqual([expect.objectContaining({ gained: true })]);
    expect(result.current.skills.some((s) => s.code === 'Python Programming')).toBe(false);
  });

  it('names course evidence by the course, not its id', () => {
    mockCourses = [
      learningPathEnrollment({ courseId: 'do_course', content: { primaryCategory: 'Course', name: 'skill course' } }),
    ];
    mockHeld = [
      {
        skillId: 'dv',
        frameworkId: 'USF',
        sourceType: 'COURSE',
        evidence: [{ evidenceId: 'e1', sourceType: 'COURSE', sourceId: 'do_course', revoked: false }],
      },
    ];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    expect(result.current.skills[0]?.evidence[0]?.sourceName).toBe('skill course');
  });

  // An assessment inside a path was never enrolled in directly: the path's hierarchy names it.
  it('names evidence from inside an enrolled path, with that path', async () => {
    mockCourses = [learningPathEnrollment({})];
    mockHeld = [
      {
        skillId: 'jp',
        frameworkId: 'USF',
        sourceType: 'ASSESSMENT',
        evidence: [{ evidenceId: 'e1', sourceType: 'ASSESSMENT', sourceId: 'do_2146316303263006721126', revoked: false }],
      },
    ];
    const { result } = renderHook(() => useMySkills(), { wrapper });
    await waitFor(() => expect(result.current.analyzedCount).toBe(1));

    const jp = result.current.skills.find((s) => s.code === 'jp');
    expect(jp?.evidence[0]).toEqual(
      expect.objectContaining({
        sourceName: 'LP-Course-1-JP-PP',
        sourcePath: { pathId: LP_ID, contextId: 'batch-1', pathName: 'TLP-1' },
      })
    );
    expect(jp?.paths.some((p) => p.pathId === LP_ID)).toBe(false);
  });

  // The My Learning card passes `enabled: false` on the Courses tab - no profile read then.
  it('passes `enabled` through to the skill profile read', () => {
    renderHook(() => useMySkills({ enabled: false }), { wrapper });
    expect(profileEnabled).toContain(false);
  });
});
