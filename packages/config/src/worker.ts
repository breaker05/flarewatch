import type { WorkerConfig } from '@flarewatch/shared';

export const workerConfig: WorkerConfig = {
  /**
   * Safe-default demo monitors, so a fresh fork/template deploy shows a
   * working status page without any secrets. Replace with your own services
   * before relying on FlareWatch for real monitoring.
   */
  monitors: [
    {
      id: 'dash_api-alive',
      name: 'Dash API - Alive',
      method: 'GET',
      target: 'https://api.dashmarketing.io/health/live',
      expectedCodes: [200],
      timeout: 10000,
      link: false,
    },
    {
      id: 'dash_api-infrastructure',
      name: 'Dash API - Infrastructure',
      method: 'GET',
      target: 'https://api.dashmarketing.io/health/ready',
      expectedCodes: [200],
      timeout: 10000,
      link: false,
    },
    {
      id: 'dash_pages',
      name: 'Dash Pages',
      method: 'GET',
      target: 'https://pages.dashmarketing.io/status',
      expectedCodes: [200],
      timeout: 10000,
      link: 'https://pages.dashmarketing.io/status',
    },
    {
      id: 'dash_core',
      name: 'Dash Core Platform',
      method: 'GET',
      target: 'https://portal.dashmarketing.io/status',
      expectedCodes: [200],
      timeout: 10000,
      link: 'https://portal.dashmarketing.io/status',
    },
  ],
};
