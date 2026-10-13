import { describe, expect, it } from 'vitest';
import { isAssessmentCourse, parseLearningPath } from './learningPathMapper';
import {
  LP_HIERARCHY_EMPTY,
  LP_HIERARCHY_WITH_ASSESSMENTS,
} from './__fixtures__/lpHierarchyWithAssessments.fixture';
import { LP_HIERARCHY_NO_ASSESSMENTS } from './__fixtures__/lpHierarchyNoAssessments.fixture';
import type { HierarchyContentNode } from '../../types/collectionTypes';

describe('parseLearningPath', () => {
  it('returns an empty model for a null/undefined root', () => {
    expect(parseLearningPath(null)).toEqual({
      identifier: '',
      name: '',
      policy: 'Fixed',
      levels: [],
      allSkills: [],
      allSkillCodes: [],
      courseTotal: 0,
      leafTotal: 0,
    });
    expect(parseLearningPath(undefined)).toEqual(
      expect.objectContaining({ identifier: '', levels: [] })
    );
  });

  it('handles a Learning Path with no children (empty path)', () => {
    const model = parseLearningPath(LP_HIERARCHY_EMPTY);
    expect(model.identifier).toBe('do_lp_empty');
    expect(model.levels).toEqual([]);
    expect(model.priorAssessment).toBeUndefined();
    expect(model.outcomeAssessment).toBeUndefined();
    expect(model.courseTotal).toBe(0);
    expect(model.leafTotal).toBe(0);
  });

  describe('with a prior + outcome assessment', () => {
    const model = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);

    it('resolves the Diagnostic policy', () => {
      expect(model.policy).toBe('Diagnostic');
    });

    it('unwraps the first level into priorAssessment', () => {
      expect(model.priorAssessment).toBeDefined();
      expect(model.priorAssessment?.identifier).toBe('course_prior');
      expect(model.priorAssessment?.isAssessmentCourse).toBe(true);
      expect(model.priorAssessment?.questionCount).toBe(1);
    });

    it('unwraps the last level into outcomeAssessment', () => {
      expect(model.outcomeAssessment).toBeDefined();
      expect(model.outcomeAssessment?.identifier).toBe('course_outcome');
      expect(model.outcomeAssessment?.isAssessmentCourse).toBe(true);
    });

    it('keeps only the middle content level in levels[]', () => {
      expect(model.levels).toHaveLength(1);
      expect(model.levels[0].identifier).toBe('level_1');
    });

    it('does NOT unwrap a mid-level assessment course — it stays a normal course', () => {
      const midLevel = model.levels[0];
      const assessCourse = midLevel.courses.find((c) => c.identifier === 'course_1_assess');
      expect(assessCourse).toBeDefined();
      expect(assessCourse?.isAssessmentCourse).toBe(true);
      // still counted as a course of level_1, not unwrapped to priorAssessment/outcomeAssessment
      expect(midLevel.courses).toHaveLength(2);
    });

    // `competencies` (display labels) is no longer read; `skill` carries leaf CODES, de-slugged
    // for display while the raw codes survive in `skillCodes` for matching held skills.
    it("reads the Level's own `skill` codes, de-slugged for display", () => {
      const midLevel = model.levels[0];
      expect(midLevel.skills).toEqual(['Data literacy', 'Spreadsheet basics']);
      expect(midLevel.skillCodes).toEqual(['data-literacy', 'spreadsheet-basics']);
      expect(midLevel.ownSkillCodes).toEqual(['data-literacy', 'spreadsheet-basics']);
    });

    it('falls back to the union of course skills when a level has no own skills', () => {
      // reconstruct a path whose only content level has no skill tags of its own
      const noOwnSkillsRoot: HierarchyContentNode = {
        ...LP_HIERARCHY_WITH_ASSESSMENTS,
        children: LP_HIERARCHY_WITH_ASSESSMENTS.children!.map((lvl) =>
          lvl.identifier === 'level_1' ? { ...lvl, skill: undefined, se_skills: undefined } : lvl
        ),
      };
      const m = parseLearningPath(noOwnSkillsRoot);
      expect(m.levels[0].ownSkillCodes).toEqual([]);
      expect(m.levels[0].skills.length).toBeGreaterThan(0);
      expect(m.levels[0].skillCodes.length).toBe(m.levels[0].skills.length);
    });

    it('computes courseTotal including prior + outcome', () => {
      // 1 prior + 2 courses in level_1 + 1 outcome = 4
      expect(model.courseTotal).toBe(4);
    });

    it('unions allSkills across prior, levels, and outcome', () => {
      expect(model.allSkills).toEqual(
        expect.arrayContaining(['Data literacy', 'Spreadsheet basics', 'SQL basics'])
      );
    });

    it('computes leafTotal from the root leafNodesCount', () => {
      expect(model.leafTotal).toBe(6);
    });
  });

  describe('with no prior/outcome assessment (common case)', () => {
    const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

    it('resolves the Fixed policy', () => {
      expect(model.policy).toBe('Fixed');
    });

    it('leaves priorAssessment/outcomeAssessment undefined', () => {
      expect(model.priorAssessment).toBeUndefined();
      expect(model.outcomeAssessment).toBeUndefined();
    });

    it('keeps both levels, sorted by index', () => {
      expect(model.levels.map((l) => l.identifier)).toEqual([
        'do_2146317426971115521341',
        'do_2146317426971197441343',
      ]);
    });

    it('builds LPUnitNode trees preserving CourseUnit nesting', () => {
      const course = model.levels[0].courses[0];
      expect(course.units).toHaveLength(2);
      expect(course.units?.[0].isUnit).toBe(true);
      expect(course.units?.[0].leafIds).toEqual(['do_21463158442296934411']);
    });

    it('flattens leafIds per course via getLeafContentIds', () => {
      const course = model.levels[0].courses[0];
      expect(course.leafIds).toEqual([
        'do_21463158442296934411',
        'do_214631592231313408130',
      ]);
      expect(course.leafNodesCount).toBe(2);
    });

    it('is not an assessment course when its leaves are ordinary resources', () => {
      const course = model.levels[0].courses[0];
      expect(course.isAssessmentCourse).toBe(false);
      expect(course.questionCount).toBeUndefined();
    });

    it('computes courseTotal across levels only', () => {
      expect(model.courseTotal).toBe(2);
    });

    it('computes leafTotal from the root leafNodesCount', () => {
      expect(model.leafTotal).toBe(3);
    });
  });
});

describe('isAssessmentCourse', () => {
  it('is false when leafIds is empty', () => {
    const node: HierarchyContentNode = {
      identifier: 'c1',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [],
    };
    expect(isAssessmentCourse(node, [])).toBe(false);
  });

  it('is true only when every leaf is a QuestionSet by objectType or mimeType', () => {
    const allQuml: HierarchyContentNode = {
      identifier: 'c2',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [
        { identifier: 'q1', mimeType: 'application/vnd.sunbird.questionset', objectType: 'QuestionSet' },
        { identifier: 'q2', mimeType: 'application/vnd.sunbird.question', objectType: 'QuestionSet' },
      ],
    };
    expect(isAssessmentCourse(allQuml, ['q1', 'q2'])).toBe(true);
  });

  it('is false when the course mixes a QuML leaf with an ordinary resource', () => {
    const mixed: HierarchyContentNode = {
      identifier: 'c3',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [
        { identifier: 'q1', mimeType: 'application/vnd.sunbird.questionset', objectType: 'QuestionSet' },
        { identifier: 'r1', mimeType: 'application/pdf' },
      ],
    };
    expect(isAssessmentCourse(mixed, ['q1', 'r1'])).toBe(false);
  });

  it('does NOT treat legacy ECML assessment resources as QuML question sets', () => {
    const ecml: HierarchyContentNode = {
      identifier: 'c4',
      mimeType: 'application/vnd.ekstep.content-collection',
      children: [{ identifier: 'e1', mimeType: 'application/vnd.ekstep.ecml-archive' }],
    };
    expect(isAssessmentCourse(ecml, ['e1'])).toBe(false);
  });
});

// Ported from the portal: the skill-code rule the My Skills "pending" set depends on.
describe('parseLearningPath skill codes', () => {
  const level = (extra: Partial<HierarchyContentNode>, children: HierarchyContentNode[] = []) =>
    ({ identifier: 'lvl_x', name: 'L', primaryCategory: 'Level', index: 1, children, ...extra }) as HierarchyContentNode;
  const course = (id: string, extra: Partial<HierarchyContentNode> = {}): HierarchyContentNode => ({
    identifier: id,
    name: id,
    mimeType: 'application/vnd.ekstep.content-collection',
    children: [{ identifier: `${id}_r`, mimeType: 'video/mp4' }],
    ...extra,
  });
  const parse = (children: HierarchyContentNode[], extra: Partial<HierarchyContentNode> = {}) =>
    parseLearningPath({ ...LP_HIERARCHY_NO_ASSESSMENTS, ...extra, children });

  it('never surfaces a raw competency code to the learner, but keeps the code', () => {
    const m = parse([level({ skill: ['iv-administration', 'hmis_reporting'] })]);
    expect(m.levels[0].skills).toEqual(['Iv administration', 'Hmis reporting']);
    expect(m.levels[0].skillCodes).toEqual(['iv-administration', 'hmis_reporting']);
  });

  // REGRESSION: se_skills is the search-enriched copy of skill - a union listed every skill twice.
  it('ignores se_skills when skill is present (not a union)', () => {
    const m = parse([level({ skill: ['hand-hygiene'], se_skills: ['hand-hygiene', 'something-else'] })]);
    expect(m.levels[0].skills).toEqual(['Hand hygiene']);
    expect(m.levels[0].skillCodes).toEqual(['hand-hygiene']);
  });

  it('falls back to se_skills when a course has no skill field', () => {
    const m = parse([level({}, [course('c_g', { se_skills: ['hand-hygiene'] })])]);
    expect(m.levels[0].courses[0].skillCodes).toEqual(['hand-hygiene']);
  });

  it("keeps a Level's own codes apart from the union of its courses' codes", () => {
    const m = parse([
      level({ identifier: 'tagged', skill: ['wound-care'] }, [course('c1', { skill: ['sterile-field'] }), course('c2')]),
      level({ identifier: 'untagged', index: 2 }, [course('c3', { skill: ['ppe-use'] }), course('c4')]),
    ]);
    expect(m.levels[0].ownSkillCodes).toEqual(['wound-care']);
    expect(m.levels[1].ownSkillCodes).toEqual([]);
    expect(m.levels[1].skillCodes).toEqual(['ppe-use']);
  });

  it('prefers the root `skill` tag for allSkillCodes, else unions the children', () => {
    expect(parse([level({ skill: ['a'] })], { skill: ['root-a', 'root-b'] }).allSkillCodes).toEqual(['root-a', 'root-b']);
    expect(parse([level({ skill: ['a'] })], { skill: undefined }).allSkillCodes).toEqual(['a']);
  });

  it('falls back to the taxonomy framework when the path names no competency framework', () => {
    expect(parse([], { framework: 'nursing_fw' }).competencyFramework).toBe('nursing_fw');
    expect(parse([], { framework: 'nursing_fw', competencyFramework: 'comp_fw' }).competencyFramework).toBe('comp_fw');
  });
});
