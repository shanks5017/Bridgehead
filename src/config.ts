/// <reference types="vite/client" />

const getEnv = (key: string, defaultValue?: string): string => {
    // In Vite, env vars are exposed on import.meta.env
    // We check both import.meta.env and process.env for compatibility
    const value = import.meta.env?.[key] || process.env?.[key];
    if (value === undefined && defaultValue === undefined) {
        // Only warn for critical missing vars (not GEMINI_API_KEY which is optional)
        if (!key.includes('GEMINI')) {
            console.warn(`Configuration warning: ${key} is not defined`);
        }
        return '';
    }
    return value || defaultValue || '';
};

export const config = {
    api: {
        baseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:5001/api'),
        timeout: 30000,
    },
    gemini: {
        apiKey: getEnv('VITE_GEMINI_API_KEY') || getEnv('GEMINI_API_KEY'),
    },
    app: {
        name: 'BridgeHead',
        version: '1.0.0',
        env: getEnv('MODE', 'development'),
    }
};
