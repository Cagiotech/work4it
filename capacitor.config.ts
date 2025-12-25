import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ee1ef185eb6144898c9bd293b150b6ed',
  appName: 'work4it',
  webDir: 'dist',
  server: {
    url: 'https://ee1ef185-eb61-4489-8c9b-d293b150b6ed.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Deep link configuration for auth redirects
    App: {
      appUrlOpen: {
        domains: ['work4it.lovableproject.com', 'ee1ef185-eb61-4489-8c9b-d293b150b6ed.lovableproject.com'],
      },
    },
    // Secure storage for auth tokens
    CapacitorCookies: {
      enabled: true,
    },
    // HTTP configuration
    CapacitorHttp: {
      enabled: true,
    },
  },
  // iOS specific configuration
  ios: {
    scheme: 'work4it',
    contentInset: 'automatic',
  },
  // Android specific configuration  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable for production
  },
};

export default config;
