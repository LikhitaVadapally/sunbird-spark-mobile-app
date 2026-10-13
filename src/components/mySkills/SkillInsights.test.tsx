import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SkillInsights from './SkillInsights';
import type { MySkillEntry } from '../../services/skill/mySkills';

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);
const entry = (code: string, extra: Partial<MySkillEntry> = {}): MySkillEntry => ({ code, gained: true, evidence: [], paths: [], ...extra });

describe('SkillInsights', () => {
  it('renders nothing with no insights', () => {
    const { container } = render(<SkillInsights recentlyGained={[]} mostReinforced={[]} nameOf={(e) => e.code} onSelectSkill={vi.fn()} t={t} />);
    expect(container.innerHTML).toBe('');
  });

  it('lists recently gained and most reinforced skills, and selects one on tap', () => {
    const recent = entry('a', { gainedAt: Date.now() });
    const reinforced = entry('b', {
      paths: [
        { pathId: 'p1', pathName: 'P1' },
        { pathId: 'p2', pathName: 'P2' },
      ],
    });
    const onSelectSkill = vi.fn();
    render(
      <SkillInsights recentlyGained={[recent]} mostReinforced={[reinforced]} nameOf={(e) => e.code.toUpperCase()} onSelectSkill={onSelectSkill} t={t} />
    );
    expect(screen.getByText('mySkills.today')).toBeInTheDocument();
    expect(screen.getByText('mySkills.pathCount:{"count":2}')).toBeInTheDocument();
    fireEvent.click(screen.getByText('B'));
    expect(onSelectSkill).toHaveBeenCalledWith(reinforced);
  });
});
