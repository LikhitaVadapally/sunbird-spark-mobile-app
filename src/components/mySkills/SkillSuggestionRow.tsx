import React from 'react';
import type { SkillSuggestion } from '../../hooks/useSkillSuggestions';
import type { LPTFunction } from '../learningPath/lpTFunction';

interface SkillSuggestionRowProps {
  suggestions: SkillSuggestion[];
  /** Display name for a skill code. */
  nameOf: (code: string) => string;
  onSelect: (suggestion: SkillSuggestion) => void;
  t: LPTFunction;
}

const CHIP_PREVIEW_COUNT = 3;

/**
 * "Skills you could gain next" - a horizontal row of Learning Paths ranked by how many
 * not-yet-held skills each would add, from enrolled-incomplete paths and unenrolled Live paths.
 */
export const SkillSuggestionRow: React.FC<SkillSuggestionRowProps> = ({ suggestions, nameOf, onSelect, t }) => {
  if (suggestions.length === 0) return null;
  return (
    <div className="ms-suggestions-section" data-testid="skill-suggestion-row">
      <h2 className="lp-section-title">{t('mySkills.suggestionsTitle')}</h2>
      <p className="ms-suggestions-subtitle">{t('mySkills.suggestionsSubtitle')}</p>
      <div className="ms-suggestions-scroll content-carousel-scroll">
        {suggestions.map((suggestion) => {
          const preview = suggestion.newSkills.slice(0, CHIP_PREVIEW_COUNT);
          const extra = suggestion.newSkills.length - preview.length;
          return (
            <div
              key={`${suggestion.source}-${suggestion.pathId}`}
              role="button"
              tabIndex={0}
              className="ms-suggestion-card"
              data-testid={`skill-suggestion-card-${suggestion.source}`}
              onClick={() => onSelect(suggestion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(suggestion);
                }
              }}
            >
              <span className="ms-suggestion-card-source">
                {suggestion.source === 'enrolled' ? t('mySkills.sourceEnrolled') : t('mySkills.sourceDiscover')}
              </span>
              <span className="ms-suggestion-card-name">{suggestion.pathName}</span>
              <span className="ms-suggestion-card-chips">
                {preview.map((code) => (
                  <span key={code} className="lp-skill-chip lp-skill-chip--pending">
                    {nameOf(code)}
                  </span>
                ))}
                {extra > 0 && <span className="ms-suggestion-card-more">{t('mySkills.moreSkills', { count: extra })}</span>}
              </span>
              <span className="ms-suggestion-card-footer">
                <span className="ms-suggestion-card-skills">
                  {t('mySkills.newSkillCount', { count: suggestion.newSkills.length })}
                </span>
                {suggestion.source === 'enrolled' && (
                  <span className="ms-suggestion-card-progress">{suggestion.progressPct}%</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillSuggestionRow;
