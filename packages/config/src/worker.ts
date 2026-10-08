import type { WorkerConfig } from '@flarewatch/shared';

export const workerConfig: WorkerConfig = {
  /**
   * Safe-default demo monitors, so a fresh fork/template deploy shows a
   * working status page without any secrets. Replace with your own services
   * before relying on FlareWatch for real monitoring.
   */
  monitors: [
    {
      id: 'dash_api',
      name: 'Dash API',
      method: 'GET',
      target: 'https://api.dashmarketing.io',
      expectedCodes: [200],
      timeout: 10000,
      link: false,
    },
    {
      id: 'dash_pages',
      name: 'Dash Pages',
      method: 'GET',
      target: 'https://pages.dashmarketing.io',
      expectedCodes: [200],
      timeout: 10000,
      link: true,
    },
    {
      id: 'dash_core',
      name: 'Dash Core Platform',
      method: 'GET',
      target: 'https://portal.dashmarketing.io',
      expectedCodes: [200],
      timeout: 10000,
      link: 'https://www.cloudflarestatus.com', // Links to status page, not the API endpoint
    }
  ],
};
