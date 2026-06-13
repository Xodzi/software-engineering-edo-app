import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'СЭД - Руководство пользователя',
  tagline: 'Система электронного документооборота',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://edo-app.example.com',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'СЭД',
      logo: {
        alt: 'СЭД Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userGuideSidebar',
          position: 'left',
          label: 'Руководство',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Документация',
          items: [
            {
              label: 'Руководство пользователя',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Проект',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/example/edo-app',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} СЭД. Система электронного документооборота.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
