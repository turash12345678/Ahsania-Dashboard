/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                roboto: ['Roboto', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--outline-variant))",
                input: "hsl(var(--outline-variant))",
                ring: "hsl(var(--primary))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--on-background))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--on-primary))",
                    container: "hsl(var(--primary-container))",
                    'on-container': "hsl(var(--on-primary-container))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--on-secondary))",
                    container: "hsl(var(--secondary-container))",
                    'on-container': "hsl(var(--on-secondary-container))",
                },
                tertiary: {
                    DEFAULT: "hsl(var(--tertiary))",
                    foreground: "hsl(var(--on-tertiary))",
                    container: "hsl(var(--tertiary-container))",
                    'on-container': "hsl(var(--on-tertiary-container))",
                },
                error: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--on-error))",
                    container: "hsl(var(--error-container))",
                    'on-container': "hsl(var(--on-error-container))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--on-error))",
                },
                muted: {
                    DEFAULT: "hsl(var(--surface-variant))",
                    foreground: "hsl(var(--on-surface-variant))",
                },
                accent: {
                    DEFAULT: "hsl(var(--secondary-container))",
                    foreground: "hsl(var(--on-secondary-container))",
                },
                popover: {
                    DEFAULT: "hsl(var(--surface-container))",
                    foreground: "hsl(var(--on-surface))",
                },
                card: {
                    DEFAULT: "hsl(var(--surface))",
                    foreground: "hsl(var(--on-surface))",
                },
                surface: {
                    DEFAULT: "hsl(var(--surface))",
                    variant: "hsl(var(--surface-variant))",
                    container: {
                        lowest: "hsl(var(--surface-container-lowest))",
                        low: "hsl(var(--surface-container-low))",
                        DEFAULT: "hsl(var(--surface-container))",
                        high: "hsl(var(--surface-container-high))",
                        highest: "hsl(var(--surface-container-highest))",
                    }
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 4px)",
                sm: "calc(var(--radius) - 8px)",
            },
            boxShadow: {
                'm3-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.10), 0px 1px 3px 1px rgba(0, 0, 0, 0.05)', // Level 1
                'm3-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.10), 0px 2px 6px 2px rgba(0, 0, 0, 0.05)', // Level 2
                'm3-3': '0px 1px 3px 0px rgba(0, 0, 0, 0.10), 0px 4px 8px 3px rgba(0, 0, 0, 0.05)', // Level 3
                'm3-4': '0px 2px 3px 0px rgba(0, 0, 0, 0.10), 0px 6px 10px 4px rgba(0, 0, 0, 0.05)',// Level 4
                'm3-5': '0px 4px 4px 0px rgba(0, 0, 0, 0.10), 0px 8px 12px 6px rgba(0, 0, 0, 0.05)',// Level 5
            }
        },
    },
    plugins: [require("tailwindcss-animate")],
}
