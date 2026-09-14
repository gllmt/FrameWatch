/**
 * FrameWatch
 * Copyright (c) 2026 Pierre Guillemot
 * Licensed under AGPL-3.0
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./entrypoints/**/*.{html,ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"SF Pro Text"',
          '"SF Pro Display"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      boxShadow: {
        hud: '0 12px 40px rgba(0, 0, 0, 0.42)',
      },
      colors: {
        hud: {
          bg: 'rgba(8, 12, 24, 0.42)',
          border: 'rgba(255, 255, 255, 0.28)',
          muted: 'rgba(248, 250, 252, 0.82)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
