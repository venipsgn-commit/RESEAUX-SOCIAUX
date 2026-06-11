import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{ts,tsx,js,jsx}'],
    theme: {
        extend: {
            colors: {
                nexus: {
                    50: '#f0f4ff',
                    100: '#e0e9ff',
                    500: '#5b6cff',
                    600: '#4f5fe6',
                    700: '#3f4cc0',
                    900: '#1a1f4d',
                },
                circle: {
                    intime: '#ff4d6d',
                    proches: '#ff9f1c',
                    amis: '#2ec4b6',
                    connaissances: '#3a86ff',
                    public: '#8338ec',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
