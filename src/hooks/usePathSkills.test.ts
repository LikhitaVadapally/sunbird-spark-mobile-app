import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePathSkills } from './usePathSkills';
import type { HeldSkill } from '../types/skillServiceTypes';
import type { LearningPathModel, LPCourseNode } from '../types/learningPathTypes';
import type { ViewerSummaryRecord } from '../types/viewerServiceTypes';

let mockHeld: HeldSkill[] = [];
const labelIds: string[][] = [];
vi.mock('./useSkillProfile', () => ({
  useSkillProfile: () => ({ skills: mockHeld, frameworkIds: ['profile_fw'], isLoading: false, isError: false }),
  useSkillLabels: (ids: string[]) => {
    labelIds.push(ids);
    return {
      labelOf: (code: string, fw?: string) => ({ name: `${fw}:${code}`, resolved: true }),
      codeOf: (tag: string) => tag,
      isLoading: false,
    };
  },
}));

const course = (id: string, codes: string[]): LPCourseNode => ({
  identifier: id, name: id, leafNodesCount: 1, leafIds: [`${id}_leaf`], skills: [], skillCodes: codes, isAssessmentCourse: false,
});

const model: LearningPathModel = {
  identifier: 'lp', name: 'LP', policy: 'Fixed', competencyFramework: 'path_fw',
  levels: [{ identifier: 'l1', name: 'L1', index: 1, skills: [], skillCodes: [], courses: [course('c1', ['a']), course('c2', ['b', 'c'])] }],
  allSkills: [], allSkillCodes: ['a', 'b', 'c'], courseTotal: 2, leafTotal: 2,
};

const held = (skillId: string): HeldSkill => ({ skillId, frameworkId: 'profile_fw', sourceType: 'COURSE', evidence: [] });

describe('usePathSkills', () => {
  beforeEach(() => {
    mockHeld = [];
    labelIds.length = 0;
  });

  it('gains what the profile holds and leaves unfinished, unheld skills pending', () => {
    mockHeld = [held('c')];
    const finishedC1 = { contentStatus: { c1_leaf: 2 } } as unknown as ViewerSummaryRecord;
    const { result } = renderHook(() => usePathSkills(model, new Map(), finishedC1));
    // 'a' is on a finished course but not in the profile: neither gained nor pending.
    expect(result.current.summary).toEqual({
      skills: [{ code: 'c', state: 'held' }, { code: 'b', state: 'pending' }],
      held: 1,
      total: 2,
    });
    expect(result.current.stateOf('a')).toBeUndefined();
    expect(result.current.heldCodes.has('c')).toBe(true);
  });

  it("names codes from the path's framework, loading it alongside the profile's", () => {
    const { result } = renderHook(() => usePathSkills(model, new Map()));
    expect(result.current.name('a')).toBe('path_fw:a');
    expect(labelIds[0]).toEqual(['path_fw', 'profile_fw']);
  });
});
