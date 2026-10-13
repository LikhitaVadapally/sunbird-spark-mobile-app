import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import MySkillsPage from './MySkillsPage';
import type { MySkillEntry } from '../services/skill/mySkills';

const mockRouterPush = vi.fn();
const mockRouterGoBack = vi.fn();
vi.mock('@ionic/react', () => ({
  IonPage: ({ children, className }: any) => <div data-testid="ion-page" className={className}>{children}</div>,
  IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
  IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
  IonToast: ({ isOpen, message }: any) => (isOpen ? <div data-testid="ion-toast">{message}</div> : null),
  useIonRouter: () => ({ push: mockRouterPush, goBack: mockRouterGoBack }),
}));

vi.mock('./MySkillsPage.css', () => ({}));
vi.mock('../components/icons/CollectionIcons', () => ({ BackIcon: () => <span data-testid="back-icon" /> }));
vi.mock('../components/common/PageLoader', () => ({
  default: ({ message, error, onRetry }: any) => (
    <div data-testid="page-loader">
      {message && <span>{message}</span>}
      {error && <span>{error}</span>}
      {onRetry && <button onClick={onRetry}>retry-loader</button>}
    </div>
  ),
}));
vi.mock('../components/mySkills/MySkillsHero', () => ({
  default: ({ aggregate }: any) => <div data-testid="ms-hero">{aggregate.gainedSkills}/{aggregate.totalSkills}</div>,
}));
vi.mock('../components/mySkills/SkillInsights', () => ({ default: () => <div data-testid="ms-insights" /> }));
vi.mock('../components/mySkills/SkillSuggestionRow', () => ({
  default: ({ onSelect }: any) => (
    <button data-testid="ms-suggestion-row" onClick={() => onSelect({ pathId: 'lp2', contextId: undefined })}>
      suggestion
    </button>
  ),
}));
vi.mock('../components/mySkills/SkillCard', () => ({
  default: ({ entry, label, onOpenPath }: any) => (
    <button data-testid={`skill-card-${entry.code}`} onClick={() => onOpenPath(entry.paths[0])}>
      {label.name}
    </button>
  ),
}));
vi.mock('../components/mySkills/SkillPathAccordion', () => ({
  default: ({ entries, onOpenPath }: any) => (
    <button data-testid="ms-path-accordion" onClick={() => onOpenPath(entries[0].summary)}>
      accordion
    </button>
  ),
}));
vi.mock('../components/mySkills/MySkillsControls', () => ({
  default: ({ onViewChange, onFilterChange, onGroupChange, onQueryChange, resultLabel }: any) => (
    <div data-testid="ms-controls">
      <span>{resultLabel}</span>
      <button onClick={() => onViewChange('paths')}>view-paths</button>
      <button onClick={() => onFilterChange('pending')}>filter-pending</button>
      <button onClick={() => onGroupChange('Infection Prevention')}>group-ipc</button>
      <button onClick={() => onQueryChange('zzz')}>search-nothing</button>
    </div>
  ),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/profile/skills', state: undefined }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key}:${JSON.stringify(opts)}` : key) }),
}));

const { mockUseMySkills, mockUseSkillSuggestions } = vi.hoisted(() => ({
  mockUseMySkills: vi.fn(),
  mockUseSkillSuggestions: vi.fn(() => ({ suggestions: [] })),
}));
vi.mock('../hooks/useMySkills', () => ({ useMySkills: mockUseMySkills }));
vi.mock('../hooks/useSkillSuggestions', () => ({ useSkillSuggestions: mockUseSkillSuggestions }));

const path = { pathId: 'lp1', contextId: 'ctx1', pathName: 'ICU Nurse Induction' };
const skills: MySkillEntry[] = [
  { code: 'hand-hygiene', gained: true, source: 'course', evidence: [], paths: [path] },
  { code: 'nrp', gained: true, source: 'external', evidence: [], paths: [] },
  { code: 'sterile-field', gained: false, evidence: [], paths: [path] },
];
const GROUPS: Record<string, string> = { 'hand-hygiene': 'Infection Prevention', 'sterile-field': 'Infection Prevention' };
const NAMES: Record<string, string> = { 'hand-hygiene': 'Hand Hygiene', nrp: 'Neonatal Resuscitation', 'sterile-field': 'Sterile Field' };

const pathSummary = {
  pathId: 'lp1',
  contextId: 'ctx1',
  pathName: 'ICU Nurse Induction',
  progressPct: 60,
  status: 'ongoing',
  taughtCodes: ['hand-hygiene', 'sterile-field'],
  unfinishedCodes: ['sterile-field'],
};

function baseMySkills(overrides: Record<string, unknown> = {}) {
  return {
    entries: [{ path: { pathId: 'lp1', contextId: 'ctx1', name: 'ICU' }, summary: pathSummary, isLoading: false, isError: false }],
    summaries: [pathSummary],
    skills,
    heldCodes: new Set(['hand-hygiene', 'nrp']),
    aggregate: { totalSkills: 3, gainedSkills: 2, pendingSkills: 1, pathsCompleted: 0, pathsOngoing: 1 },
    labelOf: (code: string) => ({ name: NAMES[code] ?? code, group: GROUPS[code], resolved: true }),
    labelsLoading: false,
    analyzedCount: 1,
    totalCount: 1,
    isLoading: false,
    isError: false,
    profileError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('MySkillsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillSuggestions.mockReturnValue({ suggestions: [] });
  });

  it('shows the loading state', () => {
    mockUseMySkills.mockReturnValue(baseMySkills({ isLoading: true }));
    render(<MySkillsPage />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('ms-hero')).not.toBeInTheDocument();
  });

  it('shows the error state with retry', () => {
    const refetch = vi.fn();
    mockUseMySkills.mockReturnValue(baseMySkills({ isError: true, refetch }));
    render(<MySkillsPage />);
    expect(screen.getByText('mySkills.errorLoading')).toBeInTheDocument();
    fireEvent.click(screen.getByText('retry-loader'));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows the empty state with no paths and no held skills', () => {
    mockUseMySkills.mockReturnValue(baseMySkills({ entries: [], skills: [], totalCount: 0 }));
    render(<MySkillsPage />);
    expect(screen.getByText('mySkills.noSkills')).toBeInTheDocument();
  });

  // Asha: a learner with no Learning Path still sees skills held from courses or certificates.
  it('renders held skills even with no enrolled paths', () => {
    mockUseMySkills.mockReturnValue(baseMySkills({ entries: [], totalCount: 0, skills: [skills[1]] }));
    render(<MySkillsPage />);
    expect(screen.getByText('Neonatal Resuscitation')).toBeInTheDocument();
  });

  it('renders the hero, suggestions, insights and one card per skill (By skill is the default view)', () => {
    mockUseMySkills.mockReturnValue(baseMySkills());
    render(<MySkillsPage />);
    expect(screen.getByTestId('ms-hero')).toHaveTextContent('2/3');
    expect(screen.getByTestId('ms-suggestion-row')).toBeInTheDocument();
    expect(screen.getByTestId('ms-insights')).toBeInTheDocument();
    expect(screen.getByText('Hand Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Sterile Field')).toBeInTheDocument();
    expect(screen.queryByTestId('ms-path-accordion')).not.toBeInTheDocument();
  });

  it('passes the held codes to the suggestions so held skills are never suggested', () => {
    const heldCodes = new Set(['hand-hygiene']);
    mockUseMySkills.mockReturnValue(baseMySkills({ heldCodes }));
    render(<MySkillsPage />);
    expect(mockUseSkillSuggestions).toHaveBeenCalledWith([pathSummary], ['lp1'], heldCodes);
  });

  it('filters by status, group and search', () => {
    mockUseMySkills.mockReturnValue(baseMySkills());
    render(<MySkillsPage />);
    fireEvent.click(screen.getByText('filter-pending'));
    expect(screen.queryByText('Hand Hygiene')).not.toBeInTheDocument();
    expect(screen.getByText('Sterile Field')).toBeInTheDocument();
    fireEvent.click(screen.getByText('group-ipc'));
    expect(screen.getByText('Sterile Field')).toBeInTheDocument();
    fireEvent.click(screen.getByText('search-nothing'));
    expect(screen.getByText('mySkills.noSkillResults')).toBeInTheDocument();
  });

  it('holds skeletons while skill names load, instead of flashing codes', () => {
    mockUseMySkills.mockReturnValue(baseMySkills({ labelsLoading: true }));
    render(<MySkillsPage />);
    expect(screen.getByTestId('skill-card-skeletons')).toBeInTheDocument();
    expect(screen.queryByText('Hand Hygiene')).not.toBeInTheDocument();
  });

  it('switches to the By path view and opens a path status page from it', () => {
    mockUseMySkills.mockReturnValue(baseMySkills());
    render(<MySkillsPage />);
    fireEvent.click(screen.getByText('view-paths'));
    fireEvent.click(screen.getByTestId('ms-path-accordion'));
    expect(mockRouterPush).toHaveBeenCalledWith('/learning-path/lp1/batch/ctx1/status', 'forward', 'push');
  });

  it("opens a pending skill's path status page from its card", () => {
    mockUseMySkills.mockReturnValue(baseMySkills());
    render(<MySkillsPage />);
    fireEvent.click(screen.getByTestId('skill-card-sterile-field'));
    expect(mockRouterPush).toHaveBeenCalledWith('/learning-path/lp1/batch/ctx1/status', 'forward', 'push');
  });

  it('navigates to the suggested path on suggestion select', () => {
    mockUseMySkills.mockReturnValue(baseMySkills());
    render(<MySkillsPage />);
    fireEvent.click(screen.getByTestId('ms-suggestion-row'));
    expect(mockRouterPush).toHaveBeenCalledWith('/learning-path/lp2', 'forward', 'push');
  });

  // Profile failure: the page still renders, with a toast and a Retry banner.
  it('keeps the page up on a profile failure, with a toast and a retry banner', () => {
    const refetch = vi.fn();
    mockUseMySkills.mockReturnValue(baseMySkills({ profileError: true, refetch }));
    render(<MySkillsPage />);
    expect(screen.getByTestId('ms-hero')).toBeInTheDocument();
    expect(screen.getByTestId('ion-toast')).toHaveTextContent('mySkills.profileError');
    expect(screen.getByTestId('my-skills-profile-error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('retry'));
    expect(refetch).toHaveBeenCalled();
  });
});
