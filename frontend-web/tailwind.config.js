/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1e293b', // Slate 800 - Fond sombre industriel
                    light: '#334155',
                    dark: '#0f172a',
                },
                accent: {
                    DEFAULT: '#3b82f6', // Blue 500 - Accents technologiques
                    light: '#60a5fa',
                    dark: '#2563eb',
                },
                danger: '#ef4444',
                success: '#22c55e',
                warning: '#f59e0b',
            }
        },
    },
    plugins: [],
}
