const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

// Installs only the public local CA and scopes it to the configured API host.
// Android still performs normal chain, date and hostname/IP-SAN validation.
module.exports = function withSeniorLearnHttps(config) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  let parsed;
  try { parsed = new URL(apiUrl); } catch { throw new Error('EXPO_PUBLIC_API_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:') throw new Error('The Android assessment build requires an HTTPS EXPO_PUBLIC_API_URL.');
  const projectRoot = config._internal?.projectRoot || process.cwd();
  const publicCa = path.join(projectRoot, 'assets', 'certs', 'seniorlearn-local-ca.crt');
  if (!fs.existsSync(publicCa)) throw new Error(`SeniorLearn public CA is missing: ${publicCa}. Run backend/scripts/generate-local-certificates.ps1 first.`);

  config = withDangerousMod(config, ['android', async (configWithMod) => {
    const resources = path.join(configWithMod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
    const raw = path.join(resources, 'raw');
    const xml = path.join(resources, 'xml');
    fs.mkdirSync(raw, { recursive: true });
    fs.mkdirSync(xml, { recursive: true });
    fs.copyFileSync(publicCa, path.join(raw, 'seniorlearn_local_ca.crt'));
    const host = parsed.hostname;
    fs.writeFileSync(path.join(xml, 'seniorlearn_network_security_config.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <base-config cleartextTrafficPermitted="false">\n    <trust-anchors><certificates src="system" /></trust-anchors>\n  </base-config>\n  <domain-config cleartextTrafficPermitted="false">\n    <domain includeSubdomains="false">${host}</domain>\n    <trust-anchors>\n      <certificates src="system" />\n      <certificates src="@raw/seniorlearn_local_ca" />\n    </trust-anchors>\n  </domain-config>\n</network-security-config>\n`);
    return configWithMod;
  }]);
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (!application) throw new Error('AndroidManifest.xml is missing its application element.');
    application.$['android:usesCleartextTraffic'] = 'false';
    application.$['android:networkSecurityConfig'] = '@xml/seniorlearn_network_security_config';
    return manifestConfig;
  });
};
