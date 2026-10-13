import React from 'react';
import ProgressRing from '../common/ProgressRing';
import type { SkillAggregate } from '../../services/learningPath/skillAggregation';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface MySkillsHeroProps {
  aggregate: SkillAggregate;
  analyzedCount: number;
  totalCount: number;
  t: LPTFunction;
}

/**
 * Hero card at the top of My Skills: a ring for "X of Y" (gained / (gained + pending)), the
 * gained / pending / paths completed / paths in progress breakdown, and an "Analyzed X of Y
 * paths" indicator while path hierarchies are still streaming in.
 */
export const MySkillsHero: React.FC<MySkillsHeroProps> = ({ aggregate, analyzedCount, totalCount, t }) => {
  const { totalSkills, gainedSkills, pendingSkills, pathsCompleted, pathsOngoing } = aggregate;
  const pct = totalSkills > 0 ? Math.round((gainedSkills / totalSkills) * 100) : 0;
  const allGained = totalSkills > 0 && gainedSkills === totalSkills;
  const isAnalyzing = totalCount > 0 && analyzedCount < totalCount;

  return (
    <div className="ms-hero" data-testid="my-skills-hero">
      <ProgressRing
        progress={pct}
        size={96}
        stroke={7}
        fillColor={allGained ? 'var(--ion-color-success)' : undefined}
        ariaLabel={t('mySkills.heroRingLabel', { pct })}
      >
        <div className="ms-hero-ring-content">
          <span className="ms-hero-count">{gainedSkills}</span>
          <span className="ms-hero-of">{t('mySkills.ofSkills', { total: totalSkills })}</span>
        </div>
      </ProgressRing>
      <p className={`ms-hero-message${allGained ? ' ms-hero-message--done' : ''}`}>
        {allGained ? t('mySkills.allSkillsGained') : t('mySkills.keepGoing')}
      </p>
      <div className="ms-hero-stats">
        <div className="ms-hero-stat">
          <span className="ms-hero-stat-value ms-hero-stat-value--gained">{gainedSkills}</span>
          <span className="ms-hero-stat-label">{t('mySkills.skillsGained')}</span>
        </div>
        <div className="ms-hero-stat">
          <span className="ms-hero-stat-value ms-hero-stat-value--pending">{pendingSkills}</span>
          <span className="ms-hero-stat-label">{t('mySkills.skillsPending')}</span>
        </div>
        <div className="ms-hero-stat">
          <span className="ms-hero-stat-value">{pathsCompleted}</span>
          <span className="ms-hero-stat-label">{t('mySkills.pathsCompleted')}</span>
        </div>
        <div className="ms-hero-stat">
          <span className="ms-hero-stat-value">{pathsOngoing}</span>
          <span className="ms-hero-stat-label">{t('mySkills.pathsOngoing')}</span>
        </div>
      </div>
      {isAnalyzing && (
        <span className="ms-hero-analyzed" data-testid="my-skills-analyzing">
          {t('mySkills.analyzedProgress', { done: analyzedCount, total: totalCount })}
        </span>
      )}
    </div>
  );
};

export default MySkillsHero;
