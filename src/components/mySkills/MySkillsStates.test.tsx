import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyResult, ProfileErrorBanner, SkillCardSkeletons } from './MySkillsStates';

describe('MySkillsStates', () => {
  it('renders skeleton cards', () => {
    render(<SkillCardSkeletons />);
    expect(screen.getByTestId('skill-card-skeletons').children.length).toBeGreaterThan(0);
  });

  it('renders an empty result label', () => {
    render(<EmptyResult label="nothing here" />);
    expect(screen.getByText('nothing here')).toBeInTheDocument();
  });

  it('explains a profile failure and retries on tap', () => {
    const onRetry = vi.fn();
    render(<ProfileErrorBanner onRetry={onRetry} t={(k) => k} />);
    expect(screen.getByRole('alert')).toHaveTextContent('mySkills.profileError');
    fireEvent.click(screen.getByText('retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
