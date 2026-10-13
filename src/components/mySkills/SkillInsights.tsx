import React from 'react';
import type { MySkillEntry } from '../../services/skill/mySkills';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface SkillInsightsProps {
  recentlyGained: MySkillEntry[];
  mostReinforced: MySkillEntry[];
  /** Display name for an entry - insights list names, never codes. */
  nameOf: (entry: MySkillEntry) => string;
  onSelectSkill: (entry: MySkillEntry) => void;
  t: LPTFunction;
}

function relativeDay(timestamp: number | undefined, t: LPTFunction): string {
  if (timestamp === undefined) return '';
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (days <= 0) return t('mySkills.today');
  if (days === 1) return t('mySkills.yesterday');
  return t('mySkills.daysAgo', { count: days });
}

/**
 * The two questions a flat skill list can't answer: what did I earn most recently, and which
 * skills does my plan reinforce across several paths. Tapping one jumps to its card.
 */
export const SkillInsights: React.FC<SkillInsightsProps> = ({ recentlyGained, mostReinforced, nameOf, onSelectSkill, t }) => {
  if (recentlyGained.length === 0 && mostReinforced.length === 0) return null;

  return (
    <div className="ms-insights" data-testid="skill-insights">
      {recentlyGained.length > 0 && (
        <section className="ms-insight-card">
          <h2 className="ms-insight-title">{t('mySkills.recentlyGained')}</h2>
          <ul className="ms-insight-list">
            {recentlyGained.map((entry) => (
              <li key={entry.code}>
                <button type="button" className="ms-insight-row" onClick={() => onSelectSkill(entry)}>
                  <span className="ms-insight-name ms-insight-name--gained">{nameOf(entry)}</span>
                  <span className="ms-insight-meta">{relativeDay(entry.gainedAt, t)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
