import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        line: 'var(--line)',
        line2: 'var(--line2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        'accent-ink': 'var(--accent-ink)',
        'accent-warm': 'var(--accent-warm)',
        ok: 'var(--ok)',
        warn: 'var(--warn)',
        danger: 'var(--danger)',
        leg: 'var(--leg)',
        push: 'var(--push)',
        pull: 'var(--pull)',
        arm: 'var(--arm)',
        cardio: 'var(--cardio)',
        rest: 'var(--rest)',
        other: 'var(--other)',
      },
      borderRadius: {
        r: 'var(--r)',
        rs: 'var(--rs)',
        rxl: 'var(--rxl)',
      },
      maxWidth: {
        app: '520px',
      },
      boxShadow: {
        glow: '0 8px 32px var(--glow)',
        'glow-sm': '0 4px 16px var(--accent-dim)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
} satisfies Config
