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
let mockProfileError = false;
const profileEnabled: Array<boolean | undefined> = [];
vi.mock('./useSkillProfile', () => ({
  useSkillProfile: (options?: { enabled?: boolean }) => {
    profileEnabled.push(options?.enabled);
    return { skills: mockHeld, frameworkIds: [], isLoading: false, isError: mockProfileError, refetch: vi.fn() };
  },
  useSkillLabels: () => ({
    labelOf: (code: string) => ({ name: code, resolved: false }),
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

  // The My Learning card passes `enabled: false` on the Courses tab - no profile read then.
  it('passes `enabled` through to the skill profile read', () => {
    renderHook(() => useMySkills({ enabled: false }), { wrapper });
    expect(profileEnabled).toContain(false);
  });
});
