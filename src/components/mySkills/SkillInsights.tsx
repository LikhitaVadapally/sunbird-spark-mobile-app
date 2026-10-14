import React from 'react';
import type { MySkillEntry } from '../../services/skill/mySkills';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface SkillInsightsProps {
  mostReinforced: MySkillEntry[];
  /** Display name for an entry - insights list names, never codes. */
  nameOf: (entry: MySkillEntry) => string;
  onSelectSkill: (entry: MySkillEntry) => void;
  t: LPTFunction;
}

/**
 * What a flat skill list can't answer: which skills does my plan reinforce across several paths.
 * Tapping one jumps to its card.
 */
export const SkillInsights: React.FC<SkillInsightsProps> = ({ mostReinforced, nameOf, onSelectSkill, t }) => {
  if (mostReinforced.length === 0) return null;

  return (
    <div className="ms-insights" data-testid="skill-insights">
      {mostReinforced.length > 0 && (
        <section className="ms-insight-card">
          <h2 className="ms-insight-title">{t('mySkills.mostReinforced')}</h2>
          <ul className="ms-insight-list">
            {mostReinforced.map((entry) => (
              <li key={entry.code}>
                <button type="button" className="ms-insight-row" onClick={() => onSelectSkill(entry)}>
                  <span className="ms-insight-name">{nameOf(entry)}</span>
                  <span className="ms-insight-badge">{t('mySkills.pathCount', { count: entry.paths.length })}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SkillInsights;
