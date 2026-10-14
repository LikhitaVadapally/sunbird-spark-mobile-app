/**
 * Wire and view types for the competency framework v2 skill APIs
 * (`/v1/skill/*`, Kong-fronted as `/skill/v1/*`). Ported from the portal's
 * `types/skillServiceTypes.ts`; learner-facing reads only - the gap,
 * recommend and role types are deliberately absent until roles are mapped.
 *
 * THE MODEL IS BINARY. A skill is held or it is not - there is no proficiency scale,
 * no level, no expiry and no status column. "Not held" is the absence of a record.
 *
 * WHO THE RESPONSE IS ABOUT: every learner-facing endpoint takes the user id from the
 * auth token, never the body, so requests must NOT carry a `userId`.
 *
 * ENVELOPE: `CapacitorAdapter.mapResponse` strips `result` before a caller sees the
 * body, so the unwrapped form is what actually arrives. Every response type below
 * accepts both shapes.
 */

// ---- wire: profile ---------------------------------------------------------------------------

export interface SkillEvidenceWire {
  evidenceId?: string;
  sourceType?: string;
  sourceId?: string;
  score?: number;
  maxScore?: number;
  issuerId?: string;
  occurredOn?: string;
  revoked?: boolean;
}

export interface HeldSkillWire {
  skillId?: string;
  frameworkId?: string;
  sourceType?: string;
  attainedOn?: string;
  /** Present only when the request asked for `evidence: true`. */
  evidence?: SkillEvidenceWire[];
}

export interface SkillProfileBody {
  skills?: HeldSkillWire[];
  count?: number;
}
export interface SkillProfileResponse extends SkillProfileBody {
  result?: SkillProfileBody;
}

// ---- wire: resolved competency framework -----------------------------------------------------

export interface CompetencyFrameworkBody {
  frameworkId?: string;
  /** Display names for each tier, e.g. ["Competency area", "Competency", "Skill"]. */
  tierLabels?: string[];
  depth?: number;
  /** FLAT list of leaf codes. The tree itself is not returned - see skillTree.ts. */
  leafSkills?: string[];
  leafCount?: number;
  /** role code -> its required leaf skills. */
  roles?: Record<string, string[]>;
  /** role code -> authored display name. Codes are not display strings. */
  roleNames?: Record<string, string>;
}
export interface CompetencyFrameworkResponse extends CompetencyFrameworkBody {
  result?: CompetencyFrameworkBody;
}

// ---- view types ------------------------------------------------------------------------------

export interface SkillEvidence {
  evidenceId: string;
  sourceType: string;
  sourceId: string;
  /** Display name of the source (a course's name), when the client knows it. */
  sourceName?: string;
  /** The enrolled Learning Path the source sits in, when it does. */
  sourcePath?: { pathId: string; contextId?: string; pathName: string };
  score?: number;
  maxScore?: number;
  issuerId?: string;
  occurredOn?: number;
  revoked: boolean;
}

/** A skill the learner holds. There is no level: presence in the profile IS the claim. */
export interface HeldSkill {
  skillId: string;
  frameworkId: string;
  sourceType: string;
  attainedOn?: number;
  evidence: SkillEvidence[];
}

export interface CompetencyFrameworkMeta {
  frameworkId: string;
  tierLabels: string[];
  depth: number;
  leafSkills: string[];
  roles: Record<string, string[]>;
  /** role code -> authored display name, so the UI never shows a de-slugged code. */
  roleNames: Record<string, string>;
  /** Role codes that require at least one skill. */
  roleCodes: string[];
}
