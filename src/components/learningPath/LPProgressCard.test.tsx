import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LPProgressCard from './LPProgressCard';
import type { LearningPathModel } from '../../types/learningPathTypes';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);

const model: LearningPathModel = {
  identifier: 'lp1',
  name: 'Path A',
  policy: 'Diagnostic',
  levels: [
    { identifier: 'l1', name: 'L1', index: 0, skills: [], skillCodes: [], courses: [] },
    { identifier: 'l2', name: 'L2', index: 1, skills: [], skillCodes: [], courses: [] },
  ],
  allSkills: ['Skill A', 'Skill B'],
  allSkillCodes: ['skill-a', 'skill-b'],
  courseTotal: 3,
  leafTotal: 6,
};

describe('LPProgressCard', () => {
  it('renders the progress percentage and levels-done label', () => {
    render(<LPProgressCard model={model} progressPct={40} doneLevels={1} t={t} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('learningPath.levelsDone:{"done":1,"total":2}')).toBeInTheDocument();
  });

  it('renders the stat grid values from the model', () => {
    render(<LPProgressCard model={model} progressPct={0} doneLevels={0} t={t} />);
    expect(screen.getByText('learningPath.policy.diagnostic')).toBeInTheDocument();
    expect(screen.getAllByText('2')).toHaveLength(2); // levels count and skills count both happen to be 2
    expect(screen.getByText('3')).toBeInTheDocument(); // courses
  });

  // With the learner's skill counts, the stat reads gained/total - the same numbers as My Skills.
  it('shows held/total skills when skill counts are given', () => {
    render(<LPProgressCard model={model} progressPct={0} doneLevels={0} skillCounts={{ held: 1, total: 2 }} t={t} />);
    expect(screen.getByTestId('lp-progress-skills')).toHaveTextContent('1/2');
  });

  it('renders the batch end date only when given', () => {
    const { rerender } = render(<LPProgressCard model={model} progressPct={0} doneLevels={0} t={t} />);
    expect(screen.queryByText(/batchEndsOn/)).not.toBeInTheDocument();

    rerender(<LPProgressCard model={model} progressPct={0} doneLevels={0} batchEndDate="2026-01-01" t={t} />);
    expect(screen.getByText(/learningPath.batchEndsOn/)).toBeInTheDocument();
  });

  it('clamps the progress bar fill width between 0 and 100', () => {
    const { container } = render(<LPProgressCard model={model} progressPct={150} doneLevels={0} t={t} />);
    const fill = container.querySelector('.lp-progress-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });
});
