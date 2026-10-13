import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MySkillsHero from './MySkillsHero';
import type { SkillAggregate } from '../../services/learningPath/skillAggregation';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);

const aggregate: SkillAggregate = { totalSkills: 10, gainedSkills: 4, pendingSkills: 6, pathsCompleted: 1, pathsOngoing: 2 };

describe('MySkillsHero', () => {
  it('shows "X of Y" as gained of gained + pending', () => {
    render(<MySkillsHero aggregate={aggregate} analyzedCount={3} totalCount={3} t={t} />);
    expect(screen.getByText('mySkills.ofSkills:{"total":10}')).toBeInTheDocument();
    expect(screen.getByLabelText('mySkills.heroRingLabel:{"pct":40}')).toBeInTheDocument();
  });

  it('renders the gained / pending / completed / in-progress breakdown', () => {
    render(<MySkillsHero aggregate={aggregate} analyzedCount={3} totalCount={3} t={t} />);
    expect(screen.getAllByText('4')).toHaveLength(2); // ring + gained stat
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('mySkills.pathsOngoing')).toBeInTheDocument();
  });

  it('shows the analyzing indicator only while paths are still loading', () => {
    const { rerender } = render(<MySkillsHero aggregate={aggregate} analyzedCount={2} totalCount={3} t={t} />);
    expect(screen.getByText('mySkills.analyzedProgress:{"done":2,"total":3}')).toBeInTheDocument();
    rerender(<MySkillsHero aggregate={aggregate} analyzedCount={3} totalCount={3} t={t} />);
    expect(screen.queryByTestId('my-skills-analyzing')).not.toBeInTheDocument();
  });

  it('celebrates when every skill is gained', () => {
    render(
      <MySkillsHero
        aggregate={{ totalSkills: 2, gainedSkills: 2, pendingSkills: 0, pathsCompleted: 0, pathsOngoing: 0 }}
        analyzedCount={0}
        totalCount={0}
        t={t}
      />
    );
    expect(screen.getByText('mySkills.allSkillsGained')).toBeInTheDocument();
  });
});
