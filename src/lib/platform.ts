/**
 * Cross-Platform Utilities for Web & Native (Capacitor)
 * Provides abstractions for browser-specific APIs that work on mobile
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running in native app context (iOS/Android)
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return !Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Get the app's base URL - works for both web and native
 */
export const getBaseUrl = (): string => {
  if (isNative()) {
    // For native apps, use the configured app scheme
    return 'app.lovable.ee1ef185eb6144898c9bd293b150b6ed://';
  }
  // For web, use window.location.origin safely
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  // Fallback for SSR or edge cases
  return import.meta.env.VITE_APP_URL || 'https://work4it.lovableproject.com';
};

/**
 * Get the auth redirect URL for email confirmation
 */
export const getAuthRedirectUrl = (path: string = '/'): string => {
  const base = getBaseUrl();
  if (isNative()) {
    // Native deep link format
    return `${base}${path}`;
  }
  // Web URL format
  return `${base}${path}`;
};

/**
 * Navigate to a URL - handles both web and native contexts
 */
export const navigateToUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
};

/**
 * Open external link (email, phone, etc.)
 */
export const openExternalLink = async (url: string): Promise<void> => {
  if (isNative()) {
    // For native, we could use Capacitor Browser plugin
    // For now, fallback to window.open which works in WebView
    if (typeof window !== 'undefined') {
      window.open(url, '_system');
    }
  } else {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
};

/**
 * Get storage that works across platforms
 * Uses localStorage for web and Preferences for native (if available)
 */
export const platformStorage = {
  get: async (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  set: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  remove: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

/**
 * Check if deep linking is available
 */
export const supportsDeepLinks = (): boolean => {
  return isNative();
};
