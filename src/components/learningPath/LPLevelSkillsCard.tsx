import React from 'react';
import type { PathSkill } from '../../services/learningPath/pathSkillStatus';
import type { LPTFunction } from './lpTFunction';

interface LPLevelSkillsCardProps {
  /** Competency leaf codes for this level. */
  codes: string[];
  /** Per-skill state, when the learner is enrolled. Same gained/pending rule as My Skills. */
  stateOf?: (code: string) => PathSkill | undefined;
  name: (code: string) => string;
  t: LPTFunction;
}

/**
 * "Skills in this level" card (port of the portal's `LevelSkillsCard`). Each skill reports
 * Gained / Pending by the My Skills rule, falling back to "In scope" when there is no state to
 * show - an unenrolled visitor, or a finished course's skill the profile has not recorded
 * (neither gained nor pending).
 */
export const LPLevelSkillsCard: React.FC<LPLevelSkillsCardProps> = ({ codes, stateOf, name, t }) => {
  if (codes.length === 0) return null;
  const label = (s: PathSkill | undefined) => {
    if (!s) return t('learningPath.inScope');
    return s.state === 'held' ? t('learningPath.skillHeld') : t('learningPath.skillPending');
  };

  return (
    <div className="lp-level-skills-card">
      <h2 className="lp-section-title">{t('learningPath.skillsInThisLevel')}</h2>
      <ul className="lp-level-skill-list">
        {codes.map((code) => {
          const s = stateOf?.(code);
          return (
            <li key={code} className="lp-level-skill-row" data-testid={`level-skill-${code}`}>
              <span className="lp-level-skill-name">
                {s && <span className={`lp-level-skill-dot lp-level-skill-dot--${s.state}`} aria-hidden="true" />}
                {name(code)}
              </span>
              <span className={`lp-level-skill-state${s?.state === 'held' ? ' lp-level-skill-state--held' : ''}`}>
                {label(s)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LPLevelSkillsCard;
