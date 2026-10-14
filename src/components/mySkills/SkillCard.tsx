import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark, chevronDownOutline, lockClosedOutline } from 'ionicons/icons';
import { toSourceKind } from '../../services/skill/mySkills';
import type { MySkillEntry, SkillPathRef } from '../../services/skill/mySkills';
import type { SkillLabel } from '../../services/skill';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface SkillCardProps {
  entry: MySkillEntry;
  label: SkillLabel;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenPath: (path: SkillPathRef) => void;
  t: LPTFunction;
}

function formatSkillDate(ms: number | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

const Dot: React.FC = () => <span className="ms-skill-card-dot" aria-hidden="true">·</span>;

const PathLinks: React.FC<{ heading: string; paths: SkillPathRef[]; onOpenPath: (path: SkillPathRef) => void }> = ({
  heading,
  paths,
  onOpenPath,
}) => {
  if (paths.length === 0) return null;
  return (
    <div className="ms-skill-card-section">
      <span className="ms-skill-card-section-title">{heading}</span>
      {paths.map((path) => (
        <button key={path.pathId} type="button" className="ms-skill-card-path-link" onClick={() => onOpenPath(path)}>
          {path.pathName}
        </button>
      ))}
    </div>
  );
};

/**
 * One skill: its name, the group it sits under, gained or pending - and, expanded, either what
 * proved it ("How I earned this") or which enrolled paths still teach it. Ported from the
 * portal's `components/mySkills/SkillCard.tsx`.
 */
export const SkillCard: React.FC<SkillCardProps> = ({ entry, label, isExpanded, onToggle, onOpenPath, t }) => {
  const { gained, source, gainedAt, evidence, paths } = entry;
  const sourceLabel = (kind: string) => t(`mySkills.source.${kind}`);

  return (
    <div
      className={`ms-skill-card${gained ? ' ms-skill-card--gained' : ' ms-skill-card--pending'}`}
      data-testid={gained ? 'skill-card-gained' : 'skill-card-pending'}
    >
      <button type="button" className="ms-skill-card-header" onClick={onToggle} aria-expanded={isExpanded}>
        <span className={`ms-skill-card-icon${gained ? ' ms-skill-card-icon--gained' : ''}`} aria-hidden="true">
          <IonIcon icon={gained ? checkmark : lockClosedOutline} />
        </span>
        <span className="ms-skill-card-main">
          {label.group && <span className="ms-skill-card-group">{label.group}</span>}
          <span className="ms-skill-card-name">{label.name}</span>
          <span className="ms-skill-card-meta">
            <span className={gained ? 'ms-skill-card-status--gained' : 'ms-skill-card-status--pending'}>
              {gained ? t('mySkills.gained') : t('mySkills.pending')}
            </span>
            {gained && source && (
              <>
                <Dot />
                <span>{sourceLabel(source)}</span>
              </>
            )}
            {gained && gainedAt !== undefined && (
              <>
                <Dot />
                <span>{formatSkillDate(gainedAt)}</span>
              </>
            )}
            {!gained && (
              <>
                <Dot />
                <span>{t('mySkills.pathCount', { count: paths.length })}</span>
              </>
            )}
          </span>
        </span>
        <IonIcon
          icon={chevronDownOutline}
          className={`ms-skill-card-chevron${isExpanded ? ' ms-skill-card-chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div className="ms-skill-card-details" data-testid="skill-card-details">
          {gained ? (
            <>
              <div className="ms-skill-card-section" data-testid="skill-evidence">
                <span className="ms-skill-card-section-title">{t('mySkills.howEarned')}</span>
                {evidence.length === 0 ? (
                  <p className="ms-skill-card-muted">{t('mySkills.noEvidence')}</p>
                ) : (
                  <ul className="ms-skill-card-evidence">
                    {evidence.map((ev) => (
                      <li key={ev.evidenceId}>
                        <span className="ms-skill-card-evidence-kind">{sourceLabel(toSourceKind(ev.sourceType))}</span>
                        {ev.sourceId && <span className="ms-skill-card-evidence-id">{ev.sourceName ?? ev.sourceId}</span>}
                        {typeof ev.score === 'number' && typeof ev.maxScore === 'number' && (
                          <>
                            <Dot />
                            <span>
                              {ev.score}/{ev.maxScore}
                            </span>
                          </>
                        )}
                        {ev.occurredOn !== undefined && (
                          <>
                            <Dot />
                            <span>{formatSkillDate(ev.occurredOn)}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <PathLinks heading={t('mySkills.alsoTaughtIn')} paths={paths} onOpenPath={onOpenPath} />
            </>
          ) : (
            <PathLinks heading={t('mySkills.stillToDoIn')} paths={paths} onOpenPath={onOpenPath} />
          )}
        </div>
      )}
    </div>
  );
};

export default SkillCard;
