import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MySkillsControls from './MySkillsControls';

vi.mock('@ionic/react', () => ({
  IonSegment: ({ children, value, onIonChange }: any) => (
    <div data-testid="segment" data-value={value}>
      {children}
      <button type="button" onClick={() => onIonChange({ detail: { value: 'paths' } })}>switch-to-paths</button>
    </div>
  ),
  IonSegmentButton: ({ children }: any) => <div>{children}</div>,
  IonLabel: ({ children }: any) => <span>{children}</span>,
  IonSearchbar: ({ placeholder, onIonInput }: any) => (
    <input placeholder={placeholder} onChange={(e) => onIonInput({ detail: { value: e.target.value } })} />
  ),
  IonChip: ({ children, onClick, ...rest }: any) => (
    <button type="button" aria-pressed={rest['aria-pressed']} onClick={onClick}>{children}</button>
  ),
}));

const t = (key: string) => key;
const options = [
  { value: 'all', label: 'All' },
  { value: 'gained', label: 'Gained' },
];

function renderControls(overrides: Record<string, unknown> = {}) {
  const props = {
    view: 'skills' as const,
    onViewChange: vi.fn(),
    query: '',
    onQueryChange: vi.fn(),
    filter: 'all',
    onFilterChange: vi.fn(),
    filterOptions: options,
    resultLabel: '3 skills',
    groupOptions: ['Infection Prevention'],
    group: '',
    onGroupChange: vi.fn(),
    t,
    ...overrides,
  };
  render(<MySkillsControls {...props} />);
  return props;
}

describe('MySkillsControls', () => {
  it('switches between By skill and By path', () => {
    const props = renderControls();
    expect(screen.getByText('mySkills.viewBySkill')).toBeInTheDocument();
    fireEvent.click(screen.getByText('switch-to-paths'));
    expect(props.onViewChange).toHaveBeenCalledWith('paths');
  });

  it('reports search input and status / group chip taps', () => {
    const props = renderControls();
    fireEvent.change(screen.getByPlaceholderText('mySkills.searchPlaceholder'), { target: { value: 'hyg' } });
    expect(props.onQueryChange).toHaveBeenCalledWith('hyg');
    fireEvent.click(screen.getByText('Gained'));
    expect(props.onFilterChange).toHaveBeenCalledWith('gained');
    fireEvent.click(screen.getByText('Infection Prevention'));
    expect(props.onGroupChange).toHaveBeenCalledWith('Infection Prevention');
  });

  it('hides the group filter on the By path view', () => {
    renderControls({ view: 'paths' });
    expect(screen.queryByTestId('ms-group-filter')).not.toBeInTheDocument();
  });
});
