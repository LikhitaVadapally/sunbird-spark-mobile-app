import { getClient, ApiResponse } from '../../lib/http-client';
import type { SkillProfileResponse, CompetencyFrameworkResponse } from '../../types/skillServiceTypes';

/**
 * Thin client over the competency framework v2 skill APIs, ported from the portal's
 * `services/skill/SkillService.ts`. Reached via Kong's mobile/Bearer-token gateway exactly
 * like `services/viewer/ViewerService.ts` (NOT the portal webapp's session-cookie-only
 * `/portal/...` proxy, which 401s for a Bearer token).
 *
 * ROUTING: Kong fronts each action under a per-category prefix BEFORE its own `/v1/...`
 * (`/skill/v1/profile/read`, not `/v1/skill/profile/read`) and rewrites onto the service's
 * own `/v1/skill/...`. The resolved-framework read keeps the `competency` prefix because it
 * describes the framework rather than a learner.
 *
 *   POST /skill/v1/profile/read
 *   GET  /competency/v1/framework/read/:frameworkId
 *
 * LEARNER-FACING READS ONLY. The portal also wires `gap/read`, `recommend`, `role/update`
 * and `competency/v1/role/assign`; those are role-based and deliberately absent until roles
 * are mapped. The `/private/*` admin routes are never wired here.
 *
 * NO userId IN THE BODY - every learner-facing operation reads the user from the token.
 */
const SKILL = '/skill/v1';
const COMPETENCY = '/competency/v1';

export class SkillService {
  /** The learner's held skills. `evidence: true` expands what proved each one. */
  public profileRead(options?: { evidence?: boolean }): Promise<ApiResponse<SkillProfileResponse>> {
    return getClient().post<SkillProfileResponse>(`${SKILL}/profile/read`, {
      request: { evidence: options?.evidence ?? false },
    });
  }

  /** Resolved framework: tier labels, the flat leaf list, and each role's required set. */
  public frameworkRead(frameworkId: string): Promise<ApiResponse<CompetencyFrameworkResponse>> {
    return getClient().get<CompetencyFrameworkResponse>(
      `${COMPETENCY}/framework/read/${encodeURIComponent(frameworkId)}`
    );
  }
}
