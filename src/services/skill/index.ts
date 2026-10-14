import { SkillService } from './SkillService';

export { SkillService };
export const skillService = new SkillService();

export { normaliseProfile, normaliseFrameworkMeta } from './skillMappers';

export {
  buildSkillVocabulary,
  groupSkillsByTier,
  frameworkCategories,
  skillName,
  skillNameFromAny,
  skillGroupName,
  resolveSkillLabel,
  isGrouped,
  type SkillLabel,
  type SkillVocabulary,
  type TierGroup,
  type TaxonomyFrameworkResponse,
} from './skillTree';

export { toSkillCode, withSkillCodes, type CodeOf } from './skillCodes';

export { skillSource } from './skillSource';
