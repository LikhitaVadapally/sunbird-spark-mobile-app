import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusTimeline from './StatusTimeline';
import type { LearningPathModel } from '../../../types/learningPathTypes';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);
const nameOf = (code: string) => ({ 'skill-a': 'Skill A', 'skill-b': 'Skill B' })[code] ?? code;

const model: LearningPathModel = {
  identifier: 'lp1',
  name: 'Path A',
  policy: 'Fixed',
  levels: [
    { identifier: 'l1', name: 'Foundations', index: 0, skills: ['Skill a'], skillCodes: ['skill-a'], courses: [] },
    { identifier: 'l2', name: 'Advanced', index: 1, skills: ['Skill b'], skillCodes: ['skill-b'], courses: [] },
  ],
  allSkills: ['Skill a', 'Skill b'],
  allSkillCodes: ['skill-a', 'skill-b'],
  courseTotal: 0,
  leafTotal: 0,
};

const base = { model, nameOf, t };

describe('StatusTimeline', () => {
  it('renders one node per content level', () => {
    render(<StatusTimeline {...base} levelStatuses={['completed', 'locked']} gainedSkills={new Set()} selectedSkill={null} />);
    expect(screen.getByText(/Foundations/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced/)).toBeInTheDocument();
  });

  it('dims a level that does not teach the selected skill code', () => {
    const { container } = render(
      <StatusTimeline {...base} levelStatuses={['completed', 'locked']} gainedSkills={new Set()} selectedSkill="skill-a" />
    );
    const nodes = container.querySelectorAll('.lp-status-timeline-node');
    expect(nodes[0]).not.toHaveClass('lp-status-timeline-node--dimmed');
    expect(nodes[1]).toHaveClass('lp-status-timeline-node--dimmed');
  });

  it('does not dim any level when no skill is selected', () => {
    const { container } = render(
      <StatusTimeline {...base} levelStatuses={['completed', 'locked']} gainedSkills={new Set()} selectedSkill={null} />
    );
    expect(container.querySelectorAll('.lp-status-timeline-node--dimmed')).toHaveLength(0);
  });

  // Gained comes from the skill profile, not from the Level being complete.
  it('marks a skill gained only when the profile holds it', () => {
    render(<StatusTimeline {...base} levelStatuses={['completed', 'locked']} gainedSkills={new Set(['skill-b'])} selectedSkill={null} />);
    expect(screen.getByText('Skill A')).not.toHaveClass('lp-skill-chip--gained');
    expect(screen.getByText('Skill B')).toHaveClass('lp-skill-chip--gained');
  });
});
