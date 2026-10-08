import type { PageConfig } from '@flarewatch/shared';

export const pageConfig: PageConfig = {
  title: 'FlareWatch',
  links: [
    { label: 'Dash Marketing', link: 'https://dashmarketing.io' },
    { label: 'Dash Core', link: 'https://portal.dashmarketing.io' },
  ],
  group: {
    Websites: ['dash_api'],
    APIs: ['dash_api', 'demo_one_dns_trace'],
    'Status Feeds': ['demo_cloudflare_status', 'demo_github_status'],
  },
};
