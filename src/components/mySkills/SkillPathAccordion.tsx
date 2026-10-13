import React from 'react';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel } from '@ionic/react';
import { splitPathSkills } from '../../services/learningPath/skillAggregation';
import type { PathSkillSummary } from '../../services/learningPath/skillAggregation';
import type { MySkillsEntry } from '../../hooks/useMySkills';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface SkillPathAccordionProps {
  entries: MySkillsEntry[];
  /** Codes held from any source - so each path counts exactly what My Skills counts. */
  heldCodes: ReadonlySet<string>;
  nameOf: (code: string, frameworkId?: string) => string;
  /** True while framework names load - rows hold a skeleton rather than flash codes. */
  labelsLoading: boolean;
  onOpenPath: (summary: PathSkillSummary) => void;
  t: LPTFunction;
}

const STATUS_LABEL_KEY: Record<PathSkillSummary['status'], string> = {
  completed: 'completed',
  ongoing: 'inProgress',
  'not-started': 'notStarted',
};

const PathSkeleton: React.FC = () => (
  <div className="ms-path-skeleton" data-testid="skill-path-skeleton" aria-hidden="true">
    <div className="ms-skeleton-line ms-skeleton-line--mid" />
    <div className="ms-skeleton-line ms-skeleton-line--long" />
  </div>
);

/**
 * By-path breakdown: one accordion row per enrolled Learning Path, with its gained and pending
 * skills split by the My Skills rule (`splitPathSkills`). A path whose hierarchy is still
 * loading renders as a skeleton row.
 */
export const SkillPathAccordion: React.FC<SkillPathAccordionProps> = ({
  entries,
  heldCodes,
  nameOf,
  labelsLoading,
  onOpenPath,
  t,
}) => {
  if (entries.length === 0) return null;
  return (
    <IonAccordionGroup className="ms-path-accordion-group">
      {entries.map((entry) => {
        const summary = entry.summary;
        const key = entry.path.contextId ?? entry.path.pathId;
        if (!summary || entry.isLoading || labelsLoading) return <PathSkeleton key={key} />;

        const { gained, pending } = splitPathSkills(summary, heldCodes);
        const total = gained.length + pending.length;
        const label = (code: string) => nameOf(code, summary.frameworkId);

        return (
          <IonAccordion key={key} value={key}>
            <IonItem slot="header" lines="none" className="ms-path-accordion-header">
              <IonLabel>
                <div className="ms-path-accordion-title-row">
                  <span className="ms-path-accordion-name">{summary.pathName || entry.path.name}</span>
                  <span className={`ms-path-accordion-status ms-path-accordion-status--${summary.status}`}>
                    {t(STATUS_LABEL_KEY[summary.status])}
                  </span>
                </div>
                <div className="ms-path-accordion-progress-row">
                  <div className="ms-path-accordion-track">
                    <div className="ms-path-accordion-fill" style={{ width: `${summary.progressPct}%` }} />
                  </div>
                  <span className="ms-path-accordion-count">{t('mySkills.gainedOfTotal', { gained: gained.length, total })}</span>
                </div>
              </IonLabel>
            </IonItem>
            <div slot="content" className="ms-path-accordion-body">
              {total === 0 ? (
                <p className="ms-path-accordion-empty">{t('learningPath.noSkillsYet')}</p>
              ) : (
                <>
                  {gained.length > 0 && (
                    <div className="ms-path-accordion-section">
                      <span className="ms-path-accordion-section-title ms-path-accordion-section-title--gained">
                        {t('mySkills.skillsGainedSection', { count: gained.length })}
                      </span>
                      <div className="ms-path-accordion-skills">
                        {gained.map((code) => (
                          <span key={code} className="lp-skill-chip lp-skill-chip--gained" data-testid="skill-chip-gained">
                            {label(code)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div className="ms-path-accordion-section">
                      <span className="ms-path-accordion-section-title">
                        {t('mySkills.skillsPendingSection', { count: pending.length })}
                      </span>
                      <div className="ms-path-accordion-skills">
                        {pending.map((code) => (
                          <span key={code} className="lp-skill-chip lp-skill-chip--pending" data-testid="skill-chip-pending">
                            {label(code)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <button type="button" className="ms-path-accordion-view-btn" onClick={() => onOpenPath(summary)}>
                {t('mySkills.viewPathStatus')}
              </button>
            </div>
          </IonAccordion>
        );
      })}
    </IonAccordionGroup>
  );
};

export default SkillPathAccordion;
