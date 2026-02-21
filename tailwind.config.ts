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
        hud: '0 10px 35px rgba(15, 23, 42, 0.35)',
      },
      colors: {
        hud: {
          bg: 'rgba(15, 23, 42, 0.78)',
          border: 'rgba(255, 255, 255, 0.20)',
          muted: 'rgba(226, 232, 240, 0.7)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
