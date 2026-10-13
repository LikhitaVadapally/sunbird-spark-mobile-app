import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FrameworkService } from './FrameworkService';
import { getClient } from '../lib/http-client';

vi.mock('../lib/http-client', () => ({
  getClient: vi.fn(),
}));

describe('FrameworkService', () => {
  let mockClient: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClient = { get: vi.fn().mockResolvedValue({ data: { framework: {} } }) };
    (getClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
  });

  it('GETs /framework/v1/read/:id and returns the response', async () => {
    const res = await new FrameworkService().read('health_fw');
    expect(mockClient.get).toHaveBeenCalledWith('/framework/v1/read/health_fw');
    expect(res).toEqual({ data: { framework: {} } });
  });
});
