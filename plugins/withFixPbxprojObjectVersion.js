const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// CocoaPods 1.16.2 does not recognize objectVersion 70 (introduced in Xcode 16.3 templates).
// Downgrade to 60 so pod install succeeds without requiring a CocoaPods update.
module.exports = function withFixPbxprojObjectVersion(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const pbxprojPath = path.join(
        config.modRequest.platformProjectRoot,
        `${config.modRequest.projectName}.xcodeproj`,
        'project.pbxproj'
      );
      if (fs.existsSync(pbxprojPath)) {
        const content = fs.readFileSync(pbxprojPath, 'utf8');
        const patched = content.replace(/objectVersion = 70;/, 'objectVersion = 60;');
        if (patched !== content) {
          fs.writeFileSync(pbxprojPath, patched);
        }
      }
      return config;
    },
  ]);
};
