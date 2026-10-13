import React from 'react';
import { IonChip, IonLabel, IonSearchbar, IonSegment, IonSegmentButton } from '@ionic/react';
import type { LPTFunction } from '../learningPath/lpTFunction';

export type SkillsView = 'skills' | 'paths';

interface FilterOption {
  value: string;
  label: string;
}

interface MySkillsControlsProps {
  view: SkillsView;
  onViewChange: (view: SkillsView) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  /** Status options for the active view, in display order. */
  filterOptions: FilterOption[];
  resultLabel: string;
  /** Skill-group labels to narrow by (the skill's parent term). Hidden when there are none. */
  groupOptions?: string[];
  group?: string;
  onGroupChange?: (group: string) => void;
  t: LPTFunction;
}

const ChipRow: React.FC<{
  ariaLabel: string;
  options: FilterOption[];
  value: string;
  onSelect: (value: string) => void;
  testId: string;
}> = ({ ariaLabel, options, value, onSelect, testId }) => (
  <div className="ms-chip-row" role="group" aria-label={ariaLabel} data-testid={testId}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <IonChip
          key={option.value || 'all'}
          className={`ms-filter-chip${active ? ' ms-filter-chip--active' : ''}`}
          outline={!active}
          aria-pressed={active}
          onClick={() => onSelect(option.value)}
        >
          <IonLabel>{option.label}</IonLabel>
        </IonChip>
      );
    })}
  </div>
);

/**
 * By skill / By path switch, search, a status narrow for the active view and - on the skills
 * view - a group narrow. The portal lays these out on one row with dropdowns; on a phone they
 * stack as a segment, a search bar and horizontally scrolling chip rows.
 */
export const MySkillsControls: React.FC<MySkillsControlsProps> = ({
  view,
  onViewChange,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  filterOptions,
  resultLabel,
  groupOptions = [],
  group = '',
  onGroupChange,
  t,
}) => {
  const showGroups = view === 'skills' && groupOptions.length > 0 && Boolean(onGroupChange);

  return (
    <div className="ms-controls">
      <IonSegment
        className="ms-view-segment"
        value={view}
        onIonChange={(e) => {
          const next = e.detail.value;
          if (next === 'skills' || next === 'paths') onViewChange(next);
        }}
      >
        <IonSegmentButton value="skills">
          <IonLabel>{t('mySkills.viewBySkill')}</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="paths">
          <IonLabel>{t('mySkills.viewByPath')}</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      <IonSearchbar
        className="ms-searchbar"
        value={query}
        debounce={150}
        placeholder={t('mySkills.searchPlaceholder')}
        aria-label={t('mySkills.searchPlaceholder')}
        onIonInput={(e) => onQueryChange(e.detail.value ?? '')}
      />

      <ChipRow
        ariaLabel={t('mySkills.filterLabel')}
        options={filterOptions}
        value={filter}
        onSelect={onFilterChange}
        testId="ms-status-filter"
      />

      {showGroups && (
        <ChipRow
          ariaLabel={t('mySkills.groupFilterLabel')}
          options={[{ value: '', label: t('mySkills.allGroups') }, ...groupOptions.map((g) => ({ value: g, label: g }))]}
          value={group}
          onSelect={(value) => onGroupChange?.(value)}
          testId="ms-group-filter"
        />
      )}

      <span className="ms-result-label">{resultLabel}</span>
    </div>
  );
};

export default MySkillsControls;
