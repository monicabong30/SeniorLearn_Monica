const { withAndroidManifest } = require('@expo/config-plugins');

// Expo does not map an `android.usesCleartextTraffic` app-config property to
// AndroidManifest.xml. The local Wi-Fi API intentionally uses HTTP, so set the
// native application attribute through a config plugin instead.
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (!application) throw new Error('AndroidManifest.xml is missing its application element.');
    application.$['android:usesCleartextTraffic'] = 'true';
    return manifestConfig;
  });
};
