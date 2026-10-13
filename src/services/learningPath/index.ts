export { parseLearningPath, isAssessmentCourse } from './learningPathMapper';
export {
  computeCourseProgress,
  computeLevelProgress,
  computePathProgress,
  deriveLevelStatuses,
  isOutcomeUnlocked,
  isCertificateUnlocked,
  isLeafOptional,
  getAssessmentScore,
  getResumeTarget,
} from './learningPathProgress';
export { getAssessmentInfo, buildAssessmentInfoMap } from './learningPathAssessment';
export type { LPAssessmentInfo } from './learningPathAssessment';
export { getAttainedLevels, SKILL_GAINING_STATUSES } from './skillAttainment';
export { deriveWaiversFromOptionalNodes } from './levelWaivers';
export {
  buildPathSkillSummary,
  courseSkillCodes,
  derivePathSkillCodes,
  filterPathSummaries,
  getFinishedCourseIds,
  splitPathSkills,
} from './skillAggregation';
export type { PathSkillSummary, PathSkillStatus, SkillAggregate, PathSkillFilters } from './skillAggregation';
export { computePathSkills } from './pathSkillStatus';
export type { PathSkill, SkillState } from './pathSkillStatus';
export { buildSkillGrowthSeries } from './skillGrowth';
export type { DatedSkill, SkillGrowthPoint, SkillGrowthSeries } from './skillGrowth';
