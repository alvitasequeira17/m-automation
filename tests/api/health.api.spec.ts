import { test, expect } from '@playwright/test';
import { ApiClient } from '../helpers/api-client';

/**
 * Health Check API Tests
 */

test.describe('Health Check API', () => {
  test('should return healthy status', async ({ request }) => {
    const apiClient = new ApiClient(request);
    const isHealthy = await apiClient.healthCheck();

    expect(isHealthy).toBe(true);
  });

  test('should respond quickly to health check', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/health');
    const duration = Date.now() - startTime;

    expect(response.ok()).toBe(true);
    expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
  });
});