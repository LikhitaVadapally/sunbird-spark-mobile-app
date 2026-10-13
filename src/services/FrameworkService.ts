import { getClient, ApiResponse } from '../lib/http-client';

/**
 * Taxonomy framework read (`GET /framework/v1/read/:id`), the source of the nested
 * `competency` category terms that give skill codes their display names and tiers.
 * Mirrors the portal's `services/FrameworkService.ts`; the mobile client routes it
 * through the Kong Bearer gateway like every other `/<service>/v1/...` call.
 */
export class FrameworkService {
  public read<T = unknown>(id: string): Promise<ApiResponse<T>> {
    return getClient().get<T>(`/framework/v1/read/${encodeURIComponent(id)}`);
  }
}

export const frameworkService = new FrameworkService();
