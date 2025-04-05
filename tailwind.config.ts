
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
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
				bone: {
					50: '#f9f6f3',
					100: '#f2ece5',
					200: '#e5d8cd',
					300: '#d3bda9',
					400: '#c1a185',
					500: '#b08969',
					600: '#a27655',
					700: '#8e6249',
					800: '#75513e',
					900: '#614436',
				},
				medical: {
					50: '#f0f7ff',
					100: '#e0eefe',
					200: '#b9ddfd',
					300: '#7cc4fc',
					400: '#36a6f9',
					500: '#0d89ee',
					600: '#006dcb',
					700: '#0056a5',
					800: '#064a87',
					900: '#0a3f70',
					950: '#072a4d',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'aurora': {
					'0%': { 
						backgroundPosition: '0% 50%, 50% 50%',
						backgroundSize: '200%, 100%'
					},
					'50%': { 
						backgroundPosition: '100% 50%, 50% 50%',
						backgroundSize: '200%, 120%'
					},
					'100%': { 
						backgroundPosition: '0% 50%, 50% 50%',
						backgroundSize: '200%, 100%'
					},
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-in-up': 'fade-in-up 0.7s ease-out',
				'pulse-subtle': 'pulse-subtle 3s infinite ease-in-out',
				'float': 'float 3s infinite ease-in-out',
				'aurora': 'aurora 10s infinite alternate'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'bone-pattern': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMjYuNjYgMjEuNzVhNCA0IDAgMCAxIDYuNjkgMCA0IDQgMCAwIDEgMCA2LjY5IDQgNCAwIDAgMS02LjY5IDAgNCA0IDAgMCAxIDAtNi42OXpNNDAgMzBhNCAxIDAgMSAwIDAgMTAgNCA0IDAgMCAwIDAtMTB6IiBmaWxsPSIjMDAwMDAwMDUiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvc3ZnPg==')",
			},
			boxShadow: {
				'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
				'card': '0px 2px 8px rgba(0, 0, 0, 0.05), 0px 6px 24px rgba(0, 0, 0, 0.03)',
			},
			backdropBlur: {
				'xs': '2px',
			},
			// Add 3D transform utilities
			transformStyle: {
				'flat': 'flat',
				'preserve-3d': 'preserve-3d',
			},
			perspective: {
				'none': 'none',
				'500': '500px',
				'800': '800px',
				'1000': '1000px',
				'1500': '1500px',
			},
			rotate: {
				'y-5': 'rotateY(5deg)',
				'y-10': 'rotateY(10deg)',
				'y-15': 'rotateY(15deg)',
				'x-5': 'rotateX(5deg)',
				'x-10': 'rotateX(10deg)',
			},
			translate: {
				'z-0': 'translateZ(0px)',
				'z-10': 'translateZ(10px)',
				'z-20': 'translateZ(20px)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
