import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'InkSpire',
  slug: 'inkspire',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.inkspire.app',
    infoPlist: {
      NSCameraUsageDescription: "Take a profile photo directly from the app.",
      NSPhotoLibraryUsageDescription: "Select a profile photo from your library.",
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"]
        }
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.inkspire.app',
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  },
  updates: {
    url: "https://u.expo.dev/" + (process.env.EXPO_PROJECT_ID || "dummy-project-id"),
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  web: {
    favicon: './assets/favicon.png'
  },
  scheme: 'inkspire',
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/SpaceMono-Regular.ttf'
        ]
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#8b5cf6'
      }
    ]
  ],
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || 'dummy-project-id'
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'
  }
});
