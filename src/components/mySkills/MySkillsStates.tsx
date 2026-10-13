import React from 'react';
import type { LPTFunction } from '../learningPath/lpTFunction';

const SKELETON_CARDS = 4;

/** Held while framework names load, so the learner never sees slugs turn into names. */
export const SkillCardSkeletons: React.FC = () => (
  <div className="ms-skill-list" data-testid="skill-card-skeletons">
    {Array.from({ length: SKELETON_CARDS }, (_, i) => (
      <div key={i} className="ms-skill-card ms-skeleton-card" aria-hidden="true">
        <div className="ms-skeleton-line ms-skeleton-line--short" />
        <div className="ms-skeleton-line ms-skeleton-line--long" />
        <div className="ms-skeleton-line ms-skeleton-line--mid" />
      </div>
    ))}
  </div>
);

export const EmptyResult: React.FC<{ label: string }> = ({ label }) => (
  <div className="ms-empty-result">
    <p>{label}</p>
  </div>
);

/**
 * The skill profile could not be read. The page still renders - enrolled paths load separately -
 * but without the profile nothing reads as gained, so the learner is told why.
 */
export const ProfileErrorBanner: React.FC<{ onRetry: () => void; t: LPTFunction }> = ({ onRetry, t }) => (
  <div className="ms-profile-error" role="alert" data-testid="my-skills-profile-error">
    <span className="ms-profile-error-text">{t('mySkills.profileError')}</span>
    <button type="button" className="ms-profile-error-retry" onClick={onRetry}>
      {t('retry')}
    </button>
  </div>
);
