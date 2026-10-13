import React from 'react';
import type { LearningPathModel, LevelStatusKey } from '../../../types/learningPathTypes';
import LPStatusBadge from '../LPStatusBadge';
import type { LPTFunction } from '../lpTFunction';

interface StatusTimelineProps {
  model: LearningPathModel;
  levelStatuses: LevelStatusKey[];
  /** Codes held from any source (skill profile) - the same "gained" set My Skills uses. */
  gainedSkills: ReadonlySet<string>;
  nameOf: (code: string) => string;
  /** A skill CODE selected in `SkillCelebrationPanel`, or null. */
  selectedSkill: string | null;
  t: LPTFunction;
}

/**
 * Vertical spine of every content Level (skills timeline). Each Level lists its skill codes as
 * gained/pending chips, and is dimmed when a skill is selected that it doesn't teach.
 */
export const StatusTimeline: React.FC<StatusTimelineProps> = ({ model, levelStatuses, gainedSkills, nameOf, selectedSkill, t }) => {
  return (
    <div className="lp-status-timeline">
      <h2 className="lp-section-title">{t('learningPath.ledgerTitle')}</h2>
      {model.levels.map((level, i) => {
        const status = levelStatuses[i];
        const codes = level.skillCodes;
        const teachesSelected = !selectedSkill || codes.includes(selectedSkill);
        const gainedHere = codes.filter((code) => gainedSkills.has(code)).length;
        return (
          <div
            key={level.identifier}
            className={`lp-status-timeline-node${!teachesSelected ? ' lp-status-timeline-node--dimmed' : ''}`}
          >
            <div className="lp-status-timeline-marker" data-status={status} />
            <div className="lp-status-timeline-body">
              <div className="lp-status-timeline-header">
                <span className="lp-status-timeline-title">
                  {t('learningPath.levelN', { num: i + 1 })} · {level.name}
                </span>
                <LPStatusBadge status={status} t={t} />
              </div>
              {codes.length > 0 && (
                <span className="lp-status-timeline-count">
                  {t('learningPath.skillsGainedCount', { gained: gainedHere, total: codes.length })}
                </span>
              )}
              <div className="lp-ledger-level-skills">
                {codes.map((code) => (
                  <span
                    key={code}
                    className={`lp-skill-chip${gainedSkills.has(code) ? ' lp-skill-chip--gained' : ''}${code === selectedSkill ? ' lp-skill-chip--selected' : ''}`}
                  >
                    {nameOf(code)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
