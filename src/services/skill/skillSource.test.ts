import { describe, it, expect } from 'vitest';
import { skillSource } from './skillSource';

describe('skillSource', () => {
  it('prefers the node\'s own skill codes', () => {
    expect(skillSource({ skill: ['a', 'b'], se_skills: ['legacy'] })).toEqual(['a', 'b']);
  });

  it('falls back to se_skills when skill is empty or absent', () => {
    expect(skillSource({ skill: [], se_skills: ['legacy'] })).toEqual(['legacy']);
    expect(skillSource({ se_skills: ['legacy'] })).toEqual(['legacy']);
  });

  it('drops blanks and duplicates', () => {
    expect(skillSource({ skill: ['a', '', 'a'] })).toEqual(['a']);
  });

  it.each([undefined, null, {}])('returns [] for %s', (input) => {
    expect(skillSource(input)).toEqual([]);
  });
});
