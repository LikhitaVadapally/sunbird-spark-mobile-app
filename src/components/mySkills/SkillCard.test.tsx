import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SkillCard from './SkillCard';
import type { MySkillEntry } from '../../services/skill/mySkills';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);

const gained: MySkillEntry = {
  code: 'hand-hygiene',
  frameworkId: 'fw',
  gained: true,
  source: 'course',
  gainedAt: Date.UTC(2026, 8, 2),
  evidence: [
    { evidenceId: 'e1', sourceType: 'ASSESSMENT', sourceId: 'do_assess', score: 8, maxScore: 10, revoked: false },
  ],
  paths: [{ pathId: 'lp1', contextId: 'b1', pathName: 'ICU Nurse Induction' }],
};
const pending: MySkillEntry = {
  code: 'sterile-field',
  gained: false,
  evidence: [],
  paths: [{ pathId: 'lp1', contextId: 'b1', pathName: 'ICU Nurse Induction' }],
};
const label = { name: 'Hand Hygiene', group: 'Infection Prevention', resolved: true };

describe('SkillCard', () => {
  it('shows the name, group label, gained status and source', () => {
    render(<SkillCard entry={gained} label={label} isExpanded={false} onToggle={vi.fn()} onOpenPath={vi.fn()} t={t} />);
    expect(screen.getByText('Hand Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Infection Prevention')).toBeInTheDocument();
    expect(screen.getByText('mySkills.gained')).toBeInTheDocument();
    expect(screen.getByText('mySkills.source.course')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-card-details')).not.toBeInTheDocument();
  });

  it('shows "How I earned this" evidence and the paths that also teach it when expanded', () => {
    const onOpenPath = vi.fn();
    render(<SkillCard entry={gained} label={label} isExpanded onToggle={vi.fn()} onOpenPath={onOpenPath} t={t} />);
    expect(screen.getByText('mySkills.howEarned')).toBeInTheDocument();
    expect(screen.getByText('mySkills.source.assessment')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('mySkills.alsoTaughtIn')).toBeInTheDocument();
    fireEvent.click(screen.getByText('ICU Nurse Induction'));
    expect(onOpenPath).toHaveBeenCalledWith(gained.paths[0]);
  });

  it('lists the paths a pending skill is still to do in', () => {
    render(
      <SkillCard entry={pending} label={{ name: 'Sterile field', resolved: false }} isExpanded onToggle={vi.fn()} onOpenPath={vi.fn()} t={t} />
    );
    expect(screen.getByTestId('skill-card-pending')).toBeInTheDocument();
    expect(screen.getByText('mySkills.pathCount:{"count":1}')).toBeInTheDocument();
    expect(screen.getByText('mySkills.stillToDoIn')).toBeInTheDocument();
    expect(screen.queryByText('mySkills.howEarned')).not.toBeInTheDocument();
  });

  it('toggles on tap', () => {
    const onToggle = vi.fn();
    render(<SkillCard entry={gained} label={label} isExpanded={false} onToggle={onToggle} onOpenPath={vi.fn()} t={t} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(onToggle).toHaveBeenCalled();
  });
});
