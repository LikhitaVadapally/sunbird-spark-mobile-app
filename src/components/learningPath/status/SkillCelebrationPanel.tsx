import React from 'react';
import type { LPTFunction } from '../lpTFunction';

interface SkillCelebrationPanelProps {
  /** Skill CODES: the path's gained + pending skills (see `computePathSkills`). */
  allSkills: string[];
  /** Codes held from any source (skill profile) - the same "gained" set My Skills uses. */
  gainedSkills: ReadonlySet<string>;
  /** Display name for a code. */
  nameOf: (code: string) => string;
  selectedSkill: string | null;
  onSelectSkill: (skill: string | null) => void;
  t: LPTFunction;
}

/**
 * Tappable skill chips shown below the Status hero, split into gained and still-to-unlock.
 * Tapping a skill toggles a "focus" mode - the timeline below dims every Level that doesn't
 * teach that skill, so the learner can trace where a skill is taught.
 */
export const SkillCelebrationPanel: React.FC<SkillCelebrationPanelProps> = ({
  allSkills,
  gainedSkills,
  nameOf,
  selectedSkill,
  onSelectSkill,
  t,
}) => {
  if (allSkills.length === 0) return null;
  const gained = allSkills.filter((code) => gainedSkills.has(code));
  const pending = allSkills.filter((code) => !gainedSkills.has(code));

  const chip = (code: string, isGained: boolean) => {
    const isSelected = selectedSkill === code;
    return (
      <button
        type="button"
        key={code}
        className={`lp-skill-chip lp-skill-chip--tappable${isGained ? ' lp-skill-chip--gained' : ' lp-skill-chip--pending'}${isSelected ? ' lp-skill-chip--selected' : ''}`}
        onClick={() => onSelectSkill(isSelected ? null : code)}
        aria-pressed={isSelected}
        data-testid={isGained ? 'skill-chip-gained' : 'skill-chip-pending'}
      >
        {nameOf(code)}
      </button>
    );
  };

  return (
    <div className="lp-skill-celebration-panel">
      <h2 className="lp-section-title">{t('learningPath.skills')}</h2>
      <p className="lp-skill-celebration-hint">{t('learningPath.tapSkillHint')}</p>
      {gained.length > 0 && (
        <div className="lp-skill-celebration-group">
          <span className="lp-skill-celebration-group-title lp-skill-celebration-group-title--gained">
            {t('learningPath.skillsGainedCount', { gained: gained.length, total: allSkills.length })}
          </span>
          <div className="lp-skill-celebration-chips">{gained.map((code) => chip(code, true))}</div>
        </div>
      )}
      {pending.length > 0 && (
        <div className="lp-skill-celebration-group">
          <span className="lp-skill-celebration-group-title">
            {t('learningPath.skillsPendingCount', { count: pending.length })}
          </span>
          <div className="lp-skill-celebration-chips">{pending.map((code) => chip(code, false))}</div>
        </div>
      )}
    </div>
  );
};

export default SkillCelebrationPanel;
