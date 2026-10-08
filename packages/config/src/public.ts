import type { PageConfig } from '@flarewatch/shared';

export const pageConfig: PageConfig = {
  title: 'FlareWatch',
  links: [
    { label: 'Dash Marketing', link: 'https://dashmarketing.io' },
    { label: 'Dash Core', link: 'https://portal.dashmarketing.io' },
  ],
  group: {
    Websites: ['dash_pages', 'dash_core'],
    APIs: ['dash_api']
  },
};
