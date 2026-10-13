import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillService } from './SkillService';
import { getClient } from '../../lib/http-client';

vi.mock('../../lib/http-client', () => ({
  getClient: vi.fn(),
}));

describe('SkillService', () => {
  let skillService: SkillService;
  let mockClient: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClient = { post: vi.fn().mockResolvedValue({ data: {} }), get: vi.fn().mockResolvedValue({ data: {} }) };
    (getClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
    skillService = new SkillService();
  });

  describe('profileRead', () => {
    // Kong prefix comes BEFORE the version: /skill/v1/..., never /v1/skill/...
    it('POSTs to /skill/v1/profile/read with evidence defaulting to false', async () => {
      await skillService.profileRead();
      expect(mockClient.post).toHaveBeenCalledWith('/skill/v1/profile/read', { request: { evidence: false } });
    });

    it('passes evidence: true through', async () => {
      await skillService.profileRead({ evidence: true });
      expect(mockClient.post).toHaveBeenCalledWith('/skill/v1/profile/read', { request: { evidence: true } });
    });

    // Every learner-facing endpoint reads the user from the token.
    it('never sends a userId in the body', async () => {
      await skillService.profileRead({ evidence: true });
      const [, body] = mockClient.post.mock.calls[0];
      expect(body.request).not.toHaveProperty('userId');
    });
  });

  describe('frameworkRead', () => {
    it('GETs /competency/v1/framework/read/:id', async () => {
      await skillService.frameworkRead('health_fw');
      expect(mockClient.get).toHaveBeenCalledWith('/competency/v1/framework/read/health_fw');
    });

    it('encodes the framework id', async () => {
      await skillService.frameworkRead('a/b c');
      expect(mockClient.get).toHaveBeenCalledWith('/competency/v1/framework/read/a%2Fb%20c');
    });
  });
});
