import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CourseSkills from './CourseSkills';

vi.mock('../icons/CollectionIcons', () => ({
  CheckIcon: () => <span data-testid="check-icon" />,
}));

const { mockUseSkillProfile, mockUseSkillFrameworks } = vi.hoisted(() => ({
  mockUseSkillProfile: vi.fn(),
  mockUseSkillFrameworks: vi.fn(),
}));
// `useSkillLabels` resolves names from the mocked vocabularies with the real resolver.
vi.mock('../../hooks/useSkillProfile', async () => {
  const { resolveSkillLabel } = await import('../../services/skill/skillTree');
  const { toSkillCode } = await import('../../services/skill/skillCodes');
  return {
    useSkillProfile: mockUseSkillProfile,
    useSkillLabels: () => {
      const { vocabularies, isLoading } = mockUseSkillFrameworks();
      return {
        labelOf: (code: string) => resolveSkillLabel(Object.values(vocabularies), code),
        codeOf: (tag: string) => toSkillCode(Object.values(vocabularies), tag),
        isLoading,
      };
    },
  };
});

const t = (key: string) => key;

function profile(held: string[], overrides: Record<string, unknown> = {}) {
  return { skills: [], heldCodes: new Set(held), frameworkIds: ['fw'], isLoading: false, isError: false, refetch: vi.fn(), ...overrides };
}

describe('CourseSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSkillProfile.mockReturnValue(profile(['hand-hygiene']));
    mockUseSkillFrameworks.mockReturnValue({
      metas: {},
      vocabularies: {
        fw: { frameworkId: 'fw', labels: { 'hand-hygiene': 'Hand Hygiene' }, leaves: {}, codeByName: {} },
        // USF tags carry the term name; the profile holds the code.
        USF: { frameworkId: 'USF', labels: { dv: 'Data Visualization' }, leaves: {}, codeByName: { 'data visualization': 'dv' } },
      },
      isLoading: false,
    });
  });

  it('lists every course skill under "You\'ll learn", named from the framework or de-slugged', () => {
    render(<CourseSkills codes={['hand-hygiene', 'sterile_field']} t={t} />);
    expect(screen.getByText('collection.youWillLearn')).toBeInTheDocument();
    expect(screen.getByText('Hand Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Sterile field')).toBeInTheDocument();
  });

  it('ticks only the skills the learner already holds', () => {
    render(<CourseSkills codes={['hand-hygiene', 'sterile_field']} t={t} />);
    expect(screen.getAllByTestId('check-icon')).toHaveLength(1);
    expect(screen.getByText('Hand Hygiene').closest('li')).toHaveAttribute('data-held', 'true');
    expect(screen.getByText('Sterile field').closest('li')).toHaveAttribute('data-held', 'false');
  });

  it('ticks a USF skill tagged by name once its code is held', () => {
    mockUseSkillProfile.mockReturnValue(profile(['dv']));
    render(<CourseSkills codes={['Data Visualization']} t={t} />);
    expect(screen.getByText('Data Visualization').closest('li')).toHaveAttribute('data-held', 'true');
  });

  it('renders nothing for an untagged course', () => {
    const { container } = render(<CourseSkills codes={[]} t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the profile loads, so codes never flash', () => {
    mockUseSkillProfile.mockReturnValue(profile([], { isLoading: true }));
    const { container } = render(<CourseSkills codes={['hand-hygiene']} t={t} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('still lists the skills, unticked, when the profile read fails', () => {
    mockUseSkillProfile.mockReturnValue(profile([], { isError: true, frameworkIds: [] }));
    mockUseSkillFrameworks.mockReturnValue({ metas: {}, vocabularies: {}, isLoading: false });
    render(<CourseSkills codes={['hand-hygiene']} t={t} />);
    expect(screen.getByText('Hand hygiene')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });
});
