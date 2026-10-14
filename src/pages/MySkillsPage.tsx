import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToast, IonToolbar, useIonRouter } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMySkills } from '../hooks/useMySkills';
import { useSkillSuggestions } from '../hooks/useSkillSuggestions';
import { getLearningPathStatusPath } from '../utils/getContentDetailPath';
import { filterPathSummaries } from '../services/learningPath/skillAggregation';
import { filterMySkills, getMostReinforcedSkills } from '../services/skill/mySkills';
import { BackIcon } from '../components/icons/CollectionIcons';
import PageLoader from '../components/common/PageLoader';
import MySkillsHero from '../components/mySkills/MySkillsHero';
import MySkillsControls from '../components/mySkills/MySkillsControls';
import SkillInsights from '../components/mySkills/SkillInsights';
import SkillSuggestionRow from '../components/mySkills/SkillSuggestionRow';
import SkillCard from '../components/mySkills/SkillCard';
import SkillPathAccordion from '../components/mySkills/SkillPathAccordion';
import { EmptyResult, ProfileErrorBanner, SkillCardSkeletons } from '../components/mySkills/MySkillsStates';
import type { SkillsView } from '../components/mySkills/MySkillsControls';
import type { SkillSuggestion } from '../hooks/useSkillSuggestions';
import type { PathSkillStatus, PathSkillSummary } from '../services/learningPath/skillAggregation';
import type { MySkillEntry, SkillPathRef, SkillStatusFilter } from '../services/skill/mySkills';
import './MySkillsPage.css';

const PAGE_SIZE = 20;

/**
 * My Skills, ported from the portal's `pages/mySkills/MySkills.tsx`.
 *
 * Gained = every skill in the learner's skill profile (any source); pending = skills on
 * unfinished courses in enrolled Learning Paths, minus gained (see `services/skill/mySkills.ts`).
 * A profile read failure does not blank the page: enrolled paths still load, and a toast plus a
 * banner with Retry warn that some "pending" skills may already be held.
 */
const MySkillsPage: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation<{ parentRoute?: string }>();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('pageTitle.mySkills');
  }, [t]);

  const {
    entries, summaries, skills, heldCodes, aggregate, labelOf, labelsLoading,
    analyzedCount, totalCount, isLoading, isError, profileError, refetch,
  } = useMySkills();

  const [view, setView] = useState<SkillsView>('skills');
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillStatusFilter>('all');
  const [groupFilter, setGroupFilter] = useState('');
  const [pathFilter, setPathFilter] = useState<PathSkillStatus | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Once per failure, not per render: the banner stays for as long as the error does.
  const [showProfileToast, setShowProfileToast] = useState(false);
  const toastedProfileError = useRef(false);
  useEffect(() => {
    if (profileError && !toastedProfileError.current) setShowProfileToast(true);
    toastedProfileError.current = profileError;
  }, [profileError]);

  const labelOfEntry = (entry: MySkillEntry) => labelOf(entry.code, entry.frameworkId);
  const nameOf = (code: string, frameworkId?: string) => labelOf(code, frameworkId).name;

  const mostReinforced = useMemo(() => getMostReinforcedSkills(skills), [skills]);

  const enrolledPathIds = useMemo(() => entries.map((entry) => entry.path.pathId), [entries]);
  const { suggestions } = useSkillSuggestions(summaries, enrolledPathIds, heldCodes);

  const groupOptions = useMemo(
    () =>
      [...new Set(skills.map((s) => labelOf(s.code, s.frameworkId).group).filter((g): g is string => !!g))].sort(
        (a, b) => a.localeCompare(b)
      ),
    [skills, labelOf]
  );

  const matchingSkills = useMemo(
    () =>
      filterMySkills(skills, {
        query,
        status: skillFilter,
        group: groupFilter,
        labelOf: (entry) => labelOf(entry.code, entry.frameworkId),
      }),
    [skills, query, skillFilter, groupFilter, labelOf]
  );
  const visibleSkills = matchingSkills.slice(0, visibleCount);

  // A path still loading has no skills to match on yet, so it stays visible as a skeleton.
  const matchedPathIds = useMemo(
    () =>
      new Set(
        filterPathSummaries(summaries, { query, status: pathFilter, nameOf: (code) => labelOf(code).name }).map(
          (s) => s.pathId
        )
      ),
    [summaries, query, pathFilter, labelOf]
  );
  const matchingPathEntries = useMemo(
    () => entries.filter((e) => !e.summary || matchedPathIds.has(e.summary.pathId)),
    [entries, matchedPathIds]
  );
  const visiblePaths = matchingPathEntries.slice(0, visibleCount);

  const isSkillsView = view === 'skills';
  const hasMore = isSkillsView
    ? matchingSkills.length > visibleSkills.length
    : matchingPathEntries.length > visiblePaths.length;
  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  const handleBack = () => {
    if (location.state?.parentRoute) {
      router.push(location.state.parentRoute, 'back', 'pop');
    } else {
      router.goBack();
    }
  };

  const openPathStatus = (pathId: string, contextId?: string) =>
    router.push(getLearningPathStatusPath(pathId, contextId), 'forward', 'push');
  const handleOpenSkillPath = (path: SkillPathRef) => openPathStatus(path.pathId, path.contextId);
  const handleOpenPathSummary = (summary: PathSkillSummary) => openPathStatus(summary.pathId, summary.contextId);
  const handleSelectSuggestion = (suggestion: SkillSuggestion) => {
    const base = suggestion.contextId
      ? `/learning-path/${suggestion.pathId}/batch/${suggestion.contextId}`
      : `/learning-path/${suggestion.pathId}`;
    router.push(base, 'forward', 'push');
  };

  const selectSkillFromInsights = (entry: MySkillEntry) => {
    setView('skills');
    setSkillFilter('all');
    setGroupFilter('');
    setQuery(labelOfEntry(entry).name);
    setExpandedSkill(entry.code);
    resetPaging();
  };

  const filterOptions = isSkillsView
    ? [
        { value: 'all', label: t('all') },
        { value: 'gained', label: t('mySkills.gained') },
        { value: 'pending', label: t('mySkills.pending') },
      ]
    : [
        { value: 'all', label: t('all') },
        { value: 'completed', label: t('completed') },
        { value: 'ongoing', label: t('inProgress') },
        { value: 'not-started', label: t('notStarted') },
      ];

  const isEmpty = !isLoading && !isError && totalCount === 0 && skills.length === 0;
  const ready = !isLoading && !isError && !isEmpty;

  return (
    <IonPage className="ms-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="lp-page-header">
          <div className="lp-page-header-inner">
            <button type="button" onClick={handleBack} className="lp-page-icon-btn" aria-label={t('back')}>
              <BackIcon />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <main id="main-content">
          <div className="ms-title-section">
            <h1 className="ms-title">{t('mySkills.title')}</h1>
            <p className="ms-subtitle">{t('mySkills.subtitle')}</p>
          </div>

          {isLoading && <PageLoader message={t('loading')} fullPage={false} />}
          {!isLoading && isError && <PageLoader error={t('mySkills.errorLoading')} onRetry={refetch} fullPage={false} />}

          {!isLoading && !isError && profileError && <ProfileErrorBanner onRetry={refetch} t={t} />}

          {isEmpty && <EmptyResult label={t('mySkills.noSkills')} />}

          {ready && (
            <>
              <MySkillsHero aggregate={aggregate} analyzedCount={analyzedCount} totalCount={totalCount} t={t} />

              {!labelsLoading && (
                <SkillSuggestionRow
                  suggestions={suggestions}
                  nameOf={(code) => nameOf(code)}
                  onSelect={handleSelectSuggestion}
                  t={t}
                />
              )}

              {!labelsLoading && (
                <SkillInsights
                  mostReinforced={mostReinforced}
                  nameOf={(entry) => labelOfEntry(entry).name}
                  onSelectSkill={selectSkillFromInsights}
                  t={t}
                />
              )}

              <MySkillsControls
                view={view}
                onViewChange={(next) => {
                  setView(next);
                  resetPaging();
                }}
                query={query}
                onQueryChange={(next) => {
                  setQuery(next);
                  resetPaging();
                }}
                filter={isSkillsView ? skillFilter : pathFilter}
                onFilterChange={(next) => {
                  if (isSkillsView) setSkillFilter(next as SkillStatusFilter);
                  else setPathFilter(next as PathSkillStatus | 'all');
                  resetPaging();
                }}
                filterOptions={filterOptions}
                groupOptions={groupOptions}
                group={groupFilter}
                onGroupChange={(next) => {
                  setGroupFilter(next);
                  resetPaging();
                }}
                resultLabel={
                  isSkillsView
                    ? t('mySkills.skillCount', { count: matchingSkills.length })
                    : t('mySkills.pathResultCount', { count: matchingPathEntries.length })
                }
                t={t}
              />

              {isSkillsView && labelsLoading && <SkillCardSkeletons />}
              {isSkillsView && !labelsLoading && visibleSkills.length === 0 && (
                <EmptyResult label={t('mySkills.noSkillResults')} />
              )}
              {isSkillsView && !labelsLoading && visibleSkills.length > 0 && (
                <div className="ms-skill-list">
                  {visibleSkills.map((entry) => (
                    <SkillCard
                      key={entry.code}
                      entry={entry}
                      label={labelOfEntry(entry)}
                      isExpanded={expandedSkill === entry.code}
                      onToggle={() => setExpandedSkill((prev) => (prev === entry.code ? null : entry.code))}
                      onOpenPath={handleOpenSkillPath}
                      t={t}
                    />
                  ))}
                </div>
              )}

              {!isSkillsView && visiblePaths.length === 0 && <EmptyResult label={t('mySkills.noResults')} />}
              {!isSkillsView && visiblePaths.length > 0 && (
                <SkillPathAccordion
                  entries={visiblePaths}
                  heldCodes={heldCodes}
                  nameOf={nameOf}
                  labelsLoading={labelsLoading}
                  onOpenPath={handleOpenPathSummary}
                  t={t}
                />
              )}

              {hasMore && (
                <button
                  type="button"
                  className="ms-load-more"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  {t('mySkills.loadMore')}
                </button>
              )}
            </>
          )}
        </main>
      </IonContent>

      <IonToast
        isOpen={showProfileToast}
        message={t('mySkills.profileError')}
        duration={4000}
        color="danger"
        position="bottom"
        onDidDismiss={() => setShowProfileToast(false)}
      />
    </IonPage>
  );
};

export default MySkillsPage;
