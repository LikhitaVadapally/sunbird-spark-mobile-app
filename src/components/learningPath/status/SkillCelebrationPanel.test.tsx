import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SkillCelebrationPanel from './SkillCelebrationPanel';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);
const nameOf = (code: string) => code.toUpperCase();

describe('SkillCelebrationPanel', () => {
  it('renders nothing when there are no skills', () => {
    const { container } = render(
      <SkillCelebrationPanel allSkills={[]} gainedSkills={new Set()} nameOf={nameOf} selectedSkill={null} onSelectSkill={vi.fn()} t={t} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('splits skills into gained (held in the profile) and pending, by display name', () => {
    render(
      <SkillCelebrationPanel allSkills={['a', 'b']} gainedSkills={new Set(['a'])} nameOf={nameOf} selectedSkill={null} onSelectSkill={vi.fn()} t={t} />
    );
    expect(screen.getByText('A')).toHaveAttribute('data-testid', 'skill-chip-gained');
    expect(screen.getByText('B')).toHaveAttribute('data-testid', 'skill-chip-pending');
    expect(screen.getByText('learningPath.skillsGainedCount:{"gained":1,"total":2}')).toBeInTheDocument();
    expect(screen.getByText('learningPath.skillsPendingCount:{"count":1}')).toBeInTheDocument();
  });

  it('selects a skill code on click', () => {
    const onSelectSkill = vi.fn();
    render(
      <SkillCelebrationPanel allSkills={['a']} gainedSkills={new Set()} nameOf={nameOf} selectedSkill={null} onSelectSkill={onSelectSkill} t={t} />
    );
    fireEvent.click(screen.getByText('A'));
    expect(onSelectSkill).toHaveBeenCalledWith('a');
  });

  it('deselects the currently-selected skill on click', () => {
    const onSelectSkill = vi.fn();
    render(
      <SkillCelebrationPanel allSkills={['a']} gainedSkills={new Set()} nameOf={nameOf} selectedSkill="a" onSelectSkill={onSelectSkill} t={t} />
    );
    fireEvent.click(screen.getByText('A'));
    expect(onSelectSkill).toHaveBeenCalledWith(null);
  });
});
