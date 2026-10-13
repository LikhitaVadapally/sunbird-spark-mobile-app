import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SkillPathAccordion from './SkillPathAccordion';
import type { MySkillsEntry } from '../../hooks/useMySkills';
import type { PathSkillSummary } from '../../services/learningPath/skillAggregation';

vi.mock('@ionic/react', () => ({
  IonAccordionGroup: ({ children }: any) => <div data-testid="accordion-group">{children}</div>,
  IonAccordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  IonItem: ({ children }: any) => <div data-testid="item">{children}</div>,
  IonLabel: ({ children }: any) => <div data-testid="label">{children}</div>,
}));

const t = (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key);
const nameOf = (code: string) => code.toUpperCase();

const summary: PathSkillSummary = {
  pathId: 'lp1',
  contextId: 'ctx1',
  pathName: 'Path A',
  progressPct: 50,
  status: 'ongoing',
  taughtCodes: ['a', 'b', 'c'],
  unfinishedCodes: ['b', 'c'],
};
const entry: MySkillsEntry = { path: { pathId: 'lp1', contextId: 'ctx1', name: 'Path A' }, summary, isLoading: false, isError: false };

const base = { heldCodes: new Set(['a', 'c']), nameOf, labelsLoading: false, t };

describe('SkillPathAccordion', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = render(<SkillPathAccordion {...base} entries={[]} onOpenPath={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  // Same split as My Skills: held anywhere = gained; unfinished and not held = pending.
  it('splits the path skills by what the learner holds from any source', () => {
    render(<SkillPathAccordion {...base} entries={[entry]} onOpenPath={vi.fn()} />);
    expect(screen.getByText('Path A')).toBeInTheDocument();
    expect(screen.getByText('inProgress')).toBeInTheDocument();
    expect(screen.getByText('mySkills.gainedOfTotal:{"gained":2,"total":3}')).toBeInTheDocument();
    expect(screen.getAllByTestId('skill-chip-gained').map((c) => c.textContent)).toEqual(['A', 'C']);
    expect(screen.getAllByTestId('skill-chip-pending').map((c) => c.textContent)).toEqual(['B']);
  });

  it('shows a skeleton for a path whose hierarchy is still loading', () => {
    render(
      <SkillPathAccordion {...base} entries={[{ path: { pathId: 'lp2', name: 'P2' }, isLoading: true, isError: false }]} onOpenPath={vi.fn()} />
    );
    expect(screen.getByTestId('skill-path-skeleton')).toBeInTheDocument();
  });

  it('calls onOpenPath with the summary when "View path status" is clicked', () => {
    const onOpenPath = vi.fn();
    render(<SkillPathAccordion {...base} entries={[entry]} onOpenPath={onOpenPath} />);
    fireEvent.click(screen.getByText('mySkills.viewPathStatus'));
    expect(onOpenPath).toHaveBeenCalledWith(summary);
  });
});
