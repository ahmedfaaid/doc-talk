/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/**/*.rs'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#003f5c',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#2c4875',
          foreground: '#ffffff'
        },
        muted: {
          DEFAULT: '#f9f6f2',
          foreground: '#00202e'
        },
        accent: {
          DEFAULT: '#bc5090',
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        card: {
          DEFAULT: '#fefefe',
          foreground: '#00202e'
        },
        popover: {
          DEFAULT: '#fefefe',
          foreground: '#00202e'
        },
        // Custom colors from original palette
        'palette-navy': '#00202e',
        'palette-dark-blue': '#003f5c',
        'palette-blue': '#2c4875',
        'palette-purple': '#8a508f',
        'palette-pink': '#bc5090',
        'palette-coral': '#ff6361',
        'palette-orange': '#ff8531',
        'palette-amber': '#ffa600',
        'palette-cream': '#ffd380',
        // Additional neutral colors
        'palette-light-gray': '#d1d1d3',
        'palette-warm-gray': '#e1dbd6',
        'palette-cool-gray': '#e2e2e4',
        'palette-warm-white': '#f9f6f2',
        'palette-white': '#fefefe'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar')]
};
