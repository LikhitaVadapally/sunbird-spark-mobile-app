import { describe, it, expect } from 'vitest';
import { normaliseProfile, normaliseFrameworkMeta } from './skillMappers';

describe('normaliseProfile', () => {
  // CapacitorAdapter.mapResponse strips `result` before a mapper sees the body, so this - not
  // the enveloped form - is what actually arrives. Getting it wrong rendered an empty
  // passbook against a good 200, twice, during the v1 work.
  it('reads the unwrapped shape the adapter delivers', () => {
    const out = normaliseProfile({
      count: 1,
      skills: [
        {
          skillId: 'dosage-calculation',
          frameworkId: 'fw',
          sourceType: 'COURSE',
          attainedOn: '2026-09-08T07:20:02.000Z',
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]!.skillId).toBe('dosage-calculation');
    expect(out[0]!.attainedOn).toBe(Date.parse('2026-09-08T07:20:02.000Z'));
  });

  it('still reads the enveloped shape', () => {
    expect(normaliseProfile({ result: { skills: [{ skillId: 'a' }] } })).toHaveLength(1);
  });

  it('drops entries with no skillId', () => {
    const out = normaliseProfile({ skills: [{ sourceType: 'COURSE' }, { skillId: 'a' }] });
    expect(out.map((s) => s.skillId)).toEqual(['a']);
  });

  // Revocation is the only way a skill leaves the profile, so a revoked row must not be
  // shown as proof of one that remains.
  it('excludes revoked evidence', () => {
    const out = normaliseProfile({
      skills: [
        {
          skillId: 'a',
          evidence: [
            { evidenceId: 'e1', sourceType: 'COURSE', sourceId: 'c1' },
            { evidenceId: 'e2', sourceType: 'COURSE', sourceId: 'c2', revoked: true },
          ],
        },
      ],
    });
    expect(out[0]!.evidence.map((e) => e.evidenceId)).toEqual(['e1']);
  });

  it('collapses many rows describing one fact', () => {
    const out = normaliseProfile({
      skills: [
        {
          skillId: 'a',
          evidence: [
            { evidenceId: 'e1', sourceType: 'COURSE', sourceId: 'c1' },
            { evidenceId: 'e2', sourceType: 'COURSE', sourceId: 'c1' },
            { evidenceId: 'e3', sourceType: 'ASSESSMENT', sourceId: 'qs1', score: 1, maxScore: 1 },
          ],
        },
      ],
    });
    expect(out[0]!.evidence).toHaveLength(2);
  });

  it('ignores an unparseable date instead of emitting NaN', () => {
    expect(normaliseProfile({ skills: [{ skillId: 'a', attainedOn: 'nope' }] })[0]!.attainedOn).toBeUndefined();
  });

  it.each([undefined, null, {}, { result: {} }])('returns [] for %s', (input) => {
    expect(normaliseProfile(input as never)).toEqual([]);
  });
});

describe('normaliseFrameworkMeta', () => {
  const body = {
    frameworkId: 'fw',
    tierLabels: ['Competency area', 'Competency', 'Skill'],
    depth: 3,
    leafSkills: ['a', 'b'],
    roles: { 'staff-nurse': ['a'], 'empty-role': [] },
  };

  it('lists only roles requiring at least one skill, sorted', () => {
    // a role requiring nothing reports 100% ready for everyone
    expect(normaliseFrameworkMeta(body)?.roleCodes).toEqual(['staff-nurse']);
  });

  it('keeps tier labels and depth', () => {
    const m = normaliseFrameworkMeta(body);
    expect(m?.tierLabels[0]).toBe('Competency area');
    expect(m?.depth).toBe(3);
  });

  it('still reads the enveloped shape', () => {
    expect(normaliseFrameworkMeta({ result: body })?.frameworkId).toBe('fw');
  });

  it('is undefined without a frameworkId, so callers can tell it did not resolve', () => {
    expect(normaliseFrameworkMeta({ result: {} })).toBeUndefined();
    expect(normaliseFrameworkMeta(undefined)).toBeUndefined();
  });
});
