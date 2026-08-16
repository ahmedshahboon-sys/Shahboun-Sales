module.exports = {
  expo: {
    owner: 'ahmedshahboon',
    name: 'شهبون للتراخيص والتفعيل',
    slug: 'shahboun-licensing-final',
    version: '6.0.2',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    backgroundColor: '#FFFFFF',
    primaryColor: '#1A2B4C',
    splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#FFFFFF' },
    android: {
      package: 'com.shahboun.licensing',
      versionCode: 62,
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#FFFFFF' }
    },
    plugins: ['expo-secure-store','expo-sqlite','expo-document-picker','expo-system-ui','./plugins/withLicensingSecurity'],
    assetBundlePatterns: ['**/*'],
    scheme: 'shahboun-licensing',
    jsEngine: 'hermes',
    newArchEnabled: true,
    extra: { eas: { projectId: '9d835e52-7b7d-4a08-83a6-b21ad88b066c' } }
  }
};
