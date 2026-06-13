import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
      },
      colors: {
        'cost-1': '#9e9e9e',
        'cost-2': '#4caf50',
        'cost-3': '#2196f3',
        'cost-4': '#9c27b0',
        'cost-5': '#ffc107',
        'tier-bronze': '#cd7f32',
        'tier-silver': '#c0c0c0',
        'tier-gold': '#ffd700',
        'tier-prismatic': '#b388ff',
      },
    },
  },
};
