import { describe, expect, it } from 'vitest';
import { parseLearningPath } from './learningPathMapper';
import { getFinishedCourseIds } from './skillAggregation';
import { LP_HIERARCHY_NO_ASSESSMENTS } from './__fixtures__/lpHierarchyNoAssessments.fixture';
import type { ViewerSummaryRecord } from '../../types/viewerServiceTypes';

const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);
const level1 = model.levels[0]!;

function pathSummaryWith(optionalNodes: string[]): ViewerSummaryRecord {
  return {
    userId: 'u1',
    collectionId: model.identifier,
    contextId: 'batch_1',
    active: true,
    status: 1,
    progress: 0,
    contentStatus: {},
    optionalNodes,
  };
}

describe('getFinishedCourseIds — optional_nodes', () => {
  it('does not finish a course with no progress and no waiver', () => {
    const finished = getFinishedCourseIds(model, pathSummaryWith([]), new Map());
    level1.courses.forEach((course) => expect(finished.has(course.identifier)).toBe(false));
  });

  it('finishes every course in a waived Level', () => {
    // The Level's own id in optional_nodes waives it wholesale, so its courses stop counting as
    // still-to-do (their skills leave "pending") even though no leaf was completed.
    const finished = getFinishedCourseIds(model, pathSummaryWith([level1.identifier]), new Map());
    expect(level1.courses.length).toBeGreaterThan(0);
    level1.courses.forEach((course) => expect(finished.has(course.identifier)).toBe(true));
  });
});
