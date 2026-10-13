import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LearningPathStatusPage from './LearningPathStatusPage';

const mockRouterPush = vi.fn();
const mockRouterGoBack = vi.fn();
vi.mock('@ionic/react', () => ({
  IonPage: ({ children, className }: any) => <div data-testid="ion-page" className={className}>{children}</div>,
  IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
  IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
  useIonRouter: () => ({ push: mockRouterPush, goBack: mockRouterGoBack }),
}));

vi.mock('./LearningPathStatusPage.css', () => ({}));
vi.mock('../components/icons/CollectionIcons', () => ({ BackIcon: () => <span data-testid="back-icon" /> }));
vi.mock('../components/common/PageLoader', () => ({
  default: ({ message, error }: any) => (
    <div data-testid="page-loader">{message && <span>{message}</span>}{error && <span>{error}</span>}</div>
  ),
}));
vi.mock('../components/learningPath/status/StatusHero', () => ({
  default: ({ gainedCount, totalCount }: any) => <div data-testid="status-hero">{gainedCount}/{totalCount}</div>,
}));
vi.mock('../components/learningPath/status/SkillCelebrationPanel', () => ({
  default: () => <div data-testid="skill-panel" />,
}));
vi.mock('../components/learningPath/status/StatusTimeline', () => ({
  default: () => <div data-testid="status-timeline" />,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ pathId: 'lp1', contextId: undefined }),
  useLocation: () => ({ pathname: '/learning-path/lp1/status', state: undefined }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const { mockUseLearningPath } = vi.hoisted(() => ({ mockUseLearningPath: vi.fn() }));
vi.mock('../hooks/useLearningPath', () => ({ useLearningPath: mockUseLearningPath }));

const { mockUsePathSkills } = vi.hoisted(() => ({ mockUsePathSkills: vi.fn() }));
vi.mock('../hooks/usePathSkills', () => ({ usePathSkills: mockUsePathSkills }));

/** `usePathSkills` result: `held` codes are gained, `pending` still to do - the My Skills rule. */
function pathSkills(held: string[] = [], pending: string[] = [], overrides: Record<string, unknown> = {}) {
  const skills = [
    ...held.map((code) => ({ code, state: 'held' as const })),
    ...pending.map((code) => ({ code, state: 'pending' as const })),
  ];
  return {
    summary: skills.length ? { skills, held: held.length, total: skills.length } : undefined,
    heldCodes: new Set(held),
    stateOf: (code: string) => skills.find((s) => s.code === code),
    name: (code: string) => `name:${code}`,
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

function baseLp(overrides: Record<string, unknown> = {}) {
  return {
    model: { name: 'Path A', levels: [{ identifier: 'l1', name: 'L1', index: 0, skills: [], skillCodes: [], courses: [] }], allSkills: ['Skill A'], courseTotal: 1 },
    levelStatuses: ['active'],
    pathSummary: undefined,
    summaryByCollectionId: new Map(),
    enrollment: { effectiveContextId: 'ctx1' },
    isLoading: false,
    isError: false,
    ...overrides,
  };
}

describe('LearningPathStatusPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathSkills.mockReturnValue(pathSkills());
  });

  it('shows the loading state', () => {
    mockUseLearningPath.mockReturnValue(baseLp({ isLoading: true }));
    render(<LearningPathStatusPage />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows not-found when the path has no levels', () => {
    mockUseLearningPath.mockReturnValue(baseLp({ model: { ...baseLp().model, levels: [] } }));
    render(<LearningPathStatusPage />);
    expect(screen.getByText('learningPath.notFound')).toBeInTheDocument();
  });

  it('renders the hero, skill panel and timeline once loaded', () => {
    mockUseLearningPath.mockReturnValue(baseLp());
    render(<LearningPathStatusPage />);
    expect(screen.getByTestId('status-hero')).toBeInTheDocument();
    expect(screen.getByTestId('skill-panel')).toBeInTheDocument();
    expect(screen.getByTestId('status-timeline')).toBeInTheDocument();
    expect(screen.getByText('Path A')).toBeInTheDocument();
  });

  // The hero counts what My Skills counts for this path: held / (held + pending).
  it('feeds the hero the gained/pending counts from usePathSkills, not the whole scope', () => {
    mockUseLearningPath.mockReturnValue(baseLp());
    mockUsePathSkills.mockReturnValue(pathSkills(['a'], ['b', 'c']));
    render(<LearningPathStatusPage />);
    expect(screen.getByTestId('status-hero')).toHaveTextContent('1/3');
  });

  it('explains a skill-profile failure', () => {
    mockUseLearningPath.mockReturnValue(baseLp());
    mockUsePathSkills.mockReturnValue(pathSkills([], [], { isError: true }));
    render(<LearningPathStatusPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('mySkills.profileError');
  });
});
