import React from 'react';
import { useSkillLabels, useSkillProfile } from '../../hooks/useSkillProfile';
import { CheckIcon } from '../icons/CollectionIcons';

interface CourseSkillsProps {
  /** The course's tagged skill codes (see `services/skill/skillSource.ts`). */
  codes: string[];
  t: (key: string) => string;
}

/**
 * "You'll learn: ..." on the course page: the course's real tagged skills, with a check on
 * each one the learner already holds (skill profile, from any source). Names come from the
 * frameworks of the learner's held skills; a code none of them names is de-slugged.
 *
 * Renders nothing when the course is untagged, and nothing while the profile/framework
 * reads are in flight so raw codes never flash before their names resolve.
 */
const CourseSkills: React.FC<CourseSkillsProps> = ({ codes, t }) => {
  const profile = useSkillProfile();
  const { labelOf, isLoading: labelsLoading } = useSkillLabels(profile.frameworkIds);

  if (codes.length === 0) return null;
  if (profile.isLoading || labelsLoading) return null;

  return (
    <div className="cp-skills-section" data-testid="course-skills">
      <h2 className="cp-section-title">{t('collection.youWillLearn')}</h2>
      <ul className="cp-check-list">
        {codes.map((code) => {
          const held = profile.heldCodes.has(code);
          return (
            <li key={code} data-held={held}>
              <span className="cp-skill-icon-slot" aria-hidden="true">
                {held && <CheckIcon />}
              </span>
              <span>
                {labelOf(code).name}
                {held && <span className="sr-only"> ({t('collection.skillAlreadyGained')})</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CourseSkills;
