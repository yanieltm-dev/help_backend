import { ApiClient, createApiClient } from './utils/api-client';
import {
  getApp,
  initializeTestContext,
  teardownTestContext,
} from './utils/test-context';

describe('HealthController (e2e)', () => {
  let api: ApiClient;

  beforeAll(async () => {
    await initializeTestContext();
    api = createApiClient(getApp());
  });

  afterAll(async () => {
    await teardownTestContext();
  });

  it('/api/v1/health (GET)', async () => {
    const res = await api.get('/health').expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('info');
    expect(res.body).toHaveProperty('details');
  });
});
