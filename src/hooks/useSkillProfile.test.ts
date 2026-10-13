import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSkillProfile, useSkillFrameworks, useSkillLabels } from './useSkillProfile';

const { mockUseAuth, mockSkillService, mockFrameworkService, mockIsInitialized } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSkillService: { profileRead: vi.fn(), frameworkRead: vi.fn() },
  mockFrameworkService: { read: vi.fn() },
  mockIsInitialized: vi.fn(),
}));

vi.mock('../contexts/AuthContext', () => ({ useAuth: mockUseAuth }));
vi.mock('../AppInitializer', () => ({ AppInitializer: { isInitialized: mockIsInitialized } }));
vi.mock('../services/FrameworkService', () => ({ frameworkService: mockFrameworkService }));
vi.mock('../services/skill', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/skill')>()),
  skillService: mockSkillService,
}));

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSkillProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userId: 'u1' });
    mockIsInitialized.mockReturnValue(true);
  });

  it('reads the profile with evidence and normalises it', async () => {
    mockSkillService.profileRead.mockResolvedValue({
      data: { skills: [{ skillId: 'hand-hygiene', frameworkId: 'fw' }, { skillId: 'ppe', frameworkId: 'fw' }, {}] },
    });
    const { result } = renderHook(() => useSkillProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.skills).toHaveLength(2));

    expect(mockSkillService.profileRead).toHaveBeenCalledWith({ evidence: true });
    expect(result.current.heldCodes.has('hand-hygiene')).toBe(true);
    expect(result.current.frameworkIds).toEqual(['fw']);
    expect(result.current.isError).toBe(false);
  });

  it('surfaces a failed read as isError rather than an empty profile', async () => {
    mockSkillService.profileRead.mockRejectedValue(new Error('404'));
    const { result } = renderHook(() => useSkillProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.skills).toEqual([]);
  });

  it('does not fetch without a user', () => {
    mockUseAuth.mockReturnValue({ userId: null });
    const { result } = renderHook(() => useSkillProfile(), { wrapper: createWrapper() });
    expect(mockSkillService.profileRead).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useSkillFrameworks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a vocabulary and meta per framework', async () => {
    mockSkillService.frameworkRead.mockResolvedValue({
      data: { frameworkId: 'fw', tierLabels: ['Area', 'Skill'], depth: 2, leafSkills: ['hand-hygiene'] },
    });
    mockFrameworkService.read.mockResolvedValue({
      data: {
        framework: {
          categories: [
            {
              code: 'competency',
              terms: [{ code: 'ipc', name: 'Infection Prevention', children: [{ code: 'hand-hygiene', name: 'Hand Hygiene' }] }],
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useSkillFrameworks(['fw', 'fw', '']), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockFrameworkService.read).toHaveBeenCalledTimes(1);
    expect(result.current.vocabularies.fw?.labels['hand-hygiene']).toBe('Hand Hygiene');
    expect(result.current.metas.fw?.tierLabels).toEqual(['Area', 'Skill']);
  });
});

describe('useSkillLabels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The learner side reads only the taxonomy tree - never the competency (role) read.
  it('resolves name and group from the taxonomy tree alone', async () => {
    mockFrameworkService.read.mockResolvedValue({
      data: {
        framework: {
          categories: [
            {
              code: 'competency',
              terms: [{ code: 'ipc', name: 'Infection Prevention', children: [{ code: 'hand-hygiene', name: 'Hand Hygiene' }] }],
            },
          ],
        },
      },
    });
    const { result } = renderHook(() => useSkillLabels(['fw']), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.labelOf('hand-hygiene')).toEqual({ name: 'Hand Hygiene', group: 'Infection Prevention', resolved: true });
    expect(result.current.labelOf('unknown-code')).toEqual({ name: 'Unknown code', resolved: false });
    expect(mockSkillService.frameworkRead).not.toHaveBeenCalled();
  });
});

describe('useSkillProfile enabled option', () => {
  it('does not read the profile when disabled', () => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ userId: 'u1' });
    mockIsInitialized.mockReturnValue(true);
    renderHook(() => useSkillProfile({ enabled: false }), { wrapper: createWrapper() });
    expect(mockSkillService.profileRead).not.toHaveBeenCalled();
  });
});
